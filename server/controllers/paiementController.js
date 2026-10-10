const stripeService = require('../services/stripeService');
const Paiement = require('../models/Paiement');
const Technicien = require('../models/Technicien');
const Entreprise = require('../models/Entreprise');
const Mission = require('../models/Mission');
const { STATUTS_PAIEMENT } = require('../config/constants');
const { logger } = require('../utils/logger');

const payerAccreditationNINTI = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    if (technicien.statut !== 'test_reussi' && technicien.statut !== 'en_attente_paiement') {
      return res.status(403).json({ success: false, message: 'Vous devez d\'abord réussir le test' });
    }

    const session = await stripeService.creerSessionAccreditationNINTI(technicien);
    res.status(200).json({ success: true, ...session });
  } catch (error) {
    next(error);
  }
};

const payerMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const mission = await Mission.findById(missionId);

    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });
    if (mission.client.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    if (mission.paiementEffectue) {
      return res.status(400).json({ success: false, message: 'Mission déjà payée' });
    }

    const client = await Entreprise.findById(req.userId) || await Technicien.findById(req.userId);
    const session = await stripeService.creerSessionCommission(mission, client);
    res.status(200).json({ success: true, ...session });
  } catch (error) {
    next(error);
  }
};

const verifierSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await stripeService.recupererSession(sessionId);
    const paiement = await Paiement.findOne({ stripeSessionId: sessionId });

    res.status(200).json({
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        montant: session.amount_total / 100,
        devise: session.currency.toUpperCase()
      },
      paiement
    });
  } catch (error) {
    next(error);
  }
};

const webhookStripe = async (req, res, next) => {
  const stripe = require('../config/stripe');
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature invalide', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const resultat = await stripeService.traiterWebhook(event);
    res.status(200).json({ received: true, ...resultat });
  } catch (error) {
    logger.error('Erreur traitement webhook', { error: error.message, eventId: event.id });
    res.status(500).json({ received: false, error: error.message });
  }
};

const mesPaiements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, statut } = req.query;
    const skip = (page - 1) * limit;

    const query = { utilisateur: req.userId };
    if (type) query.type = type;
    if (statut) query.statut = statut;

    const [paiements, total] = await Promise.all([
      Paiement.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Paiement.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      paiements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const obtenirPaiement = async (req, res, next) => {
  try {
    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) return res.status(404).json({ success: false, message: 'Paiement introuvable' });

    const User = require('../models/User');
    const user = await User.findById(req.userId);
    const estAdmin = user && user.role === 'admin';

    if (paiement.utilisateur.toString() !== req.userId && !estAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    res.status(200).json({ success: true, paiement });
  } catch (error) {
    next(error);
  }
};

const facture = async (req, res, next) => {
  try {
    const facture = await stripeService.recupererFacture(req.params.id);
    res.status(200).json({ success: true, ...facture });
  } catch (error) {
    next(error);
  }
};

const rembourser = async (req, res, next) => {
  try {
    const { montant, raison } = req.body;
    const resultat = await stripeService.rembourserPaiement(req.params.id, montant, raison, req.userId);
    res.status(200).json({ success: true, ...resultat });
  } catch (error) {
    next(error);
  }
};

const statistiquesAdmin = async (req, res, next) => {
  try {
    const stats = await Paiement.statistiquesGlobales();
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const revenusMois = await Paiement.revenusParPeriode(debutMois, new Date());
    res.status(200).json({ success: true, global: stats, mois: revenusMois });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  payerAccreditationNINTI,
  payerMission,
  verifierSession,
  webhookStripe,
  mesPaiements,
  obtenirPaiement,
  facture,
  rembourser,
  statistiquesAdmin
};
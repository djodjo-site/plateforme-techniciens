const Abonnement = require('../models/Abonnement');
const Entreprise = require('../models/Entreprise');
const { TYPES_ABONNEMENT } = require('../config/constants');
const stripeService = require('../services/stripeService');

const monAbonnement = async (req, res, next) => {
  try {
    const abonnements = await Abonnement.find({ entreprise: req.userId }).sort({ createdAt: -1 });
    const actif = abonnements.find((a) => a.estActif());

    res.status(200).json({
      success: true,
      actif: actif || null,
      joursRestants: actif ? actif.joursRestants() : 0,
      historique: abonnements
    });
  } catch (error) {
    next(error);
  }
};

const souscrire = async (req, res, next) => {
  try {
    const { type = TYPES_ABONNEMENT.MENSUEL } = req.body;

    if (!Object.values(TYPES_ABONNEMENT).includes(type)) {
      return res.status(400).json({ success: false, message: 'Type d\'abonnement invalide' });
    }

    const entreprise = await Entreprise.findById(req.userId);
    if (!entreprise || entreprise.statut !== 'actif') {
      return res.status(403).json({ success: false, message: 'Compte entreprise non validé' });
    }

    const session = await stripeService.creerSessionAbonnement(entreprise, type);
    res.status(200).json({ success: true, ...session });
  } catch (error) {
    next(error);
  }
};

const annuler = async (req, res, next) => {
  try {
    const abonnement = await Abonnement.findOne({ entreprise: req.userId, statut: 'actif' });
    if (!abonnement) return res.status(404).json({ success: false, message: 'Aucun abonnement actif' });

    await abonnement.annuler(req.body.raison || 'Annulation volontaire', req.userId);

    // Mettre à jour l'entreprise
    const entreprise = await Entreprise.findById(req.userId);
    if (entreprise) {
      entreprise.abonnement.autoRenouvellement = false;
      await entreprise.save();
    }

    res.status(200).json({ success: true, message: 'Abonnement annulé' });
  } catch (error) {
    next(error);
  }
};

const activerRenouvellementAuto = async (req, res, next) => {
  try {
    const abonnement = await Abonnement.findOne({ entreprise: req.userId, statut: 'actif' });
    if (!abonnement) return res.status(404).json({ success: false, message: 'Aucun abonnement actif' });

    abonnement.autoRenouvellement = true;
    await abonnement.save();

    const entreprise = await Entreprise.findById(req.userId);
    if (entreprise) {
      entreprise.abonnement.autoRenouvellement = true;
      await entreprise.save();
    }

    res.status(200).json({ success: true, message: 'Renouvellement automatique activé' });
  } catch (error) {
    next(error);
  }
};

const desactiverRenouvellementAuto = async (req, res, next) => {
  try {
    const abonnement = await Abonnement.findOne({ entreprise: req.userId, statut: 'actif' });
    if (!abonnement) return res.status(404).json({ success: false, message: 'Aucun abonnement actif' });

    abonnement.autoRenouvellement = false;
    await abonnement.save();

    const entreprise = await Entreprise.findById(req.userId);
    if (entreprise) {
      entreprise.abonnement.autoRenouvellement = false;
      await entreprise.save();
    }

    res.status(200).json({ success: true, message: 'Renouvellement automatique désactivé' });
  } catch (error) {
    next(error);
  }
};

const listeAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (statut) query.statut = statut;

    const [abonnements, total] = await Promise.all([
      Abonnement.find(query)
        .populate('entreprise', 'raisonSociale email nom prenom')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Abonnement.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      abonnements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const forcerExpiration = async (req, res, next) => {
  try {
    const abonnement = await Abonnement.findById(req.params.id);
    if (!abonnement) return res.status(404).json({ success: false, message: 'Abonnement introuvable' });

    abonnement.statut = 'expire';
    abonnement.historique.push({ action: 'expiration_forcee', parAdmin: req.userId });
    await abonnement.save();

    res.status(200).json({ success: true, abonnement });
  } catch (error) {
    next(error);
  }
};

const statistiques = async (req, res, next) => {
  try {
    const total = await Abonnement.countDocuments();
    const actifs = await Abonnement.countDocuments({ statut: 'actif', dateFin: { $gt: new Date() } });
    const parType = await Abonnement.aggregate([
      { $match: { statut: 'actif' } },
      { $group: { _id: '$type', nombre: { $sum: 1 } } }
    ]);

    res.status(200).json({ success: true, total, actifs, parType });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  monAbonnement,
  souscrire,
  annuler,
  activerRenouvellementAuto,
  desactiverRenouvellementAuto,
  listeAdmin,
  forcerExpiration,
  statistiques
};
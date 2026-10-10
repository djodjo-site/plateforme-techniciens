// server/services/stripeService.js
const stripe = require('../config/stripe');
const Paiement = require('../models/Paiement');
const Abonnement = require('../models/Abonnement');
const Entreprise = require('../models/Entreprise');
const {
  STATUTS_PAIEMENT,
  TYPES_PAIEMENT,
  TYPES_ABONNEMENT,
  NINTI: NINTI_CONFIG
} = require('../config/constants');
const { logger } = require('../utils/logger');

const creerSessionAccreditationNINTI = async (technicien, options = {}) => {
  try {
    const montant = options.montant || NINTI_CONFIG.PRIX_ACCREDITATION;
    const devise = (options.devise || NINTI_CONFIG.DEVISE).toLowerCase();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: technicien.email,
      line_items: [
        {
          price_data: {
            currency: devise,
            product_data: {
              name: 'Accréditation NINTI',
              description: 'Numéro d\'Identification National de Technicien Informatique - 12 mois',
              images: [`${process.env.CLIENT_URL}/assets/ninti-badge.png`]
            },
            unit_amount: montant * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        technicienId: technicien._id.toString(),
        type: TYPES_PAIEMENT.ACCREDITATION_NINTI,
        email: technicien.email,
        nom: technicien.nom,
        prenom: technicien.prenom
      },
      success_url: `${process.env.CLIENT_URL}/technicien/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/technicien/paiement/annule`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60
    });

    // Créer le paiement en base
    const paiement = await Paiement.create({
      utilisateur: technicien._id,
      type: TYPES_PAIEMENT.ACCREDITATION_NINTI,
      montant,
      devise: devise.toUpperCase(),
      statut: STATUTS_PAIEMENT.EN_ATTENTE,
      methode: 'stripe',
      stripeSessionId: session.id,
      description: 'Accréditation NINTI - 12 mois'
    });

    logger.info('Session Stripe NINTI créée', {
      technicienId: technicien._id,
      sessionId: session.id,
      paiementId: paiement._id
    });

    return {
      sessionId: session.id,
      url: session.url,
      paiementId: paiement._id
    };
  } catch (error) {
    logger.error('Erreur création session NINTI', { error: error.message });
    throw new Error(`Erreur de paiement : ${error.message}`);
  }
};

const creerSessionAbonnement = async (entreprise, type = TYPES_ABONNEMENT.MENSUEL) => {
  try {
    const tarifs = {
      [TYPES_ABONNEMENT.MENSUEL]: {
        montant: parseInt(process.env.ABONNEMENT_MENSUEL_PRIX || 50000),
        label: 'Abonnement mensuel Entreprise'
      },
      [TYPES_ABONNEMENT.ANNUEL]: {
        montant: parseInt(process.env.ABONNEMENT_ANNUEL_PRIX || 500000),
        label: 'Abonnement annuel Entreprise'
      }
    };

    const tarif = tarifs[type];
    if (!tarif) throw new Error('Type d\'abonnement invalide');

    const dureeMois = type === TYPES_ABONNEMENT.ANNUEL ? 12 : 1;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: entreprise.email,
      line_items: [
        {
          price_data: {
            currency: 'xaf',
            product_data: {
              name: tarif.label,
              description: `Accès illimité à l'annuaire des techniciens certifiés - ${dureeMois} mois`
            },
            unit_amount: tarif.montant * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        entrepriseId: entreprise._id.toString(),
        type: TYPES_PAIEMENT.ABONNEMENT_ENTREPRISE,
        typeAbonnement: type,
        dureeMois: dureeMois.toString(),
        email: entreprise.email,
        raisonSociale: entreprise.raisonSociale
      },
      success_url: `${process.env.CLIENT_URL}/entreprise/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/entreprise/abonnement/annule`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60
    });

    const paiement = await Paiement.create({
      utilisateur: entreprise._id,
      type: TYPES_PAIEMENT.ABONNEMENT_ENTREPRISE,
      montant: tarif.montant,
      devise: 'XAF',
      statut: STATUTS_PAIEMENT.EN_ATTENTE,
      methode: 'stripe',
      stripeSessionId: session.id,
      description: `${tarif.label} - ${dureeMois} mois`,
      metadata: {
        typeAbonnement: type,
        dureeMois
      }
    });

    logger.info('Session Stripe abonnement créée', {
      entrepriseId: entreprise._id,
      sessionId: session.id,
      type
    });

    return {
      sessionId: session.id,
      url: session.url,
      paiementId: paiement._id
    };
  } catch (error) {
    logger.error('Erreur création session abonnement', { error: error.message });
    throw new Error(`Erreur de paiement : ${error.message}`);
  }
};

const creerSessionCommission = async (mission, client) => {
  try {
    const montant = mission.tarification.prixConvenu;
    const devise = (mission.tarification.devise || 'XAF').toLowerCase();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: client.email,
      line_items: [
        {
          price_data: {
            currency: devise,
            product_data: {
              name: `Mission - ${mission.titre}`,
              description: `Paiement pour la mission ${mission._id}`
            },
            unit_amount: montant * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        missionId: mission._id.toString(),
        clientId: client._id.toString(),
        technicienId: mission.technicien.toString(),
        type: TYPES_PAIEMENT.COMMISSION_MISSION
      },
      success_url: `${process.env.CLIENT_URL}/missions/${mission._id}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/missions/${mission._id}/paiement/annule`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60
    });

    const paiement = await Paiement.create({
      utilisateur: client._id,
      type: TYPES_PAIEMENT.COMMISSION_MISSION,
      montant,
      devise: devise.toUpperCase(),
      statut: STATUTS_PAIEMENT.EN_ATTENTE,
      methode: 'stripe',
      stripeSessionId: session.id,
      mission: mission._id,
      commission: {
        taux: mission.tarification.commission.taux || 10,
        montant: mission.tarification.commission.montant || 0
      },
      description: `Paiement mission - ${mission.titre}`
    });

    logger.info('Session Stripe mission créée', {
      missionId: mission._id,
      sessionId: session.id,
      montant
    });

    return {
      sessionId: session.id,
      url: session.url,
      paiementId: paiement._id
    };
  } catch (error) {
    logger.error('Erreur création session mission', { error: error.message });
    throw new Error(`Erreur de paiement : ${error.message}`);
  }
};

const recupererSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer']
    });
    return session;
  } catch (error) {
    logger.error('Erreur récupération session', { sessionId, error: error.message });
    throw error;
  }
};

const traiterWebhook = async (event) => {
  logger.info('Webhook Stripe reçu', { type: event.type, id: event.id });

  switch (event.type) {
    case 'checkout.session.completed':
      return await traiterSessionComplete(event.data.object);

    case 'payment_intent.succeeded':
      return await traiterPaiementReussi(event.data.object);

    case 'payment_intent.payment_failed':
      return await traiterPaiementEchoue(event.data.object);

    case 'charge.refunded':
      return await traiterRemboursement(event.data.object);

    default:
      logger.info('Webhook non traité', { type: event.type });
      return { traite: false, type: event.type };
  }
};

const traiterSessionComplete = async (session) => {
  const paiement = await Paiement.findOne({ stripeSessionId: session.id });

  if (!paiement) {
    logger.warn('Paiement introuvable pour session', { sessionId: session.id });
    return { traite: false };
  }

  if (paiement.statut === STATUTS_PAIEMENT.REUSSI) {
    return { traite: true, deja: true };
  }

  await paiement.marquerReussi({
    chargeId: session.payment_intent,
    receiptUrl: session.receipt_url
  });

  // Traiter selon le type
  const metadata = session.metadata || {};

  if (metadata.type === TYPES_PAIEMENT.ACCREDITATION_NINTI) {
    const nintiService = require('./nintiService');
    await nintiService.delivrerNINTI(
      metadata.technicienId,
      paiement._id,
      { codePays: 'COD' }
    );
  } else if (metadata.type === TYPES_PAIEMENT.ABONNEMENT_ENTREPRISE) {
    await activerAbonnement(
      metadata.entrepriseId,
      paiement,
      metadata.typeAbonnement,
      parseInt(metadata.dureeMois, 10)
    );
  }

  logger.info('Session traitée avec succès', { sessionId: session.id });
  return { traite: true };
};

const activerAbonnement = async (entrepriseId, paiement, type, dureeMois) => {
  const entreprise = await Entreprise.findById(entrepriseId);
  if (!entreprise) throw new Error('Entreprise introuvable');

  const dateDebut = new Date();
  const dateFin = new Date(dateDebut);
  dateFin.setMonth(dateFin.getMonth() + dureeMois);

  const limites = type === TYPES_ABONNEMENT.ANNUEL
    ? { consultationsMois: 0, contactsMois: 0, missionsMois: 0 }
    : { consultationsMois: 500, contactsMois: 100, missionsMois: 0 };

  const abonnement = await Abonnement.create({
    entreprise: entrepriseId,
    type,
    statut: 'actif',
    prix: paiement.montant,
    devise: paiement.devise,
    dateDebut,
    dateFin,
    limites,
    paiements: [
      {
        paiement: paiement._id,
        date: new Date(),
        montant: paiement.montant
      }
    ],
    historique: [
      { action: 'activation', details: `Abonnement ${type} activé pour ${dureeMois} mois` }
    ]
  });

  // Mettre à jour l'entreprise
  entreprise.abonnement = {
    actif: true,
    type,
    dateDebut,
    dateFin,
    autoRenouvellement: false,
    dernierPaiement: paiement._id,
    historique: [
      ...(entreprise.abonnement.historique || []),
      {
        type,
        dateDebut,
        dateFin,
        montant: paiement.montant,
        devise: paiement.devise,
        paiementId: paiement._id
      }
    ]
  };

  entreprise.accesAnnuaire.limiteConsultationsMois = limites.consultationsMois;
  entreprise.accesAnnuaire.limiteContactsMois = limites.contactsMois;
  entreprise.accesAnnuaire.consultationsMois = 0;
  entreprise.accesAnnuaire.contactsMois = 0;

  await entreprise.save();

  await paiement.updateOne({ abonnement: abonnement._id });

  logger.info('Abonnement activé', { entrepriseId, abonnementId: abonnement._id });

  return abonnement;
};

const traiterPaiementReussi = async (paymentIntent) => {
  logger.info('Paiement réussi', { paymentIntentId: paymentIntent.id });
  return { traite: true };
};

const traiterPaiementEchoue = async (paymentIntent) => {
  const paiement = await Paiement.findOne({ stripePaymentIntentId: paymentIntent.id });

  if (paiement) {
    await paiement.marquerEchoue(
      paymentIntent.last_payment_error?.code,
      paymentIntent.last_payment_error?.message
    );
  }

  logger.warn('Paiement échoué', {
    paymentIntentId: paymentIntent.id,
    erreur: paymentIntent.last_payment_error?.message
  });

  return { traite: true };
};

const traiterRemboursement = async (charge) => {
  const paiement = await Paiement.findOne({ stripeChargeId: charge.id });
  if (!paiement) return { traite: false };

  logger.info('Remboursement détecté', {
    chargeId: charge.id,
    montant: charge.amount_refunded / 100
  });

  return { traite: true };
};

const rembourserPaiement = async (paiementId, montant, raison, adminId) => {
  const paiement = await Paiement.findById(paiementId);
  if (!paiement) throw new Error('Paiement introuvable');

  if (paiement.statut !== STATUTS_PAIEMENT.REUSSI) {
    throw new Error('Seul un paiement réussi peut être remboursé');
  }

  if (!paiement.stripePaymentIntentId && !paiement.stripeChargeId) {
    throw new Error('Aucune référence Stripe pour ce paiement');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paiement.stripePaymentIntentId,
      amount: Math.round(montant * 100),
      reason: 'requested_by_customer',
      metadata: {
        raison,
        adminId: adminId.toString()
      }
    });

    paiement.remboursement = {
      effectue: true,
      montant,
      raison,
      dateRemboursement: new Date(),
      stripeRefundId: refund.id,
      parAdmin: adminId
    };

    if (montant >= paiement.montant) {
      paiement.statut = STATUTS_PAIEMENT.REMBOURSE;
    }

    await paiement.save();

    logger.info('Remboursement effectué', {
      paiementId,
      montant,
      refundId: refund.id
    });

    return { success: true, refundId: refund.id };
  } catch (error) {
    logger.error('Erreur remboursement', { paiementId, error: error.message });
    throw new Error(`Erreur de remboursement : ${error.message}`);
  }
};

const creerClientStripe = async (user) => {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.prenom} ${user.nom}`,
      phone: user.telephone,
      metadata: {
        userId: user._id.toString(),
        role: user.role
      }
    });
    return customer;
  } catch (error) {
    logger.error('Erreur création client Stripe', { error: error.message });
    throw error;
  }
};

const recupererFacture = async (paiementId) => {
  const paiement = await Paiement.findById(paiementId);
  if (!paiement) throw new Error('Paiement introuvable');
  if (!paiement.stripeChargeId) throw new Error('Aucune facture disponible');

  try {
    const charge = await stripe.charges.retrieve(paiement.stripeChargeId);
    return { receiptUrl: charge.receipt_url, facture: charge.invoice };
  } catch (error) {
    throw new Error(`Impossible de récupérer la facture : ${error.message}`);
  }
};

module.exports = {
  creerSessionAccreditationNINTI,
  creerSessionAbonnement,
  creerSessionCommission,
  recupererSession,
  traiterWebhook,
  rembourserPaiement,
  creerClientStripe,
  recupererFacture
};
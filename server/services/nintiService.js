// server/services/nintiService.js
const NINTI = require('../models/NINTI');
const Technicien = require('../models/Technicien');
const Paiement = require('../models/Paiement');
const Notification = require('../models/Notification');
const { STATUTS_TECHNICIEN, STATUTS_PAIEMENT, TYPES_PAIEMENT, NINTI: NINTI_CONFIG } = require('../config/constants');
const { genererNumeroNINTI, calculerDateExpiration, joursRestantsNINTI } = require('../utils/generateNINTI');
const { genererCodeVerification } = require('../utils/generateNINTI');
const { logger } = require('../utils/logger');

const delivrerNINTI = async (technicienId, paiementId, options = {}) => {
  const technicien = await Technicien.findById(technicienId);
  if (!technicien) throw new Error('Technicien introuvable');

  const paiement = await Paiement.findById(paiementId);
  if (!paiement) throw new Error('Paiement introuvable');

  if (paiement.statut !== STATUTS_PAIEMENT.REUSSI) {
    throw new Error('Le paiement doit être réussi pour délivrer un NINTI');
  }

  if (paiement.type !== TYPES_PAIEMENT.ACCREDITATION_NINTI) {
    throw new Error('Type de paiement invalide pour l\'accréditation');
  }

  if (technicien.numeroNINTI && technicien.nintiEstValide()) {
    throw new Error('Le technicien possède déjà un NINTI actif');
  }

  const codePays = options.codePays || 'COD';
  const dureeValiditeMois = options.dureeValiditeMois || NINTI_CONFIG.DUREE_VALIDITE_MOIS;

  const numeroData = await genererNumeroNINTI(codePays);
  const dateDelivrance = new Date();
  const dateExpiration = calculerDateExpiration(dateDelivrance, dureeValiditeMois);

  // Snapshot des infos du technicien
  const snapshotTechnicien = {
    nom: technicien.nom,
    prenom: technicien.prenom,
    email: technicien.email,
    telephone: technicien.telephone,
    ville: technicien.ville
  };

  const ninti = await NINTI.create({
    numero: numeroData.numero,
    technicien: technicienId,
    paiement: paiementId,
    annee: numeroData.annee,
    codePays: numeroData.codePays,
    sequence: numeroData.sequence,
    dateDelivrance,
    dateExpiration,
    dureeValiditeMois,
    statut: 'actif',
    codeVerification: genererCodeVerification(),
    snapshotTechnicien,
    pays: technicien.pays || 'Congo',
    historique: [
      {
        action: 'creation',
        details: 'Délivrance initiale après paiement'
      }
    ]
  });

  // Mettre à jour le technicien
  technicien.numeroNINTI = ninti.numero;
  technicien.dateDelivranceNINTI = dateDelivrance;
  technicien.dateExpirationNINTI = dateExpiration;
  technicien.paiementAccreditation = paiementId;
  technicien.statut = STATUTS_TECHNICIEN.NINTI_ACTIF;
  await technicien.save();

  // Créer une notification
  await Notification.creer({
    destinataire: technicienId,
    type: 'ninti_delivre',
    titre: 'Félicitations ! Votre NINTI est actif',
    message: `Votre numéro d'identification national est : ${ninti.numero}. Il est valable jusqu'au ${dateExpiration.toLocaleDateString('fr-FR')}.`,
    icone: 'badge-check',
    couleur: 'success',
    priorite: 'haute',
    action: {
      label: 'Voir mon NINTI',
      url: '/technicien/mon-ninti'
    },
    refModel: 'NINTI',
    refId: ninti._id
  });

  logger.info('NINTI délivré', {
    technicienId,
    numero: ninti.numero,
    dateExpiration
  });

  return ninti;
};

const renouvelerNINTI = async (technicienId, paiementId, options = {}) => {
  const technicien = await Technicien.findById(technicienId);
  if (!technicien) throw new Error('Technicien introuvable');

  if (!technicien.numeroNINTI) {
    throw new Error('Aucun NINTI à renouveler');
  }

  const ancienNINTI = await NINTI.findOne({
    numero: technicien.numeroNINTI,
    statut: { $in: ['actif', 'expire'] }
  }).sort({ dateDelivrance: -1 });

  if (!ancienNINTI) throw new Error('Ancien NINTI introuvable');

  const paiement = await Paiement.findById(paiementId);
  if (!paiement || paiement.statut !== STATUTS_PAIEMENT.REUSSI) {
    throw new Error('Paiement invalide ou non réussi');
  }

  const codePays = ancienNINTI.codePays || 'COD';
  const dureeValiditeMois = options.dureeValiditeMois || NINTI_CONFIG.DUREE_VALIDITE_MOIS;

  const numeroData = await genererNumeroNINTI(codePays);
  const dateDelivrance = new Date();
  const dateExpiration = calculerDateExpiration(dateDelivrance, dureeValiditeMois);

  const nouveauNINTI = await NINTI.create({
    numero: numeroData.numero,
    technicien: technicienId,
    paiement: paiementId,
    annee: numeroData.annee,
    codePays: numeroData.codePays,
    sequence: numeroData.sequence,
    dateDelivrance,
    dateExpiration,
    dureeValiditeMois,
    statut: 'actif',
    codeVerification: genererCodeVerification(),
    estRenouvellement: true,
    nintiPrecedent: ancienNINTI._id,
    nombreRenouvellements: (ancienNINTI.nombreRenouvellements || 0) + 1,
    snapshotTechnicien: {
      nom: technicien.nom,
      prenom: technicien.prenom,
      email: technicien.email,
      telephone: technicien.telephone,
      ville: technicien.ville
    },
    historique: [
      {
        action: 'renouvellement',
        details: `Renouvellement de ${ancienNINTI.numero}`
      }
    ]
  });

  // Mettre à jour l'ancien NINTI
  ancienNINTI.nintiSuivant = nouveauNINTI._id;
  ancienNINTI.statut = 'remplace';
  ancienNINTI.historique.push({
    action: 'remplacement',
    details: `Remplacé par ${nouveauNINTI.numero}`
  });
  await ancienNINTI.save();

  // Mettre à jour le technicien
  technicien.numeroNINTI = nouveauNINTI.numero;
  technicien.dateDelivranceNINTI = dateDelivrance;
  technicien.dateExpirationNINTI = dateExpiration;
  technicien.paiementAccreditation = paiementId;
  technicien.statut = STATUTS_TECHNICIEN.NINTI_ACTIF;
  await technicien.save();

  await Notification.creer({
    destinataire: technicienId,
    type: 'ninti_delivre',
    titre: 'NINTI renouvelé avec succès',
    message: `Votre nouveau NINTI est : ${nouveauNINTI.numero}. Valable jusqu'au ${dateExpiration.toLocaleDateString('fr-FR')}.`,
    icone: 'refresh',
    couleur: 'success',
    priorite: 'haute',
    refModel: 'NINTI',
    refId: nouveauNINTI._id
  });

  logger.info('NINTI renouvelé', {
    technicienId,
    ancienNumero: ancienNINTI.numero,
    nouveauNumero: nouveauNINTI.numero
  });

  return nouveauNINTI;
};

const revoquerNINTI = async (numero, raison, adminId) => {
  const ninti = await NINTI.findOne({ numero });
  if (!ninti) throw new Error('NINTI introuvable');

  if (ninti.statut === 'revoque') {
    throw new Error('Ce NINTI est déjà révoqué');
  }

  await ninti.revoquer(raison, adminId);

  // Mettre à jour le technicien
  const technicien = await Technicien.findById(ninti.technicien);
  if (technicien && technicien.numeroNINTI === numero) {
    technicien.statut = STATUTS_TECHNICIEN.SUSPENDU;
    technicien.raisonSuspension = `NINTI révoqué : ${raison}`;
    technicien.dateSuspension = new Date();
    await technicien.save();

    await Notification.creer({
      destinataire: technicien._id,
      type: 'ninti_revoque',
      titre: 'Votre NINTI a été révoqué',
      message: `Raison : ${raison}. Contactez l'administration pour plus d'informations.`,
      icone: 'x-circle',
      couleur: 'danger',
      priorite: 'urgente',
      refModel: 'NINTI',
      refId: ninti._id
    });
  }

  logger.warn('NINTI révoqué', { numero, raison, adminId });
  return ninti;
};

const suspendreNINTI = async (numero, raison, adminId) => {
  const ninti = await NINTI.findOne({ numero });
  if (!ninti) throw new Error('NINTI introuvable');

  await ninti.suspendre(raison, adminId);

  await Notification.creer({
    destinataire: ninti.technicien,
    type: 'ninti_revoque',
    titre: 'Votre NINTI a été suspendu',
    message: `Raison : ${raison}`,
    icone: 'pause-circle',
    couleur: 'warning',
    priorite: 'haute',
    refModel: 'NINTI',
    refId: ninti._id
  });

  return ninti;
};

const reactiverNINTI = async (numero, adminId) => {
  const ninti = await NINTI.findOne({ numero });
  if (!ninti) throw new Error('NINTI introuvable');

  await ninti.reactiver(adminId);

  const technicien = await Technicien.findById(ninti.technicien);
  if (technicien && technicien.numeroNINTI === numero) {
    technicien.statut = STATUTS_TECHNICIEN.NINTI_ACTIF;
    technicien.raisonSuspension = null;
    technicien.dateSuspension = null;
    await technicien.save();
  }

  return ninti;
};

const verifierNINTI = async (numero) => {
  const ninti = await NINTI.verifierNumero(numero);
  return ninti;
};

const infoNINTI = async (technicienId) => {
  const technicien = await Technicien.findById(technicienId);
  if (!technicien) throw new Error('Technicien introuvable');

  if (!technicien.numeroNINTI) {
    return {
      possede: false,
      statut: technicien.statut,
      message: 'Aucun NINTI délivré'
    };
  }

  const ninti = await NINTI.findOne({ numero: technicien.numeroNINTI });
  if (!ninti) throw new Error('NINTI introuvable');

  return {
    possede: true,
    numero: ninti.numero,
    statut: ninti.statut,
    valide: ninti.estValide(),
    dateDelivrance: ninti.dateDelivrance,
    dateExpiration: ninti.dateExpiration,
    joursRestants: joursRestantsNINTI(ninti.dateExpiration),
    bientotExpire: ninti.estBientotExpire(30),
    urlVerification: ninti.urlVerification,
    nombreRenouvellements: ninti.nombreRenouvellements
  };
};

const verifierExpirations = async () => {
  const nintisExpires = await NINTI.nintisExpires();

  for (const ninti of nintisExpires) {
    await ninti.marquerExpire();

    const technicien = await Technicien.findById(ninti.technicien);
    if (technicien && technicien.numeroNINTI === ninti.numero) {
      technicien.statut = STATUTS_TECHNICIEN.EN_ATTENTE_PAIEMENT;
      await technicien.save();
    }

    await Notification.creer({
      destinataire: ninti.technicien,
      type: 'ninti_expire',
      titre: 'Votre NINTI a expiré',
      message: 'Veuillez renouveler votre accréditation pour rester actif sur la plateforme.',
      icone: 'alert-triangle',
      couleur: 'warning',
      priorite: 'haute',
      action: {
        label: 'Renouveler mon NINTI',
        url: '/technicien/renouveler-ninti'
      },
      refModel: 'NINTI',
      refId: ninti._id
    });
  }

  logger.info(`NINTI expirations traitées`, { nombre: nintisExpires.length });
  return nintisExpires.length;
};

const notifierExpirationsProches = async (joursAvant = 30) => {
  const nintisProches = await NINTI.nintisExpirant(joursAvant);

  for (const ninti of nintisProches) {
    await Notification.creer({
      destinataire: ninti.technicien._id || ninti.technicien,
      type: 'ninti_expire_bientot',
      titre: 'Votre NINTI expire bientôt',
      message: `Il vous reste ${joursRestantsNINTI(ninti.dateExpiration)} jour(s). Pensez à le renouveler.`,
      icone: 'clock',
      couleur: 'warning',
      priorite: 'normale',
      action: {
        label: 'Renouveler',
        url: '/technicien/renouveler-ninti'
      },
      refModel: 'NINTI',
      refId: ninti._id
    });
  }

  return nintisProches.length;
};

module.exports = {
  delivrerNINTI,
  renouvelerNINTI,
  revoquerNINTI,
  suspendreNINTI,
  reactiverNINTI,
  verifierNINTI,
  infoNINTI,
  verifierExpirations,
  notifierExpirationsProches
};
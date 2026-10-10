// server/middlewares/statutMiddleware.js
const { STATUTS_TECHNICIEN } = require('../config/constants');
const Technicien = require('../models/Technicien');

const chargerTechnicien = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    if (!technicien) {
      return res.status(404).json({
        success: false,
        message: 'Profil technicien introuvable'
      });
    }
    req.technicien = technicien;
    next();
  } catch (error) {
    next(error);
  }
};

const verifierStatut = (...statutsAutorises) => {
  return (req, res, next) => {
    const technicien = req.technicien;
    if (!technicien) {
      return res.status(500).json({
        success: false,
        message: 'Middleware chargerTechnicien non exécuté'
      });
    }

    if (!statutsAutorises.includes(technicien.statut)) {
      return res.status(403).json({
        success: false,
        message: `Action non autorisée. Statut actuel : ${technicien.statut}`,
        statutActuel: technicien.statut,
        statutsRequis: statutsAutorises
      });
    }
    next();
  };
};

const testReussi = (req, res, next) => {
  const t = req.technicien;
  if (!t || t.statut !== STATUTS_TECHNICIEN.TEST_REUSSI) {
    return res.status(403).json({
      success: false,
      message: 'Vous devez d\'abord réussir le test de certification',
      statutActuel: t?.statut
    });
  }
  next();
};

const nintiActif = (req, res, next) => {
  const t = req.technicien;
  if (!t || t.statut !== STATUTS_TECHNICIEN.NINTI_ACTIF) {
    return res.status(403).json({
      success: false,
      message: 'Votre NINTI doit être actif pour accéder à cette fonctionnalité',
      statutActuel: t?.statut
    });
  }

  if (!t.nintiEstValide()) {
    return res.status(403).json({
      success: false,
      message: 'Votre NINTI a expiré, veuillez le renouveler',
      dateExpiration: t.dateExpirationNINTI
    });
  }

  next();
};

const kycVerifie = (req, res, next) => {
  if (!req.technicien || !req.technicien.kycVerifie) {
    return res.status(403).json({
      success: false,
      message: 'Votre identité doit être vérifiée (KYC) pour continuer'
    });
  }
  next();
};

const profilComplet = (req, res, next) => {
  if (!req.technicien) {
    return res.status(500).json({ success: false, message: 'Technicien non chargé' });
  }

  const champsManquants = [];
  const t = req.technicien;

  if (!t.competences || t.competences.length === 0) champsManquants.push('competences');
  if (!t.categories || t.categories.length === 0) champsManquants.push('categories');
  if (!t.biographie) champsManquants.push('biographie');
  if (!t.tarifs || !t.tarifs.horaire) champsManquants.push('tarifs.horaire');
  if (!t.adressePrincipale) champsManquants.push('adressePrincipale');

  if (champsManquants.length > 0) {
    return res.status(403).json({
      success: false,
      message: 'Votre profil est incomplet',
      champsManquants
    });
  }
  next();
};

const peutPasserTest = (req, res, next) => {
  const t = req.technicien;
  if (!t) {
    return res.status(500).json({ success: false, message: 'Technicien non chargé' });
  }

  if (t.statut === STATUTS_TECHNICIEN.NINTI_ACTIF) {
    return res.status(400).json({
      success: false,
      message: 'Vous avez déjà un NINTI actif'
    });
  }

  if (!t.peutPasserTest()) {
    return res.status(403).json({
      success: false,
      message: 'Vous devez attendre avant de repasser le test',
      heuresRestantes: t.tempsRestantAvantRepassage()
    });
  }

  next();
};

module.exports = {
  chargerTechnicien,
  verifierStatut,
  testReussi,
  nintiActif,
  kycVerifie,
  profilComplet,
  peutPasserTest
};
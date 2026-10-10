// server/middlewares/abonnementMiddleware.js
const User = require('../models/User');
const Entreprise = require('../models/Entreprise');
const Abonnement = require('../models/Abonnement');
const { STATUTS_ENTREPRISE } = require('../config/constants');

// ============================================================
// Charger l'entreprise (via User pour éviter le problème de discriminator)
// ============================================================
const chargerEntreprise = async (req, res, next) => {
  try {
    // Utiliser User au lieu de Entreprise pour éviter
    // le filtre automatique du discriminator (role: 'Entreprise')
    const entreprise = await User.findById(req.userId);

    if (!entreprise) {
      return res.status(404).json({
        success: false,
        message: 'Profil entreprise introuvable'
      });
    }

    // Vérifier que c'est bien une entreprise
    if (entreprise.role?.toLowerCase() !== 'entreprise') {
      return res.status(403).json({
        success: false,
        message: 'Ce compte n\'est pas une entreprise'
      });
    }

    req.entreprise = entreprise;
    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Vérifier que l'entreprise est active
// ============================================================
const entrepriseActive = (req, res, next) => {
  if (!req.entreprise || req.entreprise.statut !== STATUTS_ENTREPRISE.ACTIF) {
    return res.status(403).json({
      success: false,
      message: 'Votre compte entreprise doit être validé par un administrateur',
      statutActuel: req.entreprise?.statut
    });
  }
  next();
};

// ============================================================
// Vérifier l'abonnement actif
// ============================================================
const abonnementActif = async (req, res, next) => {
  try {
    if (!req.entreprise) {
      return res.status(500).json({ success: false, message: 'Entreprise non chargée' });
    }

    // Vérification manuelle (méthode peut ne pas exister sur User)
    const abo = req.entreprise.abonnement || {};
    const estActif = abo.actif && abo.dateFin && new Date(abo.dateFin) > new Date();

    if (!estActif) {
      return res.status(403).json({
        success: false,
        message: 'Votre abonnement est inactif ou expiré',
        abonnement: {
          actif: abo.actif,
          dateFin: abo.dateFin
        }
      });
    }

    // Charger l'abonnement détaillé
    const abonnement = await Abonnement.findOne({
      entreprise: req.entreprise._id,
      statut: 'actif'
    }).sort({ createdAt: -1 });

    req.abonnement = abonnement;
    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Vérifier les limites de consultation
// ============================================================
const peutConsulterAnnuaire = async (req, res, next) => {
  try {
    if (!req.entreprise) {
      return res.status(500).json({ success: false, message: 'Entreprise non chargée' });
    }

    // Réinitialisation manuelle si nécessaire
    const acces = req.entreprise.accesAnnuaire || {};
    const dateReinit = acces.dateReinitialisation ? new Date(acces.dateReinitialisation) : null;

    if (dateReinit && dateReinit < new Date()) {
      req.entreprise.accesAnnuaire.consultationsMois = 0;
      req.entreprise.accesAnnuaire.contactsMois = 0;

      const nouvelleDate = new Date();
      nouvelleDate.setMonth(nouvelleDate.getMonth() + 1);
      nouvelleDate.setDate(1);
      nouvelleDate.setHours(0, 0, 0, 0);
      req.entreprise.accesAnnuaire.dateReinitialisation = nouvelleDate;

      await req.entreprise.save();
    }

    // Vérifier la limite
    const limite = req.entreprise.accesAnnuaire?.limiteConsultationsMois || 0;
    const utilise = req.entreprise.accesAnnuaire?.consultationsMois || 0;

    if (limite > 0 && utilise >= limite) {
      return res.status(403).json({
        success: false,
        message: 'Limite de consultations atteinte pour ce mois',
        consultationsMois: utilise,
        limite,
        dateReinitialisation: req.entreprise.accesAnnuaire.dateReinitialisation
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Vérifier les limites de contacts
// ============================================================
const peutContacter = async (req, res, next) => {
  try {
    if (!req.entreprise) {
      return res.status(500).json({ success: false, message: 'Entreprise non chargée' });
    }

    const limite = req.entreprise.accesAnnuaire?.limiteContactsMois || 0;
    const utilise = req.entreprise.accesAnnuaire?.contactsMois || 0;

    if (limite > 0 && utilise >= limite) {
      return res.status(403).json({
        success: false,
        message: 'Limite de contacts atteinte pour ce mois',
        contactsMois: utilise,
        limite
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Vérifier le KYC entreprise
// ============================================================
const kycEntrepriseVerifie = (req, res, next) => {
  if (!req.entreprise || !req.entreprise.kycVerifie) {
    return res.status(403).json({
      success: false,
      message: 'Les documents légaux de votre entreprise doivent être vérifiés'
    });
  }
  next();
};

module.exports = {
  chargerEntreprise,
  entrepriseActive,
  abonnementActif,
  peutConsulterAnnuaire,
  peutContacter,
  kycEntrepriseVerifie
};
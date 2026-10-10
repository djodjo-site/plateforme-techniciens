const User = require('../models/User');
const Technicien = require('../models/Technicien');
const Entreprise = require('../models/Entreprise');
const Admin = require('../models/Admin');
const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
const NINTI = require('../models/NINTI');
const Paiement = require('../models/Paiement');
const Mission = require('../models/Mission');
const Litige = require('../models/Litige');
const Avis = require('../models/Avis');
const Abonnement = require('../models/Abonnement');
const { STATUTS_TECHNICIEN, STATUTS_ENTREPRISE } = require('../config/constants');
const nintiService = require('../services/nintiService');
const notificationService = require('../services/notificationService');
const { logger } = require('../utils/logger');

const dashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, totalTechniciens, techniciensActifs, totalEntreprises, entreprisesActives,
      totalMissions, missionsEnCours, totalLitiges, litigesOuverts, totalQuestions
    ] = await Promise.all([
      User.countDocuments(),
      Technicien.countDocuments(),
      Technicien.countDocuments({ statut: STATUTS_TECHNICIEN.NINTI_ACTIF }),
      Entreprise.countDocuments(),
      Entreprise.countDocuments({ statut: STATUTS_ENTREPRISE.ACTIF }),
      Mission.countDocuments(),
      Mission.countDocuments({ statut: 'en_cours' }),
      Litige.countDocuments(),
      Litige.countDocuments({ statut: { $in: ['ouvert', 'en_examen'] } }),
      Question.countDocuments({ actif: true, validee: true })
    ]);

    const revenus = await Paiement.statistiquesGlobales();
    const nintis = await NINTI.statistiquesGlobales();

    res.status(200).json({
      success: true,
      utilisateurs: { totalUsers, totalTechniciens, techniciensActifs, totalEntreprises, entreprisesActives },
      activite: { totalMissions, missionsEnCours, totalLitiges, litigesOuverts },
      contenu: { totalQuestions },
      finances: revenus,
      nintis
    });
  } catch (error) {
    next(error);
  }
};

// ============ TECHNICIENS ============

const listerTechniciens = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, q, ville } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (statut) query.statut = statut;
    if (ville) query.ville = ville;
    if (q) {
      query.$or = [
        { nom: { $regex: q, $options: 'i' } },
        { prenom: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { numeroNINTI: { $regex: q, $options: 'i' } }
      ];
    }

    const [techniciens, total] = await Promise.all([
      Technicien.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Technicien.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      techniciens,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const detailTechnicien = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    const tests = await TestResult.historiqueTechnicien(technicien._id, 5);
    const nintis = await NINTI.rechercherParTechnicien(technicien._id);

    res.status(200).json({ success: true, technicien, tests, nintis });
  } catch (error) {
    next(error);
  }
};

const validerKYC = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    technicien.kycVerifie = true;
    technicien.dateVerificationKYC = new Date();
    technicien.documentsKYC.pieceIdentite.verifie = true;
    technicien.documentsKYC.pieceIdentite.dateVerification = new Date();
    technicien.documentsKYC.selfie.verifie = true;
    await technicien.save();

    await notificationService.notifierKYCValide(technicien._id, 'technicien');

    res.status(200).json({ success: true, message: 'KYC validé' });
  } catch (error) {
    next(error);
  }
};

const rejeterKYC = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    technicien.kycVerifie = false;
    technicien.documentsKYC.pieceIdentite.verifie = false;
    technicien.documentsKYC.selfie.verifie = false;
    await technicien.save();

    await notificationService.notifierKYCRejete(technicien._id, req.body.raison || 'Documents non conformes');

    res.status(200).json({ success: true, message: 'KYC rejeté' });
  } catch (error) {
    next(error);
  }
};

const suspendreTechnicien = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    technicien.statut = STATUTS_TECHNICIEN.SUSPENDU;
    technicien.raisonSuspension = req.body.raison;
    technicien.dateSuspension = new Date();
    await technicien.save();

    await notificationService.notifierCompteSuspendu(technicien._id, req.body.raison);

    res.status(200).json({ success: true, message: 'Technicien suspendu' });
  } catch (error) {
    next(error);
  }
};

const reactiverTechnicien = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    if (technicien.numeroNINTI && technicien.nintiEstValide()) {
      technicien.statut = STATUTS_TECHNICIEN.NINTI_ACTIF;
    } else if (technicien.scoreTest >= 60) {
      technicien.statut = STATUTS_TECHNICIEN.TEST_REUSSI;
    } else {
      technicien.statut = STATUTS_TECHNICIEN.EN_ATTENTE_DE_TEST;
    }

    technicien.raisonSuspension = null;
    technicien.dateSuspension = null;
    await technicien.save();

    await notificationService.notifierCompteReactive(technicien._id);

    res.status(200).json({ success: true, message: 'Technicien réactivé' });
  } catch (error) {
    next(error);
  }
};

// ============ ENTREPRISES ============

const listerEntreprises = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, q } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (statut) query.statut = statut;
    if (q) {
      query.$or = [
        { raisonSociale: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { numeroRCCM: { $regex: q, $options: 'i' } }
      ];
    }

    const [entreprises, total] = await Promise.all([
      Entreprise.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Entreprise.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      entreprises,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const validerEntreprise = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Entreprise introuvable' });

    entreprise.statut = STATUTS_ENTREPRISE.ACTIF;
    entreprise.kycVerifie = true;
    entreprise.dateVerificationKYC = new Date();
    entreprise.verifiePar = req.userId;
    await entreprise.save();

    res.status(200).json({ success: true, message: 'Entreprise validée' });
  } catch (error) {
    next(error);
  }
};

const rejeterEntreprise = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Entreprise introuvable' });

    entreprise.statut = STATUTS_ENTREPRISE.EN_ATTENTE_VALIDATION;
    entreprise.kycVerifie = false;
    await entreprise.save();

    res.status(200).json({ success: true, message: 'Validation rejetée' });
  } catch (error) {
    next(error);
  }
};

const suspendreEntreprise = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.params.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Entreprise introuvable' });

    entreprise.statut = STATUTS_ENTREPRISE.SUSPENDU;
    entreprise.raisonSuspension = req.body.raison;
    entreprise.dateSuspension = new Date();
    await entreprise.save();

    await notificationService.notifierCompteSuspendu(entreprise._id, req.body.raison);

    res.status(200).json({ success: true, message: 'Entreprise suspendue' });
  } catch (error) {
    next(error);
  }
};

// ============ QUESTIONS ============

const creerQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({ ...req.body, creeePar: req.userId });
    res.status(201).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

const listerQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categorie, difficulte, actif } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (categorie) query.categorie = categorie;
    if (difficulte) query.difficulte = difficulte;
    if (actif !== undefined) query.actif = actif === 'true';

    const [questions, total] = await Promise.all([
      Question.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Question.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      questions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const modifierQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question introuvable' });
    res.status(200).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

const supprimerQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question introuvable' });

    await question.archiver('Suppression admin');
    res.status(200).json({ success: true, message: 'Question archivée' });
  } catch (error) {
    next(error);
  }
};

// ============ LITIGES ============

const listerLitiges = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (statut) query.statut = statut;

    const [litiges, total] = await Promise.all([
      Litige.find(query)
        .populate('client', 'nom prenom email')
        .populate('technicien', 'nom prenom email')
        .populate('assigneA', 'nom prenom')
        .sort({ priorite: -1, createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Litige.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      litiges,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const detailLitige = async (req, res, next) => {
  try {
    const litige = await Litige.findById(req.params.id)
      .populate('client', 'nom prenom email telephone')
      .populate('technicien', 'nom prenom email telephone numeroNINTI')
      .populate('mission')
      .populate('messages.auteur', 'nom prenom role');

    if (!litige) return res.status(404).json({ success: false, message: 'Litige introuvable' });
    res.status(200).json({ success: true, litige });
  } catch (error) {
    next(error);
  }
};

const assignerLitige = async (req, res, next) => {
  try {
    const litige = await Litige.findById(req.params.id);
    if (!litige) return res.status(404).json({ success: false, message: 'Litige introuvable' });

    await litige.assigner(req.body.adminId || req.userId);
    res.status(200).json({ success: true, litige });
  } catch (error) {
    next(error);
  }
};

const rendreDecisionLitige = async (req, res, next) => {
  try {
    const litige = await Litige.findById(req.params.id);
    if (!litige) return res.status(404).json({ success: false, message: 'Litige introuvable' });

    await litige.rendreDecision(req.body, req.userId);

    await notificationService.notifierLitigeResolu(litige.client, litige);
    await notificationService.notifierLitigeResolu(litige.technicien, litige);

    res.status(200).json({ success: true, litige });
  } catch (error) {
    next(error);
  }
};

// ============ NINTI ============

const revoquerNINTI = async (req, res, next) => {
  try {
    const ninti = await nintiService.revoquerNINTI(req.params.numero, req.body.raison, req.userId);
    res.status(200).json({ success: true, ninti });
  } catch (error) {
    next(error);
  }
};

const listerNINTI = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, q } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (statut) query.statut = statut;
    if (q) query.numero = { $regex: q, $options: 'i' };

    const [nintis, total] = await Promise.all([
      NINTI.find(query)
        .populate('technicien', 'nom prenom email ville')
        .sort({ dateDelivrance: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      NINTI.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      nintis,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// ============ STATISTIQUES ============

const statistiques = async (req, res, next) => {
  try {
    const [
      usersStats, techStats, entStats, missionsStats, paiementsStats, nintisStats, litigesStats
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', nombre: { $sum: 1 } } }]),
      Technicien.statistiquesGlobales(),
      Entreprise.statistiquesGlobales(),
      Mission.statistiquesGlobales(),
      Paiement.statistiquesGlobales(),
      NINTI.statistiquesGlobales(),
      Litige.statistiquesGlobales()
    ]);

    res.status(200).json({
      success: true,
      usersStats,
      techStats,
      entStats,
      missionsStats,
      paiementsStats,
      nintisStats,
      litigesStats
    });
  } catch (error) {
    next(error);
  }
};

const mesActions = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.userId);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin introuvable' });

    res.status(200).json({
      success: true,
      journalActions: admin.journalActions.slice(-100).reverse(),
      statistiques: admin.statistiques
    });
  } catch (error) {
    next(error);
  }
};

const creerAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.create({
      ...req.body,
      creePar: req.userId
    });
    res.status(201).json({ success: true, admin: admin.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  dashboard,
  listerTechniciens,
  detailTechnicien,
  validerKYC,
  rejeterKYC,
  suspendreTechnicien,
  reactiverTechnicien,
  listerEntreprises,
  validerEntreprise,
  rejeterEntreprise,
  suspendreEntreprise,
  creerQuestion,
  listerQuestions,
  modifierQuestion,
  supprimerQuestion,
  listerLitiges,
  detailLitige,
  assignerLitige,
  rendreDecisionLitige,
  revoquerNINTI,
  listerNINTI,
  statistiques,
  mesActions,
  creerAdmin
};
const Mission = require('../models/Mission');
const Demande = require('../models/Demande');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { STATUTS_MISSION } = require('../config/constants');
const notificationService = require('../services/notificationService');
const { genererCodeOTP } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const listerMissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, role } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.userRole === 'technicien') query.technicien = req.userId;
    else if (req.userRole === 'entreprise') query.entreprise = req.userId;
    else query.client = req.userId;

    if (statut) query.statut = statut;

    const [missions, total] = await Promise.all([
      Mission.find(query)
        .populate('client', 'nom prenom photo ville telephone')
        .populate('technicien', 'nom prenom photo titreProfessionnel numeroNINTI')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Mission.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      missions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const obtenirMission = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id)
      .populate('client', 'nom prenom photo ville telephone email')
      .populate('technicien', 'nom prenom photo titreProfessionnel numeroNINTI statistiques telephone email')
      .populate('demande');

    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });

    const estParticipant =
      mission.client._id.toString() === req.userId ||
      mission.technicien._id.toString() === req.userId ||
      req.userRole === 'admin';

    if (!estParticipant) return res.status(403).json({ success: false, message: 'Non autorisé' });

    res.status(200).json({ success: true, mission });
  } catch (error) {
    next(error);
  }
};

const demarrerMission = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });
    if (mission.technicien.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    // Générer OTP si pas encore fait
    if (!mission.otpDebut || !mission.otpDebut.code) {
      mission.otpDebut = { code: genererCodeOTP(6), valide: false };
      await mission.save();
    }

    // Notifier le client avec le code OTP
    await notificationService.creerNotification({
      destinataire: mission.client,
      type: 'mission_demarree',
      titre: 'Mission démarrée',
      message: `Votre code de démarrage est : ${mission.otpDebut.code}`,
      icone: 'play',
      couleur: 'info',
      priorite: 'haute',
      refModel: 'Mission',
      refId: mission._id
    });

    res.status(200).json({ success: true, otpGenere: true, message: 'OTP envoyé au client' });
  } catch (error) {
    next(error);
  }
};

const confirmerDemarrage = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });
    if (mission.technicien.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await mission.demarrer(req.body.otpCode);

    await notificationService.notifierMissionTerminee && null;
    await notificationService.creerNotification({
      destinataire: mission.client,
      type: 'mission_demarree',
      titre: 'Mission en cours',
      message: `La mission "${mission.titre}" a démarré`,
      icone: 'play-circle',
      couleur: 'success',
      priorite: 'normale',
      refModel: 'Mission',
      refId: mission._id
    });

    res.status(200).json({ success: true, mission });
  } catch (error) {
    next(error);
  }
};

const terminerMission = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });
    if (mission.technicien.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    // Générer OTP de fin si nécessaire
    if (!mission.otpFin || !mission.otpFin.code) {
      mission.otpFin = { code: genererCodeOTP(6), valide: false };
      await mission.save();
    }

    await notificationService.creerNotification({
      destinataire: mission.client,
      type: 'mission_terminee',
      titre: 'Mission terminée',
      message: `Votre code de validation est : ${mission.otpFin.code}`,
      icone: 'check',
      couleur: 'success',
      priorite: 'haute',
      refModel: 'Mission',
      refId: mission._id
    });

    res.status(200).json({ success: true, otpGenere: true, message: 'Code envoyé au client' });
  } catch (error) {
    next(error);
  }
};

const confirmerFin = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });
    if (mission.technicien.toString() !== req.userId && mission.client.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await mission.terminer(req.body.otpCode);

    // Mettre à jour la demande
    if (mission.demande) {
      await Demande.findByIdAndUpdate(mission.demande, { statut: 'terminee' });
    }

    await notificationService.notifierMissionTerminee(mission.client, mission);
    await notificationService.notifierMissionTerminee(mission.technicien, mission);

    logger.info('Mission terminée', { missionId: mission._id });

    res.status(200).json({ success: true, mission });
  } catch (error) {
    next(error);
  }
};

const annulerMission = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });

    const estClient = mission.client.toString() === req.userId;
    const estTechnicien = mission.technicien.toString() === req.userId;

    if (!estClient && !estTechnicien && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const par = estClient ? 'client' : estTechnicien ? 'technicien' : 'admin';
    const penalite = req.body.penalite || 0;

    await mission.annuler(par, req.body.raison, penalite);

    const destinataire = estClient ? mission.technicien : mission.client;
    await notificationService.creerNotification({
      destinataire,
      type: 'mission_annulee',
      titre: 'Mission annulée',
      message: `La mission "${mission.titre}" a été annulée. Raison : ${req.body.raison || 'Non précisée'}`,
      icone: 'x-circle',
      couleur: 'danger',
      priorite: 'haute',
      refModel: 'Mission',
      refId: mission._id
    });

    res.status(200).json({ success: true, mission });
  } catch (error) {
    next(error);
  }
};

const ajouterPreuve = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });

    const estParticipant =
      mission.client.toString() === req.userId ||
      mission.technicien.toString() === req.userId;

    if (!estParticipant) return res.status(403).json({ success: false, message: 'Non autorisé' });

    const fichiers = req.files || [];
    if (fichiers.length === 0 && !req.body.url) {
      return res.status(400).json({ success: false, message: 'Aucune preuve fournie' });
    }

    for (const f of fichiers) {
      await mission.ajouterPreuve({
        type: req.body.type || 'photo_avant',
        url: `/uploads/demandes/${f.filename}`,
        description: req.body.description || null
      });
    }

    if (req.body.url) {
      await mission.ajouterPreuve({
        type: req.body.type || 'document',
        url: req.body.url,
        description: req.body.description || null
      });
    }

    res.status(200).json({ success: true, preuves: mission.preuves });
  } catch (error) {
    next(error);
  }
};

const ouvrirLitige = async (req, res, next) => {
  try {
    const Litige = require('../models/Litige');
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });

    const estClient = mission.client.toString() === req.userId;
    const estTechnicien = mission.technicien.toString() === req.userId;

    if (!estClient && !estTechnicien) return res.status(403).json({ success: false, message: 'Non autorisé' });
    if (mission.litige) return res.status(400).json({ success: false, message: 'Litige déjà ouvert' });

    const litige = await Litige.create({
      mission: mission._id,
      ouvertPar: req.userId,
      roleOuverture: estClient ? 'client' : 'technicien',
      client: mission.client,
      technicien: mission.technicien,
      motif: req.body.motif,
      description: req.body.description,
      montantLitige: mission.tarification.prixConvenu,
      devise: mission.tarification.devise
    });

    await mission.ouvrirLitige(litige._id);

    const destinataire = estClient ? mission.technicien : mission.client;
    await notificationService.notifierLitigeOuvert(destinataire, litige);

    res.status(201).json({ success: true, litige });
  } catch (error) {
    next(error);
  }
};

const mesMissionsActives = async (req, res, next) => {
  try {
    if (req.userRole === 'technicien') {
      const missions = await Mission.missionsActivesTechnicien(req.userId);
      return res.status(200).json({ success: true, missions });
    }
    const missions = await Mission.find({
      $or: [{ client: req.userId }, { entreprise: req.userId }],
      statut: { $in: [STATUTS_MISSION.ACCEPTEE, STATUTS_MISSION.EN_COURS] }
    }).populate('technicien', 'nom prenom photo titreProfessionnel');

    res.status(200).json({ success: true, missions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listerMissions,
  obtenirMission,
  demarrerMission,
  confirmerDemarrage,
  terminerMission,
  confirmerFin,
  annulerMission,
  ajouterPreuve,
  ouvrirLitige,
  mesMissionsActives
};
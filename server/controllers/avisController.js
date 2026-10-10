const Avis = require('../models/Avis');
const Mission = require('../models/Mission');
const Technicien = require('../models/Technicien');
const notificationService = require('../services/notificationService');
const { logger } = require('../utils/logger');

const creerAvis = async (req, res, next) => {
  try {
    const { missionId, note, titre, commentaire, criteres, recommande } = req.body;

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable' });

    if (mission.statut !== 'terminee') {
      return res.status(400).json({ success: false, message: 'La mission doit être terminée' });
    }

    const estClient = mission.client.toString() === req.userId;
    const estTechnicien = mission.technicien.toString() === req.userId;

    if (!estClient && !estTechnicien) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const existant = await Avis.findOne({ mission: missionId, auteur: req.userId });
    if (existant) return res.status(400).json({ success: false, message: 'Vous avez déjà laissé un avis' });

    const cible = estClient ? mission.technicien : mission.client;
    const typeCible = estClient ? 'technicien' : 'client';

    const avis = await Avis.create({
      mission: missionId,
      auteur: req.userId,
      cible,
      typeCible,
      technicien: estClient ? mission.technicien : null,
      note,
      titre,
      commentaire,
      criteres,
      recommande: recommande !== undefined ? recommande : true,
      verifie: mission.paiementEffectue
    });

    // Mettre à jour la mission
    if (estClient) mission.avisClient = avis._id;
    else mission.avisTechnicien = avis._id;
    await mission.save();

    // Notifier la cible
    await notificationService.notifierNouvelAvis(cible, avis);

    logger.info('Avis créé', { avisId: avis._id, missionId, note });

    res.status(201).json({ success: true, avis });
  } catch (error) {
    next(error);
  }
};

const avisTechnicien = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { technicien: req.params.technicienId, actif: true };

    const [avis, total, repartition] = await Promise.all([
      Avis.find(query)
        .populate('auteur', 'nom prenom photo ville')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Avis.countDocuments(query),
      Avis.repartitionNotes(req.params.technicienId)
    ]);

    res.status(200).json({
      success: true,
      avis,
      repartition,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const mesAvis = async (req, res, next) => {
  try {
    const avis = await Avis.find({ auteur: req.userId })
      .populate('cible', 'nom prenom photo')
      .populate('mission', 'titre')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, avis });
  } catch (error) {
    next(error);
  }
};

const obtenirAvis = async (req, res, next) => {
  try {
    const avis = await Avis.findById(req.params.id)
      .populate('auteur', 'nom prenom photo ville')
      .populate('cible', 'nom prenom photo')
      .populate('technicien', 'nom prenom photo numeroNINTI');

    if (!avis) return res.status(404).json({ success: false, message: 'Avis introuvable' });

    res.status(200).json({ success: true, avis });
  } catch (error) {
    next(error);
  }
};

const modifierAvis = async (req, res, next) => {
  try {
    const avis = await Avis.findById(req.params.id);
    if (!avis) return res.status(404).json({ success: false, message: 'Avis introuvable' });
    if (avis.auteur.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const delaiModif = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - avis.createdAt.getTime() > delaiModif) {
      return res.status(400).json({ success: false, message: 'Délai de modification dépassé (7 jours)' });
    }

    ['note', 'titre', 'commentaire', 'criteres', 'recommande'].forEach((c) => {
      if (req.body[c] !== undefined) avis[c] = req.body[c];
    });

    await avis.save();
    res.status(200).json({ success: true, avis });
  } catch (error) {
    next(error);
  }
};

const supprimerAvis = async (req, res, next) => {
  try {
    const avis = await Avis.findById(req.params.id);
    if (!avis) return res.status(404).json({ success: false, message: 'Avis introuvable' });

    const User = require('../models/User');
    const user = await User.findById(req.userId);
    const estAdmin = user && user.role === 'admin';

    if (avis.auteur.toString() !== req.userId && !estAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await avis.deleteOne();
    res.status(200).json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    next(error);
  }
};

const signalerAvis = async (req, res, next) => {
  try {
    const avis = await Avis.findById(req.params.id);
    if (!avis) return res.status(404).json({ success: false, message: 'Avis introuvable' });

    await avis.signaler(req.body.raison);
    res.status(200).json({ success: true, message: 'Avis signalé à la modération' });
  } catch (error) {
    next(error);
  }
};

const marquerUtile = async (req, res, next) => {
  try {
    const avis = await Avis.findById(req.params.id);
    if (!avis) return res.status(404).json({ success: false, message: 'Avis introuvable' });

    await avis.incrementerUtile();
    res.status(200).json({ success: true, utile: avis.utile });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  creerAvis,
  avisTechnicien,
  mesAvis,
  obtenirAvis,
  modifierAvis,
  supprimerAvis,
  signalerAvis,
  marquerUtile
};
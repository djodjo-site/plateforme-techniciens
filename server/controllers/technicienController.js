const Technicien = require('../models/Technicien');
const NINTI = require('../models/NINTI');
const TestResult = require('../models/TestResult');
const Mission = require('../models/Mission');
const Avis = require('../models/Avis');
const { STATUTS_TECHNICIEN } = require('../config/constants');
const geolocService = require('../services/geolocService');
const { logger } = require('../utils/logger');

const obtenirProfil = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });
    res.status(200).json({ success: true, technicien: technicien.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const obtenirProfilPublic = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id)
      .select('-motDePasse -documentsKYC -avertissements -journalActions');
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });
    if (technicien.statut !== STATUTS_TECHNICIEN.NINTI_ACTIF) {
      return res.status(403).json({ success: false, message: 'Profil non disponible' });
    }
    res.status(200).json({ success: true, technicien: technicien.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const mettreAJourProfil = async (req, res, next) => {
  try {
    const champs = [
      'titreProfessionnel', 'biographie', 'anneesExperience', 'competences',
      'categories', 'langues', 'rayonIntervention', 'zonesDesservies',
      'adressePrincipale', 'accepteUrgences', 'horairesDisponibilite',
      'preferences'
    ];

    const updates = {};
    champs.forEach((c) => {
      if (req.body[c] !== undefined) updates[c] = req.body[c];
    });

    if (req.body.tarifs) updates.tarifs = { ...req.body.tarifs };

    const technicien = await Technicien.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, technicien: technicien.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const mettreAJourDisponibilite = async (req, res, next) => {
  try {
    const { disponible, statutDisponibilite } = req.body;

    const updates = {};
    if (disponible !== undefined) updates.disponible = disponible;
    if (statutDisponibilite) updates.statutDisponibilite = statutDisponibilite;

    const technicien = await Technicien.findByIdAndUpdate(req.userId, updates, { new: true });
    res.status(200).json({ success: true, disponible: technicien.disponible, statut: technicien.statutDisponibilite });
  } catch (error) {
    next(error);
  }
};

const mettreAJourPosition = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;
    const technicien = await geolocService.mettreAJourPosition(req.userId, longitude, latitude);
    res.status(200).json({ success: true, position: technicien.positionActuelle });
  } catch (error) {
    next(error);
  }
};

const ajouterCertification = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    technicien.certifications.push(req.body);
    await technicien.save();
    res.status(201).json({ success: true, certifications: technicien.certifications });
  } catch (error) {
    next(error);
  }
};

const supprimerCertification = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    technicien.certifications = technicien.certifications.filter(
      (c) => c._id.toString() !== req.params.certId
    );
    await technicien.save();
    res.status(200).json({ success: true, certifications: technicien.certifications });
  } catch (error) {
    next(error);
  }
};

const ajouterDiplome = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    technicien.diplomes.push(req.body);
    await technicien.save();
    res.status(201).json({ success: true, diplomes: technicien.diplomes });
  } catch (error) {
    next(error);
  }
};

const supprimerDiplome = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    technicien.diplomes = technicien.diplomes.filter(
      (d) => d._id.toString() !== req.params.diplomeId
    );
    await technicien.save();
    res.status(200).json({ success: true, diplomes: technicien.diplomes });
  } catch (error) {
    next(error);
  }
};

const soumettreKYC = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    const fichiers = req.files || {};

    if (fichiers.pieceIdentiteRecto) {
      technicien.documentsKYC.pieceIdentite.urlRecto = `/uploads/documents/${fichiers.pieceIdentiteRecto[0].filename}`;
    }
    if (fichiers.pieceIdentiteVerso) {
      technicien.documentsKYC.pieceIdentite.urlVerso = `/uploads/documents/${fichiers.pieceIdentiteVerso[0].filename}`;
    }
    if (fichiers.selfie) {
      technicien.documentsKYC.selfie.url = `/uploads/documents/${fichiers.selfie[0].filename}`;
    }
    if (fichiers.justificatifDomicile) {
      technicien.documentsKYC.justificatifDomicile.url = `/uploads/documents/${fichiers.justificatifDomicile[0].filename}`;
    }

    if (req.body.pieceIdentiteType) technicien.documentsKYC.pieceIdentite.type = req.body.pieceIdentiteType;
    if (req.body.pieceIdentiteNumero) technicien.documentsKYC.pieceIdentite.numero = req.body.pieceIdentiteNumero;

    await technicien.save();

    res.status(200).json({ success: true, message: 'Documents KYC soumis pour vérification', documentsKYC: technicien.documentsKYC });
  } catch (error) {
    next(error);
  }
};

const mesStatistiques = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.userId);
    const avisRecents = await Avis.avisTechnicien(req.userId, 5);
    const repartition = await Avis.repartitionNotes(req.userId);
    const missionsActives = await Mission.countDocuments({
      technicien: req.userId,
      statut: { $in: ['acceptee', 'en_cours'] }
    });

    res.status(200).json({
      success: true,
      statistiques: technicien.statistiques,
      avisRecents,
      repartition,
      missionsActives
    });
  } catch (error) {
    next(error);
  }
};

const monHistoriqueMissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const skip = (page - 1) * limit;

    const query = { technicien: req.userId };
    if (statut) query.statut = statut;

    const [missions, total] = await Promise.all([
      Mission.find(query)
        .populate('client', 'nom prenom photo ville')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Mission.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      missions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const mesAvis = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [avis, total] = await Promise.all([
      Avis.find({ technicien: req.userId, actif: true })
        .populate('auteur', 'nom prenom photo ville')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Avis.countDocuments({ technicien: req.userId, actif: true })
    ]);

    res.status(200).json({
      success: true,
      avis,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const repondreAvis = async (req, res, next) => {
  try {
    const avis = await Avis.findById(req.params.avisId);
    if (!avis) return res.status(404).json({ success: false, message: 'Avis introuvable' });
    if (avis.technicien.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await avis.ajouterReponse(req.body.contenu);
    res.status(200).json({ success: true, avis });
  } catch (error) {
    next(error);
  }
};

const monNINTI = async (req, res, next) => {
  try {
    const nintiService = require('../services/nintiService');
    const info = await nintiService.infoNINTI(req.userId);
    res.status(200).json({ success: true, ...info });
  } catch (error) {
    next(error);
  }
};

const mesTests = async (req, res, next) => {
  try {
    const tests = await TestResult.historiqueTechnicien(req.userId, 20);
    res.status(200).json({ success: true, tests });
  } catch (error) {
    next(error);
  }
};

const demandesDisponibles = async (req, res, next) => {
  try {
    const demandes = await geolocService.rechercherDemandesProches(req.userId, {
      limite: parseInt(req.query.limit) || 50
    });
    res.status(200).json({ success: true, demandes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenirProfil,
  obtenirProfilPublic,
  mettreAJourProfil,
  mettreAJourDisponibilite,
  mettreAJourPosition,
  ajouterCertification,
  supprimerCertification,
  ajouterDiplome,
  supprimerDiplome,
  soumettreKYC,
  mesStatistiques,
  monHistoriqueMissions,
  mesAvis,
  repondreAvis,
  monNINTI,
  mesTests,
  demandesDisponibles
};
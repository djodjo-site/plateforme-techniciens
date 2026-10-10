const Technicien = require('../models/Technicien');
const Entreprise = require('../models/Entreprise');
const { STATUTS_TECHNICIEN, CATEGORIES_COMPETENCES } = require('../config/constants');
const geolocService = require('../services/geolocService');
const { logger } = require('../utils/logger');

const rechercher = async (req, res, next) => {
  try {
    const {
      q, categories, competences, ville, noteMinimum,
      disponible, longitude, latitude, rayonKm,
      page = 1, limit = 20, tri = 'note'
    } = req.query;

    const query = { statut: STATUTS_TECHNICIEN.NINTI_ACTIF };

    if (q) {
      query.$or = [
        { nom: { $regex: q, $options: 'i' } },
        { prenom: { $regex: q, $options: 'i' } },
        { titreProfessionnel: { $regex: q, $options: 'i' } },
        { competences: { $regex: q, $options: 'i' } },
        { numeroNINTI: { $regex: q, $options: 'i' } }
      ];
    }

    if (categories) {
      const cats = Array.isArray(categories) ? categories : categories.split(',');
      query.categories = { $in: cats };
    }

    if (competences) {
      const comps = Array.isArray(competences) ? competences : competences.split(',');
      query.competences = { $in: comps };
    }

    if (ville) query.ville = { $regex: ville, $options: 'i' };
    if (noteMinimum) query['statistiques.noteMoyenne'] = { $gte: parseFloat(noteMinimum) };
    if (disponible === 'true') query.disponible = true;

    // Recherche géospatiale
    if (longitude && latitude && rayonKm) {
      query.positionActuelle = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseFloat(rayonKm) * 1000
        }
      };
    }

    const tris = {
      note: { 'statistiques.noteMoyenne': -1, 'statistiques.nombreMissions': -1 },
      missions: { 'statistiques.nombreMissions': -1 },
      experience: { anneesExperience: -1 },
      recent: { createdAt: -1 }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [techniciens, total] = await Promise.all([
      Technicien.find(query)
        .select('nom prenom photo titreProfessionnel biographie competences categories anneesExperience ville tarifs numeroNINTI statistiques disponible statutDisponibilite certifications badges misEnAvant')
        .sort(tris[tri] || tris.note)
        .skip(skip)
        .limit(parseInt(limit)),
      Technicien.countDocuments(query)
    ]);

    // Incrémenter les consultations de l'entreprise
    if (req.entreprise) {
      await req.entreprise.incrementerConsultations();
    }

    res.status(200).json({
      success: true,
      techniciens,
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

const ficheTechnicien = async (req, res, next) => {
  try {
    const technicien = await Technicien.findById(req.params.id)
      .select('-motDePasse -documentsKYC -avertissements -journalActions');

    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });
    if (technicien.statut !== STATUTS_TECHNICIEN.NINTI_ACTIF) {
      return res.status(403).json({ success: false, message: 'Profil non disponible' });
    }

    // Incrémenter les consultations
    if (req.entreprise) await req.entreprise.incrementerConsultations();

    // Avis récents
    const Avis = require('../models/Avis');
    const avis = await Avis.avisTechnicien(technicien._id, 10);
    const repartition = await Avis.repartitionNotes(technicien._id);

    res.status(200).json({
      success: true,
      technicien: technicien.toPublicJSON(),
      avis,
      repartition
    });
  } catch (error) {
    next(error);
  }
};

const contacterTechnicien = async (req, res, next) => {
  try {
    const { technicienId, message } = req.body;

    if (!req.entreprise) {
      return res.status(403).json({ success: false, message: 'Réservé aux entreprises' });
    }

    if (!req.entreprise.peutContacterTechnicien()) {
      return res.status(403).json({ success: false, message: 'Limite de contacts atteinte' });
    }

    const technicien = await Technicien.findById(technicienId);
    if (!technicien) return res.status(404).json({ success: false, message: 'Technicien introuvable' });

    // Créer une notification pour le technicien
    const notificationService = require('../services/notificationService');
    await notificationService.creerNotification({
      destinataire: technicienId,
      type: 'nouvelle_demande',
      titre: `Contact de ${req.entreprise.raisonSociale}`,
      message: message || 'Une entreprise souhaite vous contacter',
      icone: 'briefcase',
      couleur: 'info',
      priorite: 'normale',
      action: { label: 'Voir le contact', url: '/technicien/messages' }
    });

    await req.entreprise.incrementerContacts();

    res.status(200).json({ success: true, message: 'Contact envoyé' });
  } catch (error) {
    next(error);
  }
};

const statistiques = async (req, res, next) => {
  try {
    const total = await Technicien.countDocuments({ statut: STATUTS_TECHNICIEN.NINTI_ACTIF });
    const disponibles = await Technicien.countDocuments({ statut: STATUTS_TECHNICIEN.NINTI_ACTIF, disponible: true });
    const parCategorie = await Technicien.aggregate([
      { $match: { statut: STATUTS_TECHNICIEN.NINTI_ACTIF } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', nombre: { $sum: 1 } } },
      { $sort: { nombre: -1 } }
    ]);
    const parVille = await Technicien.aggregate([
      { $match: { statut: STATUTS_TECHNICIEN.NINTI_ACTIF } },
      { $group: { _id: '$ville', nombre: { $sum: 1 } } },
      { $sort: { nombre: -1 } },
      { $limit: 20 }
    ]);
    const noteMoyenne = await Technicien.aggregate([
      { $match: { statut: STATUTS_TECHNICIEN.NINTI_ACTIF } },
      { $group: { _id: null, moyenne: { $avg: '$statistiques.noteMoyenne' } } }
    ]);

    res.status(200).json({
      success: true,
      total,
      disponibles,
      parCategorie,
      parVille,
      noteMoyenne: Math.round((noteMoyenne[0]?.moyenne || 0) * 10) / 10
    });
  } catch (error) {
    next(error);
  }
};

const topTechniciens = async (req, res, next) => {
  try {
    const limite = parseInt(req.query.limit) || 10;
    const top = await Technicien.find({ statut: STATUTS_TECHNICIEN.NINTI_ACTIF })
      .sort({ 'statistiques.noteMoyenne': -1, 'statistiques.nombreMissions': -1 })
      .limit(limite)
      .select('nom prenom photo titreProfessionnel numeroNINTI statistiques badges');

    res.status(200).json({ success: true, top });
  } catch (error) {
    next(error);
  }
};

const categoriesDisponibles = async (req, res, next) => {
  try {
    const stats = await Technicien.aggregate([
      { $match: { statut: STATUTS_TECHNICIEN.NINTI_ACTIF } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', nombre: { $sum: 1 } } },
      { $sort: { nombre: -1 } }
    ]);

    res.status(200).json({ success: true, categories: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  rechercher,
  ficheTechnicien,
  contacterTechnicien,
  statistiques,
  topTechniciens,
  categoriesDisponibles
};
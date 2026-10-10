const Demande = require('../models/Demande');
const Technicien = require('../models/Technicien');
const Mission = require('../models/Mission');
const Notification = require('../models/Notification');
const { STATUTS_DEMANDE, STATUTS_MISSION } = require('../config/constants');
const geolocService = require('../services/geolocService');
const notificationService = require('../services/notificationService');
const { logger } = require('../utils/logger');

const creerDemande = async (req, res, next) => {
  try {
    const donnees = {
      ...req.body,
      client: req.userId,
      statut: STATUTS_DEMANDE.OUVERTE
    };

    if (req.userRole === 'entreprise') donnees.entreprise = req.userId;

    if (req.files && req.files.length > 0) {
      donnees.fichiers = req.files.map((f) => ({
        nom: f.originalname,
        url: `/uploads/demandes/${f.filename}`,
        type: f.mimetype,
        taille: f.size
      }));
    }

    const demande = await Demande.create(donnees);

    // Notifier les techniciens correspondants
    const techniciensCorrespondants = await Technicien.find({
      statut: 'ninti_actif',
      disponible: true,
      $or: [
        { categories: demande.categorie },
        { competences: { $in: demande.competencesRequises || [] } }
      ]
    }).limit(50);

    for (const tech of techniciensCorrespondants) {
      await notificationService.notifierNouvelleDemande(tech._id, demande);
    }

    logger.info('Demande créée', { demandeId: demande._id, client: req.userId });

    res.status(201).json({ success: true, demande });
  } catch (error) {
    next(error);
  }
};

const listerDemandes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, categorie, ville } = req.query;
    const skip = (page - 1) * limit;

    const query = { client: req.userId };
    if (statut) query.statut = statut;
    if (categorie) query.categorie = categorie;
    if (ville) query['localisation.ville'] = ville;

    const [demandes, total] = await Promise.all([
      Demande.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Demande.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      demandes,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const obtenirDemande = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom photo ville telephone')
      .populate('technicienSelectionne', 'nom prenom photo titreProfessionnel numeroNINTI statistiques');

    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });

    await demande.incrementerVues();

    res.status(200).json({ success: true, demande });
  } catch (error) {
    next(error);
  }
};

const mettreAJourDemande = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    if (demande.client.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    if (demande.statut !== STATUTS_DEMANDE.OUVERTE) {
      return res.status(400).json({ success: false, message: 'Demande déjà traitée' });
    }

    const champs = ['titre', 'description', 'categorie', 'competencesRequises', 'urgence', 'budget', 'dateSouhaitee', 'localisation'];
    champs.forEach((c) => {
      if (req.body[c] !== undefined) demande[c] = req.body[c];
    });

    await demande.save();
    res.status(200).json({ success: true, demande });
  } catch (error) {
    next(error);
  }
};

const annulerDemande = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    if (demande.client.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    if (demande.statut !== STATUTS_DEMANDE.OUVERTE) {
      return res.status(400).json({ success: false, message: 'Impossible d\'annuler à ce stade' });
    }

    demande.statut = STATUTS_DEMANDE.ANNULEE;
    demande.annulation = { effectuee: true, raison: req.body.raison, dateAnnulation: new Date() };
    await demande.save();

    res.status(200).json({ success: true, message: 'Demande annulée' });
  } catch (error) {
    next(error);
  }
};

const soumettreOffre = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    if (!demande.estOuverte()) {
      return res.status(400).json({ success: false, message: 'Demande fermée ou expirée' });
    }

    const technicien = await Technicien.findById(req.userId);
    if (!technicien || technicien.statut !== 'ninti_actif') {
      return res.status(403).json({ success: false, message: 'NINTI actif requis' });
    }

    const offre = {
      technicien: req.userId,
      message: req.body.message,
      prix: req.body.prix,
      devise: req.body.devise || 'XAF',
      delaiHeures: req.body.delaiHeures || 0
    };

    await demande.ajouterOffre(offre);
    await notificationService.notifierNouvelleOffre(demande.client, offre, demande);

    res.status(201).json({ success: true, demande });
  } catch (error) {
    next(error);
  }
};

const accepterOffre = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    if (demande.client.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await demande.accepterOffre(req.params.offreId);

    const offre = demande.offres.id(req.params.offreId);

    // Créer la mission
    const mission = await Mission.create({
      demande: demande._id,
      client: demande.client,
      technicien: offre.technicien,
      entreprise: demande.entreprise,
      titre: demande.titre,
      description: demande.description,
      dateDebut: demande.dateSouhaitee || new Date(),
      localisation: demande.localisation,
      tarification: {
        prixConvenu: offre.prix,
        devise: offre.devise,
        commission: { taux: 10 },
        negociable: true
      },
      statut: STATUTS_MISSION.ACCEPTEE,
      etapes: [{ nom: 'Offre acceptée', statut: 'termine', date: new Date() }]
    });

    demande.mission = mission._id;
    await demande.save();

    await notificationService.notifierOffreAcceptee(offre.technicien, demande);
    await notificationService.notifierMissionAssignee(offre.technicien, mission);

    res.status(200).json({ success: true, mission, demande });
  } catch (error) {
    next(error);
  }
};

const refuserOffre = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    if (demande.client.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const offre = demande.offres.id(req.params.offreId);
    if (!offre) return res.status(404).json({ success: false, message: 'Offre introuvable' });

    offre.statut = 'refusee';
    await demande.save();

    await notificationService.notifierOffreRefusee(offre.technicien, demande);

    res.status(200).json({ success: true, message: 'Offre refusée' });
  } catch (error) {
    next(error);
  }
};

const mesOffres = async (req, res, next) => {
  try {
    const demandes = await Demande.find({ 'offres.technicien': req.userId })
      .populate('client', 'nom prenom photo ville')
      .sort({ createdAt: -1 });

    const offres = demandes.map((d) => {
      const offre = d.offres.find((o) => o.technicien.toString() === req.userId);
      return {
        demande: { _id: d._id, titre: d.titre, categorie: d.categorie, statut: d.statut, client: d.client },
        offre,
        statutDemande: d.statut
      };
    });

    res.status(200).json({ success: true, offres });
  } catch (error) {
    next(error);
  }
};

const demandesPourMoi = async (req, res, next) => {
  try {
    const demandes = await geolocService.rechercherDemandesProches(req.userId);
    res.status(200).json({ success: true, demandes });
  } catch (error) {
    next(error);
  }
};

const retirerOffre = async (req, res, next) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });

    const offre = demande.offres.id(req.params.offreId);
    if (!offre) return res.status(404).json({ success: false, message: 'Offre introuvable' });
    if (offre.technicien.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    if (offre.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Impossible de retirer' });
    }

    offre.statut = 'retiree';
    await demande.save();

    res.status(200).json({ success: true, message: 'Offre retirée' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  creerDemande,
  listerDemandes,
  obtenirDemande,
  mettreAJourDemande,
  annulerDemande,
  soumettreOffre,
  accepterOffre,
  refuserOffre,
  mesOffres,
  demandesPourMoi,
  retirerOffre
};
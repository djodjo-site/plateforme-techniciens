const Entreprise = require('../models/Entreprise');
const Abonnement = require('../models/Abonnement');
const Mission = require('../models/Mission');
const Paiement = require('../models/Paiement');
const { STATUTS_ENTREPRISE } = require('../config/constants');
const { logger } = require('../utils/logger');

const obtenirProfil = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Entreprise introuvable' });
    res.status(200).json({ success: true, entreprise: entreprise.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const mettreAJourProfil = async (req, res, next) => {
  try {
    const champs = [
      'raisonSociale', 'nomCommercial', 'numeroRCCM', 'numeroImpot', 'numeroCNSS',
      'secteurActivite', 'tailleEntreprise', 'nombreEmployes', 'siteWeb',
      'description', 'adresseSiege', 'ville', 'province', 'codePostal', 'facturation'
    ];

    const updates = {};
    champs.forEach((c) => {
      if (req.body[c] !== undefined) updates[c] = req.body[c];
    });

    const entreprise = await Entreprise.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, entreprise: entreprise.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

    const url = `/uploads/profils/${req.file.filename}`;
    const entreprise = await Entreprise.findByIdAndUpdate(req.userId, { logo: url }, { new: true });

    res.status(200).json({ success: true, logo: url, entreprise: entreprise.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const soumettreDocumentsLegaux = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    const fichiers = req.files || {};

    if (fichiers.rccm) entreprise.documentsLegaux.rccm.url = `/uploads/documents/${fichiers.rccm[0].filename}`;
    if (fichiers.numeroImpot) entreprise.documentsLegaux.numeroImpot.url = `/uploads/documents/${fichiers.numeroImpot[0].filename}`;
    if (fichiers.attestationFiscale) entreprise.documentsLegaux.attestationFiscale.url = `/uploads/documents/${fichiers.attestationFiscale[0].filename}`;
    if (fichiers.statuts) entreprise.documentsLegaux.statuts.url = `/uploads/documents/${fichiers.statuts[0].filename}`;

    await entreprise.save();

    res.status(200).json({ success: true, message: 'Documents soumis pour vérification', documentsLegaux: entreprise.documentsLegaux });
  } catch (error) {
    next(error);
  }
};

const ajouterContact = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    if (req.body.principal) {
      entreprise.contacts.forEach((c) => { c.principal = false; });
    }
    entreprise.contacts.push(req.body);
    await entreprise.save();
    res.status(201).json({ success: true, contacts: entreprise.contacts });
  } catch (error) {
    next(error);
  }
};

const supprimerContact = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    entreprise.contacts = entreprise.contacts.filter((c) => c._id.toString() !== req.params.contactId);
    await entreprise.save();
    res.status(200).json({ success: true, contacts: entreprise.contacts });
  } catch (error) {
    next(error);
  }
};

const monAbonnement = async (req, res, next) => {
  try {
    const abonnements = await Abonnement.find({ entreprise: req.userId }).sort({ createdAt: -1 });
    const actif = abonnements.find((a) => a.statut === 'actif' && a.dateFin > new Date());

    res.status(200).json({
      success: true,
      abonnementActif: actif || null,
      historique: abonnements
    });
  } catch (error) {
    next(error);
  }
};

const souscrireAbonnement = async (req, res, next) => {
  try {
    const stripeService = require('../services/stripeService');
    const { type = 'mensuel' } = req.body;

    const entreprise = await Entreprise.findById(req.userId);
    if (entreprise.statut !== STATUTS_ENTREPRISE.ACTIF) {
      return res.status(403).json({ success: false, message: 'Compte entreprise non validé' });
    }

    const session = await stripeService.creerSessionAbonnement(entreprise, type);
    res.status(200).json({ success: true, ...session });
  } catch (error) {
    next(error);
  }
};

const annulerAbonnement = async (req, res, next) => {
  try {
    const abonnement = await Abonnement.findOne({ entreprise: req.userId, statut: 'actif' });
    if (!abonnement) return res.status(404).json({ success: false, message: 'Aucun abonnement actif' });

    await abonnement.annuler(req.body.raison || 'Annulation volontaire', req.userId);
    res.status(200).json({ success: true, message: 'Abonnement annulé' });
  } catch (error) {
    next(error);
  }
};

const ajouterFavori = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    const ajoute = await entreprise.ajouterTechnicienFavori(req.params.technicienId, req.body.note);
    if (!ajoute) return res.status(400).json({ success: false, message: 'Technicien déjà dans les favoris' });
    res.status(200).json({ success: true, favoris: entreprise.techniciensFavoris });
  } catch (error) {
    next(error);
  }
};

const retirerFavori = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    const retire = await entreprise.retirerTechnicienFavori(req.params.technicienId);
    if (!retire) return res.status(404).json({ success: false, message: 'Favori introuvable' });
    res.status(200).json({ success: true, favoris: entreprise.techniciensFavoris });
  } catch (error) {
    next(error);
  }
};

const mesFavoris = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId).populate({
      path: 'techniciensFavoris.technicien',
      select: 'nom prenom photo titreProfessionnel competences statistiques numeroNINTI'
    });
    res.status(200).json({ success: true, favoris: entreprise.techniciensFavoris });
  } catch (error) {
    next(error);
  }
};

const mesMissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const skip = (page - 1) * limit;

    const query = { entreprise: req.userId };
    if (statut) query.statut = statut;

    const [missions, total] = await Promise.all([
      Mission.find(query)
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

const mesStatistiques = async (req, res, next) => {
  try {
    const entreprise = await Entreprise.findById(req.userId);
    res.status(200).json({
      success: true,
      statistiques: entreprise.statistiques,
      accesAnnuaire: entreprise.accesAnnuaire
    });
  } catch (error) {
    next(error);
  }
};

const mesPaiements = async (req, res, next) => {
  try {
    const paiements = await Paiement.find({ utilisateur: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, paiements });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenirProfil,
  mettreAJourProfil,
  uploadLogo,
  soumettreDocumentsLegaux,
  ajouterContact,
  supprimerContact,
  monAbonnement,
  souscrireAbonnement,
  annulerAbonnement,
  ajouterFavori,
  retirerFavori,
  mesFavoris,
  mesMissions,
  mesStatistiques,
  mesPaiements
};
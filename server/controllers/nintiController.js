const nintiService = require('../services/nintiService');
const NINTI = require('../models/NINTI');

const infoMonNINTI = async (req, res, next) => {
  try {
    const info = await nintiService.infoNINTI(req.userId);
    res.status(200).json({ success: true, ...info });
  } catch (error) {
    next(error);
  }
};

const verifierPublic = async (req, res, next) => {
  try {
    const { numero } = req.params;
    const resultat = await nintiService.verifierNINTI(numero);
    res.status(200).json({ success: true, ...resultat });
  } catch (error) {
    next(error);
  }
};

const historiqueMonNINTI = async (req, res, next) => {
  try {
    const historique = await NINTI.rechercherParTechnicien(req.userId);
    res.status(200).json({ success: true, historique });
  } catch (error) {
    next(error);
  }
};

const rechercher = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ success: false, message: 'Recherche trop courte (min 3 caractères)' });
    }
    const resultats = await NINTI.rechercherParNumero(q);
    res.status(200).json({ success: true, resultats });
  } catch (error) {
    next(error);
  }
};

const revoquer = async (req, res, next) => {
  try {
    const { numero } = req.params;
    const { raison } = req.body;
    const ninti = await nintiService.revoquerNINTI(numero, raison, req.userId);
    res.status(200).json({ success: true, ninti });
  } catch (error) {
    next(error);
  }
};

const suspendre = async (req, res, next) => {
  try {
    const { numero } = req.params;
    const { raison } = req.body;
    const ninti = await nintiService.suspendreNINTI(numero, raison, req.userId);
    res.status(200).json({ success: true, ninti });
  } catch (error) {
    next(error);
  }
};

const reactiver = async (req, res, next) => {
  try {
    const { numero } = req.params;
    const ninti = await nintiService.reactiverNINTI(numero, req.userId);
    res.status(200).json({ success: true, ninti });
  } catch (error) {
    next(error);
  }
};

const statistiques = async (req, res, next) => {
  try {
    const stats = await NINTI.statistiquesGlobales();
    res.status(200).json({ success: true, statistiques: stats });
  } catch (error) {
    next(error);
  }
};

const expirationsProches = async (req, res, next) => {
  try {
    const jours = parseInt(req.query.jours) || 30;
    const nintis = await NINTI.nintisExpirant(jours);
    res.status(200).json({ success: true, nintis });
  } catch (error) {
    next(error);
  }
};

const traiterExpirations = async (req, res, next) => {
  try {
    const nombre = await nintiService.verifierExpirations();
    res.status(200).json({ success: true, nombreTraite: nombre });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  infoMonNINTI,
  verifierPublic,
  historiqueMonNINTI,
  rechercher,
  revoquer,
  suspendre,
  reactiver,
  statistiques,
  expirationsProches,
  traiterExpirations
};
const testService = require('../services/testService');
const TestResult = require('../models/TestResult');
const { logger } = require('../utils/logger');

const demarrerTest = async (req, res, next) => {
  try {
    const resultat = await testService.demarrerTest(req.userId);
    res.status(201).json({ success: true, ...resultat });
  } catch (error) {
    next(error);
  }
};

const soumettreTest = async (req, res, next) => {
  try {
    const { testId, reponses, securite } = req.body;

    const securiteData = {
      ...securite,
      adresseIP: req.ip,
      userAgent: req.get('user-agent')
    };

    const resultat = await testService.soumettreTest(testId, req.userId, reponses, securiteData);
    res.status(200).json({ success: true, resultat: resultat.toResultatJSON() });
  } catch (error) {
    next(error);
  }
};

const obtenirResultat = async (req, res, next) => {
  try {
    const test = await testService.obtenirResultatTest(req.params.testId, req.userId);
    res.status(200).json({ success: true, test });
  } catch (error) {
    next(error);
  }
};

const historique = async (req, res, next) => {
  try {
    const tests = await testService.historiqueTests(req.userId);
    res.status(200).json({ success: true, tests });
  } catch (error) {
    next(error);
  }
};

const eligibilite = async (req, res, next) => {
  try {
    const info = await testService.verifierEligibilite(req.userId);
    res.status(200).json({ success: true, ...info });
  } catch (error) {
    next(error);
  }
};

const sauvegarderTemporaire = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const resultat = await testService.sauvegarderReponseTemporaire(testId, req.userId, req.body);
    res.status(200).json({ success: resultat });
  } catch (error) {
    next(error);
  }
};

const signalerIncident = async (req, res, next) => {
  try {
    const { testId, type, details } = req.body;
    const test = await TestResult.findById(testId);

    if (!test || test.technicien.toString() !== req.userId) {
      return res.status(404).json({ success: false, message: 'Test introuvable' });
    }

    if (type === 'changement_onglet') await test.enregistrerChangementOnglet();
    if (type === 'copie') await test.enregistrerCopie();

    logger.warn('Incident test signalé', { testId, type, userId: req.userId, details });
    res.status(200).json({ success: true, securite: test.securite });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  demarrerTest,
  soumettreTest,
  obtenirResultat,
  historique,
  eligibilite,
  sauvegarderTemporaire,
  signalerIncident
};
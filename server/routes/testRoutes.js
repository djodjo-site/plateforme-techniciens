const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { proteger } = require('../middlewares/authMiddleware');
const { estTechnicien } = require('../middlewares/roleMiddleware');
const {
  chargerTechnicien,
  peutPasserTest
} = require('../middlewares/statutMiddleware');

// Toutes les routes nécessitent d'être un technicien
router.use(proteger, estTechnicien, chargerTechnicien);

router.get('/eligibilite', testController.eligibilite);
router.post('/demarrer', peutPasserTest, testController.demarrerTest);
router.post('/soumettre', testController.soumettreTest);
router.get('/historique', testController.historique);
router.get('/:testId', testController.obtenirResultat);
router.post('/:testId/sauvegarder', testController.sauvegarderTemporaire);
router.post('/incident', testController.signalerIncident);

module.exports = router;
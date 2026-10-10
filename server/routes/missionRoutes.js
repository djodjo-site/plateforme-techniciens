const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const { proteger } = require('../middlewares/authMiddleware');
const { estTechnicien } = require('../middlewares/roleMiddleware');
const { uploadPreuvesMission, gererErreursUpload } = require('../middlewares/uploadMiddleware');

router.get('/', proteger, missionController.listerMissions);
router.get('/actives', proteger, missionController.mesMissionsActives);
router.get('/:id', proteger, missionController.obtenirMission);

// Cycle de vie mission
router.post('/:id/demarrer', proteger, estTechnicien, missionController.demarrerMission);
router.post('/:id/confirmer-demarrage', proteger, estTechnicien, missionController.confirmerDemarrage);
router.post('/:id/terminer', proteger, estTechnicien, missionController.terminerMission);
router.post('/:id/confirmer-fin', proteger, missionController.confirmerFin);

router.put('/:id/annuler', proteger, missionController.annulerMission);

// Preuves
router.post(
  '/:id/preuves',
  proteger,
  uploadPreuvesMission,
  gererErreursUpload,
  missionController.ajouterPreuve
);

// Litiges
router.post('/:id/litige', proteger, missionController.ouvrirLitige);

module.exports = router;
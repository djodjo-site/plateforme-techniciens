const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avisController');
const { proteger } = require('../middlewares/authMiddleware');
const { valider, reglesAvis } = require('../middlewares/validationMiddleware');

// Public : consulter les avis d'un technicien
router.get('/technicien/:technicienId', avisController.avisTechnicien);
router.get('/:id', avisController.obtenirAvis);

// Routes protégées
router.post('/', proteger, reglesAvis, valider, avisController.creerAvis);
router.get('/mes-avis', proteger, avisController.mesAvis);
router.put('/:id', proteger, reglesAvis, valider, avisController.modifierAvis);
router.delete('/:id', proteger, avisController.supprimerAvis);
router.post('/:id/signaler', proteger, avisController.signalerAvis);
router.post('/:id/utile', proteger, avisController.marquerUtile);

module.exports = router;
const express = require('express');
const router = express.Router();
const nintiController = require('../controllers/nintiController');
const { proteger } = require('../middlewares/authMiddleware');
const { estTechnicien, estAdmin, aPermission } = require('../middlewares/roleMiddleware');

// Vérification publique (pas d'authentification)
router.get('/verifier/:numero', nintiController.verifierPublic);

// Routes technicien
router.get('/mon-ninti', proteger, estTechnicien, nintiController.infoMonNINTI);
router.get('/mon-historique', proteger, estTechnicien, nintiController.historiqueMonNINTI);

// Routes admin
router.get('/rechercher', proteger, estAdmin, nintiController.rechercher);
router.get('/statistiques', proteger, estAdmin, aPermission('voirStatistiques'), nintiController.statistiques);
router.get('/expirations-proches', proteger, estAdmin, nintiController.expirationsProches);
router.post('/traiter-expirations', proteger, estAdmin, nintiController.traiterExpirations);
router.put('/:numero/revoquer', proteger, estAdmin, aPermission('revoquerNINTI'), nintiController.revoquer);
router.put('/:numero/suspendre', proteger, estAdmin, aPermission('revoquerNINTI'), nintiController.suspendre);
router.put('/:numero/reactiver', proteger, estAdmin, aPermission('genererNINTI'), nintiController.reactiver);

module.exports = router;
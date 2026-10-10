const express = require('express');
const router = express.Router();
const abonnementController = require('../controllers/abonnementController');
const { proteger } = require('../middlewares/authMiddleware');
const { estEntreprise, estAdmin, aPermission } = require('../middlewares/roleMiddleware');
const { chargerEntreprise } = require('../middlewares/abonnementMiddleware');

// Routes entreprise
router.get('/mon-abonnement', proteger, estEntreprise, chargerEntreprise, abonnementController.monAbonnement);
router.post('/souscrire', proteger, estEntreprise, chargerEntreprise, abonnementController.souscrire);
router.post('/annuler', proteger, estEntreprise, chargerEntreprise, abonnementController.annuler);
router.put('/renouvellement-auto/activer', proteger, estEntreprise, abonnementController.activerRenouvellementAuto);
router.put('/renouvellement-auto/desactiver', proteger, estEntreprise, abonnementController.desactiverRenouvellementAuto);

// Routes admin
router.get('/admin/liste', proteger, estAdmin, aPermission('gererAbonnements'), abonnementController.listeAdmin);
router.put('/admin/:id/forcer-expiration', proteger, estAdmin, aPermission('gererAbonnements'), abonnementController.forcerExpiration);
router.get('/admin/statistiques', proteger, estAdmin, aPermission('voirStatistiques'), abonnementController.statistiques);

module.exports = router;
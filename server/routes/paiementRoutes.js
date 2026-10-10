const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { proteger } = require('../middlewares/authMiddleware');
const { estTechnicien, estAdmin, aPermission } = require('../middlewares/roleMiddleware');

// Webhook Stripe (raw body nécessaire) — à monter AVANT express.json() dans app.js
router.post('/webhook', express.raw({ type: 'application/json' }), paiementController.webhookStripe);

// Routes protégées
router.post('/accreditation-ninti', proteger, estTechnicien, paiementController.payerAccreditationNINTI);
router.post('/mission/:missionId', proteger, paiementController.payerMission);

router.get('/mes-paiements', proteger, paiementController.mesPaiements);
router.get('/session/:sessionId', proteger, paiementController.verifierSession);
router.get('/:id', proteger, paiementController.obtenirPaiement);
router.get('/:id/facture', proteger, paiementController.facture);

// Admin
router.post('/:id/rembourser', proteger, estAdmin, aPermission('gererRemboursements'), paiementController.rembourser);
router.get('/admin/statistiques', proteger, estAdmin, aPermission('voirStatistiques'), paiementController.statistiquesAdmin);

module.exports = router;
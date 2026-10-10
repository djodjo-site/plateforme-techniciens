const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { proteger } = require('../middlewares/authMiddleware');
const { estAdmin, estSuperAdmin, aPermission } = require('../middlewares/roleMiddleware');
const { valider, reglesQuestion } = require('../middlewares/validationMiddleware');

// Toutes les routes nécessitent d'être admin
router.use(proteger, estAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);
router.get('/statistiques', aPermission('voirStatistiques'), adminController.statistiques);
router.get('/mes-actions', adminController.mesActions);

// Techniciens
router.get('/techniciens', aPermission('gererTechniciens'), adminController.listerTechniciens);
router.get('/techniciens/:id', aPermission('gererTechniciens'), adminController.detailTechnicien);
router.put('/techniciens/:id/kyc/valider', aPermission('verifierKYC'), adminController.validerKYC);
router.put('/techniciens/:id/kyc/rejeter', aPermission('rejeterKYC'), adminController.rejeterKYC);
router.put('/techniciens/:id/suspendre', aPermission('suspendreComptes'), adminController.suspendreTechnicien);
router.put('/techniciens/:id/reactiver', aPermission('suspendreComptes'), adminController.reactiverTechnicien);

// Entreprises
router.get('/entreprises', aPermission('gererEntreprises'), adminController.listerEntreprises);
router.put('/entreprises/:id/valider', aPermission('gererEntreprises'), adminController.validerEntreprise);
router.put('/entreprises/:id/rejeter', aPermission('gererEntreprises'), adminController.rejeterEntreprise);
router.put('/entreprises/:id/suspendre', aPermission('suspendreComptes'), adminController.suspendreEntreprise);

// Questions
router.post('/questions', aPermission('gererQuestions'), reglesQuestion, valider, adminController.creerQuestion);
router.get('/questions', aPermission('gererQuestions'), adminController.listerQuestions);
router.put('/questions/:id', aPermission('gererQuestions'), adminController.modifierQuestion);
router.delete('/questions/:id', aPermission('gererQuestions'), adminController.supprimerQuestion);

// Litiges
router.get('/litiges', aPermission('gererLitiges'), adminController.listerLitiges);
router.get('/litiges/:id', aPermission('gererLitiges'), adminController.detailLitige);
router.put('/litiges/:id/assigner', aPermission('gererLitiges'), adminController.assignerLitige);
router.put('/litiges/:id/decision', aPermission('gererLitiges'), adminController.rendreDecisionLitige);

// NINTI
router.get('/nintis', aPermission('genererNINTI'), adminController.listerNINTI);
router.put('/nintis/:numero/revoquer', aPermission('revoquerNINTI'), adminController.revoquerNINTI);

// Super admin uniquement
router.post('/creer', estSuperAdmin, adminController.creerAdmin);

module.exports = router;
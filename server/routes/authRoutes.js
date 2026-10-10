const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { proteger } = require('../middlewares/authMiddleware');
const {
  valider,
  reglesInscription,
  reglesConnexion
} = require('../middlewares/validationMiddleware');
const { uploadPhoto } = require('../middlewares/uploadMiddleware');

router.post('/inscription', reglesInscription, valider, authController.inscription);
router.post('/connexion', reglesConnexion, valider, authController.connexion);
router.post('/deconnexion', proteger, authController.deconnexion);

router.get('/profil', proteger, authController.profil);
router.put('/profil', proteger, authController.mettreAJourProfil);
router.put('/profil/photo', proteger, uploadPhoto, authController.uploadPhotoProfil);

router.get('/verifier-email/:token', authController.verifierEmail);
router.post('/renvoyer-verification', proteger, authController.renvoyerVerification);

router.post('/mot-de-passe-oublie', authController.motDePasseOublie);
router.put('/reset-mot-de-passe/:token', authController.resetMotDePasse);
router.put('/changer-mot-de-passe', proteger, authController.changerMotDePasse);

router.get('/verifier-email-disponible', authController.verifierDisponibiliteEmail);
router.get('/verifier-telephone-disponible', authController.verifierDisponibiliteTelephone);

module.exports = router;
const express = require('express');
const router = express.Router();
const entrepriseController = require('../controllers/entrepriseController');
const { proteger } = require('../middlewares/authMiddleware');
const { estEntreprise } = require('../middlewares/roleMiddleware');
const {
  chargerEntreprise,
  abonnementActif
} = require('../middlewares/abonnementMiddleware');
const {
  uploadLogo,
  uploadKYCEntreprise,
  gererErreursUpload
} = require('../middlewares/uploadMiddleware');
const { valider, reglesProfilEntreprise } = require('../middlewares/validationMiddleware');

// Toutes les routes nécessitent d'être une entreprise
router.use(proteger, estEntreprise, chargerEntreprise);

router.get('/profil', entrepriseController.obtenirProfil);
router.put('/profil', reglesProfilEntreprise, valider, entrepriseController.mettreAJourProfil);
router.put('/logo', uploadLogo, gererErreursUpload, entrepriseController.uploadLogo);

router.post(
  '/documents-legaux',
  uploadKYCEntreprise,
  gererErreursUpload,
  entrepriseController.soumettreDocumentsLegaux
);

router.post('/contacts', entrepriseController.ajouterContact);
router.delete('/contacts/:contactId', entrepriseController.supprimerContact);

router.get('/abonnement', entrepriseController.monAbonnement);
router.post('/abonnement/souscrire', entrepriseController.souscrireAbonnement);
router.post('/abonnement/annuler', entrepriseController.annulerAbonnement);

router.post('/favoris/:technicienId', abonnementActif, entrepriseController.ajouterFavori);
router.delete('/favoris/:technicienId', entrepriseController.retirerFavori);
router.get('/favoris', abonnementActif, entrepriseController.mesFavoris);

router.get('/missions', entrepriseController.mesMissions);
router.get('/statistiques', entrepriseController.mesStatistiques);
router.get('/paiements', entrepriseController.mesPaiements);

module.exports = router;
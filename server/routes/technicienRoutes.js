const express = require('express');
const router = express.Router();
const technicienController = require('../controllers/technicienController');
const { proteger } = require('../middlewares/authMiddleware');
const { estTechnicien } = require('../middlewares/roleMiddleware');
const {
  chargerTechnicien,
  nintiActif,
  verifierStatut
} = require('../middlewares/statutMiddleware');
const {
  uploadKYCTechnicien,
  uploadPhoto,
  gererErreursUpload
} = require('../middlewares/uploadMiddleware');
const { valider, reglesProfilTechnicien } = require('../middlewares/validationMiddleware');

// Routes publiques
router.get('/public/:id', technicienController.obtenirProfilPublic);

// Routes protégées (technicien)
router.use(proteger, estTechnicien, chargerTechnicien);

router.get('/profil', technicienController.obtenirProfil);
router.put('/profil', reglesProfilTechnicien, valider, technicienController.mettreAJourProfil);
router.put('/disponibilite', technicienController.mettreAJourDisponibilite);
router.put('/position', technicienController.mettreAJourPosition);

router.post('/certifications', technicienController.ajouterCertification);
router.delete('/certifications/:certId', technicienController.supprimerCertification);
router.post('/diplomes', technicienController.ajouterDiplome);
router.delete('/diplomes/:diplomeId', technicienController.supprimerDiplome);

router.post(
  '/kyc',
  uploadKYCTechnicien,
  gererErreursUpload,
  technicienController.soumettreKYC
);

router.get('/statistiques', nintiActif, technicienController.mesStatistiques);
router.get('/missions', nintiActif, technicienController.monHistoriqueMissions);
router.get('/avis', nintiActif, technicienController.mesAvis);
router.post('/avis/:avisId/repondre', nintiActif, technicienController.repondreAvis);

router.get('/ninti', technicienController.monNINTI);
router.get('/tests', technicienController.mesTests);
router.get('/demandes-disponibles', nintiActif, technicienController.demandesDisponibles);

module.exports = router;
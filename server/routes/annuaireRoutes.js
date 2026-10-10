const express = require('express');
const router = express.Router();
const annuaireController = require('../controllers/annuaireController');
const { proteger } = require('../middlewares/authMiddleware');
const { estEntreprise } = require('../middlewares/roleMiddleware');
const {
  chargerEntreprise,
  entrepriseActive,
  abonnementActif,
  peutConsulterAnnuaire,
  peutContacter
} = require('../middlewares/abonnementMiddleware');

// Routes publiques (statistiques générales)
router.get('/statistiques-publiques', annuaireController.statistiques);
router.get('/categories', annuaireController.categoriesDisponibles);
router.get('/top', annuaireController.topTechniciens);

// Routes entreprises (nécessitent un abonnement)
router.use(proteger, estEntreprise, chargerEntreprise, entrepriseActive, abonnementActif);

router.get('/rechercher', peutConsulterAnnuaire, annuaireController.rechercher);
router.get('/technicien/:id', peutConsulterAnnuaire, annuaireController.ficheTechnicien);
router.post('/contacter', peutContacter, annuaireController.contacterTechnicien);
router.get('/statistiques', annuaireController.statistiques);

module.exports = router;
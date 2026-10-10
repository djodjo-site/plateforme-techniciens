const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeController');
const { proteger } = require('../middlewares/authMiddleware');
const { autoriserRoles, estTechnicien } = require('../middlewares/roleMiddleware');
const { uploadFichiersDemande, gererErreursUpload } = require('../middlewares/uploadMiddleware');
const { valider, reglesDemande } = require('../middlewares/validationMiddleware');

// Routes protégées pour clients (particulier + entreprise)
router.post(
  '/',
  proteger,
  autoriserRoles('particulier', 'entreprise'),
  uploadFichiersDemande,
  gererErreursUpload,
  reglesDemande,
  valider,
  demandeController.creerDemande
);

router.get(
  '/mes-demandes',
  proteger,
  autoriserRoles('particulier', 'entreprise'),
  demandeController.listerDemandes
);

router.get(
  '/pour-moi',
  proteger,
  estTechnicien,
  demandeController.demandesPourMoi
);

router.get(
  '/mes-offres',
  proteger,
  estTechnicien,
  demandeController.mesOffres
);

router.get('/:id', proteger, demandeController.obtenirDemande);

router.put(
  '/:id',
  proteger,
  autoriserRoles('particulier', 'entreprise'),
  demandeController.mettreAJourDemande
);

router.delete(
  '/:id',
  proteger,
  autoriserRoles('particulier', 'entreprise'),
  demandeController.annulerDemande
);

// Offres
router.post('/:id/offres', proteger, estTechnicien, demandeController.soumettreOffre);
router.put(
  '/:id/offres/:offreId/accepter',
  proteger,
  autoriserRoles('particulier', 'entreprise'),
  demandeController.accepterOffre
);
router.put(
  '/:id/offres/:offreId/refuser',
  proteger,
  autoriserRoles('particulier', 'entreprise'),
  demandeController.refuserOffre
);
router.delete('/:id/offres/:offreId', proteger, estTechnicien, demandeController.retirerOffre);

module.exports = router;
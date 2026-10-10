const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { proteger } = require('../middlewares/authMiddleware');

router.get('/', proteger, notificationController.mesNotifications);
router.get('/non-lues', proteger, notificationController.compterNonLues);
router.put('/:id/lire', proteger, notificationController.marquerLue);
router.put('/lire-tout', proteger, notificationController.marquerToutesLues);
router.delete('/:id', proteger, notificationController.supprimer);
router.delete('/supprimer-lues', proteger, notificationController.supprimerToutes);

module.exports = router;
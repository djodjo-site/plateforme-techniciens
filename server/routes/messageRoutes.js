const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { proteger } = require('../middlewares/authMiddleware');
const { uploadDocuments, gererErreursUpload } = require('../middlewares/uploadMiddleware');
const { valider, reglesMessage } = require('../middlewares/validationMiddleware');

router.post(
  '/',
  proteger,
  uploadDocuments,
  gererErreursUpload,
  messageController.envoyerMessage
);

router.get('/conversations', proteger, messageController.mesConversations);
router.get('/conversation/:userId/:missionId?', proteger, messageController.conversation);
router.put('/conversation/:userId/:missionId?/lire', proteger, messageController.marquerLus);
router.get('/non-lus', proteger, messageController.compterNonLus);

router.delete('/:id', proteger, messageController.supprimerMessage);
router.post('/:id/signaler', proteger, messageController.signalerMessage);

module.exports = router;
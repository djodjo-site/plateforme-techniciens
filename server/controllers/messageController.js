const Message = require('../models/Message');
const User = require('../models/User');
const Mission = require('../models/Mission');
const notificationService = require('../services/notificationService');
const { getIO } = require('../sockets');
const { logger } = require('../utils/logger');

const envoyerMessage = async (req, res, next) => {
  try {
    const { destinataire, mission, contenu, type = 'texte' } = req.body;

    if (mission) {
      const missionDoc = await Mission.findById(mission);
      if (!missionDoc) return res.status(404).json({ success: false, message: 'Mission introuvable' });

      const estParticipant =
        missionDoc.client.toString() === req.userId ||
        missionDoc.technicien.toString() === req.userId;

      if (!estParticipant) return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const messageData = {
      expediteur: req.userId,
      destinataire,
      mission: mission || null,
      contenu,
      type
    };

    if (req.file) {
      messageData.type = req.file.mimetype.startsWith('image/') ? 'image' : 'fichier';
      messageData.fichier = {
        url: `/uploads/demandes/${req.file.filename}`,
        nom: req.file.originalname,
        taille: req.file.size,
        typeMime: req.file.mimetype
      };
    }

    const message = await Message.create(messageData);
    await message.populate('expediteur', 'nom prenom photo role');
    await message.populate('destinataire', 'nom prenom photo role');

    // Émettre via Socket.io
    try {
      const io = getIO();
      io.to(`user_${destinataire}`).emit('message:receive', message);
    } catch (e) {}

    // Notifier
    const expediteur = await User.findById(req.userId);
    await notificationService.notifierNouveauMessage(destinataire, expediteur, contenu, mission);

    logger.info('Message envoyé', { de: req.userId, vers: destinataire });

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const conversation = async (req, res, next) => {
  try {
    const { userId, missionId } = req.params;
    const { limite = 50 } = req.query;

    const messages = await Message.conversation(req.userId, userId, missionId, parseInt(limite));
    await Message.marquerConversationLue(req.userId, userId, missionId);

    res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

const mesConversations = async (req, res, next) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ expediteur: req.user._id }, { destinataire: req.user._id }],
          supprime: false
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$expediteur', req.user._id] },
              '$destinataire',
              '$expediteur'
            ]
          },
          dernierMessage: { $first: '$$ROOT' },
          nonLus: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$destinataire', req.user._id] }, { $eq: ['$lu', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'dernierMessage.createdAt': -1 } },
      { $limit: 50 }
    ]);

    const conversations = await Promise.all(
      messages.map(async (c) => {
        const user = await User.findById(c._id).select('nom prenom photo role');
        return {
          utilisateur: user,
          dernierMessage: c.dernierMessage,
          nonLus: c.nonLus
        };
      })
    );

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

const marquerLus = async (req, res, next) => {
  try {
    const { userId, missionId } = req.params;
    await Message.marquerConversationLue(req.userId, userId, missionId);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const supprimerMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message introuvable' });

    const estParticipant =
      message.expediteur.toString() === req.userId ||
      message.destinataire.toString() === req.userId;

    if (!estParticipant) return res.status(403).json({ success: false, message: 'Non autorisé' });

    await message.supprimerPour(req.userId);
    res.status(200).json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    next(error);
  }
};

const signalerMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message introuvable' });

    message.signale = true;
    message.raisonSignalement = req.body.raison;
    await message.save();

    res.status(200).json({ success: true, message: 'Message signalé' });
  } catch (error) {
    next(error);
  }
};

const compterNonLus = async (req, res, next) => {
  try {
    const nombre = await Message.messagesNonLus(req.userId);
    res.status(200).json({ success: true, nombre });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  envoyerMessage,
  conversation,
  mesConversations,
  marquerLus,
  supprimerMessage,
  signalerMessage,
  compterNonLus
};
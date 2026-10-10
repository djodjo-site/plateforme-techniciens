// server/sockets/messageSocket.js
const Message = require('../models/Message');
const Mission = require('../models/Mission');

module.exports = (io, socket) => {
  // Envoyer un message
  socket.on('message:send', async (data) => {
    try {
      const { destinataireId, missionId, contenu } = data;

      // Vérifier que la mission existe et que l'utilisateur y participe
      const mission = await Mission.findById(missionId);
      if (!mission) {
        return socket.emit('message:error', { message: 'Mission introuvable' });
      }

      const estParticipant =
        mission.client.toString() === socket.userId ||
        mission.technicien.toString() === socket.userId;

      if (!estParticipant) {
        return socket.emit('message:error', { message: 'Non autorisé' });
      }

      // Créer le message
      const message = await Message.create({
        expediteur: socket.userId,
        destinataire: destinataireId,
        mission: missionId,
        contenu,
        lu: false
      });

      await message.populate('expediteur', 'nom prenom photo');

      // Envoyer au destinataire
      io.to(`user_${destinataireId}`).emit('message:receive', message);
      
      // Confirmer l'envoi à l'expéditeur
      socket.emit('message:sent', message);

    } catch (error) {
      console.error('❌ Erreur envoi message :', error.message);
      socket.emit('message:error', { message: 'Erreur lors de l\'envoi' });
    }
  });

  // Marquer comme lu
  socket.on('message:read', async (data) => {
    try {
      const { messageId } = data;
      await Message.findByIdAndUpdate(messageId, { lu: true });
      socket.emit('message:read:confirmed', { messageId });
    } catch (error) {
      console.error('❌ Erreur marquage lu :', error.message);
    }
  });

  // Indicateur de frappe
  socket.on('message:typing', (data) => {
    const { destinataireId, missionId } = data;
    io.to(`user_${destinataireId}`).emit('message:typing', {
      expediteurId: socket.userId,
      missionId
    });
  });
};
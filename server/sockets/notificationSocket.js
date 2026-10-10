// server/sockets/notificationSocket.js
const Notification = require('../models/Notification');

module.exports = (io, socket) => {
  // Marquer une notification comme lue
  socket.on('notification:read', async (data) => {
    try {
      const { notificationId } = data;
      await Notification.findByIdAndUpdate(notificationId, { lu: true });
      socket.emit('notification:read:confirmed', { notificationId });
    } catch (error) {
      console.error('❌ Erreur notification :', error.message);
    }
  });

  // Marquer toutes comme lues
  socket.on('notification:read:all', async () => {
    try {
      await Notification.updateMany(
        { destinataire: socket.userId, lu: false },
        { lu: true }
      );
      socket.emit('notification:read:all:confirmed');
    } catch (error) {
      console.error('❌ Erreur notifications :', error.message);
    }
  });
};
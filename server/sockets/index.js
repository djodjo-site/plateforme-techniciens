// server/sockets/index.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Middleware d'authentification Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token manquant'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-motDePasse');
      
      if (!user) {
        return next(new Error('Utilisateur introuvable'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentification échouée'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté : ${socket.userId} (${socket.userRole})`);

    // Rejoindre une room personnelle (pour les notifications)
    socket.join(`user_${socket.userId}`);

    // Événements de messagerie
    require('./messageSocket')(io, socket);

    // Événements de notification
    require('./notificationSocket')(io, socket);

    socket.on('disconnect', () => {
      console.log(`🔌 Utilisateur déconnecté : ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io non initialisé');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
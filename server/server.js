// server/server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./sockets');

const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.io
initializeSocket(server);

// Démarrage du serveur
server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Serveur démarré en mode ${process.env.NODE_ENV}`);
  console.log(`📡 URL : http://localhost:${PORT}`);
  console.log(`🔗 API : http://localhost:${PORT}/api`);
  console.log(`❤️  Santé : http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Rejet non géré :', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exception non capturée :', err.message);
  server.close(() => process.exit(1));
});

// Arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt propre du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});
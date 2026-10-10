// server/config/db.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    mongoose.connection.on('error', (err) => console.error(`❌ MongoDB : ${err.message}`));
    mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB déconnecté'));
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
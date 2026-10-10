// server/seeds/index.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const seedAdmin = require('./adminSeed');
const seedQuestions = require('./questionsSeed');

const lancerSeeds = async () => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🌱 DÉMARRAGE DES SEEDS');
    console.log('═══════════════════════════════════════════════════');

    // Connexion DB
    await connectDB();

    // Seed admin
    await seedAdmin();

    // Seed questions
    await seedQuestions();

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SEEDS TERMINÉS AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR SEEDS :', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

lancerSeeds();
// server/seeds/adminSeed.js
const Admin = require('../models/Admin');

const superAdminData = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@plateforme-techniciens.com',
  motDePasse: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2025!',
  nom: 'Administrateur',
  prenom: 'Super',
  telephone: process.env.SUPER_ADMIN_PHONE || '+243900000000',
  // role: 'admin'  ← SUPPRIMÉ (le discriminator l'ajoute automatiquement)
  niveauAcces: 'super_admin',
  fonction: 'Super Administrateur',
  matricule: 'ADMIN-00001',
  emailVerifie: true,
  actif: true,
  deuxFacteursActif: false,
  peutEtreSupprime: false
};

const seedAdmin = async () => {
  try {
    const existant = await Admin.findOne({ email: superAdminData.email });

    if (existant) {
      console.log('ℹ️  Super admin déjà existant :', superAdminData.email);
      return existant;
    }

    const admin = await Admin.create(superAdminData);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SUPER ADMIN CRÉÉ');
    console.log('═══════════════════════════════════════════════════');
    console.log('📧 Email      :', superAdminData.email);
    console.log('🔑 Mot de passe :', superAdminData.motDePasse);
    console.log('⚠️  Changez le mot de passe après la première connexion !');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return admin;
  } catch (error) {
    console.error('❌ Erreur création super admin :', error.message);
    throw error;
  }
};

module.exports = seedAdmin;
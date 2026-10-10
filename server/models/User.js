// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    // ===== IDENTIFIANTS =====
    email: {
      type: String,
      required: [true, 'L\'email est obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Veuillez fournir un email valide'
      ]
    },

    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false // Ne pas retourner par défaut dans les requêtes
    },

    // ===== RÔLE (DISCRIMINATOR KEY) =====
    role: {
  type: String,
  enum: Object.values(ROLES),
  required: true,
  default: ROLES.PARTICULIER,
  lowercase: true,
  trim: true
},
    // ===== INFORMATIONS PERSONNELLES =====
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },

    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
    },

    telephone: {
      type: String,
      required: [true, 'Le téléphone est obligatoire'],
      trim: true,
      match: [
        /^\+?[0-9]{8,15}$/,
        'Veuillez fournir un numéro de téléphone valide'
      ]
    },

    photo: {
      type: String,
      default: null // URL vers l'image uploadée
    },

    dateNaissance: {
      type: Date,
      default: null
    },

    // ===== LOCALISATION =====
    pays: {
      type: String,
      default: 'Congo'
    },

    ville: {
      type: String,
      trim: true,
      default: null
    },

    adresse: {
      type: String,
      trim: true,
      default: null
    },

    // ===== VÉRIFICATIONS =====
    emailVerifie: {
      type: Boolean,
      default: false
    },

    telephoneVerifie: {
      type: Boolean,
      default: false
    },

    // ===== SÉCURITÉ =====
    tokenVerificationEmail: {
      type: String,
      select: false
    },

    tokenResetMotDePasse: {
      type: String,
      select: false
    },

    tokenResetExpire: {
      type: Date,
      select: false
    },

    tentativesConnexion: {
      type: Number,
      default: 0,
      select: false
    },

    compteVerrouille: {
      type: Boolean,
      default: false,
      select: false
    },

    // ===== STATUT DU COMPTE =====
    actif: {
      type: Boolean,
      default: true
    },

    // ===== TRACABILITÉ =====
    derniereConnexion: {
      type: Date,
      default: null
    },

    // ===== PRÉFÉRENCES =====
    langue: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr'
    },

    notificationsEmail: {
      type: Boolean,
      default: true
    },

    notificationsPush: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
    discriminatorKey: 'role', // Clé pour le polymorphisme
    collection: 'users'
  }
);

// ===== INDEX =====
userSchema.index({ telephone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ ville: 1, role: 1 });

// ===== MIDDLEWARE PRÉ-SAVE : HASHAGE DU MOT DE PASSE =====
userSchema.pre('save', async function (next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('motDePasse')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ===== MÉTHODE : COMPARER MOT DE PASSE =====
userSchema.methods.comparerMotDePasse = async function (motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

// ===== MÉTHODE : RETOURNER LES DONNÉES PUBLIQUES =====
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.motDePasse;
  delete obj.tokenVerificationEmail;
  delete obj.tokenResetMotDePasse;
  delete obj.tokenResetExpire;
  delete obj.tentativesConnexion;
  delete obj.compteVerrouille;
  delete obj.__v;
  return obj;
};

// ===== MÉTHODE STATIQUE : INCRÉMENTER LES TENTATIVES =====
userSchema.statics.incrementerTentatives = async function (userId) {
  const user = await this.findById(userId).select('+tentativesConnexion +compteVerrouille');
  if (!user) return null;

  user.tentativesConnexion += 1;

  // Verrouiller après 5 tentatives échouées
  if (user.tentativesConnexion >= 5) {
    user.compteVerrouille = true;
  }

  await user.save({ validateBeforeSave: false });
  return user;
};

// ===== MÉTHODE STATIQUE : RÉINITIALISER LES TENTATIVES =====
userSchema.statics.resetTentatives = async function (userId) {
  await this.findByIdAndUpdate(
    userId,
    {
      tentativesConnexion: 0,
      compteVerrouille: false,
      derniereConnexion: new Date()
    },
    { validateBeforeSave: false }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
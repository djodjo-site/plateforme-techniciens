const mongoose = require('mongoose');
const { TYPES_ABONNEMENT } = require('../config/constants');

const abonnementSchema = new mongoose.Schema(
  {
    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entreprise',
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: Object.values(TYPES_ABONNEMENT),
      required: true
    },

    statut: {
      type: String,
      enum: ['actif', 'expire', 'annule', 'en_attente', 'suspendu'],
      default: 'en_attente',
      required: true
    },

    prix: { type: Number, required: true, min: 0 },
    devise: { type: String, default: 'XAF', enum: ['XAF', 'USD', 'EUR', 'CDF'] },

    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },

    autoRenouvellement: { type: Boolean, default: false },

    // Limites
    limites: {
      consultationsMois: { type: Number, default: 0 },
      contactsMois: { type: Number, default: 0 },
      missionsMois: { type: Number, default: 0 }
    },

    // Paiements liés
    paiements: [
      {
        paiement: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement' },
        date: Date,
        montant: Number
      }
    ],

    stripe: {
      subscriptionId: { type: String, default: null },
      customerId: { type: String, default: null },
      priceId: { type: String, default: null }
    },

    // Annulation
    annulation: {
      effectuee: { type: Boolean, default: false },
      raison: { type: String, default: null },
      dateAnnulation: { type: Date, default: null },
      par: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },

    // Renouvellement
    renouvellement: {
      nombreRenouvellements: { type: Number, default: 0 },
      abonnementPrecedent: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonnement', default: null }
    },

    historique: [
      {
        action: String,
        date: { type: Date, default: Date.now },
        details: String
      }
    ]
  },
  { timestamps: true, collection: 'abonnements' }
);

abonnementSchema.index({ entreprise: 1, statut: 1 });
abonnementSchema.index({ dateFin: 1, statut: 1 });
abonnementSchema.index({ autoRenouvellement: 1, dateFin: 1 });

abonnementSchema.methods.estActif = function () {
  return this.statut === 'actif' && this.dateFin > new Date();
};

abonnementSchema.methods.joursRestants = function () {
  const diff = this.dateFin.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

abonnementSchema.methods.estBientotExpire = function (jours = 7) {
  return this.joursRestants() <= jours && this.statut === 'actif';
};

abonnementSchema.methods.annuler = async function (raison, userId) {
  this.statut = 'annule';
  this.autoRenouvellement = false;
  this.annulation = {
    effectuee: true,
    raison,
    dateAnnulation: new Date(),
    par: userId
  };
  this.historique.push({ action: 'annulation', details: raison });
  await this.save();
  return this;
};

abonnementSchema.methods.marquerExpire = async function () {
  if (this.statut === 'actif' && this.dateFin <= new Date()) {
    this.statut = 'expire';
    this.historique.push({ action: 'expiration' });
    await this.save();
  }
  return this;
};

abonnementSchema.statics.mettreAJourExpires = async function () {
  const resultat = await this.updateMany(
    { statut: 'actif', dateFin: { $lt: new Date() } },
    { $set: { statut: 'expire' } }
  );
  return resultat.modifiedCount;
};

abonnementSchema.statics.aRenouveler = async function (joursAvant = 3) {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + joursAvant);
  return this.find({
    statut: 'actif',
    autoRenouvellement: true,
    dateFin: { $gte: new Date(), $lte: dateLimite }
  }).populate('entreprise');
};

const Abonnement = mongoose.model('Abonnement', abonnementSchema);
module.exports = Abonnement;
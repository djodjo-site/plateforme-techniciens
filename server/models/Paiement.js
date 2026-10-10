const mongoose = require('mongoose');
const { STATUTS_PAIEMENT, TYPES_PAIEMENT } = require('../config/constants');

const paiementSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },

    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: Object.values(TYPES_PAIEMENT),
      required: true
    },

    montant: {
      type: Number,
      required: true,
      min: 0
    },

    devise: {
      type: String,
      default: 'XAF',
      enum: ['XAF', 'USD', 'EUR', 'CDF']
    },

    statut: {
      type: String,
      enum: Object.values(STATUTS_PAIEMENT),
      default: STATUTS_PAIEMENT.EN_ATTENTE,
      required: true
    },

    methode: {
      type: String,
      enum: ['carte', 'mobile_money', 'virement', 'especes', 'stripe'],
      default: 'stripe'
    },

    // Stripe
    stripePaymentIntentId: { type: String, default: null, index: true, sparse: true },
    stripeSessionId: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },
    stripeChargeId: { type: String, default: null },
    stripeReceiptUrl: { type: String, default: null },

    // Commission plateforme
    commission: {
      taux: { type: Number, default: 0, min: 0, max: 100 },
      montant: { type: Number, default: 0, min: 0 }
    },

    montantNet: {
      type: Number,
      default: 0,
      min: 0
    },

    // Références métier
    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      default: null
    },

    abonnement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Abonnement',
      default: null
    },

    ninti: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NINTI',
      default: null
    },

    // Détails
    description: { type: String, trim: true, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Erreurs
    erreur: {
      code: { type: String, default: null },
      message: { type: String, default: null },
      date: { type: Date, default: null }
    },

    // Remboursement
    remboursement: {
      effectue: { type: Boolean, default: false },
      montant: { type: Number, default: 0, min: 0 },
      raison: { type: String, default: null },
      dateRemboursement: { type: Date, default: null },
      stripeRefundId: { type: String, default: null },
      parAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
    },

    datePaiement: { type: Date, default: null },
    dateEcheance: { type: Date, default: null },

    facture: {
      numero: { type: String, default: null },
      url: { type: String, default: null },
      dateEmission: { type: Date, default: null }
    }
  },
  { timestamps: true, collection: 'paiements' }
);

paiementSchema.index({ utilisateur: 1, createdAt: -1 });
paiementSchema.index({ statut: 1, type: 1 });
paiementSchema.index({ createdAt: -1 });

paiementSchema.pre('save', function (next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.reference = `PAY-${timestamp}-${random}`;
  }
  if (this.commission.taux > 0 && this.montant > 0) {
    this.commission.montant = Math.round((this.montant * this.commission.taux) / 100);
    this.montantNet = this.montant - this.commission.montant;
  } else {
    this.montantNet = this.montant;
  }
  next();
});

paiementSchema.methods.marquerReussi = async function (stripeData = {}) {
  this.statut = STATUTS_PAIEMENT.REUSSI;
  this.datePaiement = new Date();
  if (stripeData.chargeId) this.stripeChargeId = stripeData.chargeId;
  if (stripeData.receiptUrl) this.stripeReceiptUrl = stripeData.receiptUrl;
  await this.save();
  return this;
};

paiementSchema.methods.marquerEchoue = async function (code, message) {
  this.statut = STATUTS_PAIEMENT.ECHOUE;
  this.erreur = { code, message, date: new Date() };
  await this.save();
  return this;
};

paiementSchema.methods.rembourser = async function (montant, raison, adminId) {
  if (this.statut !== STATUTS_PAIEMENT.REUSSI) {
    throw new Error('Seul un paiement réussi peut être remboursé');
  }
  if (montant > this.montant) {
    throw new Error('Le montant remboursé ne peut dépasser le montant payé');
  }
  this.remboursement = {
    effectue: true,
    montant,
    raison,
    dateRemboursement: new Date(),
    parAdmin: adminId
  };
  if (montant === this.montant) this.statut = STATUTS_PAIEMENT.REMBOURSE;
  await this.save();
  return this;
};

paiementSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.stripePaymentIntentId;
  delete obj.stripeSessionId;
  delete obj.stripeCustomerId;
  delete obj.stripeChargeId;
  delete obj.metadata;
  return obj;
};

paiementSchema.statics.revenusParPeriode = async function (dateDebut, dateFin) {
  const resultat = await this.aggregate([
    { $match: { statut: STATUTS_PAIEMENT.REUSSI, datePaiement: { $gte: dateDebut, $lte: dateFin } } },
    { $group: { _id: '$type', total: { $sum: '$montant' }, commission: { $sum: '$commission.montant' }, nombre: { $sum: 1 } } }
  ]);
  return resultat;
};

paiementSchema.statics.statistiquesGlobales = async function () {
  const total = await this.countDocuments({ statut: STATUTS_PAIEMENT.REUSSI });
  const montantTotal = await this.aggregate([
    { $match: { statut: STATUTS_PAIEMENT.REUSSI } },
    { $group: { _id: null, total: { $sum: '$montant' }, commissions: { $sum: '$commission.montant' } } }
  ]);
  return {
    total,
    montantTotal: montantTotal[0]?.total || 0,
    commissionsTotal: montantTotal[0]?.commissions || 0
  };
};

const Paiement = mongoose.model('Paiement', paiementSchema);
module.exports = Paiement;
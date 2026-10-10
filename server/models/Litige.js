const mongoose = require('mongoose');

const litigeSchema = new mongoose.Schema(
  {
    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      required: true,
      index: true
    },

    ouvertPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    roleOuverture: {
      type: String,
      enum: ['client', 'technicien', 'admin'],
      required: true
    },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    technicien: { type: mongoose.Schema.Types.ObjectId, ref: 'Technicien', required: true },

    motif: {
      type: String,
      enum: [
        'travail_non_effectue', 'travail_mal_effectue', 'retard',
        'comportement_inapproprie', 'prix_non_respecte',
        'non_paiement', 'annulation_abusive',
        'degats_materiels', 'communication_difficile', 'autre'
      ],
      required: true
    },

    description: { type: String, required: true, trim: true, maxlength: 3000 },

    // Preuves
    preuves: [
      {
        type: { type: String, enum: ['photo', 'document', 'message', 'video'] },
        url: String,
        description: String,
        ajoutePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        dateAjout: { type: Date, default: Date.now }
      }
    ],

    // Montant en jeu
    montantLitige: { type: Number, default: 0, min: 0 },
    devise: { type: String, default: 'XAF' },

    // Statut
    statut: {
      type: String,
      enum: ['ouvert', 'en_examen', 'en_mediation', 'resolu', 'escalade', 'ferme'],
      default: 'ouvert',
      required: true
    },

    priorite: {
      type: String,
      enum: ['basse', 'normale', 'haute', 'urgente'],
      default: 'normale'
    },

    // Assignation
    assigneA: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    dateAssignation: { type: Date, default: null },

    // Conversation / messages du litige
    messages: [
      {
        auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        roleAuteur: { type: String, enum: ['client', 'technicien', 'admin'] },
        contenu: { type: String, required: true, maxlength: 2000 },
        date: { type: Date, default: Date.now }
      }
    ],

    // Décision
    decision: {
      prise: { type: Boolean, default: false },
      enFaveurDe: { type: String, enum: ['client', 'technicien', 'partage', null], default: null },
      description: { type: String, default: null },
      remboursement: { type: Number, default: 0, min: 0 },
      compensationTechnicien: { type: Number, default: 0, min: 0 },
      sanctions: {
        avertissementTechnicien: { type: Boolean, default: false },
        avertissementClient: { type: Boolean, default: false },
        suspensionTechnicien: { type: Boolean, default: false },
        suspensionClient: { type: Boolean, default: false }
      },
      dateDecision: { type: Date, default: null },
      decideParAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
    },

    // Résolution
    resolution: {
      type: String,
      enum: ['accord_amiable', 'decision_admin', 'retrait', 'abandon', 'autre', null],
      default: null
    },
    dateResolution: { type: Date, default: null },

    // Escalade
    escalade: {
      effectuee: { type: Boolean, default: false },
      raison: String,
      dateEscalade: Date,
      niveauEscalade: { type: Number, default: 0, min: 0, max: 3 }
    },

    // Délai de traitement
    delaiTraitementJours: { type: Number, default: 7, min: 1 },
    dateLimiteTraitement: { type: Date, default: null }
  },
  { timestamps: true, collection: 'litiges' }
);

litigeSchema.index({ mission: 1 }, { unique: true });
litigeSchema.index({ statut: 1, priorite: -1, createdAt: -1 });
litigeSchema.index({ assigneA: 1, statut: 1 });
litigeSchema.index({ client: 1, statut: 1 });
litigeSchema.index({ technicien: 1, statut: 1 });

litigeSchema.pre('save', function (next) {
  if (!this.dateLimiteTraitement && this.delaiTraitementJours) {
    const limite = new Date();
    limite.setDate(limite.getDate() + this.delaiTraitementJours);
    this.dateLimiteTraitement = limite;
  }
  next();
});

litigeSchema.methods.assigner = async function (adminId) {
  this.assigneA = adminId;
  this.dateAssignation = new Date();
  this.statut = 'en_examen';
  await this.save();
  return this;
};

litigeSchema.methods.ajouterMessage = async function (auteurId, roleAuteur, contenu) {
  this.messages.push({ auteur: auteurId, roleAuteur, contenu });
  await this.save();
  return this;
};

litigeSchema.methods.ajouterPreuve = async function (preuve) {
  this.preuves.push({ ...preuve, dateAjout: new Date() });
  await this.save();
  return this;
};

litigeSchema.methods.rendreDecision = async function (decision, adminId) {
  this.decision = {
    ...decision,
    prise: true,
    dateDecision: new Date(),
    decideParAdmin: adminId
  };
  this.statut = 'resolu';
  this.resolution = 'decision_admin';
  this.dateResolution = new Date();
  await this.save();
  return this;
};

litigeSchema.methods.resoudreAmiable = async function (resolution = 'accord_amiable') {
  this.statut = 'resolu';
  this.resolution = resolution;
  this.dateResolution = new Date();
  await this.save();
  return this;
};

litigeSchema.methods.escalader = async function (raison) {
  this.escalade = {
    effectuee: true,
    raison,
    dateEscalade: new Date(),
    niveauEscalade: Math.min(3, (this.escalade?.niveauEscalade || 0) + 1)
  };
  this.statut = 'escalade';
  this.priorite = 'urgente';
  await this.save();
  return this;
};

litigeSchema.methods.estEnRetard = function () {
  return this.dateLimiteTraitement && this.dateLimiteTraitement < new Date() && this.statut !== 'resolu';
};

litigeSchema.statics.litigesOuverts = async function () {
  return this.find({ statut: { $in: ['ouvert', 'en_examen', 'en_mediation', 'escalade'] } })
    .populate('client', 'nom prenom email')
    .populate('technicien', 'nom prenom email')
    .populate('assigneA', 'nom prenom')
    .sort({ priorite: -1, createdAt: 1 });
};

litigeSchema.statics.statistiquesGlobales = async function () {
  const parStatut = await this.aggregate([
    { $group: { _id: '$statut', nombre: { $sum: 1 } } }
  ]);
  const parMotif = await this.aggregate([
    { $group: { _id: '$motif', nombre: { $sum: 1 } } },
    { $sort: { nombre: -1 } }
  ]);
  const total = await this.countDocuments();
  const resolus = await this.countDocuments({ statut: 'resolu' });
  const enRetard = await this.countDocuments({
    statut: { $ne: 'resolu' },
    dateLimiteTraitement: { $lt: new Date() }
  });

  return {
    total,
    resolus,
    enRetard,
    tauxResolution: total > 0 ? Math.round((resolus / total) * 100) : 0,
    parStatut,
    parMotif
  };
};

const Litige = mongoose.model('Litige', litigeSchema);
module.exports = Litige;
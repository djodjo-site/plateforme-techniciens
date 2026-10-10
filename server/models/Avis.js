// server/models/Avis.js
const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema(
  {
    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      required: true,
      index: true
    },

    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    cible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    typeCible: {
      type: String,
      enum: ['technicien', 'client', 'entreprise'],
      required: true
    },

    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technicien',
      default: null,
      index: true
    },

    note: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    criteres: {
      qualite: { type: Number, min: 1, max: 5, default: null },
      rapidite: { type: Number, min: 1, max: 5, default: null },
      communication: { type: Number, min: 1, max: 5, default: null },
      prix: { type: Number, min: 1, max: 5, default: null },
      professionnalisme: { type: Number, min: 1, max: 5, default: null }
    },

    titre: { type: String, trim: true, maxlength: 150, default: null },
    commentaire: { type: String, required: true, trim: true, maxlength: 2000 },

    recommande: { type: Boolean, default: true },

    reponse: {
      contenu: { type: String, trim: true, maxlength: 1000, default: null },
      date: { type: Date, default: null }
    },

    actif: { type: Boolean, default: true },
    signale: { type: Boolean, default: false },
    raisonSignalement: { type: String, default: null },
    modere: { type: Boolean, default: false },
    moderePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    dateModeration: { type: Date, default: null },
    raisonModeration: { type: String, default: null },

    utile: { type: Number, default: 0, min: 0 },

    verifie: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'avis' }
);

// ============================================================
// INDEX
// ============================================================
avisSchema.index({ technicien: 1, actif: 1, createdAt: -1 });
avisSchema.index({ cible: 1, actif: 1 });
avisSchema.index({ mission: 1, auteur: 1 }, { unique: true });
avisSchema.index({ note: -1 });

// ============================================================
// MIDDLEWARE POST-SAVE
// ============================================================
avisSchema.post('save', async function (doc) {
  if (doc.technicien) {
    try {
      const Technicien = mongoose.model('Technicien');
      const technicien = await Technicien.findById(doc.technicien);
      if (technicien) await technicien.recalculerNoteMoyenne();
    } catch (e) {
      console.error('Erreur recalcul note:', e.message);
    }
  }
});

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================
avisSchema.methods.ajouterReponse = async function (contenu) {
  this.reponse = { contenu, date: new Date() };
  await this.save();
  return this;
};

avisSchema.methods.signaler = async function (raison) {
  this.signale = true;
  this.raisonSignalement = raison;
  await this.save();
  return this;
};

avisSchema.methods.masquer = async function (raison, adminId) {
  this.actif = false;
  this.modere = true;
  this.moderePar = adminId;
  this.dateModeration = new Date();
  this.raisonModeration = raison;
  await this.save();
  return this;
};

avisSchema.methods.incrementerUtile = async function () {
  this.utile += 1;
  await this.save();
  return this;
};

avisSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.raisonSignalement;
  delete obj.moderePar;
  delete obj.raisonModeration;
  return obj;
};

// ============================================================
// MÉTHODES STATIQUES
// ============================================================
avisSchema.statics.repartitionNotes = async function (technicienId) {
  return this.aggregate([
    { $match: { technicien: new mongoose.Types.ObjectId(technicienId), actif: true } },
    { $group: { _id: '$note', nombre: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
};

avisSchema.statics.avisTechnicien = async function (technicienId, limite = 20) {
  return this.find({ technicien: technicienId, actif: true })
    .populate('auteur', 'nom prenom photo ville')
    .sort({ createdAt: -1 })
    .limit(limite);
};

avisSchema.statics.avisSignales = async function () {
  return this.find({ signale: true, modere: false })
    .populate('auteur', 'nom prenom email')
    .populate('technicien', 'nom prenom email')
    .sort({ createdAt: -1 });
};

const Avis = mongoose.model('Avis', avisSchema);
module.exports = Avis;
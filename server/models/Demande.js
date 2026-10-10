const mongoose = require('mongoose');
const { STATUTS_DEMANDE, CATEGORIES_COMPETENCES } = require('../config/constants');

const demandeSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Pour entreprise
    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entreprise',
      default: null
    },

    titre: { type: String, required: true, trim: true, maxlength: 200 },

    description: { type: String, required: true, trim: true, maxlength: 5000 },

    categorie: { type: String, enum: CATEGORIES_COMPETENCES, required: true },

    competencesRequises: { type: [String], default: [] },

    urgence: {
      type: String,
      enum: ['basse', 'normale', 'haute', 'urgente'],
      default: 'normale'
    },

    // Localisation
    localisation: {
      adresse: { type: String, trim: true, default: null },
      ville: { type: String, trim: true, default: null },
      position: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      },
      aDistance: { type: Boolean, default: false }
    },

    // Budget
    budget: {
      min: { type: Number, default: 0, min: 0 },
      max: { type: Number, default: 0, min: 0 },
      devise: { type: String, default: 'XAF', enum: ['XAF', 'USD', 'EUR', 'CDF'] },
      negociable: { type: Boolean, default: true }
    },

    // Planning
    dateSouhaitee: { type: Date, default: null },
    dureeEstimeeHeures: { type: Number, default: 0, min: 0 },

    // Fichiers joints
    fichiers: [
      {
        nom: String,
        url: String,
        type: String,
        taille: Number
      }
    ],

    // Statut
    statut: {
      type: String,
      enum: Object.values(STATUTS_DEMANDE),
      default: STATUTS_DEMANDE.OUVERTE,
      required: true
    },

    // Offres reçues
    offres: [
      {
        technicien: { type: mongoose.Schema.Types.ObjectId, ref: 'Technicien', required: true },
        message: { type: String, maxlength: 1000 },
        prix: { type: Number, min: 0 },
        devise: { type: String, default: 'XAF' },
        delaiHeures: { type: Number, min: 0 },
        dateOffre: { type: Date, default: Date.now },
        statut: {
          type: String,
          enum: ['en_attente', 'acceptee', 'refusee', 'retiree'],
          default: 'en_attente'
        }
      }
    ],

    // Technicien sélectionné
    technicienSelectionne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technicien',
      default: null
    },

    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      default: null
    },

    // Vues
    nombreVues: { type: Number, default: 0, min: 0 },

    // Expiration
    dateExpiration: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      }
    },

    // Annulation
    annulation: {
      effectuee: { type: Boolean, default: false },
      raison: { type: String, default: null },
      dateAnnulation: { type: Date, default: null }
    }
  },
  { timestamps: true, collection: 'demandes' }
);

demandeSchema.index({ client: 1, statut: 1 });
demandeSchema.index({ statut: 1, categorie: 1, createdAt: -1 });
demandeSchema.index({ 'localisation.position': '2dsphere' });
demandeSchema.index({ 'offres.technicien': 1 });
demandeSchema.index({ dateExpiration: 1, statut: 1 });

demandeSchema.methods.estOuverte = function () {
  return this.statut === STATUTS_DEMANDE.OUVERTE && this.dateExpiration > new Date();
};

demandeSchema.methods.ajouterOffre = async function (offre) {
  const existe = this.offres.some(
    (o) => o.technicien.toString() === offre.technicien.toString() && o.statut === 'en_attente'
  );
  if (existe) throw new Error('Vous avez déjà une offre en attente pour cette demande');
  this.offres.push(offre);
  await this.save();
  return this;
};

demandeSchema.methods.accepterOffre = async function (offreId) {
  const offre = this.offres.id(offreId);
  if (!offre) throw new Error('Offre introuvable');
  offre.statut = 'acceptee';
  this.offres.forEach((o) => {
    if (o._id.toString() !== offreId.toString()) o.statut = 'refusee';
  });
  this.technicienSelectionne = offre.technicien;
  this.statut = STATUTS_DEMANDE.ATTRIBUEE;
  await this.save();
  return this;
};

demandeSchema.methods.incrementerVues = async function () {
  this.nombreVues += 1;
  await this.save();
};

demandeSchema.statics.rechercherPourTechnicien = async function (technicienId, filtres = {}) {
  const Technicien = mongoose.model('Technicien');
  const tech = await Technicien.findById(technicienId);
  if (!tech) return [];

  const query = {
    statut: STATUTS_DEMANDE.OUVERTE,
    dateExpiration: { $gt: new Date() },
    'offres.technicien': { $ne: technicienId },
    $or: [
      { categorie: { $in: tech.categories } },
      { competencesRequises: { $in: tech.competences } }
    ]
  };

  if (tech.positionActuelle?.coordinates && tech.positionActuelle.coordinates[0] !== 0) {
    query['localisation.position'] = {
      $near: {
        $geometry: tech.positionActuelle,
        $maxDistance: tech.rayonIntervention * 1000
      }
    };
  }

  return this.find({ ...query, ...filtres })
    .populate('client', 'nom prenom photo ville')
    .sort({ urgence: -1, createdAt: -1 })
    .limit(50);
};

const Demande = mongoose.model('Demande', demandeSchema);
module.exports = Demande;
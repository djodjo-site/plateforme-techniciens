const mongoose = require('mongoose');
const { STATUTS_MISSION } = require('../config/constants');

const missionSchema = new mongoose.Schema(
  {
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande',
      required: true,
      index: true
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technicien',
      required: true,
      index: true
    },

    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entreprise',
      default: null
    },

    // Contenu
    titre: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },

    // Planning
    dateDebut: { type: Date, required: true },
    dateDebutReelle: { type: Date, default: null },
    dateFinPrevue: { type: Date, default: null },
    dateFinReelle: { type: Date, default: null },
    dureeEstimeeHeures: { type: Number, default: 0, min: 0 },
    dureeReelleHeures: { type: Number, default: 0, min: 0 },

    // Localisation
    localisation: {
      adresse: String,
      ville: String,
      position: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      },
      aDistance: { type: Boolean, default: false }
    },

    // Tarification
    tarification: {
      prixConvenu: { type: Number, required: true, min: 0 },
      devise: { type: String, default: 'XAF' },
      commission: {
        taux: { type: Number, default: 10, min: 0, max: 100 },
        montant: { type: Number, default: 0 }
      },
      montantTechnicien: { type: Number, default: 0 },
      negociable: { type: Boolean, default: true }
    },

    // Statut
    statut: {
      type: String,
      enum: Object.values(STATUTS_MISSION),
      default: STATUTS_MISSION.EN_ATTENTE,
      required: true
    },

    // Suivi
    etapes: [
      {
        nom: String,
        statut: { type: String, enum: ['en_attente', 'en_cours', 'termine'] },
        date: Date,
        commentaire: String
      }
    ],

    // Preuves (photos avant/après, documents)
    preuves: [
      {
        type: { type: String, enum: ['photo_avant', 'photo_apres', 'document', 'signature'] },
        url: String,
        description: String,
        dateAjout: { type: Date, default: Date.now }
      }
    ],

    // Paiement
    paiement: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement', default: null },
    paiementEffectue: { type: Boolean, default: false },
    datePaiement: { type: Date, default: null },

    // Évaluation
    avisClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Avis', default: null },
    avisTechnicien: { type: mongoose.Schema.Types.ObjectId, ref: 'Avis', default: null },

    // Litige
    litige: { type: mongoose.Schema.Types.ObjectId, ref: 'Litige', default: null },

    // Annulation
    annulation: {
      effectuee: { type: Boolean, default: false },
      par: { type: String, enum: ['client', 'technicien', 'admin', null], default: null },
      raison: String,
      dateAnnulation: Date,
      penalite: { type: Number, default: 0 }
    },

    // Notes internes
    notes: { type: String, trim: true, default: null },

    // Vérification OTP début/fin
    otpDebut: { code: String, valide: { type: Boolean, default: false }, dateValidation: Date },
    otpFin: { code: String, valide: { type: Boolean, default: false }, dateValidation: Date }
  },
  { timestamps: true, collection: 'missions' }
);

missionSchema.index({ client: 1, statut: 1 });
missionSchema.index({ technicien: 1, statut: 1 });
missionSchema.index({ statut: 1, createdAt: -1 });
missionSchema.index({ 'localisation.position': '2dsphere' });

missionSchema.pre('save', function (next) {
  if (this.tarification.prixConvenu && this.tarification.commission.taux) {
    this.tarification.commission.montant = Math.round(
      (this.tarification.prixConvenu * this.tarification.commission.taux) / 100
    );
    this.tarification.montantTechnicien =
      this.tarification.prixConvenu - this.tarification.commission.montant;
  }
  next();
});

missionSchema.methods.demarrer = async function (otpCode = null) {
  if (this.statut !== STATUTS_MISSION.ACCEPTEE) {
    throw new Error('La mission doit être acceptée pour démarrer');
  }
  if (otpCode && this.otpDebut?.code && otpCode !== this.otpDebut.code) {
    throw new Error('Code OTP invalide');
  }
  this.statut = STATUTS_MISSION.EN_COURS;
  this.dateDebutReelle = new Date();
  if (this.otpDebut?.code) {
    this.otpDebut.valide = true;
    this.otpDebut.dateValidation = new Date();
  }
  this.etapes.push({ nom: 'Démarrage', statut: 'termine', date: new Date() });
  await this.save();
  return this;
};

missionSchema.methods.terminer = async function (otpCode = null) {
  if (this.statut !== STATUTS_MISSION.EN_COURS) {
    throw new Error('La mission doit être en cours pour être terminée');
  }
  if (otpCode && this.otpFin?.code && otpCode !== this.otpFin.code) {
    throw new Error('Code OTP invalide');
  }
  this.statut = STATUTS_MISSION.TERMINEE;
  this.dateFinReelle = new Date();
  if (this.dateDebutReelle) {
    const dureeMs = this.dateFinReelle - this.dateDebutReelle;
    this.dureeReelleHeures = Math.round((dureeMs / 3600000) * 10) / 10;
  }
  if (this.otpFin?.code) {
    this.otpFin.valide = true;
    this.otpFin.dateValidation = new Date();
  }
  this.etapes.push({ nom: 'Fin', statut: 'termine', date: new Date() });
  await this.save();

  // Mettre à jour les stats du technicien
  const Technicien = mongoose.model('Technicien');
  await Technicien.findByIdAndUpdate(this.technicien, {
    $inc: {
      'statistiques.nombreMissions': 1,
      'statistiques.missionsReussies': 1
    },
    $set: { statutDisponibilite: 'disponible', disponible: true }
  });

  return this;
};

missionSchema.methods.annuler = async function (par, raison, penalite = 0) {
  this.statut = STATUTS_MISSION.ANNULEE;
  this.annulation = {
    effectuee: true,
    par,
    raison,
    dateAnnulation: new Date(),
    penalite
  };
  await this.save();
  return this;
};

missionSchema.methods.ouvrirLitige = async function (litigeId) {
  this.statut = STATUTS_MISSION.LITIGE;
  this.litige = litigeId;
  await this.save();
  return this;
};

missionSchema.methods.ajouterPreuve = async function (preuve) {
  this.preuves.push({ ...preuve, dateAjout: new Date() });
  await this.save();
  return this;
};

missionSchema.statics.missionsActivesTechnicien = async function (technicienId) {
  return this.find({
    technicien: technicienId,
    statut: { $in: [STATUTS_MISSION.ACCEPTEE, STATUTS_MISSION.EN_COURS] }
  }).populate('client', 'nom prenom photo telephone');
};

missionSchema.statics.statistiquesGlobales = async function () {
  const parStatut = await this.aggregate([
    { $group: { _id: '$statut', nombre: { $sum: 1 } } }
  ]);
  const montants = await this.aggregate([
    { $match: { statut: STATUTS_MISSION.TERMINEE } },
    {
      $group: {
        _id: null,
        total: { $sum: '$tarification.prixConvenu' },
        commissions: { $sum: '$tarification.commission.montant' }
      }
    }
  ]);
  return {
    parStatut,
    montantTotal: montants[0]?.total || 0,
    commissionsTotal: montants[0]?.commissions || 0
  };
};

const Mission = mongoose.model('Mission', missionSchema);
module.exports = Mission;
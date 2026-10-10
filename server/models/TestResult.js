// server/models/TestResult.js
const mongoose = require('mongoose');
const { CATEGORIES_COMPETENCES } = require('../config/constants');

const testResultSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. RÉFÉRENCES
    // ============================================================
    
    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technicien',
      required: [true, 'Le technicien est obligatoire'],
      index: true
    },

    // ============================================================
    // 2. RÉSULTAT GLOBAL
    // ============================================================
    
   score: {
  type: Number,
  required: false,
  default: 0,
  min: 0,
  max: 100
},

reussi: {
  type: Boolean,
  required: false,
  default: false
},
    seuilReussite: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    },

    // ============================================================
    // 3. DÉTAILS DES RÉPONSES
    // ============================================================
    
    reponses: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true
        },
        reponsesDonnees: {
          type: [String],
          default: []
        },
        estCorrecte: {
          type: Boolean,
          required: true
        },
        pointsObtenus: {
          type: Number,
          default: 0,
          min: 0
        },
        pointsPossibles: {
          type: Number,
          default: 1,
          min: 0
        },
        tempsReponse: {
          type: Number,
          default: 0,
          min: 0
        },
        categorie: {
          type: String,
          enum: CATEGORIES_COMPETENCES
        },
        difficulte: {
          type: String,
          enum: ['facile', 'moyen', 'difficile']
        }
      }
    ],

    // ============================================================
    // 4. STATISTIQUES DU TEST
    // ============================================================
    
    nombreQuestions: {
      type: Number,
      required: true,
      min: 1
    },

    nombreBonnesReponses: {
      type: Number,
      default: 0,
      min: 0
    },

    nombreMauvaisesReponses: {
      type: Number,
      default: 0,
      min: 0
    },

    nombreSansReponse: {
      type: Number,
      default: 0,
      min: 0
    },

    totalPoints: {
      type: Number,
      default: 0,
      min: 0
    },

    pointsObtenus: {
      type: Number,
      default: 0,
      min: 0
    },

    // ============================================================
    // 5. DURÉE ET TIMING
    // ============================================================
    
    dureePrevueMinutes: {
      type: Number,
      default: 30,
      min: 1
    },

    dureeReelleMinutes: {
      type: Number,
      default: 0,
      min: 0
    },

    dureeReelleSecondes: {
      type: Number,
      default: 0,
      min: 0
    },

    dateDebut: {
      type: Date,
      required: true,
      default: Date.now
    },

    dateFin: {
      type: Date,
      required: true,
      default: Date.now
    },

    tempsMoyenParQuestion: {
      type: Number,
      default: 0,
      min: 0
    },

    // ============================================================
    // 6. PERFORMANCE PAR CATÉGORIE
    // ============================================================
    
    performanceCategories: [
      {
        categorie: {
          type: String,
          enum: CATEGORIES_COMPETENCES
        },
        nombreQuestions: {
          type: Number,
          default: 0
        },
        bonnesReponses: {
          type: Number,
          default: 0
        },
        score: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        }
      }
    ],

    // ============================================================
    // 7. MÉTADONNÉES
    // ============================================================
    
    tentative: {
      type: Number,
      required: true,
      min: 1
    },

    // Configuration utilisée pour ce test
    configuration: {
      nombreQuestions: Number,
      dureeMinutes: Number,
      seuilReussite: Number,
      melangeQuestions: {
        type: Boolean,
        default: true
      },
      melangeOptions: {
        type: Boolean,
        default: true
      }
    },

    // ============================================================
    // 8. SÉCURITÉ ET ANTI-TRICHE
    // ============================================================
    
    securite: {
      changementsOnglet: {
        type: Number,
        default: 0,
        min: 0
      },
      copiesDetectees: {
        type: Number,
        default: 0,
        min: 0
      },
      clicsDroits: {
        type: Number,
        default: 0,
        min: 0
      },
      // Note de fiabilité (100 = parfait, 0 = triche probable)
      scoreFiabilite: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      },
      // Test invalidé pour triche
      invalide: {
        type: Boolean,
        default: false
      },
      raisonInvalidation: {
        type: String,
        default: null
      },
      // Adresse IP du passage
      adresseIP: {
        type: String,
        default: null
      },
      userAgent: {
        type: String,
        default: null
      }
    },

    // ============================================================
    // 9. TRAÇABILITÉ
    // ============================================================
    
    statut: {
      type: String,
      enum: ['en_cours', 'termine', 'invalide', 'expire'],
      default: 'en_cours'
    },

    // Réponses sauvegardées au fur et à mesure (pour reprise en cas de coupure)
    reponsesTemporaires: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
      default: null
    },

    // Marqué comme le dernier test du technicien
    estDernierTest: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'testresults'
  }
);

// ============================================================
// INDEX
// ============================================================

testResultSchema.index({ technicien: 1, createdAt: -1 });
testResultSchema.index({ technicien: 1, reussi: 1 });
testResultSchema.index({ technicien: 1, estDernierTest: 1 });
testResultSchema.index({ statut: 1 });
testResultSchema.index({ 'securite.invalide': 1 });

// ============================================================
// MIDDLEWARE PRÉ-SAVE
// ============================================================

testResultSchema.pre('save', function (next) {
  // Calculer la durée réelle
  if (this.dateDebut && this.dateFin) {
    const dureeMs = this.dateFin.getTime() - this.dateDebut.getTime();
    this.dureeReelleSecondes = Math.round(dureeMs / 1000);
    this.dureeReelleMinutes = Math.round(dureeMs / 60000);
  }

  // Calculer le temps moyen par question
  if (this.nombreQuestions > 0 && this.dureeReelleSecondes > 0) {
    this.tempsMoyenParQuestion = Math.round(
      this.dureeReelleSecondes / this.nombreQuestions
    );
  }

  // Calculer le score
  if (this.totalPoints > 0) {
    this.score = Math.round((this.pointsObtenus / this.totalPoints) * 100);
  }

  // Déterminer la réussite
  this.reussi = this.score >= this.seuilReussite && !this.securite.invalide;

  next();
});

// ============================================================
// MIDDLEWARE POST-SAVE : METTRE À JOUR LE TECHNICIEN
// ============================================================

testResultSchema.post('save', async function (doc) {
  // Ne pas exécuter si le test est encore en cours
  if (doc.statut !== 'termine') return;

  try {
    const Technicien = mongoose.model('Technicien');
    const { STATUTS_TECHNICIEN } = require('../config/constants');

    // Marquer les autres tests comme non-derniers
    await mongoose.model('TestResult').updateMany(
      { technicien: doc.technicien, _id: { $ne: doc._id } },
      { estDernierTest: false }
    );

    // Mettre à jour le technicien
    const updateData = {
      dernierTest: doc._id,
      scoreTest: doc.score
    };

    if (doc.securite.invalide) {
      // Test invalidé : ne pas changer le statut
      await Technicien.findByIdAndUpdate(doc.technicien, updateData);
      return;
    }

    if (doc.reussi) {
      updateData.statut = STATUTS_TECHNICIEN.TEST_REUSSI;
      updateData.dernierEchecTest = null;
    } else {
      updateData.statut = STATUTS_TECHNICIEN.TEST_ECHOUE;
      updateData.dernierEchecTest = new Date();
    }

    await Technicien.findByIdAndUpdate(doc.technicien, updateData);
  } catch (error) {
    console.error('❌ Erreur mise à jour technicien après test :', error.message);
  }
});

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================

testResultSchema.methods.calculerPerformanceCategories = function () {
  const performances = {};

  this.reponses.forEach((rep) => {
    if (!rep.categorie) return;

    if (!performances[rep.categorie]) {
      performances[rep.categorie] = {
        categorie: rep.categorie,
        nombreQuestions: 0,
        bonnesReponses: 0,
        score: 0
      };
    }

    performances[rep.categorie].nombreQuestions += 1;
    if (rep.estCorrecte) {
      performances[rep.categorie].bonnesReponses += 1;
    }
  });

  this.performanceCategories = Object.values(performances).map((p) => ({
    ...p,
    score: Math.round((p.bonnesReponses / p.nombreQuestions) * 100)
  }));

  return this.performanceCategories;
};

testResultSchema.methods.terminer = async function () {
  this.statut = 'termine';
  this.dateFin = new Date();
  this.calculerPerformanceCategories();
  await this.save();
  return this;
};

testResultSchema.methods.invalider = async function (raison) {
  this.securite.invalide = true;
  this.securite.raisonInvalidation = raison;
  this.statut = 'invalide';
  this.reussi = false;
  await this.save();
  return this;
};

testResultSchema.methods.diminuerFiabilite = async function (points = 10, raison = null) {
  this.securite.scoreFiabilite = Math.max(0, this.securite.scoreFiabilite - points);

  // Si la fiabilité tombe sous 30, invalider automatiquement
  if (this.securite.scoreFiabilite < 30 && !this.securite.invalide) {
    this.securite.invalide = true;
    this.securite.raisonInvalidation = raison || 'Score de fiabilité trop bas';
    this.reussi = false;
    this.statut = 'invalide';
  }

  await this.save();
};

testResultSchema.methods.enregistrerChangementOnglet = async function () {
  this.securite.changementsOnglet += 1;

  // Pénalité progressive
  let penalite = 5;
  if (this.securite.changementsOnglet > 3) penalite = 15;
  if (this.securite.changementsOnglet > 5) penalite = 30;

  return await this.diminuerFiabilite(penalite, 'Trop de changements d\'onglet');
};

testResultSchema.methods.enregistrerCopie = async function () {
  this.securite.copiesDetectees += 1;
  return await this.diminuerFiabilite(10, 'Copie détectée');
};

testResultSchema.methods.peutEtreConsultePar = function (userId, userRole) {
  if (userRole === 'admin') return true;
  if (this.technicien.toString() === userId.toString()) return true;
  return false;
};

testResultSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.reponsesTemporaires;
  delete obj.__v;
  return obj;
};

testResultSchema.methods.toResultatJSON = function () {
  // Version affichée au technicien après le test
  const obj = this.toObject();
  delete obj.reponsesTemporaires;
  delete obj.securite.adresseIP;
  delete obj.securite.userAgent;
  delete obj.__v;
  return obj;
};

// ============================================================
// MÉTHODES STATIQUES
// ============================================================

testResultSchema.statics.dernierTestTechnicien = async function (technicienId) {
  return this.findOne({ technicien: technicienId })
    .sort({ createdAt: -1 })
    .populate('reponses.question', 'enonce categorie difficulte explication');
};

testResultSchema.statics.historiqueTechnicien = async function (technicienId, limite = 10) {
  return this.find({ technicien: technicienId, statut: 'termine' })
    .sort({ createdAt: -1 })
    .limit(limite)
    .select('-reponsesTemporaires -reponses.reponsesDonnees');
};

testResultSchema.statics.compterTentatives = async function (technicienId) {
  return this.countDocuments({
    technicien: technicienId,
    statut: { $in: ['termine', 'invalide'] }
  });
};

testResultSchema.statics.statistiquesGlobales = async function () {
  const total = await this.countDocuments({ statut: 'termine' });
  const reussis = await this.countDocuments({ statut: 'termine', reussi: true });
  const echoues = await this.countDocuments({ statut: 'termine', reussi: false });
  const invalides = await this.countDocuments({ statut: 'invalide' });

  const scoreMoyen = await this.aggregate([
    { $match: { statut: 'termine' } },
    { $group: { _id: null, moyenne: { $avg: '$score' } } }
  ]);

  const dureeMoyenne = await this.aggregate([
    { $match: { statut: 'termine' } },
    { $group: { _id: null, moyenne: { $avg: '$dureeReelleMinutes' } } }
  ]);

  return {
    total,
    reussis,
    echoues,
    invalides,
    tauxReussite: total > 0 ? Math.round((reussis / total) * 100) : 0,
    scoreMoyen: Math.round(scoreMoyen[0]?.moyenne || 0),
    dureeMoyenneMinutes: Math.round(dureeMoyenne[0]?.moyenne || 0)
  };
};

testResultSchema.statics.testsSuspects = async function (seuilFiabilite = 50) {
  return this.find({
    statut: 'termine',
    'securite.scoreFiabilite': { $lt: seuilFiabilite },
    'securite.invalide': false
  })
    .populate('technicien', 'nom prenom email')
    .sort({ 'securite.scoreFiabilite': 1 });
};

const TestResult = mongoose.model('TestResult', testResultSchema);

module.exports = TestResult;
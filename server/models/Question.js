// server/models/Question.js
const mongoose = require('mongoose');
const { CATEGORIES_COMPETENCES } = require('../config/constants');

const questionSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. CONTENU DE LA QUESTION
    // ============================================================
    
    enonce: {
      type: String,
      required: [true, 'L\'énoncé de la question est obligatoire'],
      trim: true,
      maxlength: [2000, 'L\'énoncé ne peut pas dépasser 2000 caractères']
    },

    type: {
      type: String,
      enum: ['qcm', 'vrai_faux', 'multiple'],
      default: 'qcm',
      required: true
    },

    options: [
      {
        lettre: {
          type: String,
          enum: ['A', 'B', 'C', 'D', 'E', 'F'],
          required: true
        },
        texte: {
          type: String,
          required: true,
          trim: true
        },
        estCorrecte: {
          type: Boolean,
          default: false
        }
      }
    ],

    // ============================================================
    // 2. CLASSIFICATION
    // ============================================================
    
    categorie: {
      type: String,
      enum: CATEGORIES_COMPETENCES,
      required: true
    },

    sousCategorie: {
      type: String,
      trim: true,
      default: null
    },

    difficulte: {
      type: String,
      enum: ['facile', 'moyen', 'difficile'],
      default: 'moyen',
      required: true
    },

    niveauDifficulte: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },

    tags: {
      type: [String],
      default: []
    },

    // ============================================================
    // 3. MÉTADONNÉES
    // ============================================================
    
    explication: {
      type: String,
      trim: true,
      maxlength: [1000, 'L\'explication ne peut pas dépasser 1000 caractères'],
      default: null
    },

    source: {
      type: String,
      trim: true,
      default: null
    },

    points: {
      type: Number,
      default: 1,
      min: [0.5, 'Le minimum est de 0.5 point'],
      max: [5, 'Le maximum est de 5 points']
    },

    tempsRecommande: {
      type: Number,
      default: 45,
      min: 10,
      max: 300
    },

    // ============================================================
    // 4. STATUT ET VALIDATION
    // ============================================================
    
    actif: {
      type: Boolean,
      default: true
    },

    validee: {
      type: Boolean,
      default: false
    },

    valideePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    dateValidation: {
      type: Date,
      default: null
    },

    // ============================================================
    // 5. STATISTIQUES D'UTILISATION
    // ============================================================
    
    statistiques: {
      nombreFoisPosee: {
        type: Number,
        default: 0,
        min: 0
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
      tauxReussite: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      tempsMoyenReponse: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    // ============================================================
    // 6. VERSIONS ET TRAÇABILITÉ
    // ============================================================
    
    version: {
      type: Number,
      default: 1
    },

    remplaceePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null
    },

    archivee: {
      type: Boolean,
      default: false
    },

    dateArchivage: {
      type: Date,
      default: null
    },

    creeePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // ============================================================
    // 7. USAGE DANS LES TESTS
    // ============================================================
    
    utiliseeDansTests: {
      type: Number,
      default: 0,
      min: 0
    },

    derniereUtilisation: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'questions'
  }
);

// ============================================================
// INDEX
// ============================================================

questionSchema.index({ categorie: 1, difficulte: 1, actif: 1 });
questionSchema.index({ actif: 1, validee: 1, archivee: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'statistiques.tauxReussite': -1 });
questionSchema.index({ creeePar: 1 });

// ============================================================
// VALIDATION PERSONNALISÉE
// ============================================================

questionSchema.pre('validate', function (next) {
  if (['qcm', 'multiple'].includes(this.type)) {
    if (!this.options || this.options.length < 2) {
      return next(new Error('Une question QCM doit avoir au moins 2 options'));
    }
    if (this.options.length > 6) {
      return next(new Error('Une question ne peut pas avoir plus de 6 options'));
    }
  }

  const bonnesReponses = this.options?.filter((o) => o.estCorrecte) || [];
  
  if (bonnesReponses.length === 0) {
    return next(new Error('La question doit avoir au moins une bonne réponse'));
  }

  if (this.type === 'qcm' && bonnesReponses.length > 1) {
    return next(new Error('Une question QCM ne peut avoir qu\'une seule bonne réponse'));
  }

  if (this.type === 'multiple' && bonnesReponses.length < 2) {
    return next(new Error('Une question à choix multiple doit avoir au moins 2 bonnes réponses'));
  }

  if (this.type === 'vrai_faux') {
    if (!this.options || this.options.length !== 2) {
      return next(new Error('Une question Vrai/Faux doit avoir exactement 2 options'));
    }
  }

  next();
});

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================

questionSchema.methods.verifierReponse = function (reponsesDonnees) {
  const bonnesReponses = this.options
    .filter((o) => o.estCorrecte)
    .map((o) => o.lettre)
    .sort();

  const reponsesTriees = [...reponsesDonnees].sort();

  if (bonnesReponses.length !== reponsesTriees.length) return false;

  return bonnesReponses.every((r, i) => r === reponsesTriees[i]);
};

questionSchema.methods.enregistrerUtilisation = async function (estCorrecte, tempsReponse = 0) {
  this.statistiques.nombreFoisPosee += 1;

  if (estCorrecte) {
    this.statistiques.nombreBonnesReponses += 1;
  } else {
    this.statistiques.nombreMauvaisesReponses += 1;
  }

  this.statistiques.tauxReussite = Math.round(
    (this.statistiques.nombreBonnesReponses / this.statistiques.nombreFoisPosee) * 100
  );

  if (tempsReponse > 0) {
    const totalTemps =
      this.statistiques.tempsMoyenReponse * (this.statistiques.nombreFoisPosee - 1) +
      tempsReponse;
    this.statistiques.tempsMoyenReponse = Math.round(
      totalTemps / this.statistiques.nombreFoisPosee
    );
  }

  this.utiliseeDansTests += 1;
  this.derniereUtilisation = new Date();

  await this.save();
};

questionSchema.methods.archiver = async function (raison = null) {
  this.archivee = true;
  this.actif = false;
  this.dateArchivage = new Date();
  await this.save();
};

questionSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  obj.options = obj.options.map((o) => ({
    lettre: o.lettre,
    texte: o.texte
  }));
  delete obj.__v;
  return obj;
};

questionSchema.methods.toAdminJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// ============================================================
// MÉTHODES STATIQUES
// ============================================================

questionSchema.statics.genererTestAleatoire = async function (nombreQuestions = 40) {
  const pipeline = [
    { $match: { actif: true, validee: true, archivee: false } },
    { $sample: { size: nombreQuestions } },
    {
      $project: {
        enonce: 1,
        type: 1,
        options: 1,
        categorie: 1,
        difficulte: 1,
        points: 1,
        tempsRecommande: 1,
        explication: 1
      }
    }
  ];

  return this.aggregate(pipeline);
};

questionSchema.statics.genererTestEquilibre = async function (nombreQuestions = 40) {
  const questionsParCategorie = Math.ceil(nombreQuestions / CATEGORIES_COMPETENCES.length);
  const questionsSelectionnees = [];

  for (const categorie of CATEGORIES_COMPETENCES) {
    const questions = await this.aggregate([
      {
        $match: {
          actif: true,
          validee: true,
          archivee: false,
          categorie
        }
      },
      { $sample: { size: questionsParCategorie } },
      {
        $project: {
          enonce: 1,
          type: 1,
          options: 1,
          categorie: 1,
          difficulte: 1,
          points: 1,
          tempsRecommande: 1,
          explication: 1
        }
      }
    ]);

    questionsSelectionnees.push(...questions);

    if (questionsSelectionnees.length >= nombreQuestions) break;
  }

  return questionsSelectionnees.slice(0, nombreQuestions);
};

questionSchema.statics.statistiquesGlobales = async function () {
  const total = await this.countDocuments();
  const actives = await this.countDocuments({ actif: true, archivee: false });
  const validees = await this.countDocuments({ actif: true, validee: true, archivee: false });

  const parCategorie = await this.aggregate([
    { $match: { actif: true, archivee: false } },
    { $group: { _id: '$categorie', nombre: { $sum: 1 } } },
    { $sort: { nombre: -1 } }
  ]);

  const parDifficulte = await this.aggregate([
    { $match: { actif: true, archivee: false } },
    { $group: { _id: '$difficulte', nombre: { $sum: 1 } } }
  ]);

  const tauxReussiteMoyen = await this.aggregate([
    { $match: { 'statistiques.nombreFoisPosee': { $gt: 10 } } },
    {
      $group: {
        _id: null,
        moyenne: { $avg: '$statistiques.tauxReussite' }
      }
    }
  ]);

  return {
    total,
    actives,
    validees,
    parCategorie,
    parDifficulte,
    tauxReussiteMoyen: Math.round(tauxReussiteMoyen[0]?.moyenne || 0)
  };
};

questionSchema.statics.questionsTropFaciles = async function (seuil = 90) {
  return this.find({
    actif: true,
    'statistiques.nombreFoisPosee': { $gt: 20 },
    'statistiques.tauxReussite': { $gte: seuil }
  }).select('enonce categorie statistiques');
};

questionSchema.statics.questionsTropDifficiles = async function (seuil = 20) {
  return this.find({
    actif: true,
    'statistiques.nombreFoisPosee': { $gt: 20 },
    'statistiques.tauxReussite': { $lte: seuil }
  }).select('enonce categorie statistiques');
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
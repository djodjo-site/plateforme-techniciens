// server/models/Technicien.js
const mongoose = require('mongoose');
const User = require('./User');
const { STATUTS_TECHNICIEN, CATEGORIES_COMPETENCES } = require('../config/constants');

const technicienSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. WORKFLOW DE CERTIFICATION
    // ============================================================
    
    statut: {
      type: String,
      enum: Object.values(STATUTS_TECHNICIEN),
      default: STATUTS_TECHNICIEN.EN_ATTENTE_DE_TEST,
      required: true
    },

    // Référence au dernier test passé
    dernierTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestResult',
      default: null
    },

    // Score du dernier test (pour affichage rapide)
    scoreTest: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    // Nombre total de tentatives au test
    nombreTentativesTest: {
      type: Number,
      default: 0,
      min: 0
    },

    // Date du dernier échec (pour calculer le délai de repassage)
    dernierEchecTest: {
      type: Date,
      default: null
    },

    // ============================================================
    // 2. NINTI (NUMÉRO D'IDENTIFICATION NATIONAL)
    // ============================================================
    
    numeroNINTI: {
      type: String,
      unique: true,
      sparse: true, // Autorise plusieurs null (techniciens pas encore certifiés)
      trim: true,
      uppercase: true,
      match: [
        /^NINTI-\d{4}-[A-Z]{3}-\d{5}$/,
        'Format NINTI invalide (ex: NINTI-2025-COD-00042)'
      ]
    },

    dateDelivranceNINTI: {
      type: Date,
      default: null
    },

    dateExpirationNINTI: {
      type: Date,
      default: null
    },

    // Référence au paiement qui a permis d'obtenir le NINTI
    paiementAccreditation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paiement',
      default: null
    },

    // ============================================================
    // 3. PROFIL PROFESSIONNEL
    // ============================================================
    
    // Titre professionnel affiché (ex: "Expert réseaux Cisco")
    titreProfessionnel: {
      type: String,
      trim: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
      default: null
    },

    // Biographie / présentation
    biographie: {
      type: String,
      trim: true,
      maxlength: [1000, 'La biographie ne peut pas dépasser 1000 caractères'],
      default: null
    },

    // Années d'expérience
    anneesExperience: {
      type: Number,
      min: [0, 'L\'expérience ne peut pas être négative'],
      max: [60, 'Valeur trop élevée'],
      default: 0
    },

    // Compétences (liste de tags)
    competences: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 20; // Max 20 compétences
        },
        message: 'Un technicien ne peut pas avoir plus de 20 compétences'
      }
    },

    // Catégories principales (doit correspondre aux catégories définies)
    categories: {
      type: [String],
      enum: CATEGORIES_COMPETENCES,
      default: []
    },

    // Langues parlées
    langues: {
      type: [String],
      default: ['Français']
    },

    // ============================================================
    // 4. CERTIFICATIONS EXTERNES
    // ============================================================
    
    certifications: [
      {
        nom: {
          type: String,
          required: true,
          trim: true
        },
        organisme: {
          type: String,
          trim: true
        },
        dateObtention: {
          type: Date
        },
        dateExpiration: {
          type: Date,
          default: null
        },
        documentUrl: {
          type: String, // URL vers le PDF/image
          default: null
        },
        verifie: {
          type: Boolean,
          default: false // Vérifié par l'admin
        }
      }
    ],

    // Diplômes
    diplomes: [
      {
        intitule: {
          type: String,
          required: true,
          trim: true
        },
        etablissement: {
          type: String,
          trim: true
        },
        annee: {
          type: Number
        },
        documentUrl: {
          type: String,
          default: null
        },
        verifie: {
          type: Boolean,
          default: false
        }
      }
    ],

    // ============================================================
    // 5. DOCUMENTS KYC (VÉRIFICATION D'IDENTITÉ)
    // ============================================================
    
    documentsKYC: {
      pieceIdentite: {
        type: {
          type: String,
          enum: ['CNI', 'Passeport', 'Permis', 'Attestation'],
          default: null
        },
        numero: {
          type: String,
          default: null
        },
        urlRecto: {
          type: String,
          default: null
        },
        urlVerso: {
          type: String,
          default: null
        },
        verifie: {
          type: Boolean,
          default: false
        },
        dateVerification: {
          type: Date,
          default: null
        }
      },
      selfie: {
        url: {
          type: String,
          default: null
        },
        verifie: {
          type: Boolean,
          default: false
        }
      },
      justificatifDomicile: {
        url: {
          type: String,
          default: null
        },
        verifie: {
          type: Boolean,
          default: false
        }
      }
    },

    // Statut global de vérification KYC
    kycVerifie: {
      type: Boolean,
      default: false
    },

    dateVerificationKYC: {
      type: Date,
      default: null
    },

    // ============================================================
    // 6. GÉOLOCALISATION ET ZONE D'INTERVENTION
    // ============================================================
    
    // Position actuelle du technicien (GeoJSON)
    positionActuelle: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },

    // Zone d'intervention (rayon en km autour de la position)
    rayonIntervention: {
      type: Number,
      default: 20, // 20 km par défaut
      min: [1, 'Le rayon minimum est de 1 km'],
      max: [200, 'Le rayon maximum est de 200 km']
    },

    // Villes/quartiers desservis (en plus du rayon)
    zonesDesservies: {
      type: [String],
      default: []
    },

    // Adresse principale (pour l'affichage)
    adressePrincipale: {
      type: String,
      trim: true,
      default: null
    },

    // ============================================================
    // 7. DISPONIBILITÉ
    // ============================================================
    
    disponible: {
      type: Boolean,
      default: true
    },

    // Statut détaillé de disponibilité
    statutDisponibilite: {
      type: String,
      enum: ['disponible', 'en_mission', 'indisponible', 'vacances'],
      default: 'disponible'
    },

    // Horaires de disponibilité (optionnel)
    horairesDisponibilite: {
      lundi:    { type: String, default: '08:00-18:00' },
      mardi:    { type: String, default: '08:00-18:00' },
      mercredi: { type: String, default: '08:00-18:00' },
      jeudi:    { type: String, default: '08:00-18:00' },
      vendredi: { type: String, default: '08:00-18:00' },
      samedi:   { type: String, default: '09:00-15:00' },
      dimanche: { type: String, default: 'fermé' }
    },

    // Interventions d'urgence acceptées
    accepteUrgences: {
      type: Boolean,
      default: false
    },

    // ============================================================
    // 8. TARIFS
    // ============================================================
    
    tarifs: {
      // Tarif horaire de base
      horaire: {
        type: Number,
        default: 0,
        min: [0, 'Le tarif ne peut pas être négatif']
      },
      // Tarif pour déplacement
      deplacement: {
        type: Number,
        default: 0,
        min: [0, 'Le tarif ne peut pas être négatif']
      },
      // Devise (par défaut FCFA pour le Congo)
      devise: {
        type: String,
        default: 'XAF',
        enum: ['XAF', 'USD', 'EUR', 'CDF']
      },
      // Tarif négociable ?
      negociable: {
        type: Boolean,
        default: true
      }
    },

    // ============================================================
    // 9. STATISTIQUES
    // ============================================================
    
    statistiques: {
      // Nombre total de missions
      nombreMissions: {
        type: Number,
        default: 0,
        min: 0
      },
      // Missions terminées avec succès
      missionsReussies: {
        type: Number,
        default: 0,
        min: 0
      },
      // Missions annulées
      missionsAnnulees: {
        type: Number,
        default: 0,
        min: 0
      },
      // Note moyenne (sur 5)
      noteMoyenne: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      // Nombre total d'avis reçus
      nombreAvis: {
        type: Number,
        default: 0,
        min: 0
      },
      // Taux de réponse aux demandes (%)
      tauxReponse: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      // Temps de réponse moyen (en minutes)
      tempsReponseMoyen: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    // ============================================================
    // 10. BADGES ET DISTINCTIONS
    // ============================================================
    
    badges: [
      {
        nom: {
          type: String,
          required: true
        },
        description: {
          type: String
        },
        icone: {
          type: String // URL ou nom de l'icône
        },
        dateObtention: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Technicien mis en avant par l'admin
    misEnAvant: {
      type: Boolean,
      default: false
    },

    // ============================================================
    // 11. PRÉFÉRENCES DE TRAVAIL
    // ============================================================
    
    preferences: {
      // Accepte les missions à distance (visio, téléassistance)
      accepteDistance: {
        type: Boolean,
        default: true
      },
      // Accepte les missions pour particuliers
      accepteParticuliers: {
        type: Boolean,
        default: true
      },
      // Accepte les missions pour entreprises
      accepteEntreprises: {
        type: Boolean,
        default: true
      },
      // Nombre maximum de missions simultanées
      maxMissionsSimultanees: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
      }
    },

    // ============================================================
    // 12. SANCTIONS ET HISTORIQUE
    // ============================================================
    
    avertissements: [
      {
        motif: String,
        date: {
          type: Date,
          default: Date.now
        },
        parAdmin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],

    // Raison de suspension (si applicable)
    raisonSuspension: {
      type: String,
      default: null
    },

    dateSuspension: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    // Hérite du discriminator de User
    discriminatorKey: 'role',
    collection: 'users'
  }
);

// ============================================================
// INDEX
// ============================================================

// Index géospatial pour la recherche par proximité
technicienSchema.index({ positionActuelle: '2dsphere' });

// Index pour la recherche par NINTI
technicienSchema.index({ numeroNINTI: 1 }, { unique: true, sparse: true });

// Index pour la recherche par statut
technicienSchema.index({ statut: 1 });

// Index pour la recherche par compétences
technicienSchema.index({ competences: 1 });

// Index pour la recherche par catégories
technicienSchema.index({ categories: 1 });

// Index pour la recherche par disponibilité
technicienSchema.index({ disponible: 1, statutDisponibilite: 1 });

// Index pour la recherche par note (annuaire B2B)
technicienSchema.index({ 'statistiques.noteMoyenne': -1 });

// Index composé pour la recherche dans l'annuaire
technicienSchema.index({
  statut: 1,
  disponible: 1,
  categories: 1,
  'statistiques.noteMoyenne': -1
});

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================

/**
 * Vérifie si le technicien peut passer le test
 * (délai de repassage respecté)
 */
technicienSchema.methods.peutPasserTest = function () {
  if (!this.dernierEchecTest) return true;
  
  const { DELAI_REPASSAGE_HEURES } = require('../config/constants').TEST;
  const delaiMs = DELAI_REPASSAGE_HEURES * 60 * 60 * 1000;
  const tempsEcoule = Date.now() - this.dernierEchecTest.getTime();
  
  return tempsEcoule >= delaiMs;
};

/**
 * Retourne le temps restant avant de pouvoir repasser le test (en heures)
 */
technicienSchema.methods.tempsRestantAvantRepassage = function () {
  if (!this.dernierEchecTest) return 0;
  
  const { DELAI_REPASSAGE_HEURES } = require('../config/constants').TEST;
  const delaiMs = DELAI_REPASSAGE_HEURES * 60 * 60 * 1000;
  const tempsEcoule = Date.now() - this.dernierEchecTest.getTime();
  const tempsRestant = delaiMs - tempsEcoule;
  
  return tempsRestant > 0 ? Math.ceil(tempsRestant / (60 * 60 * 1000)) : 0;
};

/**
 * Vérifie si le NINTI est valide et non expiré
 */
technicienSchema.methods.nintiEstValide = function () {
  if (!this.numeroNINTI) return false;
  if (this.statut !== STATUTS_TECHNICIEN.NINTI_ACTIF) return false;
  if (!this.dateExpirationNINTI) return false;
  
  return this.dateExpirationNINTI > new Date();
};

/**
 * Vérifie si le profil est complet pour être visible dans l'annuaire
 */
technicienSchema.methods.profilCompletPourAnnuaire = function () {
  return (
    this.numeroNINTI &&
    this.kycVerifie &&
    this.competences.length > 0 &&
    this.categories.length > 0 &&
    this.biographie &&
    this.tarifs.horaire > 0
  );
};

/**
 * Met à jour la note moyenne après un nouvel avis
 */
technicienSchema.methods.recalculerNoteMoyenne = async function () {
  const Avis = mongoose.model('Avis');
  
  const resultat = await Avis.aggregate([
    { $match: { technicien: this._id, actif: true } },
    {
      $group: {
        _id: null,
        noteMoyenne: { $avg: '$note' },
        nombreAvis: { $sum: 1 }
      }
    }
  ]);

  if (resultat.length > 0) {
    this.statistiques.noteMoyenne = Math.round(resultat[0].noteMoyenne * 10) / 10;
    this.statistiques.nombreAvis = resultat[0].nombreAvis;
  } else {
    this.statistiques.noteMoyenne = 0;
    this.statistiques.nombreAvis = 0;
  }

  await this.save();
};

/**
 * Retourne le profil public (visible par les entreprises et particuliers)
 */
technicienSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  
  // Retirer les champs sensibles
  delete obj.motDePasse;
  delete obj.documentsKYC; // Ne pas exposer les documents KYC
  delete obj.avertissements;
  delete obj.raisonSuspension;
  delete obj.__v;
  delete obj.tokenVerificationEmail;
  delete obj.tokenResetMotDePasse;
  delete obj.tokenResetExpire;
  
  return obj;
};

// ============================================================
// MÉTHODES STATIQUES
// ============================================================

/**
 * Recherche les techniciens dans un rayon donné
 */
technicienSchema.statics.rechercherParProximite = async function (
  longitude,
  latitude,
  rayonKm = 50,
  filtres = {}
) {
  const query = {
    statut: STATUTS_TECHNICIEN.NINTI_ACTIF,
    disponible: true,
    positionActuelle: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: rayonKm * 1000 // Conversion km → mètres
      }
    },
    ...filtres
  };

  return this.find(query)
    .select('-motDePasse -documentsKYC -avertissements')
    .limit(50);
};

/**
 * Statistiques globales pour l'admin
 */
technicienSchema.statics.statistiquesGlobales = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$statut',
        nombre: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments();
  const certifies = await this.countDocuments({
    statut: STATUTS_TECHNICIEN.NINTI_ACTIF
  });
  const disponibles = await this.countDocuments({
    statut: STATUTS_TECHNICIEN.NINTI_ACTIF,
    disponible: true
  });

  return {
    total,
    certifies,
    disponibles,
    parStatut: stats
  };
};

const Technicien = User.discriminator('technicien', technicienSchema);

module.exports = Technicien;
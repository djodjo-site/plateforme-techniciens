// server/models/Entreprise.js
const mongoose = require('mongoose');
const User = require('./User');
const { STATUTS_ENTREPRISE, TYPES_ABONNEMENT } = require('../config/constants');

const entrepriseSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. INFORMATIONS LÉGALES DE L'ENTREPRISE
    // ============================================================
    
    raisonSociale: {
      type: String,
      required: [true, 'La raison sociale est obligatoire'],
      trim: true,
      maxlength: [150, 'La raison sociale ne peut pas dépasser 150 caractères']
    },

    nomCommercial: {
      type: String,
      trim: true,
      maxlength: [150, 'Le nom commercial ne peut pas dépasser 150 caractères'],
      default: null
    },

    numeroRCCM: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },

    numeroImpot: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },

    numeroCNSS: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },

    secteurActivite: {
      type: String,
      trim: true,
      default: null
    },

    tailleEntreprise: {
      type: String,
      enum: ['TPE', 'PME', 'GE', 'Startup', 'ONG', 'Administration', 'Autre'],
      default: 'PME'
    },

    nombreEmployes: {
      type: Number,
      min: 0,
      default: 0
    },

    siteWeb: {
      type: String,
      trim: true,
      default: null
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
      default: null
    },

    logo: {
      type: String,
      default: null
    },

    // ============================================================
    // 2. LOCALISATION
    // ============================================================
    
    adresseSiege: {
      type: String,
      trim: true,
      default: null
    },

    ville: {
      type: String,
      trim: true,
      default: null
    },

    province: {
      type: String,
      trim: true,
      default: null
    },

    codePostal: {
      type: String,
      trim: true,
      default: null
    },

    positionGeo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },

    // ============================================================
    // 3. DOCUMENTS LÉGAUX (KYC ENTREPRISE)
    // ============================================================
    
    documentsLegaux: {
      rccm: {
        url: { type: String, default: null },
        verifie: { type: Boolean, default: false }
      },
      numeroImpot: {
        url: { type: String, default: null },
        verifie: { type: Boolean, default: false }
      },
      attestationFiscale: {
        url: { type: String, default: null },
        verifie: { type: Boolean, default: false }
      },
      statuts: {
        url: { type: String, default: null },
        verifie: { type: Boolean, default: false }
      }
    },

    kycVerifie: {
      type: Boolean,
      default: false
    },

    dateVerificationKYC: {
      type: Date,
      default: null
    },

    verifiePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // ============================================================
    // 4. CONTACTS AUTORISÉS
    // ============================================================
    
    contacts: [
      {
        nom: {
          type: String,
          required: true,
          trim: true
        },
        prenom: {
          type: String,
          required: true,
          trim: true
        },
        fonction: {
          type: String,
          trim: true,
          default: null
        },
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        telephone: {
          type: String,
          trim: true,
          default: null
        },
        principal: {
          type: Boolean,
          default: false
        },
        actif: {
          type: Boolean,
          default: true
        },
        dateAjout: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ============================================================
    // 5. STATUT DU COMPTE ENTREPRISE
    // ============================================================
    
    statut: {
      type: String,
      enum: Object.values(STATUTS_ENTREPRISE),
      default: STATUTS_ENTREPRISE.EN_ATTENTE_VALIDATION,
      required: true
    },

    raisonSuspension: {
      type: String,
      default: null
    },

    dateSuspension: {
      type: Date,
      default: null
    },

    // ============================================================
    // 6. ABONNEMENT
    // ============================================================
    
    abonnement: {
      actif: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: Object.values(TYPES_ABONNEMENT),
        default: null
      },
      dateDebut: {
        type: Date,
        default: null
      },
      dateFin: {
        type: Date,
        default: null
      },
      autoRenouvellement: {
        type: Boolean,
        default: false
      },
      dernierPaiement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paiement',
        default: null
      },
      historique: [
        {
          type: {
            type: String,
            enum: Object.values(TYPES_ABONNEMENT)
          },
          dateDebut: Date,
          dateFin: Date,
          montant: Number,
          devise: String,
          paiementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Paiement'
          }
        }
      ]
    },

    // ============================================================
    // 7. ACCÈS À L'ANNUAIRE
    // ============================================================
    
    accesAnnuaire: {
      // Nombre de consultations ce mois
      consultationsMois: {
        type: Number,
        default: 0,
        min: 0
      },
      // Limite mensuelle selon l'abonnement (0 = illimité)
      limiteConsultationsMois: {
        type: Number,
        default: 0,
        min: 0
      },
      // Nombre de contacts pris ce mois
      contactsMois: {
        type: Number,
        default: 0,
        min: 0
      },
      // Limite de contacts par mois (0 = illimité)
      limiteContactsMois: {
        type: Number,
        default: 0,
        min: 0
      },
      // Date de réinitialisation des compteurs
      dateReinitialisation: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return date;
        }
      },
      // Recherches sauvegardées
      recherchesSauvegardees: [
        {
          nom: String,
          filtres: mongoose.Schema.Types.Mixed,
          dateCreation: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },

    // ============================================================
    // 8. TECHNICIENS FAVORIS
    // ============================================================
    
    techniciensFavoris: [
      {
        technicien: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Technicien',
          required: true
        },
        dateAjout: {
          type: Date,
          default: Date.now
        },
        note: {
          type: String,
          maxlength: 500,
          default: null
        }
      }
    ],

    // ============================================================
    // 9. STATISTIQUES
    // ============================================================
    
    statistiques: {
      nombreMissionsTotales: {
        type: Number,
        default: 0,
        min: 0
      },
      missionsEnCours: {
        type: Number,
        default: 0,
        min: 0
      },
      missionsTerminees: {
        type: Number,
        default: 0,
        min: 0
      },
      missionsAnnulees: {
        type: Number,
        default: 0,
        min: 0
      },
      montantTotalDepense: {
        type: Number,
        default: 0,
        min: 0
      },
      deviseDepense: {
        type: String,
        default: 'XAF',
        enum: ['XAF', 'USD', 'EUR', 'CDF']
      },
      nombreTechniciensContactes: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    // ============================================================
    // 10. PRÉFÉRENCES
    // ============================================================
    
    preferences: {
      notificationsEmail: {
        type: Boolean,
        default: true
      },
      notificationsPush: {
        type: Boolean,
        default: true
      },
      // Accepter les techniciens nouvellement certifiés
      accepterNouveauxTechniciens: {
        type: Boolean,
        default: true
      },
      // Note minimum des techniciens affichés (0 = tous)
      noteMinimumTechniciens: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      // Zones géographiques préférées
      zonesPreferees: {
        type: [String],
        default: []
      }
    },

    // ============================================================
    // 11. FACTURATION
    // ============================================================
    
    facturation: {
      adresseFacturation: {
        type: String,
        default: null
      },
      emailFacturation: {
        type: String,
        lowercase: true,
        trim: true,
        default: null
      },
      telephoneFacturation: {
        type: String,
        trim: true,
        default: null
      },
      numeroTVA: {
        type: String,
        trim: true,
        uppercase: true,
        default: null
      },
      conditionsPaiement: {
        type: String,
        enum: ['comptant', '15_jours', '30_jours', '45_jours', '60_jours'],
        default: 'comptant'
      }
    },

    // ============================================================
    // 12. HISTORIQUE ET SANCTIONS
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
    ]
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
    collection: 'users'
  }
);

// ============================================================
// INDEX
// ============================================================

entrepriseSchema.index({ raisonSociale: 1 });
entrepriseSchema.index({ numeroRCCM: 1 }, { sparse: true });
entrepriseSchema.index({ numeroImpot: 1 }, { sparse: true });
entrepriseSchema.index({ statut: 1 });
entrepriseSchema.index({ 'abonnement.actif': 1, 'abonnement.dateFin': 1 });
entrepriseSchema.index({ ville: 1, statut: 1 });
entrepriseSchema.index({ positionGeo: '2dsphere' });
entrepriseSchema.index({ 'contacts.email': 1 });

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================

entrepriseSchema.methods.abonnementEstActif = function () {
  if (!this.abonnement.actif) return false;
  if (!this.abonnement.dateFin) return false;
  return this.abonnement.dateFin > new Date();
};

entrepriseSchema.methods.peutConsulterAnnuaire = function () {
  if (this.statut !== STATUTS_ENTREPRISE.ACTIF) return false;
  if (!this.abonnementEstActif()) return false;
  
  if (this.accesAnnuaire.limiteConsultationsMois === 0) return true;
  return this.accesAnnuaire.consultationsMois < this.accesAnnuaire.limiteConsultationsMois;
};

entrepriseSchema.methods.peutContacterTechnicien = function () {
  if (!this.peutConsulterAnnuaire()) return false;
  
  if (this.accesAnnuaire.limiteContactsMois === 0) return true;
  return this.accesAnnuaire.contactsMois < this.accesAnnuaire.limiteContactsMois;
};

entrepriseSchema.methods.incrementerConsultations = async function () {
  this.accesAnnuaire.consultationsMois += 1;
  await this.save();
};

entrepriseSchema.methods.incrementerContacts = async function () {
  this.accesAnnuaire.contactsMois += 1;
  this.statistiques.nombreTechniciensContactes += 1;
  await this.save();
};

entrepriseSchema.methods.reinitialiserCompteursMensuels = async function () {
  if (this.accesAnnuaire.dateReinitialisation > new Date()) return;

  this.accesAnnuaire.consultationsMois = 0;
  this.accesAnnuaire.contactsMois = 0;

  const nouvelleDate = new Date();
  nouvelleDate.setMonth(nouvelleDate.getMonth() + 1);
  nouvelleDate.setDate(1);
  nouvelleDate.setHours(0, 0, 0, 0);
  this.accesAnnuaire.dateReinitialisation = nouvelleDate;

  await this.save();
};

entrepriseSchema.methods.ajouterTechnicienFavori = async function (technicienId, note = null) {
  const existe = this.techniciensFavoris.some(
    (fav) => fav.technicien.toString() === technicienId.toString()
  );

  if (existe) return false;

  this.techniciensFavoris.push({
    technicien: technicienId,
    note
  });

  await this.save();
  return true;
};

entrepriseSchema.methods.retirerTechnicienFavori = async function (technicienId) {
  const index = this.techniciensFavoris.findIndex(
    (fav) => fav.technicien.toString() === technicienId.toString()
  );

  if (index === -1) return false;

  this.techniciensFavoris.splice(index, 1);
  await this.save();
  return true;
};

entrepriseSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.motDePasse;
  delete obj.documentsLegaux;
  delete obj.avertissements;
  delete obj.facturation;
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

entrepriseSchema.statics.rechercherActives = async function (filtres = {}) {
  return this.find({
    statut: STATUTS_ENTREPRISE.ACTIF,
    'abonnement.actif': true,
    'abonnement.dateFin': { $gt: new Date() },
    ...filtres
  }).select('-motDePasse -documentsLegaux -avertissements');
};

entrepriseSchema.statics.statistiquesGlobales = async function () {
  const total = await this.countDocuments();
  const actives = await this.countDocuments({ statut: STATUTS_ENTREPRISE.ACTIF });
  const abonnees = await this.countDocuments({
    statut: STATUTS_ENTREPRISE.ACTIF,
    'abonnement.actif': true,
    'abonnement.dateFin': { $gt: new Date() }
  });

  const parStatut = await this.aggregate([
    { $group: { _id: '$statut', nombre: { $sum: 1 } } }
  ]);

  const revenusAbonnements = await this.aggregate([
    { $unwind: '$abonnement.historique' },
    {
      $group: {
        _id: null,
        total: { $sum: '$abonnement.historique.montant' }
      }
    }
  ]);

  return {
    total,
    actives,
    abonnees,
    parStatut,
    revenusAbonnements: revenusAbonnements[0]?.total || 0
  };
};

entrepriseSchema.statics.entreprisesAbonnementExpirant = async function (joursAvant = 7) {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + joursAvant);

  return this.find({
    statut: STATUTS_ENTREPRISE.ACTIF,
    'abonnement.actif': true,
    'abonnement.autoRenouvellement': false,
    'abonnement.dateFin': {
      $gte: new Date(),
      $lte: dateLimite
    }
  });
};

const Entreprise = User.discriminator('Entreprise', entrepriseSchema);

module.exports = Entreprise;
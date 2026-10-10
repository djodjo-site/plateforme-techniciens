// server/models/Admin.js
const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. INFORMATIONS ADMINISTRATIVES
    // ============================================================
    
    matricule: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },

    fonction: {
      type: String,
      trim: true,
      default: 'Administrateur'
    },

    // ============================================================
    // 2. NIVEAU DE PERMISSIONS
    // ============================================================
    
    niveauAcces: {
      type: String,
      enum: ['super_admin', 'admin', 'moderateur', 'support'],
      default: 'moderateur',
      required: true
    },

    permissions: {
      // Gestion des utilisateurs
      gererTechniciens: { type: Boolean, default: false },
      gererEntreprises: { type: Boolean, default: false },
      gererParticuliers: { type: Boolean, default: false },
      gererAdmins: { type: Boolean, default: false },

      // Certification et NINTI
      validerTests: { type: Boolean, default: false },
      genererNINTI: { type: Boolean, default: false },
      revoquerNINTI: { type: Boolean, default: false },

      // Vérification KYC
      verifierKYC: { type: Boolean, default: false },
      rejeterKYC: { type: Boolean, default: false },

      // Contenu
      gererQuestions: { type: Boolean, default: false },
      gererCategories: { type: Boolean, default: false },

      // Litiges et sanctions
      gererLitiges: { type: Boolean, default: false },
      sanctionnerUtilisateurs: { type: Boolean, default: false },
      suspendreComptes: { type: Boolean, default: false },

      // Finances
      voirTransactions: { type: Boolean, default: false },
      gererRemboursements: { type: Boolean, default: false },
      gererAbonnements: { type: Boolean, default: false },

      // Statistiques
      voirStatistiques: { type: Boolean, default: false },
      exporterDonnees: { type: Boolean, default: false },

      // Système
      gererParametresSysteme: { type: Boolean, default: false },
      voirLogs: { type: Boolean, default: false }
    },

    // ============================================================
    // 3. PÉRIMÈTRE D'ACTION
    // ============================================================
    
    // Restriction géographique (null = tout le pays)
    zonesAssignees: {
      type: [String],
      default: []
    },

    // Restriction par catégorie (null = toutes)
    categoriesAssignees: {
      type: [String],
      default: []
    },

    // ============================================================
    // 4. SÉCURITÉ RENFORCÉE
    // ============================================================
    
    deuxFacteursActif: {
      type: Boolean,
      default: true
    },

    secret2FA: {
      type: String,
      select: false,
      default: null
    },

    // IPs autorisées (whitelist)
    ipsAutorisees: {
      type: [String],
      default: []
    },

    // Sessions actives
    sessionsActives: [
      {
        token: { type: String, select: false },
        ip: String,
        userAgent: String,
        dateConnexion: { type: Date, default: Date.now },
        dateExpiration: Date
      }
    ],

    // ============================================================
    // 5. TRAÇABILITÉ DES ACTIONS
    // ============================================================
    
    journalActions: [
      {
        action: {
          type: String,
          required: true
        },
        cible: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'journalActions.cibleModel'
        },
        cibleModel: {
          type: String,
          enum: ['User', 'Technicien', 'Entreprise', 'Paiement', 'Mission', 'Avis', 'Litige']
        },
        details: {
          type: mongoose.Schema.Types.Mixed
        },
        ip: String,
        dateAction: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ============================================================
    // 6. STATISTIQUES PERSONNELLES
    // ============================================================
    
    statistiques: {
      totalActions: { type: Number, default: 0, min: 0 },
      techniciensValides: { type: Number, default: 0, min: 0 },
      KYCVerifies: { type: Number, default: 0, min: 0 },
      litigesResolus: { type: Number, default: 0, min: 0 },
      comptesSuspendus: { type: Number, default: 0, min: 0 },
      remboursementsTraites: { type: Number, default: 0, min: 0 }
    },

    // ============================================================
    // 7. SUPER ADMIN - CLAISON
    // ============================================================
    
    // Créé par (pour tracer qui a nommé cet admin)
    creePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },

    // Peut être désactivé par un super admin
    peutEtreSupprime: {
      type: Boolean,
      default: true
    }
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

adminSchema.index({ niveauAcces: 1 });
adminSchema.index({ 'journalActions.dateAction': -1 });

// ============================================================
// MIDDLEWARE PRÉ-SAVE : PERMISSIONS PAR DÉFAUT SELON NIVEAU
// ============================================================

adminSchema.pre('save', function (next) {
  if (this.isModified('niveauAcces')) {
    const permissionsParDefaut = {
      super_admin: {
        gererTechniciens: true,
        gererEntreprises: true,
        gererParticuliers: true,
        gererAdmins: true,
        validerTests: true,
        genererNINTI: true,
        revoquerNINTI: true,
        verifierKYC: true,
        rejeterKYC: true,
        gererQuestions: true,
        gererCategories: true,
        gererLitiges: true,
        sanctionnerUtilisateurs: true,
        suspendreComptes: true,
        voirTransactions: true,
        gererRemboursements: true,
        gererAbonnements: true,
        voirStatistiques: true,
        exporterDonnees: true,
        gererParametresSysteme: true,
        voirLogs: true
      },
      admin: {
        gererTechniciens: true,
        gererEntreprises: true,
        gererParticuliers: true,
        gererAdmins: false,
        validerTests: true,
        genererNINTI: true,
        revoquerNINTI: true,
        verifierKYC: true,
        rejeterKYC: true,
        gererQuestions: true,
        gererCategories: true,
        gererLitiges: true,
        sanctionnerUtilisateurs: true,
        suspendreComptes: true,
        voirTransactions: true,
        gererRemboursements: true,
        gererAbonnements: true,
        voirStatistiques: true,
        exporterDonnees: true,
        gererParametresSysteme: false,
        voirLogs: true
      },
      moderateur: {
        gererTechniciens: true,
        gererEntreprises: false,
        gererParticuliers: true,
        gererAdmins: false,
        validerTests: false,
        genererNINTI: false,
        revoquerNINTI: false,
        verifierKYC: true,
        rejeterKYC: false,
        gererQuestions: true,
        gererCategories: false,
        gererLitiges: true,
        sanctionnerUtilisateurs: false,
        suspendreComptes: false,
        voirTransactions: false,
        gererRemboursements: false,
        gererAbonnements: false,
        voirStatistiques: true,
        exporterDonnees: false,
        gererParametresSysteme: false,
        voirLogs: false
      },
      support: {
        gererTechniciens: false,
        gererEntreprises: false,
        gererParticuliers: false,
        gererAdmins: false,
        validerTests: false,
        genererNINTI: false,
        revoquerNINTI: false,
        verifierKYC: false,
        rejeterKYC: false,
        gererQuestions: false,
        gererCategories: false,
        gererLitiges: false,
        sanctionnerUtilisateurs: false,
        suspendreComptes: false,
        voirTransactions: false,
        gererRemboursements: false,
        gererAbonnements: false,
        voirStatistiques: true,
        exporterDonnees: false,
        gererParametresSysteme: false,
        voirLogs: false
      }
    };

    const defaut = permissionsParDefaut[this.niveauAcces] || permissionsParDefaut.moderateur;
    Object.assign(this.permissions, defaut);
  }
  next();
});

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================

adminSchema.methods.aPermission = function (permission) {
  if (this.niveauAcces === 'super_admin') return true;
  return this.permissions[permission] === true;
};

adminSchema.methods.estSuperAdmin = function () {
  return this.niveauAcces === 'super_admin';
};

adminSchema.methods.enregistrerAction = async function (action, cible = null, cibleModel = null, details = {}) {
  this.journalActions.push({
    action,
    cible,
    cibleModel,
    details,
    ip: details.ip || null
  });

  // Limiter la taille du journal (garder les 1000 dernières actions)
  if (this.journalActions.length > 1000) {
    this.journalActions = this.journalActions.slice(-1000);
  }

  this.statistiques.totalActions += 1;
  await this.save();
};

adminSchema.methods.incrementerStatistique = async function (champ) {
  if (this.statistiques[champ] !== undefined) {
    this.statistiques[champ] += 1;
    await this.save();
  }
};

adminSchema.methods.ajouterSession = async function (token, ip, userAgent, dureeHeures = 24) {
  const dateExpiration = new Date();
  dateExpiration.setHours(dateExpiration.getHours() + dureeHeures);

  this.sessionsActives.push({
    token,
    ip,
    userAgent,
    dateExpiration
  });

  // Nettoyer les sessions expirées
  this.sessionsActives = this.sessionsActives.filter(
    (s) => s.dateExpiration > new Date()
  );

  await this.save();
};

adminSchema.methods.supprimerSession = async function (token) {
  this.sessionsActives = this.sessionsActives.filter(
    (s) => s.token !== token
  );
  await this.save();
};

adminSchema.methods.supprimerToutesSessions = async function () {
  this.sessionsActives = [];
  await this.save();
};

adminSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.motDePasse;
  delete obj.secret2FA;
  delete obj.sessionsActives;
  delete obj.journalActions;
  delete obj.__v;
  delete obj.tokenVerificationEmail;
  delete obj.tokenResetMotDePasse;
  delete obj.tokenResetExpire;
  return obj;
};

// ============================================================
// MÉTHODES STATIQUES
// ============================================================

adminSchema.statics.rechercherParNiveau = async function (niveau) {
  return this.find({ niveauAcces: niveau, actif: true })
    .select('-motDePasse -secret2FA -sessionsActives');
};

adminSchema.statics.creerSuperAdmin = async function (donnees) {
  const admin = await this.create({
    ...donnees,
    niveauAcces: 'super_admin',
    peutEtreSupprime: false,
    deuxFacteursActif: true
  });

  return admin;
};

adminSchema.statics.statistiquesGlobales = async function () {
  const total = await this.countDocuments();
  const actifs = await this.countDocuments({ actif: true });

  const parNiveau = await this.aggregate([
    { $match: { actif: true } },
    { $group: { _id: '$niveauAcces', nombre: { $sum: 1 } } }
  ]);

  return {
    total,
    actifs,
    parNiveau
  };
};

adminSchema.statics.activiteRecente = async function (limite = 50) {
  const admins = await this.find({ actif: true })
    .select('nom prenom journalActions')
    .lean();

  const toutesActions = [];

  admins.forEach((admin) => {
    admin.journalActions.forEach((action) => {
      toutesActions.push({
        admin: {
          id: admin._id,
          nom: admin.nom,
          prenom: admin.prenom
        },
        ...action
      });
    });
  });

  return toutesActions
    .sort((a, b) => b.dateAction - a.dateAction)
    .slice(0, limite);
};

const Admin = User.discriminator('Admin', adminSchema);

module.exports = Admin;
// server/models/NINTI.js
const mongoose = require('mongoose');

const nintiSchema = new mongoose.Schema(
  {
    // ============================================================
    // 1. NUMÉRO NINTI
    // ============================================================
    
    numero: {
      type: String,
      required: [true, 'Le numéro NINTI est obligatoire'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^NINTI-\d{4}-[A-Z]{3}-\d{5}$/,
        'Format NINTI invalide (ex: NINTI-2025-COD-00042)'
      ]
    },

    // ============================================================
    // 2. RÉFÉRENCES
    // ============================================================
    
    technicien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technicien',
      required: [true, 'Le technicien est obligatoire'],
      index: true
    },

    paiement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paiement',
      required: [true, 'Le paiement est obligatoire']
    },

    // ============================================================
    // 3. DÉCOMPOSITION DU NUMÉRO
    // ============================================================
    
    annee: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100
    },

    codePays: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      default: 'COD'
    },

    sequence: {
      type: Number,
      required: true,
      min: 1
    },

    // ============================================================
    // 4. VALIDITÉ
    // ============================================================
    
    dateDelivrance: {
      type: Date,
      required: true,
      default: Date.now
    },

    dateExpiration: {
      type: Date,
      required: true
    },

    dureeValiditeMois: {
      type: Number,
      default: 12,
      min: 1,
      max: 120
    },

    // ============================================================
    // 5. STATUT
    // ============================================================
    
    statut: {
      type: String,
      enum: ['actif', 'expire', 'revoque', 'suspendu', 'remplace'],
      default: 'actif',
      required: true
    },

    raisonRevocation: {
      type: String,
      default: null
    },

    dateRevocation: {
      type: Date,
      default: null
    },

    revoquePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },

    // ============================================================
    // 6. RENOUVELLEMENT
    // ============================================================
    
    estRenouvellement: {
      type: Boolean,
      default: false
    },

    nintiPrecedent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NINTI',
      default: null
    },

    nintiSuivant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NINTI',
      default: null
    },

    nombreRenouvellements: {
      type: Number,
      default: 0,
      min: 0
    },

    // ============================================================
    // 7. VÉRIFICATION PUBLIQUE
    // ============================================================
    
    // Code secret pour vérification publique (optionnel)
    codeVerification: {
      type: String,
      select: false,
      default: null
    },

    // Nombre de fois que ce NINTI a été vérifié publiquement
    nombreVerifications: {
      type: Number,
      default: 0,
      min: 0
    },

    derniereVerification: {
      type: Date,
      default: null
    },

    // ============================================================
    // 8. MÉTADONNÉES
    // ============================================================
    
    pays: {
      type: String,
      default: 'Congo'
    },

    // Snapshot des infos du technicien au moment de la délivrance
    snapshotTechnicien: {
      nom: String,
      prenom: String,
      email: String,
      telephone: String,
      ville: String
    },

    // ============================================================
    // 9. QR CODE
    // ============================================================
    
    qrCodeUrl: {
      type: String,
      default: null
    },

    urlVerification: {
      type: String,
      default: null
    },

    // ============================================================
    // 10. HISTORIQUE
    // ============================================================
    
    historique: [
      {
        action: {
          type: String,
          enum: ['creation', 'renouvellement', 'revocation', 'suspension', 'reactivation', 'remplacement'],
          required: true
        },
        date: {
          type: Date,
          default: Date.now
        },
        parAdmin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
          default: null
        },
        details: {
          type: String,
          default: null
        }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'nintis'
  }
);

// ============================================================
// INDEX
// ============================================================

nintiSchema.index({ numero: 1 }, { unique: true });
nintiSchema.index({ technicien: 1 });
nintiSchema.index({ statut: 1, dateExpiration: 1 });
nintiSchema.index({ annee: 1, codePays: 1, sequence: 1 }, { unique: true });
nintiSchema.index({ dateExpiration: 1, statut: 1 });

// ============================================================
// MIDDLEWARE PRÉ-SAVE
// ============================================================

nintiSchema.pre('save', function (next) {
  // Calculer la date d'expiration si non définie
  if (!this.dateExpiration && this.dateDelivrance && this.dureeValiditeMois) {
    const expiration = new Date(this.dateDelivrance);
    expiration.setMonth(expiration.getMonth() + this.dureeValiditeMois);
    this.dateExpiration = expiration;
  }

  // Générer l'URL de vérification
  if (this.numero && !this.urlVerification) {
    const baseUrl = process.env.CLIENT_URL || 'https://plateforme-techniciens.com';
    this.urlVerification = `${baseUrl}/verifier/${this.numero}`;
  }

  next();
});

// ============================================================
// MÉTHODES D'INSTANCE
// ============================================================

nintiSchema.methods.estValide = function () {
  if (this.statut !== 'actif') return false;
  return this.dateExpiration > new Date();
};

nintiSchema.methods.estExpire = function () {
  return this.dateExpiration <= new Date() || this.statut === 'expire';
};

nintiSchema.methods.joursRestants = function () {
  const diff = this.dateExpiration.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

nintiSchema.methods.estBientotExpire = function (joursAvant = 30) {
  return this.joursRestants() <= joursAvant && this.statut === 'actif';
};

nintiSchema.methods.enregistrerVerification = async function () {
  this.nombreVerifications += 1;
  this.derniereVerification = new Date();
  await this.save();
};

nintiSchema.methods.revoquer = async function (raison, adminId) {
  this.statut = 'revoque';
  this.raisonRevocation = raison;
  this.dateRevocation = new Date();
  this.revoquePar = adminId;

  this.historique.push({
    action: 'revocation',
    parAdmin: adminId,
    details: raison
  });

  await this.save();
  return this;
};

nintiSchema.methods.suspendre = async function (raison, adminId) {
  this.statut = 'suspendu';

  this.historique.push({
    action: 'suspension',
    parAdmin: adminId,
    details: raison
  });

  await this.save();
  return this;
};

nintiSchema.methods.reactiver = async function (adminId) {
  if (this.dateExpiration <= new Date()) {
    throw new Error('Impossible de réactiver un NINTI expiré');
  }

  this.statut = 'actif';

  this.historique.push({
    action: 'reactivation',
    parAdmin: adminId
  });

  await this.save();
  return this;
};

nintiSchema.methods.marquerExpire = async function () {
  if (this.statut === 'actif') {
    this.statut = 'expire';
    await this.save();
  }
  return this;
};

nintiSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.codeVerification;
  delete obj.__v;
  delete obj.snapshotTechnicien.email;
  delete obj.snapshotTechnicien.telephone;
  return obj;
};

nintiSchema.methods.toVerificationJSON = function () {
  // Version minimale pour la vérification publique
  return {
    numero: this.numero,
    statut: this.statut,
    dateDelivrance: this.dateDelivrance,
    dateExpiration: this.dateExpiration,
    estValide: this.estValide(),
    technicien: {
      nom: this.snapshotTechnicien?.nom,
      prenom: this.snapshotTechnicien?.prenom,
      ville: this.snapshotTechnicien?.ville
    },
    urlVerification: this.urlVerification
  };
};

// ============================================================
// MÉTHODES STATIQUES
// ============================================================

nintiSchema.statics.genererNumero = async function (codePays = 'COD') {
  const annee = new Date().getFullYear();

  // Trouver le dernier numéro de cette année/pays
  const dernier = await this.findOne({
    annee,
    codePays: codePays.toUpperCase()
  }).sort({ sequence: -1 });

  const nouvelleSequence = dernier ? dernier.sequence + 1 : 1;
  const sequenceFormatee = String(nouvelleSequence).padStart(5, '0');

  return `NINTI-${annee}-${codePays.toUpperCase()}-${sequenceFormatee}`;
};

nintiSchema.statics.creerNINTI = async function (donnees) {
  const {
    technicienId,
    paiementId,
    snapshotTechnicien,
    codePays = 'COD',
    dureeValiditeMois = 12,
    estRenouvellement = false,
    nintiPrecedent = null
  } = donnees;

  const numero = await this.genererNumero(codePays);
  const annee = new Date().getFullYear();
  const sequence = parseInt(numero.split('-')[3], 10);

  const dateDelivrance = new Date();
  const dateExpiration = new Date(dateDelivrance);
  dateExpiration.setMonth(dateExpiration.getMonth() + dureeValiditeMois);

  const ninti = await this.create({
    numero,
    technicien: technicienId,
    paiement: paiementId,
    annee,
    codePays: codePays.toUpperCase(),
    sequence,
    dateDelivrance,
    dateExpiration,
    dureeValiditeMois,
    statut: 'actif',
    estRenouvellement,
    nintiPrecedent,
    snapshotTechnicien,
    historique: [
      {
        action: estRenouvellement ? 'renouvellement' : 'creation',
        details: estRenouvellement ? 'Renouvellement annuel' : 'Délivrance initiale'
      }
    ]
  });

  // Mettre à jour le NINTI précédent
  if (nintiPrecedent) {
    const ancien = await this.findById(nintiPrecedent);
    if (ancien) {
      ancien.nintiSuivant = ninti._id;
      ancien.statut = 'remplace';
      ancien.historique.push({
        action: 'remplacement',
        details: `Remplacé par ${numero}`
      });
      await ancien.save();

      ninti.nombreRenouvellements = (ancien.nombreRenouvellements || 0) + 1;
      await ninti.save();
    }
  }

  return ninti;
};

nintiSchema.statics.verifierNumero = async function (numero) {
  const ninti = await this.findOne({ numero: numero.toUpperCase() })
    .populate('technicien', 'nom prenom ville photo statistiques')
    .select('+codeVerification');

  if (!ninti) {
    return {
      trouve: false,
      message: 'Aucun NINTI trouvé avec ce numéro'
    };
  }

  await ninti.enregistrerVerification();

  return {
    trouve: true,
    valide: ninti.estValide(),
    ...ninti.toVerificationJSON()
  };
};

nintiSchema.statics.nintisExpirant = async function (joursAvant = 30) {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + joursAvant);

  return this.find({
    statut: 'actif',
    dateExpiration: {
      $gte: new Date(),
      $lte: dateLimite
    }
  }).populate('technicien', 'nom prenom email telephone');
};

nintiSchema.statics.nintisExpires = async function () {
  return this.find({
    statut: 'actif',
    dateExpiration: { $lt: new Date() }
  }).populate('technicien', 'nom prenom email');
};

nintiSchema.statics.mettreAJourExpires = async function () {
  const resultat = await this.updateMany(
    {
      statut: 'actif',
      dateExpiration: { $lt: new Date() }
    },
    {
      $set: { statut: 'expire' }
    }
  );

  return resultat.modifiedCount;
};

nintiSchema.statics.rechercherParTechnicien = async function (technicienId) {
  return this.find({ technicien: technicienId })
    .sort({ dateDelivrance: -1 });
};

nintiSchema.statics.statistiquesGlobales = async function () {
  const total = await this.countDocuments();
  const actifs = await this.countDocuments({ statut: 'actif' });
  const expires = await this.countDocuments({ statut: 'expire' });
  const revoques = await this.countDocuments({ statut: 'revoque' });
  const suspendus = await this.countDocuments({ statut: 'suspendu' });

  const parAnnee = await this.aggregate([
    { $group: { _id: '$annee', nombre: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);

  const parPays = await this.aggregate([
    { $group: { _id: '$codePays', nombre: { $sum: 1 } } },
    { $sort: { nombre: -1 } }
  ]);

  const expirationsMois = await this.aggregate([
    { $match: { statut: 'actif' } },
    {
      $group: {
        _id: {
          annee: { $year: '$dateExpiration' },
          mois: { $month: '$dateExpiration' }
        },
        nombre: { $sum: 1 }
      }
    },
    { $sort: { '_id.annee': 1, '_id.mois': 1 } }
  ]);

  return {
    total,
    actifs,
    expires,
    revoques,
    suspendus,
    parAnnee,
    parPays,
    expirationsMois
  };
};

nintiSchema.statics.rechercherParNumero = async function (recherche) {
  return this.find({
    numero: { $regex: recherche, $options: 'i' }
  })
    .populate('technicien', 'nom prenom email')
    .limit(20);
};

const NINTI = mongoose.model('NINTI', nintiSchema);

module.exports = NINTI; 
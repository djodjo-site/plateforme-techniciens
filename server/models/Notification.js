const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        'test_disponible', 'test_reussi', 'test_echoue',
        'paiement_requis', 'paiement_reussi', 'paiement_echoue', 'paiement_recu',
        'ninti_delivre', 'ninti_expire_bientot', 'ninti_expire', 'ninti_revoque',
        'nouvelle_demande', 'nouvelle_offre', 'offre_acceptee', 'offre_refusee',
        'mission_assignee', 'mission_demarree', 'mission_terminee', 'mission_annulee',
        'nouveau_message', 'nouvel_avis', 'avis_recu',
        'abonnement_actif', 'abonnement_expire_bientot', 'abonnement_expire',
        'kyc_valide', 'kyc_rejete',
        'litige_ouvert', 'litige_resolu',
        'compte_suspendu', 'compte_reactive',
        'rappel', 'systeme', 'autre'
      ],
      required: true
    },

    titre: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },

    icone: { type: String, default: null },
    couleur: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },

    // Priorité
    priorite: {
      type: String,
      enum: ['basse', 'normale', 'haute', 'urgente'],
      default: 'normale'
    },

    // Lien d'action
    action: {
      label: { type: String, default: null },
      url: { type: String, default: null }
    },

    // Références
    refModel: {
      type: String,
      enum: ['Technicien', 'Entreprise', 'Demande', 'Mission', 'Paiement', 'NINTI', 'Avis', 'Litige', 'TestResult', 'Abonnement', 'Message', null],
      default: null
    },
    refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'refModel', default: null },

    // État
    lu: { type: Boolean, default: false },
    dateLecture: { type: Date, default: null },

    // Envois
    emailEnvoye: { type: Boolean, default: false },
    dateEmailEnvoi: { type: Date, default: null },
    pushEnvoye: { type: Boolean, default: false },
    datePushEnvoi: { type: Date, default: null },

    // Expiration
    dateExpiration: { type: Date, default: null },

    // Groupement
    groupe: { type: String, default: null }
  },
  { timestamps: true, collection: 'notifications' }
);

notificationSchema.index({ destinataire: 1, lu: 1, createdAt: -1 });
notificationSchema.index({ destinataire: 1, type: 1 });
notificationSchema.index({ dateExpiration: 1 });

notificationSchema.methods.marquerLue = async function () {
  if (!this.lu) {
    this.lu = true;
    this.dateLecture = new Date();
    await this.save();
  }
  return this;
};

notificationSchema.statics.marquerToutesLues = async function (userId) {
  return this.updateMany(
    { destinataire: userId, lu: false },
    { lu: true, dateLecture: new Date() }
  );
};

notificationSchema.statics.nonLues = async function (userId) {
  return this.countDocuments({ destinataire: userId, lu: false });
};

notificationSchema.statics.creer = async function (donnees) {
  const notification = await this.create(donnees);
  // Optionnel : émettre via socket.io si le module est disponible
  try {
    const { getIO } = require('../sockets');
    const io = getIO();
    io.to(`user_${donnees.destinataire}`).emit('notification:nouvelle', notification);
  } catch (e) {
    // Socket.io pas encore initialisé
  }
  return notification;
};

notificationSchema.statics.nettoyerExpirees = async function () {
  const resultat = await this.deleteMany({
    dateExpiration: { $lt: new Date() }
  });
  return resultat.deletedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
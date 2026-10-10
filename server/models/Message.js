const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    expediteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      default: null,
      index: true
    },

    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande',
      default: null
    },

    contenu: {
      type: String,
      required: true,
      trim: true,
      maxlength: [5000, 'Le message ne peut pas dépasser 5000 caractères']
    },

    type: {
      type: String,
      enum: ['texte', 'image', 'fichier', 'systeme'],
      default: 'texte'
    },

    fichier: {
      url: String,
      nom: String,
      taille: Number,
      typeMime: String
    },

    lu: { type: Boolean, default: false },
    dateLecture: { type: Date, default: null },

    // Réponse à un message
    repondA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },

    // Suppression logique
    supprime: { type: Boolean, default: false },
    supprimePar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Signalement
    signale: { type: Boolean, default: false },
    raisonSignalement: { type: String, default: null },

    // Édition
    edite: { type: Boolean, default: false },
    dateEdition: { type: Date, default: null }
  },
  { timestamps: true, collection: 'messages' }
);

messageSchema.index({ expediteur: 1, destinataire: 1, createdAt: -1 });
messageSchema.index({ mission: 1, createdAt: -1 });
messageSchema.index({ destinataire: 1, lu: 1 });

messageSchema.methods.marquerLu = async function () {
  if (!this.lu) {
    this.lu = true;
    this.dateLecture = new Date();
    await this.save();
  }
  return this;
};

messageSchema.methods.supprimerPour = async function (userId) {
  if (!this.supprimePar.includes(userId)) {
    this.supprimePar.push(userId);
    await this.save();
  }
  return this;
};

messageSchema.methods.toPublicJSON = function (userId) {
  const obj = this.toObject();
  delete obj.__v;
  if (obj.supprimePar?.some((id) => id.toString() === userId.toString())) {
    return null;
  }
  return obj;
};

messageSchema.statics.conversation = async function (userId1, userId2, missionId = null, limite = 50) {
  const query = {
    $or: [
      { expediteur: userId1, destinataire: userId2 },
      { expediteur: userId2, destinataire: userId1 }
    ]
  };
  if (missionId) query.mission = missionId;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limite)
    .populate('expediteur', 'nom prenom photo role')
    .populate('destinataire', 'nom prenom photo role');
};

messageSchema.statics.messagesNonLus = async function (userId) {
  return this.countDocuments({ destinataire: userId, lu: false, supprime: false });
};

messageSchema.statics.marquerConversationLue = async function (userId, autreUserId, missionId = null) {
  const query = {
    expediteur: autreUserId,
    destinataire: userId,
    lu: false
  };
  if (missionId) query.mission = missionId;

  return this.updateMany(query, { lu: true, dateLecture: new Date() });
};

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
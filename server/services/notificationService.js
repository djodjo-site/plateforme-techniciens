// server/services/notificationService.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const mailService = require('./mailService');
const { logger } = require('../utils/logger');

const creerNotification = async (donnees, options = {}) => {
  try {
    const notification = await Notification.create(donnees);

    // Émettre via Socket.io
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      io.to(`user_${donnees.destinataire}`).emit('notification:nouvelle', notification);
    } catch (e) {
      // Socket.io pas initialisé
    }

    // Envoyer par email si demandé
    if (options.envoyerEmail && options.emailTemplate) {
      const user = await User.findById(donnees.destinataire);
      if (user && user.notificationsEmail) {
        await mailService.envoyerEmail({
          to: user.email,
          subject: donnees.titre,
          html: options.emailTemplate
        });
        notification.emailEnvoye = true;
        notification.dateEmailEnvoi = new Date();
        await notification.save();
      }
    }

    logger.info('Notification créée', {
      destinataire: donnees.destinataire,
      type: donnees.type
    });

    return notification;
  } catch (error) {
    logger.error('Erreur création notification', { error: error.message });
    throw error;
  }
};

const notifierNouvelleDemande = async (technicienId, demande) => {
  return creerNotification({
    destinataire: technicienId,
    type: 'nouvelle_demande',
    titre: 'Nouvelle demande correspondant à votre profil',
    message: `${demande.titre} - Catégorie : ${demande.categorie}`,
    icone: 'bell',
    couleur: 'info',
    priorite: demande.urgence === 'urgente' ? 'urgente' : 'normale',
    action: {
      label: 'Voir la demande',
      url: `/technicien/demandes/${demande._id}`
    },
    refModel: 'Demande',
    refId: demande._id
  });
};

const notifierNouvelleOffre = async (clientId, offre, demande) => {
  return creerNotification({
    destinataire: clientId,
    type: 'nouvelle_offre',
    titre: 'Nouvelle offre reçue',
    message: `Une offre de ${offre.prix} ${offre.devise} a été soumise pour "${demande.titre}"`,
    icone: 'gift',
    couleur: 'info',
    priorite: 'normale',
    action: {
      label: 'Voir les offres',
      url: `/demandes/${demande._id}/offres`
    },
    refModel: 'Demande',
    refId: demande._id
  });
};

const notifierOffreAcceptee = async (technicienId, demande) => {
  return creerNotification({
    destinataire: technicienId,
    type: 'offre_acceptee',
    titre: '🎉 Votre offre a été acceptée',
    message: `Félicitations ! Vous avez été sélectionné pour "${demande.titre}"`,
    icone: 'check-circle',
    couleur: 'success',
    priorite: 'haute',
    action: {
      label: 'Voir la mission',
      url: `/technicien/missions`
    },
    refModel: 'Demande',
    refId: demande._id
  });
};

const notifierOffreRefusee = async (technicienId, demande) => {
  return creerNotification({
    destinataire: technicienId,
    type: 'offre_refusee',
    titre: 'Votre offre n\'a pas été retenue',
    message: `Votre offre pour "${demande.titre}" n'a pas été sélectionnée`,
    icone: 'x-circle',
    couleur: 'warning',
    priorite: 'basse',
    refModel: 'Demande',
    refId: demande._id
  });
};

const notifierMissionAssignee = async (technicienId, mission) => {
  return creerNotification({
    destinataire: technicienId,
    type: 'mission_assignee',
    titre: 'Mission assignée',
    message: `Vous avez une nouvelle mission : "${mission.titre}"`,
    icone: 'briefcase',
    couleur: 'info',
    priorite: 'haute',
    action: {
      label: 'Voir la mission',
      url: `/technicien/missions/${mission._id}`
    },
    refModel: 'Mission',
    refId: mission._id
  });
};

const notifierMissionTerminee = async (userId, mission) => {
  return creerNotification({
    destinataire: userId,
    type: 'mission_terminee',
    titre: 'Mission terminée',
    message: `La mission "${mission.titre}" a été marquée comme terminée`,
    icone: 'check',
    couleur: 'success',
    priorite: 'normale',
    action: {
      label: 'Voir la mission',
      url: `/missions/${mission._id}`
    },
    refModel: 'Mission',
    refId: mission._id
  });
};

const notifierNouveauMessage = async (destinataireId, expediteur, contenu, missionId) => {
  const extrait = contenu.length > 100 ? contenu.substring(0, 100) + '...' : contenu;

  return creerNotification({
    destinataire: destinataireId,
    type: 'nouveau_message',
    titre: `Message de ${expediteur.prenom} ${expediteur.nom}`,
    message: extrait,
    icone: 'message-circle',
    couleur: 'info',
    priorite: 'normale',
    action: {
      label: 'Répondre',
      url: `/missions/${missionId}/messages`
    },
    refModel: 'Mission',
    refId: missionId
  });
};

const notifierNouvelAvis = async (technicienId, avis) => {
  return creerNotification({
    destinataire: technicienId,
    type: 'nouvel_avis',
    titre: `Nouvel avis ${avis.note}/5 ⭐`,
    message: avis.commentaire.substring(0, 150),
    icone: 'star',
    couleur: avis.note >= 4 ? 'success' : avis.note >= 3 ? 'info' : 'warning',
    priorite: 'normale',
    action: {
      label: 'Voir l\'avis',
      url: `/technicien/avis`
    },
    refModel: 'Avis',
    refId: avis._id
  });
};

const notifierKYCValide = async (userId, typeKYC = 'technicien') => {
  return creerNotification({
    destinataire: userId,
    type: 'kyc_valide',
    titre: '✅ Identité vérifiée',
    message: 'Vos documents ont été validés avec succès',
    icone: 'shield-check',
    couleur: 'success',
    priorite: 'haute'
  });
};

const notifierKYCRejete = async (userId, raison) => {
  return creerNotification({
    destinataire: userId,
    type: 'kyc_rejete',
    titre: '⚠️ Documents rejetés',
    message: `Raison : ${raison}`,
    icone: 'alert-triangle',
    couleur: 'danger',
    priorite: 'haute',
    action: {
      label: 'Soumettre à nouveau',
      url: '/profil/kyc'
    }
  });
};

const notifierAbonnementExpireBientot = async (entrepriseId, joursRestants) => {
  return creerNotification({
    destinataire: entrepriseId,
    type: 'abonnement_expire_bientot',
    titre: 'Votre abonnement expire bientôt',
    message: `Il vous reste ${joursRestants} jour(s) d'abonnement`,
    icone: 'clock',
    couleur: 'warning',
    priorite: 'haute',
    action: {
      label: 'Renouveler',
      url: '/entreprise/abonnement'
    }
  });
};

const notifierAbonnementExpire = async (entrepriseId) => {
  return creerNotification({
    destinataire: entrepriseId,
    type: 'abonnement_expire',
    titre: 'Votre abonnement a expiré',
    message: 'Renouvelez votre abonnement pour continuer à accéder à l\'annuaire',
    icone: 'x-circle',
    couleur: 'danger',
    priorite: 'urgente',
    action: {
      label: 'Renouveler',
      url: '/entreprise/abonnement'
    }
  });
};

const notifierLitigeOuvert = async (userId, litige) => {
  return creerNotification({
    destinataire: userId,
    type: 'litige_ouvert',
    titre: '⚖️ Litige ouvert',
    message: `Un litige a été ouvert pour la mission concernée`,
    icone: 'scale',
    couleur: 'warning',
    priorite: 'haute',
    action: {
      label: 'Voir le litige',
      url: `/litiges/${litige._id}`
    },
    refModel: 'Litige',
    refId: litige._id
  });
};

const notifierLitigeResolu = async (userId, litige) => {
  return creerNotification({
    destinataire: userId,
    type: 'litige_resolu',
    titre: '✅ Litige résolu',
    message: `Le litige a été résolu : ${litige.resolution}`,
    icone: 'check-circle',
    couleur: 'success',
    priorite: 'haute',
    action: {
      label: 'Voir les détails',
      url: `/litiges/${litige._id}`
    },
    refModel: 'Litige',
    refId: litige._id
  });
};

const notifierCompteSuspendu = async (userId, raison) => {
  return creerNotification({
    destinataire: userId,
    type: 'compte_suspendu',
    titre: '🚫 Compte suspendu',
    message: `Raison : ${raison}`,
    icone: 'ban',
    couleur: 'danger',
    priorite: 'urgente'
  });
};

const notifierCompteReactive = async (userId) => {
  return creerNotification({
    destinataire: userId,
    type: 'compte_reactive',
    titre: '✅ Compte réactivé',
    message: 'Votre compte a été réactivé. Vous pouvez à nouveau utiliser la plateforme.',
    icone: 'check-circle',
    couleur: 'success',
    priorite: 'haute'
  });
};

const notifierPaiementRecu = async (userId, paiement) => {
  return creerNotification({
    destinataire: userId,
    type: 'paiement_recu',
    titre: '💰 Paiement reçu',
    message: `Vous avez reçu un paiement de ${paiement.montant} ${paiement.devise}`,
    icone: 'dollar-sign',
    couleur: 'success',
    priorite: 'haute',
    refModel: 'Paiement',
    refId: paiement._id
  });
};

const envoyerNotificationGroupee = async (userIds, donnees) => {
  const notifications = [];
  for (const userId of userIds) {
    const notif = await creerNotification({
      ...donnees,
      destinataire: userId
    });
    notifications.push(notif);
  }
  return notifications;
};

const nettoyerNotificationsAnciennes = async (joursConservation = 90) => {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() - joursConservation);

  const resultat = await Notification.deleteMany({
    lu: true,
    createdAt: { $lt: dateLimite }
  });

  logger.info('Notifications nettoyées', { nombre: resultat.deletedCount });
  return resultat.deletedCount;
};

module.exports = {
  creerNotification,
  notifierNouvelleDemande,
  notifierNouvelleOffre,
  notifierOffreAcceptee,
  notifierOffreRefusee,
  notifierMissionAssignee,
  notifierMissionTerminee,
  notifierNouveauMessage,
  notifierNouvelAvis,
  notifierKYCValide,
  notifierKYCRejete,
  notifierAbonnementExpireBientot,
  notifierAbonnementExpire,
  notifierLitigeOuvert,
  notifierLitigeResolu,
  notifierCompteSuspendu,
  notifierCompteReactive,
  notifierPaiementRecu,
  envoyerNotificationGroupee,
  nettoyerNotificationsAnciennes
};
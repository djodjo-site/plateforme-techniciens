// server/services/mailService.js
const transporter = require('../config/mailer');
const { logger } = require('../utils/logger');

const templateBase = (contenu) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #1e40af; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #1e40af; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .info-box { background: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0; }
    .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
    .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .danger-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇨🇩 Plateforme Techniciens</h1>
    </div>
    <div class="content">
      ${contenu}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Plateforme Nationale de Techniciens Informatique</p>
      <p>Cet email vous a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
`;

const envoyerEmail = async ({ to, subject, html, text = null, attachments = [] }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || '"Plateforme Techniciens" <noreply@plateforme.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
      attachments
    });

    logger.info('Email envoyé', { to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Erreur envoi email', { to, subject, error: error.message });
    return { success: false, error: error.message };
  }
};

const envoyerVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verifier-email/${token}`;

  const html = templateBase(`
    <h2>Bienvenue ${user.prenom} !</h2>
    <p>Merci de vous être inscrit sur la Plateforme Nationale de Techniciens Informatique.</p>
    <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
    <p style="text-align: center;"><a href="${url}" class="button">Vérifier mon email</a></p>
    <div class="info-box">
      <p><strong>Lien de vérification :</strong></p>
      <p style="word-break: break-all; font-size: 12px;">${url}</p>
    </div>
    <p>Ce lien expire dans 24 heures.</p>
    <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
  `);

  return envoyerEmail({
    to: user.email,
    subject: 'Vérifiez votre adresse email',
    html
  });
};

const envoyerResetMotDePasse = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const html = templateBase(`
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour ${user.prenom},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
    <p style="text-align: center;"><a href="${url}" class="button">Réinitialiser mon mot de passe</a></p>
    <div class="warning-box">
      <p><strong>Ce lien expire dans 1 heure.</strong></p>
    </div>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et votre mot de passe restera inchangé.</p>
  `);

  return envoyerEmail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html
  });
};

const envoyerConfirmationTestReussi = async (technicien, score) => {
  const html = templateBase(`
    <h2>🎉 Félicitations ${technicien.prenom} !</h2>
    <p>Vous avez réussi le test de certification avec un score de <strong>${score}%</strong>.</p>
    <div class="success-box">
      <p><strong>Prochaine étape :</strong> Procédez au paiement de votre accréditation pour recevoir votre NINTI.</p>
    </div>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/technicien/payer-accreditation" class="button">
        Payer mon accréditation
      </a>
    </p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: '🎉 Test réussi - Passez à l\'étape suivante',
    html
  });
};

const envoyerConfirmationTestEchoue = async (technicien, score, heuresRestantes) => {
  const html = templateBase(`
    <h2>Résultat de votre test</h2>
    <p>Bonjour ${technicien.prenom},</p>
    <p>Malheureusement, votre score de <strong>${score}%</strong> n'atteint pas le seuil requis de 60%.</p>
    <div class="warning-box">
      <p>Vous pourrez repasser le test dans <strong>${heuresRestantes} heure(s)</strong>.</p>
    </div>
    <p>Nous vous encourageons à réviser et à retenter votre chance. Bon courage !</p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: 'Résultat de votre test de certification',
    html
  });
};

const envoyerConfirmationNINTI = async (technicien, ninti) => {
  const dateExpiration = new Date(ninti.dateExpiration).toLocaleDateString('fr-FR');

  const html = templateBase(`
    <h2>🎊 Votre NINTI est actif !</h2>
    <p>Bonjour ${technicien.prenom},</p>
    <p>Votre paiement a été confirmé et votre NINTI a été délivré avec succès.</p>
    <div class="success-box" style="text-align: center;">
      <p style="font-size: 24px; font-weight: bold; color: #16a34a; margin: 10px 0;">${ninti.numero}</p>
      <p>Valable jusqu'au <strong>${dateExpiration}</strong></p>
    </div>
    <p>Vous pouvez désormais :</p>
    <ul>
      <li>Recevoir des demandes d'intervention</li>
      <li>Soumettre des offres sur les missions</li>
      <li>Apparaître dans l'annuaire B2B des entreprises</li>
      <li>Recevoir des paiements sécurisés</li>
    </ul>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/technicien/dashboard" class="button">
        Accéder à mon espace
      </a>
    </p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: '🎊 Votre NINTI est actif',
    html
  });
};

const envoyerRenouvellementNINTI = async (technicien, ninti) => {
  const dateExpiration = new Date(ninti.dateExpiration).toLocaleDateString('fr-FR');

  const html = templateBase(`
    <h2>✅ NINTI renouvelé avec succès</h2>
    <p>Bonjour ${technicien.prenom},</p>
    <p>Votre NINTI a été renouvelé avec succès.</p>
    <div class="success-box">
      <p><strong>Nouveau numéro :</strong> ${ninti.numero}</p>
      <p><strong>Valable jusqu'au :</strong> ${dateExpiration}</p>
    </div>
    <p>Vous pouvez continuer à exercer sans interruption.</p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: 'NINTI renouvelé avec succès',
    html
  });
};

const envoyerAlerteExpirationNINTI = async (technicien, ninti, joursRestants) => {
  const dateExpiration = new Date(ninti.dateExpiration).toLocaleDateString('fr-FR');

  const html = templateBase(`
    <h2>⚠️ Votre NINTI expire bientôt</h2>
    <p>Bonjour ${technicien.prenom},</p>
    <div class="warning-box">
      <p>Votre NINTI <strong>${ninti.numero}</strong> expirera le <strong>${dateExpiration}</strong>.</p>
      <p>Il vous reste <strong>${joursRestants} jour(s)</strong>.</p>
    </div>
    <p>Pour éviter toute interruption de service, nous vous invitons à le renouveler dès maintenant.</p>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/technicien/renouveler-ninti" class="button">
        Renouveler mon NINTI
      </a>
    </p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: `⚠️ Votre NINTI expire dans ${joursRestants} jour(s)`,
    html
  });
};

const envoyerConfirmationAbonnement = async (entreprise, abonnement) => {
  const dateFin = new Date(abonnement.dateFin).toLocaleDateString('fr-FR');

  const html = templateBase(`
    <h2>✅ Abonnement activé</h2>
    <p>Bonjour,</p>
    <p>Votre abonnement pour <strong>${entreprise.raisonSociale}</strong> a été activé avec succès.</p>
    <div class="success-box">
      <p><strong>Type :</strong> ${abonnement.type === 'annuel' ? 'Annuel' : 'Mensuel'}</p>
      <p><strong>Date de début :</strong> ${new Date(abonnement.dateDebut).toLocaleDateString('fr-FR')}</p>
      <p><strong>Date de fin :</strong> ${dateFin}</p>
    </div>
    <p>Vous avez maintenant accès à :</p>
    <ul>
      <li>L'annuaire complet des techniciens certifiés</li>
      <li>Les recherches par compétence et localisation</li>
      <li>Le contact direct avec les techniciens</li>
    </ul>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/entreprise/annuaire" class="button">
        Accéder à l'annuaire
      </a>
    </p>
  `);

  return envoyerEmail({
    to: entreprise.email,
    subject: 'Votre abonnement Entreprise est actif',
    html
  });
};

const envoyerConfirmationPaiement = async (user, paiement) => {
  const html = templateBase(`
    <h2>Confirmation de paiement</h2>
    <p>Bonjour ${user.prenom},</p>
    <p>Nous confirmons la réception de votre paiement.</p>
    <div class="info-box">
      <p><strong>Référence :</strong> ${paiement.reference}</p>
      <p><strong>Montant :</strong> ${paiement.montant} ${paiement.devise}</p>
      <p><strong>Date :</strong> ${new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}</p>
      <p><strong>Type :</strong> ${paiement.type}</p>
    </div>
    <p>Merci de votre confiance.</p>
  `);

  return envoyerEmail({
    to: user.email,
    subject: 'Confirmation de votre paiement',
    html
  });
};

const envoyerNouvelleDemande = async (technicien, demande) => {
  const html = templateBase(`
    <h2>🔔 Nouvelle demande d'intervention</h2>
    <p>Bonjour ${technicien.prenom},</p>
    <p>Une nouvelle demande correspond à vos compétences :</p>
    <div class="info-box">
      <p><strong>Titre :</strong> ${demande.titre}</p>
      <p><strong>Catégorie :</strong> ${demande.categorie}</p>
      <p><strong>Urgence :</strong> ${demande.urgence}</p>
      <p><strong>Ville :</strong> ${demande.localisation?.ville || 'Non précisée'}</p>
    </div>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/technicien/demandes/${demande._id}" class="button">
        Voir la demande
      </a>
    </p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: '🔔 Nouvelle demande d\'intervention',
    html
  });
};

const envoyerNouveauMessage = async (destinataire, expediteur, contenu, missionId) => {
  const html = templateBase(`
    <h2>💬 Nouveau message</h2>
    <p>Bonjour ${destinataire.prenom},</p>
    <p>Vous avez reçu un nouveau message de <strong>${expediteur.prenom} ${expediteur.nom}</strong> :</p>
    <div class="info-box">
      <p>${contenu}</p>
    </div>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/missions/${missionId}/messages" class="button">
        Répondre
      </a>
    </p>
  `);

  return envoyerEmail({
    to: destinataire.email,
    subject: '💬 Nouveau message',
    html
  });
};

const envoyerKYCValide = async (user, typeKYC = 'technicien') => {
  const html = templateBase(`
    <h2>✅ Identité vérifiée</h2>
    <p>Bonjour ${user.prenom},</p>
    <p>Vos documents d'identité ont été vérifiés et validés avec succès.</p>
    <div class="success-box">
      <p>Votre compte est maintenant pleinement vérifié.</p>
    </div>
    ${typeKYC === 'technicien' ? `
      <p>Vous pouvez désormais apparaître dans l'annuaire des entreprises et recevoir des missions.</p>
    ` : `
      <p>Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.</p>
    `}
  `);

  return envoyerEmail({
    to: user.email,
    subject: '✅ Votre identité a été vérifiée',
    html
  });
};

const envoyerKYCRejete = async (user, raison) => {
  const html = templateBase(`
    <h2>⚠️ Documents rejetés</h2>
    <p>Bonjour ${user.prenom},</p>
    <p>Vos documents d'identité n'ont pas pu être validés.</p>
    <div class="danger-box">
      <p><strong>Raison :</strong> ${raison}</p>
    </div>
    <p>Veuillez soumettre de nouveaux documents conformes.</p>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/profil/kyc" class="button">
        Soumettre de nouveaux documents
      </a>
    </p>
  `);

  return envoyerEmail({
    to: user.email,
    subject: '⚠️ Vos documents ont été rejetés',
    html
  });
};

const envoyerSuspensionCompte = async (user, raison) => {
  const html = templateBase(`
    <h2>🚫 Compte suspendu</h2>
    <p>Bonjour ${user.prenom},</p>
    <p>Votre compte a été suspendu.</p>
    <div class="danger-box">
      <p><strong>Raison :</strong> ${raison}</p>
    </div>
    <p>Pour toute contestation, veuillez contacter l'administration.</p>
  `);

  return envoyerEmail({
    to: user.email,
    subject: '🚫 Votre compte a été suspendu',
    html
  });
};

const envoyerLitigeOuvert = async (destinataire, litige) => {
  const html = templateBase(`
    <h2>⚖️ Litige ouvert</h2>
    <p>Bonjour ${destinataire.prenom},</p>
    <p>Un litige a été ouvert concernant la mission :</p>
    <div class="warning-box">
      <p><strong>Motif :</strong> ${litige.motif}</p>
      <p><strong>Description :</strong> ${litige.description}</p>
    </div>
    <p>Un administrateur va examiner la situation et vous contactera prochainement.</p>
  `);

  return envoyerEmail({
    to: destinataire.email,
    subject: '⚖️ Un litige a été ouvert',
    html
  });
};

const envoyerNouvelAvis = async (technicien, avis) => {
  const html = templateBase(`
    <h2>⭐ Nouvel avis reçu</h2>
    <p>Bonjour ${technicien.prenom},</p>
    <p>Vous avez reçu un nouvel avis de <strong>${avis.note}/5 étoiles</strong>.</p>
    <div class="info-box">
      <p>${avis.commentaire}</p>
    </div>
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/technicien/avis" class="button">
        Voir tous mes avis
      </a>
    </p>
  `);

  return envoyerEmail({
    to: technicien.email,
    subject: `⭐ Nouvel avis ${avis.note}/5`,
    html
  });
};

module.exports = {
  envoyerEmail,
  envoyerVerificationEmail,
  envoyerResetMotDePasse,
  envoyerConfirmationTestReussi,
  envoyerConfirmationTestEchoue,
  envoyerConfirmationNINTI,
  envoyerRenouvellementNINTI,
  envoyerAlerteExpirationNINTI,
  envoyerConfirmationAbonnement,
  envoyerConfirmationPaiement,
  envoyerNouvelleDemande,
  envoyerNouveauMessage,
  envoyerKYCValide,
  envoyerKYCRejete,
  envoyerSuspensionCompte,
  envoyerLitigeOuvert,
  envoyerNouvelAvis
};
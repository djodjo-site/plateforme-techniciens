// server/config/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

// Vérification de la configuration au démarrage (en développement)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️  Configuration email invalide :', error.message);
    } else {
      console.log('✅ Serveur email prêt');
    }
  });
}

module.exports = transporter;
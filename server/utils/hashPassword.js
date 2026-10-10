// server/utils/hashPassword.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

const hasherMotDePasse = async (motDePasse) => {
  if (!motDePasse || typeof motDePasse !== 'string') {
    throw new Error('Mot de passe invalide');
  }

  if (motDePasse.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères');
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(motDePasse, salt);
};

const comparerMotDePasse = async (motDePasseSaisi, motDePasseHashe) => {
  if (!motDePasseSaisi || !motDePasseHashe) return false;
  return await bcrypt.compare(motDePasseSaisi, motDePasseHashe);
};

const validerForceMotDePasse = (motDePasse) => {
  const erreurs = [];

  if (!motDePasse || motDePasse.length < 8) {
    erreurs.push('Au moins 8 caractères');
  }
  if (!/[a-z]/.test(motDePasse)) {
    erreurs.push('Au moins une minuscule');
  }
  if (!/[A-Z]/.test(motDePasse)) {
    erreurs.push('Au moins une majuscule');
  }
  if (!/[0-9]/.test(motDePasse)) {
    erreurs.push('Au moins un chiffre');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(motDePasse)) {
    erreurs.push('Au moins un caractère spécial');
  }

  if (erreurs.length === 0) {
    return { valide: true, force: 'forte', score: 5 };
  }

  let score = 5 - erreurs.length;
  let force = 'faible';
  if (score >= 4) force = 'forte';
  else if (score >= 3) force = 'moyenne';

  return { valide: false, force, score, erreurs };
};

const genererMotDePasseTemporaire = (longueur = 12) => {
  const minuscules = 'abcdefghijklmnopqrstuvwxyz';
  const majuscules = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chiffres = '0123456789';
  const speciaux = '!@#$%^&*';
  const tous = minuscules + majuscules + chiffres + speciaux;

  let motDePasse = '';
  motDePasse += minuscules[crypto.randomInt(0, minuscules.length)];
  motDePasse += majuscules[crypto.randomInt(0, majuscules.length)];
  motDePasse += chiffres[crypto.randomInt(0, chiffres.length)];
  motDePasse += speciaux[crypto.randomInt(0, speciaux.length)];

  for (let i = motDePasse.length; i < longueur; i++) {
    motDePasse += tous[crypto.randomInt(0, tous.length)];
  }

  return motDePasse
    .split('')
    .sort(() => crypto.randomInt(0, 3) - 1)
    .join('');
};

const hasherDonnee = (donnee) => {
  return crypto.createHash('sha256').update(donnee).digest('hex');
};

const genererTokenAleatoire = (taille = 32) => {
  return crypto.randomBytes(taille).toString('hex');
};

const hmacSignature = (donnee, secret) => {
  return crypto.createHmac('sha256', secret).update(donnee).digest('hex');
};

module.exports = {
  hasherMotDePasse,
  comparerMotDePasse,
  validerForceMotDePasse,
  genererMotDePasseTemporaire,
  hasherDonnee,
  genererTokenAleatoire,
  hmacSignature
};
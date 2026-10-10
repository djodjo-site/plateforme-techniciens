// server/utils/generateNINTI.js
const NINTI = require('../models/NINTI');

const CODES_PAYS = {
  'Congo': 'COD',
  'RDC': 'COD',
  'Cameroun': 'CMR',
  'Gabon': 'GAB',
  'Sénégal': 'SEN',
  "Côte d'Ivoire": 'CIV',
  'Bénin': 'BEN',
  'Togo': 'TGO',
  'Burkina Faso': 'BFA',
  'Mali': 'MLI',
  'Niger': 'NER',
  'Tchad': 'TCD',
  'RCA': 'CAF'
};

const formaterNumeroNINTI = (annee, codePays, sequence) => {
  const codePaysMaj = codePays.toUpperCase();
  const sequenceFormatee = String(sequence).padStart(5, '0');
  return `NINTI-${annee}-${codePaysMaj}-${sequenceFormatee}`;
};

const extraireComposantsNINTI = (numero) => {
  const regex = /^NINTI-(\d{4})-([A-Z]{3})-(\d{5})$/;
  const match = numero.match(regex);

  if (!match) {
    throw new Error(`Format NINTI invalide : ${numero}`);
  }

  return {
    annee: parseInt(match[1], 10),
    codePays: match[2],
    sequence: parseInt(match[3], 10)
  };
};

const validerFormatNINTI = (numero) => {
  if (!numero) return false;
  return /^NINTI-\d{4}-[A-Z]{3}-\d{5}$/.test(numero);
};

const obtenirCodePays = (nomPays) => {
  return CODES_PAYS[nomPays] || 'XXX';
};

const genererNumeroNINTI = async (codePays = 'COD') => {
  const annee = new Date().getFullYear();
  const codePaysMaj = codePays.toUpperCase();

  const dernier = await NINTI.findOne({
    annee,
    codePays: codePaysMaj
  }).sort({ sequence: -1 });

  const nouvelleSequence = dernier ? dernier.sequence + 1 : 1;

  return {
    numero: formaterNumeroNINTI(annee, codePaysMaj, nouvelleSequence),
    annee,
    codePays: codePaysMaj,
    sequence: nouvelleSequence
  };
};

const genererQRCodeData = (numero) => {
  const baseUrl = process.env.CLIENT_URL || 'https://plateforme-techniciens.com';
  return `${baseUrl}/verifier/${numero}`;
};

const calculerDateExpiration = (dateDelivrance, dureeMois = 12) => {
  const expiration = new Date(dateDelivrance);
  expiration.setMonth(expiration.getMonth() + dureeMois);
  return expiration;
};

const joursRestantsNINTI = (dateExpiration) => {
  const diff = new Date(dateExpiration).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const estNINTIValide = (numero, statut, dateExpiration) => {
  if (!validerFormatNINTI(numero)) return false;
  if (statut !== 'actif') return false;
  return new Date(dateExpiration) > new Date();
};

const formaterNINTIPourAffichage = (numero) => {
  if (!validerFormatNINTI(numero)) return numero;
  const { annee, codePays, sequence } = extraireComposantsNINTI(numero);
  return {
    numero,
    annee,
    codePays,
    sequence: String(sequence).padStart(5, '0'),
    affichage: `N° ${annee}/${codePays}/${String(sequence).padStart(5, '0')}`
  };
};

const genererCodeVerification = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

module.exports = {
  formaterNumeroNINTI,
  extraireComposantsNINTI,
  validerFormatNINTI,
  obtenirCodePays,
  genererNumeroNINTI,
  genererQRCodeData,
  calculerDateExpiration,
  joursRestantsNINTI,
  estNINTIValide,
  formaterNINTIPourAffichage,
  genererCodeVerification,
  CODES_PAYS
};
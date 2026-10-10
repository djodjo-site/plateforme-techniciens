// server/utils/helpers.js
const mongoose = require('mongoose');

const estObjetIdValide = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const genererReference = (prefixe = 'REF') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefixe}-${timestamp}-${random}`;
};

const formaterMontant = (montant, devise = 'XAF') => {
  const symboles = { XAF: 'FCFA', USD: '$', EUR: '€', CDF: 'FC' };
  const montantFormate = new Intl.NumberFormat('fr-FR').format(montant);
  return `${montantFormate} ${symboles[devise] || devise}`;
};

const calculerDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const paginer = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum
  };
};

const formatReponsePaginee = (donnees, total, page, limit) => {
  return {
    success: true,
    donnees,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      aSuivant: page < Math.ceil(total / limit),
      aPrecedent: page > 1
    }
  };
};

const nettoyerObjet = (obj) => {
  const nettoye = {};
  Object.keys(obj).forEach((cle) => {
    if (obj[cle] !== undefined && obj[cle] !== null && obj[cle] !== '') {
      nettoye[cle] = obj[cle];
    }
  });
  return nettoye;
};

const masquerEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domaine] = email.split('@');
  const localMasque =
    local.length <= 2
      ? local[0] + '*'
      : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${localMasque}@${domaine}`;
};

const masquerTelephone = (telephone) => {
  if (!telephone) return telephone;
  const visible = telephone.slice(-4);
  const masque = '*'.repeat(Math.max(0, telephone.length - 4));
  return `${masque}${visible}`;
};

const slugify = (texte) => {
  return texte
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const truncate = (texte, longueur = 100) => {
  if (!texte) return '';
  if (texte.length <= longueur) return texte;
  return texte.substring(0, longueur - 3) + '...';
};

const dateRelative = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);

  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (heures < 24) return `il y a ${heures} h`;
  if (jours < 7) return `il y a ${jours} j`;
  return new Date(date).toLocaleDateString('fr-FR');
};

const ajouterJours = (date, jours) => {
  const nouvelleDate = new Date(date);
  nouvelleDate.setDate(nouvelleDate.getDate() + jours);
  return nouvelleDate;
};

const ajouterMois = (date, mois) => {
  const nouvelleDate = new Date(date);
  nouvelleDate.setMonth(nouvelleDate.getMonth() + mois);
  return nouvelleDate;
};

const debutJournee = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const finJournee = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const estDansIntervalle = (date, debut, fin) => {
  const d = new Date(date);
  return d >= new Date(debut) && d <= new Date(fin);
};

const genererCodeOTP = (longueur = 6) => {
  const crypto = require('crypto');
  let code = '';
  for (let i = 0; i < longueur; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
};

const calculerCommission = (montant, taux = 10) => {
  const commission = Math.round((montant * taux) / 100);
  return {
    montant,
    taux,
    commission,
    montantNet: montant - commission
  };
};

const grouperPar = (tableau, cle) => {
  return tableau.reduce((acc, item) => {
    const groupe = item[cle];
    if (!acc[groupe]) acc[groupe] = [];
    acc[groupe].push(item);
    return acc;
  }, {});
};

const supprimerDoublons = (tableau, cle = null) => {
  if (!cle) return [...new Set(tableau)];
  const vus = new Set();
  return tableau.filter((item) => {
    const valeur = item[cle];
    if (vus.has(valeur)) return false;
    vus.add(valeur);
    return true;
  });
};

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const reessayer = async (fn, tentatives = 3, delaiMs = 1000) => {
  for (let i = 0; i < tentatives; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === tentatives - 1) throw error;
      await attendre(delaiMs * Math.pow(2, i));
    }
  }
};

const validerEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validerTelephone = (telephone) => {
  return /^\+?[0-9]{8,15}$/.test(telephone);
};

const validerURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const convertirEnNombre = (valeur, defaut = 0) => {
  const nombre = parseFloat(valeur);
  return isNaN(nombre) ? defaut : nombre;
};

const convertirEnBooleen = (valeur) => {
  if (typeof valeur === 'boolean') return valeur;
  if (typeof valeur === 'string') {
    return ['true', '1', 'oui', 'yes', 'vrai'].includes(valeur.toLowerCase());
  }
  return Boolean(valeur);
};

const genererCouleurAleatoire = () => {
  const couleurs = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  return couleurs[Math.floor(Math.random() * couleurs.length)];
};

const obtenirInitiales = (nom, prenom) => {
  const n = nom ? nom.charAt(0).toUpperCase() : '';
  const p = prenom ? prenom.charAt(0).toUpperCase() : '';
  return `${p}${n}`;
};

const formaterNomComplet = (user) => {
  if (!user) return '';
  return `${user.prenom || ''} ${user.nom || ''}`.trim();
};

const echapperRegex = (texte) => {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  estObjetIdValide,
  genererReference,
  formaterMontant,
  calculerDistanceKm,
  paginer,
  formatReponsePaginee,
  nettoyerObjet,
  masquerEmail,
  masquerTelephone,
  slugify,
  truncate,
  dateRelative,
  ajouterJours,
  ajouterMois,
  debutJournee,
  finJournee,
  estDansIntervalle,
  genererCodeOTP,
  calculerCommission,
  grouperPar,
  supprimerDoublons,
  attendre,
  reessayer,
  validerEmail,
  validerTelephone,
  validerURL,
  convertirEnNombre,
  convertirEnBooleen,
  genererCouleurAleatoire,
  obtenirInitiales,
  formaterNomComplet,
  echapperRegex
};
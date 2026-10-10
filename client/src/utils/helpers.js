// client/src/utils/helpers.js

/**
 * Normalise un utilisateur retourné par l'API
 * - role en minuscule (contre le comportement Mongoose discriminator)
 * - champs standards
 */
export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: user.role?.toLowerCase() || 'particulier'
  };
};

/**
 * Formate un montant avec devise
 */
export const formatMontant = (montant, devise = 'XAF') => {
  const symboles = { XAF: 'FCFA', USD: '$', EUR: '€', CDF: 'FC' };
  const montantFormate = new Intl.NumberFormat('fr-FR').format(montant || 0);
  return `${montantFormate} ${symboles[devise] || devise}`;
};

/**
 * Formate une date en français (JJ/MM/AAAA)
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate une date + heure
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Temps relatif ("il y a 5 min")
 */
export const dateRelative = (date) => {
  if (!date) return '-';
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);

  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (heures < 24) return `il y a ${heures} h`;
  if (jours < 7) return `il y a ${jours} j`;
  return formatDate(date);
};

/**
 * Retourne les initiales d'un utilisateur
 */
export const getInitiales = (user) => {
  if (!user) return '?';
  const p = user.prenom?.[0] || '';
  const n = user.nom?.[0] || '';
  return `${p}${n}`.toUpperCase() || '?';
};

/**
 * Tronque un texte
 */
export const truncate = (texte, longueur = 100) => {
  if (!texte) return '';
  if (texte.length <= longueur) return texte;
  return texte.substring(0, longueur - 3) + '...';
};

/**
 * Construit une URL d'image (uploads)
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};
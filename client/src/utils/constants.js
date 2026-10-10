// client/src/utils/constants.js

// ============================================================
// RÔLES
// ============================================================
export const ROLES = {
  TECHNICIEN: 'technicien',
  ENTREPRISE: 'entreprise',
  PARTICULIER: 'particulier',
  ADMIN: 'admin'
};

// ============================================================
// STATUTS TECHNICIEN
// ============================================================
export const STATUTS_TECHNICIEN = {
  EN_ATTENTE_DE_TEST: 'en_attente_de_test',
  TEST_ECHOUE: 'test_echoue',
  TEST_REUSSI: 'test_reussi',
  EN_ATTENTE_PAIEMENT: 'en_attente_paiement',
  NINTI_ACTIF: 'ninti_actif',
  SUSPENDU: 'suspendu',
  INACTIF: 'inactif'
};

export const STATUTS_TECHNICIEN_LABELS = {
  en_attente_de_test: { label: 'En attente de test', couleur: 'info' },
  test_echoue: { label: 'Test échoué', couleur: 'danger' },
  test_reussi: { label: 'Test réussi', couleur: 'success' },
  en_attente_paiement: { label: 'En attente de paiement', couleur: 'warning' },
  ninti_actif: { label: 'NINTI Actif', couleur: 'success' },
  suspendu: { label: 'Suspendu', couleur: 'danger' },
  inactif: { label: 'Inactif', couleur: 'neutral' }
};

// ============================================================
// STATUTS ENTREPRISE
// ============================================================
export const STATUTS_ENTREPRISE = {
  EN_ATTENTE_VALIDATION: 'en_attente_validation',
  ACTIF: 'actif',
  SUSPENDU: 'suspendu'
};

// ============================================================
// STATUTS DEMANDE
// ============================================================
export const STATUTS_DEMANDE = {
  OUVERTE: 'ouverte',
  EN_COURS: 'en_cours',
  ATTRIBUEE: 'attribuee',
  TERMINEE: 'terminee',
  ANNULEE: 'annulee'
};

export const STATUTS_DEMANDE_LABELS = {
  ouverte: { label: 'Ouverte', couleur: 'info' },
  en_cours: { label: 'En cours', couleur: 'warning' },
  attribuee: { label: 'Attribuée', couleur: 'success' },
  terminee: { label: 'Terminée', couleur: 'success' },
  annulee: { label: 'Annulée', couleur: 'danger' }
};

// ============================================================
// STATUTS MISSION
// ============================================================
export const STATUTS_MISSION = {
  EN_ATTENTE: 'en_attente',
  ACCEPTEE: 'acceptee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
  ANNULEE: 'annulee',
  LITIGE: 'litige'
};

export const STATUTS_MISSION_LABELS = {
  en_attente: { label: 'En attente', couleur: 'warning' },
  acceptee: { label: 'Acceptée', couleur: 'info' },
  en_cours: { label: 'En cours', couleur: 'warning' },
  terminee: { label: 'Terminée', couleur: 'success' },
  annulee: { label: 'Annulée', couleur: 'danger' },
  litige: { label: 'Litige', couleur: 'danger' }
};

// ============================================================
// STATUTS PAIEMENT
// ============================================================
export const STATUTS_PAIEMENT = {
  EN_ATTENTE: 'en_attente',
  REUSSI: 'reussi',
  ECHOUE: 'echoue',
  REMBOURSE: 'rembourse'
};

// ============================================================
// TYPES DE PAIEMENT
// ============================================================
export const TYPES_PAIEMENT = {
  ACCREDITATION_NINTI: 'accreditation_ninti',
  ABONNEMENT_ENTREPRISE: 'abonnement_entreprise',
  COMMISSION_MISSION: 'commission_mission'
};

export const TYPES_PAIEMENT_LABELS = {
  accreditation_ninti: 'Accréditation NINTI',
  abonnement_entreprise: 'Abonnement Entreprise',
  commission_mission: 'Paiement Mission'
};

// ============================================================
// CATÉGORIES DE COMPÉTENCES
// ============================================================
export const CATEGORIES_COMPETENCES = [
  'Réseaux',
  'Sécurité informatique',
  'Développement web',
  'Développement mobile',
  'Cloud computing',
  'Maintenance matérielle',
  'Support utilisateur',
  'Base de données',
  "Systèmes d'exploitation",
  'Cybersécurité'
];

// ============================================================
// URGENCE
// ============================================================
export const URGENCE = {
  BASSE: 'basse',
  NORMALE: 'normale',
  HAUTE: 'haute',
  URGENTE: 'urgente'
};

export const URGENCE_LABELS = {
  basse: { label: 'Basse', couleur: 'neutral' },
  normale: { label: 'Normale', couleur: 'info' },
  haute: { label: 'Haute', couleur: 'warning' },
  urgente: { label: 'Urgente', couleur: 'danger' }
};

// ============================================================
// DEVISES
// ============================================================
export const DEVISES = [
  { code: 'XAF', label: 'FCFA', symbole: 'FCFA' },
  { code: 'CDF', label: 'Franc congolais', symbole: 'FC' },
  { code: 'USD', label: 'Dollar US', symbole: '$' },
  { code: 'EUR', label: 'Euro', symbole: '€' }
];

// ============================================================
// CONFIGURATION TEST
// ============================================================
export const TEST_CONFIG = {
  SEUIL_REUSSITE: 60,
  DUREE_MINUTES: 30,
  NB_QUESTIONS: 40,
  DELAI_REPASSAGE_HEURES: 48
};

// ============================================================
// CONFIGURATION NINTI
// ============================================================
export const NINTI_CONFIG = {
  PRIX_ACCREDITATION: 50000,
  DEVISE: 'XAF',
  DUREE_VALIDITE_MOIS: 12,
  PREFIXE: 'NINTI'
};

// ============================================================
// PAGINATION
// ============================================================
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================================
// NIVEAUX ADMIN
// ============================================================
export const NIVEAUX_ADMIN = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATEUR: 'moderateur',
  SUPPORT: 'support'
};

export const NIVEAUX_ADMIN_LABELS = {
  super_admin: { label: 'Super Admin', couleur: 'danger' },
  admin: { label: 'Administrateur', couleur: 'primary' },
  moderateur: { label: 'Modérateur', couleur: 'warning' },
  support: { label: 'Support', couleur: 'info' }
};
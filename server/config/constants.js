// server/config/constants.js

module.exports = {
  // Rôles utilisateurs
  ROLES: {
    TECHNICIEN: 'technicien',
    ENTREPRISE: 'entreprise',
    PARTICULIER: 'particulier',
    ADMIN: 'admin'
  },

  // Statuts du technicien (workflow)
  STATUTS_TECHNICIEN: {
    EN_ATTENTE_DE_TEST: 'en_attente_de_test',
    TEST_ECHOUE: 'test_echoue',
    TEST_REUSSI: 'test_reussi',
    EN_ATTENTE_PAIEMENT: 'en_attente_paiement',
    NINTI_ACTIF: 'ninti_actif',
    SUSPENDU: 'suspendu',
    INACTIF: 'inactif'
  },

  // Statuts de l'entreprise
  STATUTS_ENTREPRISE: {
    EN_ATTENTE_VALIDATION: 'en_attente_validation',
    ACTIF: 'actif',
    SUSPENDU: 'suspendu'
  },

  // Statuts des demandes d'intervention
  STATUTS_DEMANDE: {
    OUVERTE: 'ouverte',
    EN_COURS: 'en_cours',
    ATTRIBUEE: 'attribuee',
    TERMINEE: 'terminee',
    ANNULEE: 'annulee'
  },

  // Statuts des missions
  STATUTS_MISSION: {
    EN_ATTENTE: 'en_attente',
    ACCEPTEE: 'acceptee',
    EN_COURS: 'en_cours',
    TERMINEE: 'terminee',
    ANNULEE: 'annulee',
    LITIGE: 'litige'
  },

  // Statuts des paiements
  STATUTS_PAIEMENT: {
    EN_ATTENTE: 'en_attente',
    REUSSI: 'reussi',
    ECHOUE: 'echoue',
    REMBOURSE: 'rembourse'
  },

  // Types de paiement
  TYPES_PAIEMENT: {
    ACCREDITATION_NINTI: 'accreditation_ninti',
    ABONNEMENT_ENTREPRISE: 'abonnement_entreprise',
    COMMISSION_MISSION: 'commission_mission'
  },

  // Types d'abonnement entreprise
  TYPES_ABONNEMENT: {
    MENSUEL: 'mensuel',
    ANNUEL: 'annuel'
  },

  // Catégories de compétences
  CATEGORIES_COMPETENCES: [
    'Réseaux',
    'Sécurité informatique',
    'Développement web',
    'Développement mobile',
    'Cloud computing',
    'Maintenance matérielle',
    'Support utilisateur',
    'Base de données',
    'Systèmes d\'exploitation',
    'Cybersécurité'
  ],

  // Configuration du test
  TEST: {
    SEUIL_REUSSITE: 60,          // en pourcentage
    DUREE_MINUTES: 30,
    NB_QUESTIONS: 40,
    DELAI_REPASSAGE_HEURES: 48,
    MAX_TENTATIVES: 5
  },

  // Configuration NINTI
  NINTI: {
    PRIX_ACCREDITATION: 50000,   // en FCFA
    DEVISE: 'XAF',
    DUREE_VALIDITE_MOIS: 12,
    PREFIXE: 'NINTI'
  }
};
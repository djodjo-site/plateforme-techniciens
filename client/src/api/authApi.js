// client/src/api/authApi.js
import {
  apiGet,
  apiPost,
  apiPut,
  apiUpload
} from './axiosClient.js';

// ============================================================
// AUTHENTIFICATION
// ============================================================

/**
 * Inscription
 * @param {Object} data - { email, motDePasse, nom, prenom, telephone, role, ...extra }
 */
export const inscription = async (data) => {
  const response = await apiPost('/auth/inscription', data);
  return response.data;
};

/**
 * Connexion
 * @param {Object} data - { email, motDePasse }
 */
export const connexion = async (data) => {
  const response = await apiPost('/auth/connexion', data);
  return response.data;
};

/**
 * Déconnexion
 */
export const deconnexion = async () => {
  const response = await apiPost('/auth/deconnexion');
  return response.data;
};

// ============================================================
// PROFIL
// ============================================================

/**
 * Récupérer le profil connecté
 */
export const getProfil = async () => {
  const response = await apiGet('/auth/profil');
  return response.data;
};

/**
 * Mettre à jour le profil
 * @param {Object} data - { nom, prenom, telephone, ville, adresse, ... }
 */
export const updateProfil = async (data) => {
  const response = await apiPut('/auth/profil', data);
  return response.data;
};

/**
 * Upload photo de profil
 * @param {File} file
 * @param {Function} onProgress - (percent) => {}
 */
export const uploadPhotoProfil = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await apiUpload('/auth/profil/photo', formData, onProgress);
  return response.data;
};

// ============================================================
// VÉRIFICATION EMAIL
// ============================================================

/**
 * Vérifier l'email avec un token
 * @param {string} token
 */
export const verifierEmail = async (token) => {
  const response = await apiGet(`/auth/verifier-email/${token}`);
  return response.data;
};

/**
 * Renvoyer l'email de vérification
 */
export const renvoyerVerification = async () => {
  const response = await apiPost('/auth/renvoyer-verification');
  return response.data;
};

// ============================================================
// MOT DE PASSE
// ============================================================

/**
 * Demander la réinitialisation du mot de passe
 * @param {string} email
 */
export const motDePasseOublie = async (email) => {
  const response = await apiPost('/auth/mot-de-passe-oublie', { email });
  return response.data;
};

/**
 * Réinitialiser le mot de passe
 * @param {string} token
 * @param {string} motDePasse
 */
export const resetMotDePasse = async (token, motDePasse) => {
  const response = await apiPut(`/auth/reset-mot-de-passe/${token}`, { motDePasse });
  return response.data;
};

/**
 * Changer le mot de passe (connecté)
 * @param {Object} data - { ancienMotDePasse, nouveauMotDePasse }
 */
export const changerMotDePasse = async (data) => {
  const response = await apiPut('/auth/changer-mot-de-passe', data);
  return response.data;
};

// ============================================================
// VÉRIFICATIONS DISPONIBILITÉ
// ============================================================

/**
 * Vérifier si un email est disponible
 * @param {string} email
 */
export const verifierEmailDisponible = async (email) => {
  const response = await apiGet('/auth/verifier-email-disponible', {
    params: { email }
  });
  return response.data;
};

/**
 * Vérifier si un téléphone est disponible
 * @param {string} telephone
 */
export const verifierTelephoneDisponible = async (telephone) => {
  const response = await apiGet('/auth/verifier-telephone-disponible', {
    params: { telephone }
  });
  return response.data;
};
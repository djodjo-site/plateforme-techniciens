// client/src/api/technicienApi.js
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './axiosClient.js';

// ============================================================
// PROFIL
// ============================================================

export const getProfil = async () => {
  const response = await apiGet('/techniciens/profil');
  return response.data;
};

export const updateProfil = async (data) => {
  const response = await apiPut('/techniciens/profil', data);
  return response.data;
};

export const updateDisponibilite = async (data) => {
  const response = await apiPut('/techniciens/disponibilite', data);
  return response.data;
};

export const updatePosition = async (longitude, latitude) => {
  const response = await apiPut('/techniciens/position', { longitude, latitude });
  return response.data;
};

// ============================================================
// CERTIFICATIONS & DIPLÔMES
// ============================================================

export const ajouterCertification = async (data) => {
  const response = await apiPost('/techniciens/certifications', data);
  return response.data;
};

export const supprimerCertification = async (certId) => {
  const response = await apiDelete(`/techniciens/certifications/${certId}`);
  return response.data;
};

export const ajouterDiplome = async (data) => {
  const response = await apiPost('/techniciens/diplomes', data);
  return response.data;
};

export const supprimerDiplome = async (diplomeId) => {
  const response = await apiDelete(`/techniciens/diplomes/${diplomeId}`);
  return response.data;
};

// ============================================================
// KYC
// ============================================================

export const soumettreKYC = async (formData, onProgress = null) => {
  const response = await apiUpload('/techniciens/kyc', formData, onProgress);
  return response.data;
};

// ============================================================
// STATISTIQUES & HISTORIQUE
// ============================================================

export const getStatistiques = async () => {
  const response = await apiGet('/techniciens/statistiques');
  return response.data;
};

export const getMesMissions = async (params = {}) => {
  const response = await apiGet('/techniciens/missions', { params });
  return response.data;
};

export const getMesAvis = async (params = {}) => {
  const response = await apiGet('/techniciens/avis', { params });
  return response.data;
};

export const repondreAvis = async (avisId, contenu) => {
  const response = await apiPost(`/techniciens/avis/${avisId}/repondre`, { contenu });
  return response.data;
};

// ============================================================
// NINTI
// ============================================================

export const getMonNINTI = async () => {
  const response = await apiGet('/techniciens/ninti');
  return response.data;
};

// ============================================================
// TESTS
// ============================================================

export const getMesTests = async () => {
  const response = await apiGet('/techniciens/tests');
  return response.data;
};

// ============================================================
// DEMANDES DISPONIBLES
// ============================================================

export const getDemandesDisponibles = async (params = {}) => {
  const response = await apiGet('/techniciens/demandes-disponibles', { params });
  return response.data;
};

// ============================================================
// PROFIL PUBLIC
// ============================================================

export const getProfilPublic = async (id) => {
  const response = await apiGet(`/techniciens/public/${id}`);
  return response.data;
};
// client/src/api/entrepriseApi.js
import { apiGet, apiPost, apiPut, apiUpload } from './axiosClient.js';

// ============================================================
// PROFIL
// ============================================================

export const getProfil = async () => {
  const response = await apiGet('/entreprises/profil');
  return response.data;
};

export const updateProfil = async (data) => {
  const response = await apiPut('/entreprises/profil', data);
  return response.data;
};

export const uploadLogo = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await apiUpload('/entreprises/logo', formData, onProgress);
  return response.data;
};

// ============================================================
// DOCUMENTS LÉGAUX (KYC)
// ============================================================

export const soumettreDocumentsLegaux = async (formData, onProgress = null) => {
  const response = await apiUpload('/entreprises/documents-legaux', formData, onProgress);
  return response.data;
};

// ============================================================
// CONTACTS
// ============================================================

export const ajouterContact = async (data) => {
  const response = await apiPost('/entreprises/contacts', data);
  return response.data;
};

export const supprimerContact = async (contactId) => {
  const response = await apiPut(`/entreprises/contacts/${contactId}`);
  return response.data;
};

// ============================================================
// ABONNEMENT
// ============================================================

export const getMonAbonnement = async () => {
  const response = await apiGet('/entreprises/abonnement');
  return response.data;
};

export const souscrireAbonnement = async (type = 'mensuel') => {
  const response = await apiPost('/entreprises/abonnement/souscrire', { type });
  return response.data;
};

export const annulerAbonnement = async (raison) => {
  const response = await apiPost('/entreprises/abonnement/annuler', { raison });
  return response.data;
};

// ============================================================
// FAVORIS
// ============================================================

export const ajouterFavori = async (technicienId, note = null) => {
  const response = await apiPost(`/entreprises/favoris/${technicienId}`, { note });
  return response.data;
};

export const retirerFavori = async (technicienId) => {
  const response = await apiPost(`/entreprises/favoris/${technicienId}/retirer`);
  return response.data;
};

export const getMesFavoris = async () => {
  const response = await apiGet('/entreprises/favoris');
  return response.data;
};

// ============================================================
// MISSIONS & STATS
// ============================================================

export const getMesMissions = async (params = {}) => {
  const response = await apiGet('/entreprises/missions', { params });
  return response.data;
};

export const getMesStatistiques = async () => {
  const response = await apiGet('/entreprises/statistiques');
  return response.data;
};

export const getMesPaiements = async () => {
  const response = await apiGet('/entreprises/paiements');
  return response.data;
};
// client/src/api/avisApi.js
import { apiGet, apiPost, apiPut, apiDelete } from './axiosClient.js';

// ============================================================
// LECTURE
// ============================================================

export const getAvisTechnicien = async (technicienId, params = {}) => {
  const response = await apiGet(`/avis/technicien/${technicienId}`, { params });
  return response.data;
};

export const getMesAvis = async () => {
  const response = await apiGet('/avis/mes-avis');
  return response.data;
};

export const getAvis = async (id) => {
  const response = await apiGet(`/avis/${id}`);
  return response.data;
};

// ============================================================
// CRÉATION / MODIFICATION
// ============================================================

export const creerAvis = async (data) => {
  const response = await apiPost('/avis', data);
  return response.data;
};

export const modifierAvis = async (id, data) => {
  const response = await apiPut(`/avis/${id}`, data);
  return response.data;
};

export const supprimerAvis = async (id) => {
  const response = await apiDelete(`/avis/${id}`);
  return response.data;
};

// ============================================================
// INTERACTIONS
// ============================================================

export const signalerAvis = async (id, raison) => {
  const response = await apiPost(`/avis/${id}/signaler`, { raison });
  return response.data;
};

export const marquerUtile = async (id) => {
  const response = await apiPost(`/avis/${id}/utile`);
  return response.data;
};
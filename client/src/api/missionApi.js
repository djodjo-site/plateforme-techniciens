// client/src/api/missionApi.js
import { apiGet, apiPost, apiPut, apiUpload } from './axiosClient.js';

// ============================================================
// LECTURE
// ============================================================

export const getMesMissions = async (params = {}) => {
  const response = await apiGet('/missions', { params });
  return response.data;
};

export const getMissionsActives = async () => {
  const response = await apiGet('/missions/actives');
  return response.data;
};

export const getMission = async (id) => {
  const response = await apiGet(`/missions/${id}`);
  return response.data;
};

// ============================================================
// CYCLE DE VIE
// ============================================================

export const demarrerMission = async (id) => {
  const response = await apiPost(`/missions/${id}/demarrer`);
  return response.data;
};

export const confirmerDemarrage = async (id, otpCode) => {
  const response = await apiPost(`/missions/${id}/confirmer-demarrage`, { otpCode });
  return response.data;
};

export const terminerMission = async (id) => {
  const response = await apiPost(`/missions/${id}/terminer`);
  return response.data;
};

export const confirmerFin = async (id, otpCode) => {
  const response = await apiPost(`/missions/${id}/confirmer-fin`, { otpCode });
  return response.data;
};

export const annulerMission = async (id, raison, penalite = 0) => {
  const response = await apiPut(`/missions/${id}/annuler`, { raison, penalite });
  return response.data;
};

// ============================================================
// PREUVES
// ============================================================

export const ajouterPreuve = async (id, type, fichier, description = '') => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('description', description);
  if (fichier) formData.append('preuves', fichier);

  const response = await apiUpload(`/missions/${id}/preuves`, formData);
  return response.data;
};

// ============================================================
// LITIGES
// ============================================================

export const ouvrirLitige = async (id, motif, description) => {
  const response = await apiPost(`/missions/${id}/litige`, { motif, description });
  return response.data;
};
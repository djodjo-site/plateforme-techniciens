// client/src/api/annuaireApi.js
import { apiGet, apiPost } from './axiosClient.js';

// ============================================================
// RECHERCHE
// ============================================================

export const rechercherTechniciens = async (params = {}) => {
  const response = await apiGet('/annuaire/rechercher', { params });
  return response.data;
};

export const getFicheTechnicien = async (id) => {
  const response = await apiGet(`/annuaire/technicien/${id}`);
  return response.data;
};

export const contacterTechnicien = async (technicienId, message) => {
  const response = await apiPost('/annuaire/contacter', { technicienId, message });
  return response.data;
};

// ============================================================
// STATISTIQUES PUBLIQUES
// ============================================================

export const getStatistiquesPubliques = async () => {
  const response = await apiGet('/annuaire/statistiques-publiques');
  return response.data;
};

export const getCategories = async () => {
  const response = await apiGet('/annuaire/categories');
  return response.data;
};

export const getTopTechniciens = async (limit = 10) => {
  const response = await apiGet(`/annuaire/top?limit=${limit}`);
  return response.data;
};
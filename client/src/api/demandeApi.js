// client/src/api/demandeApi.js
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './axiosClient.js';

// ============================================================
// CRÉATION
// ============================================================

export const creerDemande = async (donnees, fichiers = null, onProgress = null) => {
  if (fichiers && fichiers.length > 0) {
    const formData = new FormData();
    Object.keys(donnees).forEach((key) => {
      if (typeof donnees[key] === 'object') {
        formData.append(key, JSON.stringify(donnees[key]));
      } else {
        formData.append(key, donnees[key]);
      }
    });
    fichiers.forEach((f) => formData.append('fichiers', f));

    const response = await apiUpload('/demandes', formData, onProgress);
    return response.data;
  }

  const response = await apiPost('/demandes', donnees);
  return response.data;
};

// ============================================================
// LECTURE
// ============================================================

export const getMesDemandes = async (params = {}) => {
  const response = await apiGet('/demandes/mes-demandes', { params });
  return response.data;
};

export const getDemandesPourMoi = async (params = {}) => {
  const response = await apiGet('/demandes/pour-moi', { params });
  return response.data;
};

export const getDemande = async (id) => {
  const response = await apiGet(`/demandes/${id}`);
  return response.data;
};

// ============================================================
// MISE À JOUR
// ============================================================

export const updateDemande = async (id, donnees) => {
  const response = await apiPut(`/demandes/${id}`, donnees);
  return response.data;
};

export const annulerDemande = async (id, raison) => {
  const response = await apiDelete(`/demandes/${id}`, { data: { raison } });
  return response.data;
};

// ============================================================
// OFFRES
// ============================================================

export const soumettreOffre = async (demandeId, offre) => {
  const response = await apiPost(`/demandes/${demandeId}/offres`, offre);
  return response.data;
};

export const accepterOffre = async (demandeId, offreId) => {
  const response = await apiPut(`/demandes/${demandeId}/offres/${offreId}/accepter`);
  return response.data;
};

export const refuserOffre = async (demandeId, offreId) => {
  const response = await apiPut(`/demandes/${demandeId}/offres/${offreId}/refuser`);
  return response.data;
};

export const retirerOffre = async (demandeId, offreId) => {
  const response = await apiDelete(`/demandes/${demandeId}/offres/${offreId}`);
  return response.data;
};

export const getMesOffres = async () => {
  const response = await apiGet('/demandes/mes-offres');
  return response.data;
};
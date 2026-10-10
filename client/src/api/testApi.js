// client/src/api/testApi.js
import { apiGet, apiPost } from './axiosClient.js';

// ============================================================
// ÉLIGIBILITÉ
// ============================================================

export const getEligibilite = async () => {
  const response = await apiGet('/test/eligibilite');
  return response.data;
};

// ============================================================
// DÉMARRAGE
// ============================================================

export const demarrerTest = async () => {
  const response = await apiPost('/test/demarrer');
  return response.data;
};

// ============================================================
// SOUMISSION
// ============================================================

export const soumettreTest = async (testId, reponses, securite = {}) => {
  const response = await apiPost('/test/soumettre', {
    testId,
    reponses,
    securite
  });
  return response.data;
};

// ============================================================
// RÉSULTAT
// ============================================================

export const getResultat = async (testId) => {
  const response = await apiGet(`/test/${testId}`);
  return response.data;
};

export const getHistorique = async () => {
  const response = await apiGet('/test/historique');
  return response.data;
};

// ============================================================
// SAUVEGARDE TEMPORAIRE
// ============================================================

export const sauvegarderTemporaire = async (testId, donnees) => {
  const response = await apiPost(`/test/${testId}/sauvegarder`, donnees);
  return response.data;
};

// ============================================================
// INCIDENT (anti-triche)
// ============================================================

export const signalerIncident = async (testId, type, details = null) => {
  const response = await apiPost('/test/incident', { testId, type, details });
  return response.data;
};
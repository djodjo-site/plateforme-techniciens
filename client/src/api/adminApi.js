// client/src/api/adminApi.js
import { apiGet, apiPost, apiPut, apiDelete } from './axiosClient.js';

// ============================================================
// DASHBOARD & STATISTIQUES
// ============================================================

/**
 * Récupérer les KPIs principaux du dashboard
 */
export const getDashboard = async () => {
  const response = await apiGet('/admin/dashboard');
  return response.data;
};

/**
 * Récupérer les statistiques détaillées
 */
export const getStatistiques = async () => {
  const response = await apiGet('/admin/statistiques');
  return response.data;
};

/**
 * Récupérer les actions récentes de l'admin connecté
 */
export const getMesActions = async () => {
  const response = await apiGet('/admin/mes-actions');
  return response.data;
};

// ============================================================
// TECHNICIENS
// ============================================================

/**
 * Lister tous les techniciens (avec filtres + pagination)
 */
export const getTechniciens = async (params = {}) => {
  const response = await apiGet('/admin/techniciens', { params });
  return response.data;
};

/**
 * Détail d'un technicien
 */
export const getTechnicien = async (id) => {
  const response = await apiGet(`/admin/techniciens/${id}`);
  return response.data;
};

/**
 * Valider le KYC d'un technicien
 */
export const validerKYC = async (id) => {
  const response = await apiPut(`/admin/techniciens/${id}/kyc/valider`);
  return response.data;
};

/**
 * Rejeter le KYC d'un technicien
 */
export const rejeterKYC = async (id, raison) => {
  const response = await apiPut(`/admin/techniciens/${id}/kyc/rejeter`, { raison });
  return response.data;
};

/**
 * Suspendre un technicien
 */
export const suspendreTechnicien = async (id, raison) => {
  const response = await apiPut(`/admin/techniciens/${id}/suspendre`, { raison });
  return response.data;
};

/**
 * Réactiver un technicien
 */
export const reactiverTechnicien = async (id) => {
  const response = await apiPut(`/admin/techniciens/${id}/reactiver`);
  return response.data;
};

// ============================================================
// ENTREPRISES
// ============================================================

export const getEntreprises = async (params = {}) => {
  const response = await apiGet('/admin/entreprises', { params });
  return response.data;
};

export const validerEntreprise = async (id) => {
  const response = await apiPut(`/admin/entreprises/${id}/valider`);
  return response.data;
};

export const rejeterEntreprise = async (id) => {
  const response = await apiPut(`/admin/entreprises/${id}/rejeter`);
  return response.data;
};

export const suspendreEntreprise = async (id, raison) => {
  const response = await apiPut(`/admin/entreprises/${id}/suspendre`, { raison });
  return response.data;
};

// ============================================================
// QUESTIONS (TEST DE CERTIFICATION)
// ============================================================

export const getQuestions = async (params = {}) => {
  const response = await apiGet('/admin/questions', { params });
  return response.data;
};

export const creerQuestion = async (data) => {
  const response = await apiPost('/admin/questions', data);
  return response.data;
};

export const modifierQuestion = async (id, data) => {
  const response = await apiPut(`/admin/questions/${id}`, data);
  return response.data;
};

export const supprimerQuestion = async (id) => {
  const response = await apiDelete(`/admin/questions/${id}`);
  return response.data;
};

// ============================================================
// NINTI
// ============================================================

export const getNINTIs = async (params = {}) => {
  const response = await apiGet('/admin/nintis', { params });
  return response.data;
};

export const revoquerNINTI = async (numero, raison) => {
  const response = await apiPut(`/admin/nintis/${numero}/revoquer`, { raison });
  return response.data;
};

// ============================================================
// LITIGES
// ============================================================

export const getLitiges = async (params = {}) => {
  const response = await apiGet('/admin/litiges', { params });
  return response.data;
};

export const getLitige = async (id) => {
  const response = await apiGet(`/admin/litiges/${id}`);
  return response.data;
};

export const assignerLitige = async (id, adminId = null) => {
  const response = await apiPut(`/admin/litiges/${id}/assigner`, { adminId });
  return response.data;
};

export const rendreDecisionLitige = async (id, decision) => {
  const response = await apiPut(`/admin/litiges/${id}/decision`, decision);
  return response.data;
};
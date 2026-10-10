// client/src/api/messageApi.js
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './axiosClient.js';

// ============================================================
// ENVOI
// ============================================================

export const envoyerMessage = async (destinataire, contenu, mission = null, fichier = null) => {
  if (fichier) {
    const formData = new FormData();
    formData.append('destinataire', destinataire);
    formData.append('contenu', contenu);
    if (mission) formData.append('mission', mission);
    formData.append('documents', fichier);

    const response = await apiUpload('/messages', formData);
    return response.data;
  }

  const response = await apiPost('/messages', { destinataire, contenu, mission });
  return response.data;
};

// ============================================================
// LECTURE
// ============================================================

export const getConversations = async () => {
  const response = await apiGet('/messages/conversations');
  return response.data;
};

export const getConversation = async (userId, missionId = null, limite = 50) => {
  const url = missionId
    ? `/messages/conversation/${userId}/${missionId}?limite=${limite}`
    : `/messages/conversation/${userId}?limite=${limite}`;
  const response = await apiGet(url);
  return response.data;
};

export const getMessagesNonLus = async () => {
  const response = await apiGet('/messages/non-lus');
  return response.data;
};

// ============================================================
// MARQUAGE
// ============================================================

export const marquerConversationLue = async (userId, missionId = null) => {
  const url = missionId
    ? `/messages/conversation/${userId}/${missionId}/lire`
    : `/messages/conversation/${userId}/lire`;
  const response = await apiPut(url);
  return response.data;
};

// ============================================================
// SUPPRESSION / SIGNALEMENT
// ============================================================

export const supprimerMessage = async (id) => {
  const response = await apiDelete(`/messages/${id}`);
  return response.data;
};

export const signalerMessage = async (id, raison) => {
  const response = await apiPost(`/messages/${id}/signaler`, { raison });
  return response.data;
};
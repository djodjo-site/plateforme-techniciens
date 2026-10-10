// client/src/api/axiosClient.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================================
// INSTANCE AXIOS
// ============================================================
const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// ============================================================
// INTERCEPTEUR REQUÊTE : Ajouter le token JWT
// ============================================================
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// INTERCEPTEUR RÉPONSE : Gérer les erreurs globales
// ============================================================
axiosClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Erreur réseau
    if (!error.response) {
      console.error('❌ Erreur réseau :', error.message);
      return Promise.reject({
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
        code: 'NETWORK_ERROR'
      });
    }

    const { status, data } = error.response;

    // 401 : Non authentifié → déconnexion
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Éviter la boucle infinie sur les routes d'auth
      const isAuthRoute = originalRequest.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Rediriger vers connexion si pas déjà sur une page publique
        const publicPaths = ['/', '/connexion', '/inscription', '/verifier'];
        const currentPath = window.location.pathname;
        const isPublic = publicPaths.some((p) => currentPath.startsWith(p));

        if (!isPublic) {
          window.location.href = '/connexion';
        }
      }
    }

    // 403 : Accès refusé
    if (status === 403) {
      console.warn('⛔ Accès refusé :', data?.message);
    }

    // 500+ : Erreur serveur
    if (status >= 500) {
      console.error('🔥 Erreur serveur :', data?.message || error.message);
    }

    // Normaliser la réponse d'erreur
    return Promise.reject({
      message: data?.message || 'Une erreur est survenue',
      status,
      erreurs: data?.erreurs || null,
      code: data?.code || null
    });
  }
);

// ============================================================
// MÉTHODES HELPER
// ============================================================
export const apiGet = (url, config = {}) => axiosClient.get(url, config);
export const apiPost = (url, data = {}, config = {}) => axiosClient.post(url, data, config);
export const apiPut = (url, data = {}, config = {}) => axiosClient.put(url, data, config);
export const apiPatch = (url, data = {}, config = {}) => axiosClient.patch(url, data, config);
export const apiDelete = (url, config = {}) => axiosClient.delete(url, config);

// Upload de fichier
export const apiUpload = (url, formData, onProgress = null, config = {}) => {
  return axiosClient.post(url, formData, {
    ...config,
    headers: {
      ...config.headers,
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
      ? (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      : undefined
  });
};

export default axiosClient;
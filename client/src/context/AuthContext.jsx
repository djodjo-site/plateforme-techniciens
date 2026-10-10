// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import {
  setCredentials,
  updateUser as updateUserAction,
  logout as logoutAction,
  setLoading,
  setError,
  clearError
} from '../redux/slices/authSlice.js';

import * as authApi from '../api/authApi.js';
import { normalizeUser } from '../utils/helpers.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  const [initialized, setInitialized] = useState(false);

  // ============================================================
  // INITIALISATION : charger l'utilisateur depuis le token
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');

      // Pas de token → considéré comme initialisé immédiatement
      if (!storedToken) {
        if (!cancelled) setInitialized(true);
        return;
      }

      try {
        dispatch(setLoading(true));
        const data = await authApi.getProfil();

        if (cancelled) return;

        if (data.success && data.user) {
          dispatch(
            setCredentials({
              user: normalizeUser(data.user),
              token: storedToken
            })
          );
        } else {
          // Réponse invalide → nettoyer
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch(logoutAction());
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('Session expirée ou invalide :', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(logoutAction());
      } finally {
        if (!cancelled) {
          dispatch(setLoading(false));
          setInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // ============================================================
  // CONNEXION
  // ============================================================
  const login = useCallback(
    async (email, motDePasse) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const data = await authApi.connexion({ email, motDePasse });

        if (data.success && data.token && data.user) {
          const userNormalise = normalizeUser(data.user);

          dispatch(
            setCredentials({
              user: userNormalise,
              token: data.token
            })
          );

          toast.success(`Bienvenue ${userNormalise.prenom} !`);
          return { success: true, user: userNormalise };
        }

        throw new Error('Réponse invalide du serveur');
      } catch (err) {
        const message = err.message || 'Erreur de connexion';
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // ============================================================
  // INSCRIPTION
  // ============================================================
  const register = useCallback(
    async (donnees) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const data = await authApi.inscription(donnees);

        if (data.success && data.token && data.user) {
          const userNormalise = normalizeUser(data.user);

          dispatch(
            setCredentials({
              user: userNormalise,
              token: data.token
            })
          );

          toast.success('Inscription réussie ! Vérifiez votre email.');
          return { success: true, user: userNormalise };
        }

        throw new Error('Réponse invalide du serveur');
      } catch (err) {
        const message = err.message || 'Erreur d\'inscription';
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // ============================================================
  // DÉCONNEXION
  // ============================================================
  const logout = useCallback(async () => {
    try {
      await authApi.deconnexion();
    } catch (err) {
      console.warn('Erreur déconnexion serveur :', err.message);
    } finally {
      dispatch(logoutAction());
      toast.success('Déconnexion réussie');
    }
  }, [dispatch]);

  // ============================================================
  // MISE À JOUR PROFIL
  // ============================================================
  const updateProfil = useCallback(
    async (data) => {
      try {
        const response = await authApi.updateProfil(data);

        if (response.success && response.user) {
          dispatch(updateUserAction(normalizeUser(response.user)));
          toast.success('Profil mis à jour');
          return { success: true, user: normalizeUser(response.user) };
        }

        throw new Error('Réponse invalide');
      } catch (err) {
        const message = err.message || 'Erreur de mise à jour';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [dispatch]
  );

  // ============================================================
  // UPLOAD PHOTO
  // ============================================================
  const uploadPhoto = useCallback(
    async (file, onProgress = null) => {
      try {
        const response = await authApi.uploadPhotoProfil(file, onProgress);

        if (response.success && response.user) {
          dispatch(updateUserAction(normalizeUser(response.user)));
          toast.success('Photo mise à jour');
          return { success: true, photo: response.photo };
        }

        throw new Error('Réponse invalide');
      } catch (err) {
        const message = err.message || 'Erreur d\'upload';
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [dispatch]
  );

  // ============================================================
  // VÉRIFICATION RÔLES (insensible à la casse)
  // ============================================================
  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      const userRole = user.role?.toLowerCase();
      return roles.map((r) => r.toLowerCase()).includes(userRole);
    },
    [user]
  );

  const isAdmin = useCallback(
    () => user?.role?.toLowerCase() === 'admin',
    [user]
  );
  const isTechnicien = useCallback(
    () => user?.role?.toLowerCase() === 'technicien',
    [user]
  );
  const isEntreprise = useCallback(
    () => user?.role?.toLowerCase() === 'entreprise',
    [user]
  );
  const isParticulier = useCallback(
    () => user?.role?.toLowerCase() === 'particulier',
    [user]
  );

  // ============================================================
  // VALEUR DU CONTEXTE
  // ============================================================
  const value = {
    // État
    user,
    token,
    isAuthenticated,
    loading,
    error,
    initialized,

    // Actions
    login,
    register,
    logout,
    updateProfil,
    uploadPhoto,

    // Helpers
    hasRole,
    isAdmin,
    isTechnicien,
    isEntreprise,
    isParticulier
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
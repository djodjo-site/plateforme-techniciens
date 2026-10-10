// client/src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Loader from '../components/common/Loader.jsx';

export default function ProtectedRoute({ roles = null, redirectTo = '/connexion' }) {
  const location = useLocation();
  const { user, isAuthenticated, initialized } = useAuth();

  // 1. Attendre la fin de l'initialisation (vérification du token)
  if (!initialized) {
    return <Loader fullScreen text="Vérification de la session..." />;
  }

  // 2. Non connecté → redirection vers connexion
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. Rôles spécifiques requis
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center px-4 max-w-md">
          <h1 className="text-6xl font-bold text-danger-600 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
            Accès refusé
          </h2>
          <p className="text-neutral-500 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
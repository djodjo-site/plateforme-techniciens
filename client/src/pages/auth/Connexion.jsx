// client/src/pages/auth/Connexion.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

// ============================================================
// SCHÉMA DE VALIDATION
// ============================================================
const connexionSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est obligatoire')
    .email('Email invalide'),
  motDePasse: z
    .string()
    .min(1, 'Le mot de passe est obligatoire')
});

export default function Connexion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(connexionSchema),
    defaultValues: {
      email: '',
      motDePasse: ''
    }
  });

  const onSubmit = async (data) => {
    const resultat = await login(data.email, data.motDePasse);

    if (resultat.success) {
      const user = resultat.user;

      // Rediriger selon le rôle
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      const dashboards = {
        technicien: '/technicien/dashboard',
        entreprise: '/entreprise/dashboard',
        particulier: '/particulier/dashboard',
        admin: '/admin/dashboard'
      };

      navigate(dashboards[user.role] || '/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header minimal */}
      <div className="p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl mb-4">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Connexion
            </h1>
            <p className="text-neutral-500 mt-2">
              Accédez à votre espace personnel
            </p>
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                icon={Mail}
                error={errors.email?.message}
                required
                autoComplete="email"
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.motDePasse?.message}
                  required
                  autoComplete="current-password"
                  {...register('motDePasse')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  Se souvenir de moi
                </label>

                <Link
                  to="/mot-de-passe-oublie"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                fullWidth
              >
                Se connecter
              </Button>
            </form>

            {/* Séparateur */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-neutral-500">
                  Pas encore de compte ?
                </span>
              </div>
            </div>

            {/* Liens inscription */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/inscription/technicien">
                <Button variant="outline" size="sm" fullWidth>
                  Technicien
                </Button>
              </Link>
              <Link to="/inscription/entreprise">
                <Button variant="outline" size="sm" fullWidth>
                  Entreprise
                </Button>
              </Link>
            </div>

            <p className="text-center text-sm text-neutral-500 mt-4">
              Vous êtes un particulier ?{' '}
              <Link
                to="/inscription"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Inscrivez-vous ici
              </Link>
            </p>
          </div>

          {/* Compte de démo */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-semibold text-blue-900 mb-1">
              🔑 Compte de démonstration
            </p>
            <p className="text-xs text-blue-700">
              <strong>Email :</strong> admin@plateforme-techniciens.com
            </p>
            <p className="text-xs text-blue-700">
              <strong>Mot de passe :</strong> SuperAdmin2025!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
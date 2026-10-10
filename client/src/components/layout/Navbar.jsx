// client/src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Menu, X, Bell, LogOut, User, Settings, ChevronDown, Search
} from 'lucide-react';

import { logout as logoutAction } from '../../redux/slices/authSlice.js';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { nonLues } = useSelector((state) => state.notifications);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const links = {
      technicien: '/technicien/dashboard',
      entreprise: '/entreprise/dashboard',
      particulier: '/particulier/dashboard',
      admin: '/admin/dashboard'
    };
    return links[user.role] || '/';
  };

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-neutral-900 leading-tight">
                Plateforme
              </p>
              <p className="text-xs text-neutral-500 leading-tight">
                Techniciens
              </p>
            </div>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors">
              Accueil
            </Link>
            <Link to="/annuaire" className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors">
              Annuaire
            </Link>
            <Link to="/verifier" className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors">
              Vérifier NINTI
            </Link>
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-neutral-600" />
                  {nonLues > 0 && (
                    <span className="absolute top-1 right-1 bg-danger-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {nonLues > 9 ? '9+' : nonLues}
                    </span>
                  )}
                </Link>

                {/* Menu utilisateur */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {user.photo ? (
                        <img src={user.photo} alt={user.nom} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-700 font-semibold text-sm">
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-500 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-20 animate-fade-in">
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="font-semibold text-neutral-900">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                          <div className="mt-2">
                            <Badge color="primary" size="sm">{user.role}</Badge>
                          </div>
                        </div>

                        <Link
                          to={getDashboardLink()}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 text-sm text-neutral-700"
                        >
                          <User className="w-4 h-4" />
                          Mon tableau de bord
                        </Link>

                        <Link
                          to="/profil"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 text-sm text-neutral-700"
                        >
                          <Settings className="w-4 h-4" />
                          Paramètres
                        </Link>

                        <hr className="my-2 border-neutral-100" />

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-danger-50 text-sm text-danger-600"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/connexion">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link to="/inscription">
                  <Button size="sm">Inscription</Button>
                </Link>
              </>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu mobile ouvert */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-neutral-100 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-neutral-100 text-sm font-medium"
              >
                Accueil
              </Link>
              <Link
                to="/annuaire"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-neutral-100 text-sm font-medium"
              >
                Annuaire
              </Link>
              <Link
                to="/verifier"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-neutral-100 text-sm font-medium"
              >
                Vérifier NINTI
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
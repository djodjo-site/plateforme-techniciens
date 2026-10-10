// client/src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, User, FileText, Award, Search, Briefcase,
  MessageSquare, Star, Settings, LogOut, GraduationCap,
  Users, Building2, Shield, AlertTriangle, DollarSign, BookOpen
} from 'lucide-react';

import { logout as logoutAction } from '../../redux/slices/authSlice.js';

// ============================================================
// MENUS PAR RÔLE
// ============================================================
const MENUS = {
  technicien: [
    { to: '/technicien/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/technicien/profil', label: 'Mon profil', icon: User },
    { to: '/technicien/test', label: 'Mon test', icon: GraduationCap },
    { to: '/technicien/ninti', label: 'Mon NINTI', icon: Award },
    { to: '/technicien/demandes', label: 'Demandes disponibles', icon: FileText },
    { to: '/technicien/missions', label: 'Mes missions', icon: Briefcase },
    { to: '/technicien/messages', label: 'Messagerie', icon: MessageSquare },
    { to: '/technicien/avis', label: 'Mes avis', icon: Star }
  ],
  entreprise: [
    { to: '/entreprise/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/entreprise/annuaire', label: 'Annuaire', icon: Search },
    { to: '/entreprise/favoris', label: 'Mes favoris', icon: Star },
    { to: '/entreprise/missions', label: 'Mes missions', icon: Briefcase },
    { to: '/entreprise/abonnement', label: 'Mon abonnement', icon: Award },
    { to: '/entreprise/messages', label: 'Messagerie', icon: MessageSquare },
    { to: '/entreprise/profil', label: 'Mon profil', icon: Building2 }
  ],
  particulier: [
    { to: '/particulier/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/particulier/nouvelle-demande', label: 'Nouvelle demande', icon: FileText },
    { to: '/particulier/demandes', label: 'Mes demandes', icon: Briefcase },
    { to: '/particulier/missions', label: 'Mes missions', icon: Award },
    { to: '/particulier/messages', label: 'Messagerie', icon: MessageSquare },
    { to: '/particulier/profil', label: 'Mon profil', icon: User }
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/admin/techniciens', label: 'Techniciens', icon: Users },
    { to: '/admin/entreprises', label: 'Entreprises', icon: Building2 },
    { to: '/admin/questions', label: 'Questions', icon: BookOpen },
    { to: '/admin/nintis', label: 'Registre NINTI', icon: Shield },
    { to: '/admin/litiges', label: 'Litiges', icon: AlertTriangle },
    { to: '/admin/paiements', label: 'Paiements', icon: DollarSign },
    { to: '/admin/statistiques', label: 'Statistiques', icon: Award }
  ]
};

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const menu = MENUS[user?.role] || [];

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/');
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-neutral-900 text-white z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-bold leading-tight">Plateforme</p>
            <p className="text-xs text-neutral-400 leading-tight">Techniciens</p>
          </div>
        </div>

        {/* Profil mini */}
        <div className="px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
              {user?.photo ? (
                <img src={user.photo} alt={user.nom} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-neutral-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }
                  `
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger-400 hover:bg-danger-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
// client/src/components/layout/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';

import Sidebar from './Sidebar.jsx';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { nonLues } = useSelector((state) => state.notifications);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenu principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-20">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            {/* Bouton menu mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Titre / fil d'ariane (à remplir par les pages) */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-neutral-900">
                Bonjour, {user?.prenom} 👋
              </h1>
              <p className="text-xs text-neutral-500">
                Bienvenue sur votre espace {user?.role}
              </p>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3">
              <a
                href="/notifications"
                className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-neutral-600" />
                {nonLues > 0 && (
                  <span className="absolute top-1 right-1 bg-danger-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {nonLues > 9 ? '9+' : nonLues}
                  </span>
                )}
              </a>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
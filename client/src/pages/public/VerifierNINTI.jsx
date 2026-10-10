// client/src/pages/public/VerifierNINTI.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function VerifierNINTI() {
  const { numero } = useParams();
  const [recherche, setRecherche] = useState(numero || '');

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="container-app max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Vérification NINTI
          </h1>
          <p className="text-neutral-500">
            Vérifiez l'authenticité d'un numéro d'identification
          </p>
        </div>

        <form className="bg-white rounded-xl shadow-lg p-8">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Numéro NINTI
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="NINTI-2026-COD-00042"
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Vérifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
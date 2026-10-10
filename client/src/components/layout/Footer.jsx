// client/src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Plateforme</p>
                <p className="text-xs text-neutral-400 leading-tight">Techniciens</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              La plateforme nationale de référence pour trouver, certifier et
              contacter des techniciens informatique qualifiés.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Accueil</Link></li>
              <li><Link to="/annuaire" className="hover:text-primary-400 transition-colors">Annuaire</Link></li>
              <li><Link to="/verifier" className="hover:text-primary-400 transition-colors">Vérifier un NINTI</Link></li>
              <li><Link to="/inscription/technicien" className="hover:text-primary-400 transition-colors">Devenir technicien</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mentions-legales" className="hover:text-primary-400 transition-colors">Mentions légales</Link></li>
              <li><Link to="/cgu" className="hover:text-primary-400 transition-colors">CGU</Link></li>
              <li><Link to="/confidentialite" className="hover:text-primary-400 transition-colors">Confidentialité</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>contact@plateforme-techniciens.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+243 900 000 000</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>Kinshasa, RDC</span>
              </li>
            </ul>

            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 bg-neutral-800 rounded-lg hover:bg-primary-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-neutral-800 rounded-lg hover:bg-primary-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-neutral-800 rounded-lg hover:bg-primary-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 text-center text-sm text-neutral-500">
          <p>© {annee} Plateforme Nationale de Techniciens Informatique. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
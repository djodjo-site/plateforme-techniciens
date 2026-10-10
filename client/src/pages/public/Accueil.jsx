// client/src/pages/public/Accueil.jsx
import { Link } from 'react-router-dom';
import {
  Shield, Search, CreditCard, Award, Users, MapPin,
  ArrowRight, CheckCircle
} from 'lucide-react';

import Navbar from '../../components/layout/Navbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { CATEGORIES_COMPETENCES } from '../../utils/constants.js';

export default function Accueil() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="bg-gradient-primary text-white py-20 md:py-28">
          <div className="container-app">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-sm mb-6">
                <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
                <span>Plateforme officielle de certification</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                La plateforme nationale des techniciens informatique certifiés
              </h1>

              <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
                Trouvez un expert vérifié, certifié et géolocalisé en quelques clics.
                Chaque technicien possède un numéro d'identification NINTI unique.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/annuaire">
                  <Button
                    variant="primary"
                    size="lg"
                    className="!bg-white !text-primary-700 hover:!bg-blue-50"
                  >
                    Trouver un technicien
                  </Button>
                </Link>
                <Link to="/inscription/technicien">
                  <Button
                    variant="outline"
                    size="lg"
                    className="!border-white !text-white hover:!bg-white/10"
                  >
                    Devenir technicien certifié
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3 PILIERS ===== */}
        <section className="py-16 -mt-8">
          <div className="container-app">
            <div className="grid md:grid-cols-3 gap-6">
              <Card hover>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Recherche géolocalisée</h3>
                <p className="text-neutral-500 text-sm">
                  Trouvez un technicien près de chez vous grâce à notre annuaire interactif.
                </p>
              </Card>

              <Card hover>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Certification NINTI</h3>
                <p className="text-neutral-500 text-sm">
                  Tous nos techniciens sont testés et possèdent un numéro d'identification unique.
                </p>
              </Card>

              <Card hover>
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Paiement sécurisé</h3>
                <p className="text-neutral-500 text-sm">
                  Vos transactions sont protégées et traçables de bout en bout.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="py-16">
          <div className="container-app">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="flex justify-center mb-2">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-neutral-900">500+</p>
                <p className="text-sm text-neutral-500">Techniciens certifiés</p>
              </div>
              <div>
                <div className="flex justify-center mb-2">
                  <MapPin className="w-8 h-8 text-success-600" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-neutral-900">15</p>
                <p className="text-sm text-neutral-500">Villes couvertes</p>
              </div>
              <div>
                <div className="flex justify-center mb-2">
                  <Award className="w-8 h-8 text-accent-600" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-neutral-900">1000+</p>
                <p className="text-sm text-neutral-500">Missions réalisées</p>
              </div>
              <div>
                <div className="flex justify-center mb-2">
                  <CheckCircle className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-neutral-900">4.8/5</p>
                <p className="text-sm text-neutral-500">Note moyenne</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CATÉGORIES ===== */}
        <section className="py-16 bg-white">
          <div className="container-app">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Domaines d'expertise
              </h2>
              <p className="text-neutral-500">
                Faites appel à un expert dans le domaine qui vous concerne
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES_COMPETENCES.map((cat) => (
                <Link
                  key={cat}
                  to={`/annuaire?categorie=${encodeURIComponent(cat)}`}
                  className="p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all text-center group"
                >
                  <p className="text-sm font-medium text-neutral-700 group-hover:text-primary-700">
                    {cat}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="py-20 bg-gradient-primary text-white">
          <div className="container-app text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Rejoignez la communauté des techniciens certifiés ou trouvez l'expert
              qu'il vous faut en quelques clics.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/inscription/technicien">
                <Button className="!bg-white !text-primary-700 hover:!bg-blue-50" size="lg">
                  Devenir technicien
                </Button>
              </Link>
              <Link to="/annuaire">
                <Button variant="outline" size="lg" className="!border-white !text-white">
                  Parcourir l'annuaire
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
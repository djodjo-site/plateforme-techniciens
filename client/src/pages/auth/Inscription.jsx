// client/src/pages/auth/Inscription.jsx
import { Link } from 'react-router-dom';
import { User, Wrench, Building2, ArrowRight, ArrowLeft } from 'lucide-react';

const TYPES_COMPTES = [
  {
    type: 'particulier',
    title: 'Particulier',
    description: 'Je cherche un technicien pour un besoin personnel',
    icon: User,
    color: 'primary',
    link: '/inscription/particulier',
    features: [
      'Publier des demandes gratuitement',
      'Comparer les offres des techniciens',
      'Paiement sécurisé',
      'Avis vérifiés'
    ]
  },
  {
    type: 'technicien',
    title: 'Technicien',
    description: 'Je suis un professionnel et je veux proposer mes services',
    icon: Wrench,
    color: 'success',
    link: '/inscription/technicien',
    features: [
      'Certification NINTI officielle',
      'Recevoir des demandes ciblées',
      'Paiements sécurisés',
      'Visibilité nationale'
    ],
    featured: true
  },
  {
    type: 'entreprise',
    title: 'Entreprise',
    description: 'Je cherche des techniciens pour mon organisation',
    icon: Building2,
    color: 'accent',
    link: '/inscription/entreprise',
    features: [
      'Accès à l\'annuaire complet',
      'Filtres avancés',
      'Contact direct',
      'Facturation centralisée'
    ]
  }
];

export default function Inscription() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
            Rejoignez la plateforme
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
            Choisissez votre type de compte pour commencer
          </p>
        </div>

        {/* Cartes */}
        <div className="grid md:grid-cols-3 gap-6">
          {TYPES_COMPTES.map((type) => {
            const Icon = type.icon;
            const colorClasses = {
              primary: 'bg-primary-100 text-primary-600',
              success: 'bg-success-100 text-success-600',
              accent: 'bg-accent-100 text-accent-600'
            };

            return (
              <Link
                key={type.type}
                to={type.link}
                className={`
                  relative bg-white rounded-2xl p-8 border-2 transition-all duration-200
                  hover:shadow-xl hover:-translate-y-1
                  ${type.featured
                    ? 'border-success-500 shadow-lg'
                    : 'border-neutral-200 hover:border-primary-300'
                  }
                `}
              >
                {type.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMANDÉ
                  </div>
                )}

                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${colorClasses[type.color]}`}>
                  <Icon className="w-7 h-7" />
                </div>

                <h2 className="text-xl font-bold text-neutral-900 mb-2">
                  {type.title}
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                  {type.description}
                </p>

                <ul className="space-y-3 mb-6">
                  {type.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="text-success-500 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-sm font-semibold text-primary-600">
                  Choisir
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Déjà un compte */}
        <div className="text-center mt-12">
          <p className="text-neutral-500">
            Vous avez déjà un compte ?{' '}
            <Link
              to="/connexion"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
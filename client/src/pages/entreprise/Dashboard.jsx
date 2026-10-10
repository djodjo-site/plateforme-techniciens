// client/src/pages/entreprise/Dashboard.jsx
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Search, Users, Briefcase, DollarSign, Award,
  Star, TrendingUp, ArrowRight, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth.js';
import * as entrepriseApi from '../../api/entrepriseApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import { formatMontant, formatDate } from '../../utils/helpers.js';

// ============================================================
// KPI CARD
// ============================================================
function KPICard({ icon: Icon, label, value, color = 'primary', link = null }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    accent: 'bg-accent-100 text-accent-600',
    info: 'bg-blue-100 text-blue-600'
  };

  const Wrapper = link ? Link : 'div';
  const wrapperProps = link ? { to: link } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Card padding="md" hover={!!link}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </Wrapper>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function EntrepriseDashboard() {
  const { user } = useAuth();

  const { data: profilData, isLoading: loadingProfil } = useQuery({
    queryKey: ['entreprise-profil'],
    queryFn: entrepriseApi.getProfil
  });

  const { data: statsData } = useQuery({
    queryKey: ['entreprise-stats'],
    queryFn: entrepriseApi.getMesStatistiques
  });

  const { data: abonnementData } = useQuery({
    queryKey: ['entreprise-abonnement'],
    queryFn: entrepriseApi.getMonAbonnement
  });

  if (loadingProfil) {
    return <Loader text="Chargement du tableau de bord..." />;
  }

  const entreprise = profilData?.entreprise || user;
  const stats = statsData?.statistiques || {};
  const accesAnnuaire = statsData?.accesAnnuaire || {};
  const abonnement = abonnementData?.actif;

  const abonnementActif = !!abonnement && abonnement.estActif;
  const joursRestants = abonnementData?.joursRestants || 0;
  const bientotExpire = abonnementActif && joursRestants <= 7;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Tableau de bord
          </h1>
          <p className="text-neutral-500 mt-1">
            {entreprise?.raisonSociale || 'Bienvenue sur votre espace entreprise'}
          </p>
        </div>
        {abonnementActif ? (
          <Badge color="success" size="lg">
            <CheckCircle className="w-4 h-4" />
            Abonnement actif
          </Badge>
        ) : (
          <Badge color="warning" size="lg">
            <AlertCircle className="w-4 h-4" />
            Sans abonnement
          </Badge>
        )}
      </div>

      {/* Alerte abonnement */}
      {!abonnementActif && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-accent-900">
                Accédez à l'annuaire des techniciens
              </p>
              <p className="text-sm text-accent-700 mt-1">
                Souscrivez à un abonnement pour consulter les profils certifiés
                et contacter directement les techniciens.
              </p>
              <Link to="/entreprise/abonnement" className="inline-block mt-3">
                <Button variant="warning" size="sm">
                  Voir les abonnements
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {bientotExpire && (
        <Card className="border border-danger-200 bg-danger-50">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-danger-900">
                Votre abonnement expire bientôt
              </p>
              <p className="text-sm text-danger-700 mt-1">
                Il vous reste <strong>{joursRestants} jour(s)</strong>. Renouvelez pour
                éviter toute interruption d'accès.
              </p>
              <Link to="/entreprise/abonnement" className="inline-block mt-3">
                <Button variant="danger" size="sm">
                  Renouveler
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Search}
          label="Consultations annuaire"
          value={accesAnnuaire.consultationsMois || 0}
          color="primary"
          link="/entreprise/annuaire"
        />
        <KPICard
          icon={Users}
          label="Techniciens contactés"
          value={stats.nombreTechniciensContactes || 0}
          color="info"
        />
        <KPICard
          icon={Briefcase}
          label="Missions en cours"
          value={stats.missionsEnCours || 0}
          color="accent"
          link="/entreprise/missions"
        />
        <KPICard
          icon={DollarSign}
          label="Total dépensé"
          value={formatMontant(stats.montantTotalDepense || 0, stats.deviseDepense)}
          color="success"
        />
      </div>

      {/* Deux colonnes */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Actions rapides */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/entreprise/annuaire">
              <Button variant="primary" fullWidth className="!justify-start">
                <Search className="w-4 h-4 mr-2" />
                Chercher un technicien
              </Button>
            </Link>

            <Link to="/entreprise/favoris">
              <Button variant="outline" fullWidth className="!justify-start">
                <Star className="w-4 h-4 mr-2" />
                Mes favoris
              </Button>
            </Link>

            <Link to="/entreprise/missions">
              <Button variant="outline" fullWidth className="!justify-start">
                <Briefcase className="w-4 h-4 mr-2" />
                Mes missions
              </Button>
            </Link>

            <Link to="/entreprise/profil">
              <Button variant="outline" fullWidth className="!justify-start">
                <Building2 className="w-4 h-4 mr-2" />
                Compléter mon profil
              </Button>
            </Link>
          </div>

          {/* Avantages abonnement */}
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">
              {abonnementActif ? 'Votre abonnement inclut' : 'L\'abonnement vous donne accès à'}
            </h3>
            <div className="space-y-2">
              {[
                'Accès à l\'annuaire complet des techniciens certifiés',
                'Filtres avancés (compétence, ville, note)',
                'Contact direct avec les techniciens',
                'Gestion des missions et paiements sécurisés'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                  <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Mon abonnement */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            Mon abonnement
          </h2>

          {abonnementActif ? (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-primary text-white rounded-lg">
                <p className="text-xs text-blue-100 mb-1">Type</p>
                <p className="font-bold capitalize">{abonnement.type}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Début</span>
                  <span className="font-medium">{formatDate(abonnement.dateDebut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Expire le</span>
                  <span className="font-medium">{formatDate(abonnement.dateFin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Jours restants</span>
                  <span className={`font-medium ${joursRestants <= 7 ? 'text-danger-600' : 'text-success-600'}`}>
                    {joursRestants} j
                  </span>
                </div>
              </div>

              <Link to="/entreprise/abonnement">
                <Button variant="outline" size="sm" fullWidth>
                  Gérer l'abonnement
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-7 h-7 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500 mb-4">
                Aucun abonnement actif
              </p>
              <Link to="/entreprise/abonnement">
                <Button variant="primary" size="sm">
                  Souscrire
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Info statut compte */}
      {entreprise?.statut === 'en_attente_validation' && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-accent-900">
                Compte en attente de validation
              </p>
              <p className="text-sm text-accent-700 mt-1">
                Votre compte est en cours d'examen par un administrateur.
                Vous recevrez une notification dès qu'il sera validé.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
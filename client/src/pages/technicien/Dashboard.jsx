// client/src/pages/technicien/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Award, GraduationCap, Briefcase, Star, TrendingUp, Clock,
  AlertCircle, CheckCircle, ArrowRight, User, Shield, DollarSign,
  FileText, MessageSquare, MapPin, Target
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth.js';
import * as technicienApi from '../../api/technicienApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import { STATUTS_TECHNICIEN_LABELS } from '../../utils/constants.js';
import { formatMontant, formatDate } from '../../utils/helpers.js';

// ============================================================
// ÉTAPES DU PARCOURS
// ============================================================
const ETAPES_PARCOURS = [
  {
    id: 1,
    label: 'Inscription',
    description: 'Compte créé',
    icone: User,
    statuts: ['en_attente_de_test', 'test_echoue', 'test_reussi', 'en_attente_paiement', 'ninti_actif']
  },
  {
    id: 2,
    label: 'Profil complété',
    description: 'Compétences et tarifs',
    icone: User,
    statuts: ['en_attente_de_test', 'test_echoue', 'test_reussi', 'en_attente_paiement', 'ninti_actif']
  },
  {
    id: 3,
    label: 'Test réussi',
    description: 'Score ≥ 60%',
    icone: GraduationCap,
    statuts: ['test_reussi', 'en_attente_paiement', 'ninti_actif']
  },
  {
    id: 4,
    label: 'NINTI actif',
    description: 'Accréditation payée',
    icone: Award,
    statuts: ['ninti_actif']
  },
  {
    id: 5,
    label: 'Missions',
    description: 'Prêt à travailler',
    icone: Briefcase,
    statuts: ['ninti_actif']
  }
];

// ============================================================
// COMPOSANT : Étape du parcours
// ============================================================
function EtapeParcours({ etape, complete, active }) {
  const Icon = etape.icone;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center mb-2
          transition-all
          ${complete
            ? 'bg-success-500 text-white'
            : active
              ? 'bg-primary-600 text-white ring-4 ring-primary-100'
              : 'bg-neutral-200 text-neutral-400'
          }
        `}
      >
        {complete ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
      </div>
      <p className={`text-sm font-semibold ${complete || active ? 'text-neutral-900' : 'text-neutral-400'}`}>
        {etape.label}
      </p>
      <p className="text-xs text-neutral-500 mt-0.5">{etape.description}</p>
    </div>
  );
}

// ============================================================
// COMPOSANT : Alerte de statut
// ============================================================
function AlerteStatut({ statut, scoreTest, heuresRestantes }) {
  const alertes = {
    en_attente_de_test: {
      icone: GraduationCap,
      couleur: 'primary',
      titre: 'Prêt pour le test de certification ?',
      message: 'Passez le test de 40 questions pour valider vos compétences. Seuil de réussite : 60%.',
      action: { label: 'Passer le test', lien: '/technicien/test' }
    },
    test_echoue: {
      icone: AlertCircle,
      couleur: 'warning',
      titre: 'Test non réussi',
      message: `Vous avez obtenu ${scoreTest || 0}%. Vous pourrez repasser le test dans ${heuresRestantes || 48}h.`,
      action: null
    },
    test_reussi: {
      icone: Award,
      couleur: 'success',
      titre: 'Test réussi ! 🎉',
      message: 'Il ne vous reste plus qu\'à payer votre accréditation pour recevoir votre NINTI.',
      action: { label: 'Payer mon accréditation', lien: '/technicien/payer-accreditation' }
    },
    en_attente_paiement: {
      icone: DollarSign,
      couleur: 'warning',
      titre: 'Paiement en attente',
      message: 'Finalisez votre paiement pour activer votre NINTI.',
      action: { label: 'Finaliser le paiement', lien: '/technicien/payer-accreditation' }
    },
    ninti_actif: {
      icone: CheckCircle,
      couleur: 'success',
      titre: 'Vous êtes certifié ! ✨',
      message: 'Votre NINTI est actif. Vous pouvez recevoir des missions.',
      action: { label: 'Voir les demandes', lien: '/technicien/demandes' }
    },
    suspendu: {
      icone: AlertCircle,
      couleur: 'danger',
      titre: 'Compte suspendu',
      message: 'Votre compte a été suspendu. Contactez l\'administrateur.',
      action: null
    }
  };

  const config = alertes[statut];
  if (!config) return null;

  const Icon = config.icone;

  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200 text-primary-900',
    success: 'bg-success-50 border-success-200 text-success-900',
    warning: 'bg-accent-50 border-accent-200 text-accent-900',
    danger: 'bg-danger-50 border-danger-200 text-danger-900'
  };

  const iconColorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-accent-500',
    danger: 'bg-danger-500'
  };

  return (
    <Card padding="md" className={`border ${colorClasses[config.couleur]}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColorClasses[config.couleur]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{config.titre}</h3>
          <p className="text-sm opacity-90">{config.message}</p>
          {config.action && (
            <Link to={config.action.lien} className="inline-block mt-3">
              <Button size="sm" variant={config.couleur === 'success' ? 'success' : 'primary'}>
                {config.action.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// COMPOSANT : KPI Card
// ============================================================
function KPICard({ icon: Icon, label, value, color = 'primary', suffix = '' }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    accent: 'bg-accent-100 text-accent-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">
            {value}
            {suffix && <span className="text-base text-neutral-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['technicien-profil-dashboard'],
    queryFn: technicienApi.getProfil,
    refetchInterval: 60000
  });

  if (isLoading) {
    return <Loader text="Chargement du tableau de bord..." />;
  }

  const technicien = data?.technicien || user || {};
  const statistiques = technicien.statistiques || {};

  const statutInfo = STATUTS_TECHNICIEN_LABELS[technicien.statut] || {
    label: technicien.statut,
    couleur: 'neutral'
  };

  // Déterminer l'étape actuelle du parcours
  const getEtapeActuelle = () => {
    const statut = technicien.statut;
    if (statut === 'ninti_actif') return 5;
    if (statut === 'test_reussi' || statut === 'en_attente_paiement') return 4;
    if (statut === 'test_echoue') return 2;
    if (statut === 'en_attente_de_test') {
      // Vérifier si le profil est complété
      if (technicien.competences?.length > 0 && technicien.tarifs?.horaire > 0) return 2;
      return 1;
    }
    return 1;
  };

  const etapeActuelle = getEtapeActuelle();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Tableau de bord
          </h1>
          <p className="text-neutral-500 mt-1">
            Bienvenue dans votre espace technicien
          </p>
        </div>
        <Badge color={statutInfo.couleur} size="lg">
          {statutInfo.label}
        </Badge>
      </div>

      {/* Alerte de statut */}
      <AlerteStatut
        statut={technicien.statut}
        scoreTest={technicien.scoreTest}
        heuresRestantes={technicien.tempsRestantAvantRepassage}
      />

      {/* Parcours */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          Votre parcours de certification
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {ETAPES_PARCOURS.map((etape) => (
            <EtapeParcours
              key={etape.id}
              etape={etape}
              complete={etape.id < etapeActuelle}
              active={etape.id === etapeActuelle}
            />
          ))}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Briefcase}
          label="Missions réalisées"
          value={statistiques.nombreMissions || 0}
          color="primary"
        />
        <KPICard
          icon={Star}
          label="Note moyenne"
          value={statistiques.noteMoyenne ? statistiques.noteMoyenne.toFixed(1) : '—'}
          suffix={statistiques.noteMoyenne ? '/5' : ''}
          color="accent"
        />
        <KPICard
          icon={TrendingUp}
          label="Taux de réussite"
          value={statistiques.missionsReussies && statistiques.nombreMissions
            ? Math.round((statistiques.missionsReussies / statistiques.nombreMissions) * 100)
            : 0}
          suffix="%"
          color="success"
        />
        <KPICard
          icon={Clock}
          label="Temps de réponse"
          value={statistiques.tempsReponseMoyen || '—'}
          suffix={statistiques.tempsReponseMoyen ? 'min' : ''}
          color="info"
        />
      </div>

      {/* Actions rapides + Infos */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Actions rapides */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/technicien/profil">
              <Button variant="outline" fullWidth className="!justify-start">
                <User className="w-4 h-4 mr-2" />
                Compléter mon profil
              </Button>
            </Link>

            {technicien.statut === 'en_attente_de_test' && (
              <Link to="/technicien/test">
                <Button variant="success" fullWidth className="!justify-start">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Passer le test
                </Button>
              </Link>
            )}

            {technicien.statut === 'test_reussi' && (
              <Link to="/technicien/payer-accreditation">
                <Button variant="success" fullWidth className="!justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Payer mon NINTI
                </Button>
              </Link>
            )}

            {technicien.statut === 'ninti_actif' && (
              <Link to="/technicien/demandes">
                <Button variant="primary" fullWidth className="!justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir les demandes
                </Button>
              </Link>
            )}

            <Link to="/technicien/missions">
              <Button variant="outline" fullWidth className="!justify-start">
                <Briefcase className="w-4 h-4 mr-2" />
                Mes missions
              </Button>
            </Link>

            <Link to="/technicien/messages">
              <Button variant="outline" fullWidth className="!justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messagerie
              </Button>
            </Link>

            <Link to="/technicien/avis">
              <Button variant="outline" fullWidth className="!justify-start">
                <Star className="w-4 h-4 mr-2" />
                Mes avis
              </Button>
            </Link>
          </div>
        </Card>

        {/* Mon NINTI */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            Mon NINTI
          </h2>

          {technicien.numeroNINTI ? (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-primary text-white rounded-lg">
                <p className="text-xs text-blue-100 mb-1">Numéro</p>
                <p className="font-mono font-bold text-lg break-all">
                  {technicien.numeroNINTI}
                </p>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Délivré le</span>
                  <span className="font-medium">{formatDate(technicien.dateDelivranceNINTI)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Expire le</span>
                  <span className="font-medium">{formatDate(technicien.dateExpirationNINTI)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-7 h-7 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500">
                Aucun NINTI pour le moment
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Réussissez le test pour y accéder
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Info profil incomplet */}
      {(!technicien.competences || technicien.competences.length === 0) && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-accent-900">
                Complétez votre profil professionnel
              </p>
              <p className="text-sm text-accent-700 mt-1">
                Ajoutez vos compétences, tarifs et une biographie pour apparaître
                dans l'annuaire et recevoir des missions adaptées.
              </p>
              <Link to="/technicien/profil" className="inline-block mt-3">
                <Button variant="warning" size="sm">
                  Compléter mon profil
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
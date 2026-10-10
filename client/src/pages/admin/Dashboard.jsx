// client/src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Briefcase, AlertTriangle, DollarSign, Shield,
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Award,
  ArrowRight, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../hooks/useAuth.js';
import * as adminApi from '../../api/adminApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';

// ============================================================
// COMPOSANT KPI CARD
// ============================================================
function KPICard({ icon: Icon, label, value, trend, color = 'primary', link = null }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-accent-100 text-accent-600',
    danger: 'bg-danger-100 text-danger-600',
    info: 'bg-blue-100 text-blue-600'
  };

  const CardWrapper = link ? Link : 'div';
  const cardProps = link ? { to: link } : {};

  return (
    <CardWrapper {...cardProps}>
      <Card hover={!!link} padding="md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl md:text-3xl font-bold text-neutral-900">
              {value}
            </p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                trend >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
                <span className="text-neutral-400">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </CardWrapper>
  );
}

// ============================================================
// COMPOSANT ACTIVITÉ RÉCENTE
// ============================================================
function ActiviteRecente({ actions }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        Aucune activité récente
      </div>
    );
  }

  const getActionIcon = (action) => {
    if (action.includes('valider') || action.includes('KYC')) return CheckCircle;
    if (action.includes('rejeter') || action.includes('suspendre')) return XCircle;
    if (action.includes('revoir')) return Award;
    return Activity;
  };

  const getActionColor = (action) => {
    if (action.includes('valider') || action.includes('KYC')) return 'text-success-600 bg-success-100';
    if (action.includes('rejeter') || action.includes('suspendre')) return 'text-danger-600 bg-danger-100';
    if (action.includes('revoir')) return 'text-accent-600 bg-accent-100';
    return 'text-primary-600 bg-primary-100';
  };

  return (
    <ul className="space-y-3">
      {actions.slice(0, 8).map((action, i) => {
        const Icon = getActionIcon(action.action);
        const colorClass = getActionColor(action.action);
        return (
          <li key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {action.action}
              </p>
              <p className="text-xs text-neutral-500">
                {new Date(action.dateAction).toLocaleString('fr-FR')}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function AdminDashboard() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 60000
  });

  const { data: actionsData } = useQuery({
    queryKey: ['admin-actions'],
    queryFn: adminApi.getMesActions
  });

  if (isLoading) {
    return <Loader text="Chargement du tableau de bord..." />;
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
          <p className="text-neutral-700 font-medium">
            Erreur de chargement
          </p>
          <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
        </div>
      </Card>
    );
  }

  const stats = data || {};
  const utilisateurs = stats.utilisateurs || {};
  const activite = stats.activite || {};
  const finances = stats.finances || {};
  const nintis = stats.nintis || {};

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Tableau de bord
          </h1>
          <p className="text-neutral-500 mt-1">
            Vue d'ensemble de la plateforme
          </p>
        </div>
        <Badge color="danger" size="lg">
          <Shield className="w-3.5 h-3.5" />
          Super Admin
        </Badge>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Techniciens"
          value={utilisateurs.totalTechniciens || 0}
          color="primary"
          link="/admin/techniciens"
        />
        <KPICard
          icon={Shield}
          label="NINTI actifs"
          value={nintis.actifs || 0}
          color="success"
          link="/admin/nintis"
        />
        <KPICard
          icon={Building2}
          label="Entreprises"
          value={utilisateurs.totalEntreprises || 0}
          color="info"
          link="/admin/entreprises"
        />
        <KPICard
          icon={Briefcase}
          label="Missions"
          value={activite.totalMissions || 0}
          color="warning"
        />
      </div>

      {/* Finances */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-neutral-500">Revenus totaux</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {new Intl.NumberFormat('fr-FR').format(finances.montantTotal || 0)} XAF
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-success-100 text-success-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-success-600 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Commissions : {new Intl.NumberFormat('fr-FR').format(finances.commissionsTotal || 0)} XAF</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-neutral-500">Litiges ouverts</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {activite.litigesOuverts || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-danger-100 text-danger-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <Link
            to="/admin/litiges"
            className="flex items-center gap-2 text-xs text-primary-600 font-medium hover:gap-3 transition-all"
          >
            <span>Voir les litiges</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Grille principale */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activité récente */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Activité récente
            </h2>
            <Link
              to="/admin/mes-actions"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir tout
            </Link>
          </div>
          <ActiviteRecente actions={actionsData?.journalActions} />
        </Card>

        {/* Actions rapides */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Actions rapides
          </h2>
          <div className="space-y-3">
            <Link to="/admin/techniciens?statut=en_attente_de_test">
              <Button variant="outline" size="sm" fullWidth className="!justify-start">
                <Clock className="w-4 h-4 mr-2" />
                KYC à valider
              </Button>
            </Link>
            <Link to="/admin/litiges?statut=ouvert">
              <Button variant="outline" size="sm" fullWidth className="!justify-start">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Litiges en attente
              </Button>
            </Link>
            <Link to="/admin/questions">
              <Button variant="outline" size="sm" fullWidth className="!justify-start">
                <Award className="w-4 h-4 mr-2" />
                Gérer les questions
              </Button>
            </Link>
            <Link to="/admin/statistiques">
              <Button variant="outline" size="sm" fullWidth className="!justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Voir les statistiques
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Répartition */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            NINTI par statut
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Actifs</span>
              <Badge color="success">{nintis.actifs || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Expirés</span>
              <Badge color="warning">{nintis.expires || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Révoqués</span>
              <Badge color="danger">{nintis.revoques || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Suspendus</span>
              <Badge color="neutral">{nintis.suspendus || 0}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Activité plateforme
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Missions en cours</span>
              <Badge color="info">{activite.missionsEnCours || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Questions actives</span>
              <Badge color="primary">{stats.contenu?.totalQuestions || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Techniciens certifiés</span>
              <Badge color="success">{utilisateurs.techniciensActifs || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Entreprises actives</span>
              <Badge color="success">{utilisateurs.entreprisesActives || 0}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
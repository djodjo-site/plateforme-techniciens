// client/src/pages/admin/Statistiques.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, Briefcase, Award, DollarSign, Shield,
  TrendingUp, Activity, XCircle, BookOpen, Scale, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

import * as adminApi from '../../api/adminApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';

// ============================================================
// PALETTE DE COULEURS
// ============================================================
const COULEURS = {
  primary: '#2563eb',
  success: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  neutral: '#64748b'
};

const PIE_COLORS = [
  COULEURS.primary,
  COULEURS.success,
  COULEURS.accent,
  COULEURS.danger,
  COULEURS.info,
  COULEURS.neutral
];

// ============================================================
// COMPOSANT KPI
// ============================================================
function KPICard({ icon: Icon, label, value, color = 'primary', suffix = '' }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    accent: 'bg-accent-100 text-accent-600',
    danger: 'bg-danger-100 text-danger-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
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
export default function AdminStatistiques() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-statistiques'],
    queryFn: adminApi.getStatistiques,
    refetchInterval: 120000
  });

  if (isLoading) {
    return <Loader text="Chargement des statistiques..." />;
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
          <p className="text-neutral-700 font-medium">Erreur de chargement</p>
          <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
        </div>
      </Card>
    );
  }

  const stats = data || {};
  const techStats = stats.techStats || {};
  const entStats = stats.entStats || {};
  const missionsStats = stats.missionsStats || {};
  const paiementsStats = stats.paiementsStats || {};
  const nintisStats = stats.nintisStats || {};
  const litigesStats = stats.litigesStats || {};
  const usersStats = stats.usersStats || [];

  // Préparer les données pour les graphiques

  // 1. Répartition utilisateurs par rôle
  const usersParRole = usersStats.map((u) => ({
    name: u._id || 'Autre',
    value: u.nombre,
    fill: PIE_COLORS[usersStats.indexOf(u) % PIE_COLORS.length]
  }));

  // 2. Techniciens par catégorie
  const techsParCategorie = (techStats.parCategorie || []).slice(0, 8).map((c) => ({
    name: c._id || 'Autre',
    nombre: c.nombre
  }));

  // 3. NINTI par statut
  const nintisParStatut = [
    { name: 'Actifs', value: nintisStats.actifs || 0, fill: COULEURS.success },
    { name: 'Expirés', value: nintisStats.expires || 0, fill: COULEURS.accent },
    { name: 'Révoqués', value: nintisStats.revoques || 0, fill: COULEURS.danger },
    { name: 'Suspendus', value: nintisStats.suspendus || 0, fill: COULEURS.neutral }
  ].filter((d) => d.value > 0);

  // 4. Missions par statut
  const missionsParStatut = (missionsStats.parStatut || []).map((s) => ({
    name: s._id || 'Inconnu',
    nombre: s.nombre
  }));

  // 5. Litiges par motif
  const litigesParMotif = (litigesStats.parMotif || []).slice(0, 6).map((m) => ({
    name: m._id || 'Autre',
    nombre: m.nombre
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Statistiques
        </h1>
        <p className="text-neutral-500 mt-1">
          Vue d'ensemble des performances de la plateforme
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Techniciens"
          value={techStats.total || 0}
          color="primary"
        />
        <KPICard
          icon={Shield}
          label="NINTI actifs"
          value={nintisStats.actifs || 0}
          color="success"
        />
        <KPICard
          icon={Briefcase}
          label="Missions"
          value={missionsStats.total || 0}
          color="accent"
        />
        <KPICard
          icon={DollarSign}
          label="Revenus totaux"
          value={new Intl.NumberFormat('fr-FR').format(paiementsStats.montantTotal || 0)}
          suffix="XAF"
          color="success"
        />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Building2}
          label="Entreprises"
          value={entStats.total || 0}
          color="info"
        />
        <KPICard
          icon={Award}
          label="Techniciens disponibles"
          value={techStats.disponibles || 0}
          color="success"
        />
        <KPICard
          icon={Scale}
          label="Litiges ouverts"
          value={litigesStats.total - (litigesStats.resolus || 0)}
          color="danger"
        />
        <KPICard
          icon={BookOpen}
          label="Taux réussite test"
          value={`${(stats.techStats?.parStatut?.find((s) => s._id === 'ninti_actif')?.nombre / (techStats.total || 1) * 100 || 0).toFixed(0)}%`}
          color="primary"
        />
      </div>

      {/* Graphiques principaux */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Répartition utilisateurs */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Répartition des utilisateurs
          </h2>
          {usersParRole.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={usersParRole}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {usersParRole.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-400 text-sm">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* NINTI par statut */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Statut des NINTI
          </h2>
          {nintisParStatut.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={nintisParStatut}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} : ${value}`}
                  >
                    {nintisParStatut.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-400 text-sm">
              Aucun NINTI délivré
            </div>
          )}
        </Card>
      </div>

      {/* Deuxième ligne graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Techniciens par catégorie */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Techniciens par catégorie
          </h2>
          {techsParCategorie.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={techsParCategorie} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip />
                  <Bar dataKey="nombre" fill={COULEURS.primary} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-400 text-sm">
              Aucun technicien dans une catégorie
            </div>
          )}
        </Card>

        {/* Missions par statut */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Missions par statut
          </h2>
          {missionsParStatut.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={missionsParStatut}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="nombre" fill={COULEURS.success} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-400 text-sm">
              Aucune mission enregistrée
            </div>
          )}
        </Card>
      </div>

      {/* Litiges par motif */}
      {litigesParMotif.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Litiges par motif
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={litigesParMotif}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="nombre" fill={COULEURS.danger} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Résumé financier */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-success-600" />
          Résumé financier
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-xs text-success-700 mb-1">Montant total traité</p>
            <p className="text-xl font-bold text-success-800">
              {new Intl.NumberFormat('fr-FR').format(paiementsStats.montantTotal || 0)} XAF
            </p>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-xs text-primary-700 mb-1">Commissions plateforme</p>
            <p className="text-xl font-bold text-primary-800">
              {new Intl.NumberFormat('fr-FR').format(paiementsStats.commissionsTotal || 0)} XAF
            </p>
          </div>

          <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
            <p className="text-xs text-accent-700 mb-1">Nombre de paiements</p>
            <p className="text-xl font-bold text-accent-800">
              {paiementsStats.total || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
// client/src/pages/technicien/MesMissions.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Search, Filter, Eye, Play, CheckCircle, XCircle,
  Clock, MapPin, DollarSign, User, Calendar, AlertTriangle,
  MessageSquare, Shield, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as missionApi from '../../api/missionApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { STATUTS_MISSION_LABELS } from '../../utils/constants.js';
import { formatMontant, formatDate, dateRelative } from '../../utils/helpers.js';

// ============================================================
// CARTE MISSION
// ============================================================
function MissionCard({ mission, onClick }) {
  const statutInfo = STATUTS_MISSION_LABELS[mission.statut] || {
    label: mission.statut,
    couleur: 'neutral'
  };

  const prix = mission.tarification?.prixConvenu || 0;
  const devise = mission.tarification?.devise || 'XAF';

  return (
    <Card padding="md" hover onClick={() => onClick(mission)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge color={statutInfo.couleur} size="sm">
          {statutInfo.label}
        </Badge>
        <span className="text-xs text-neutral-400 flex-shrink-0">
          {dateRelative(mission.createdAt)}
        </span>
      </div>

      <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
        {mission.titre}
      </h3>

      {mission.description && (
        <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
          {mission.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-xs text-neutral-600">
        {mission.localisation?.ville && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate">{mission.localisation.ville}</span>
          </div>
        )}
        {prix > 0 && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate font-medium text-success-600">
              {formatMontant(prix, devise)}
            </span>
          </div>
        )}
        {mission.dateDebut && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate">
              {new Date(mission.dateDebut).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
        {mission.client && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate">
              {mission.client?.prenom} {mission.client?.nom}
            </span>
          </div>
        )}
      </div>

      {/* Action principale selon statut */}
      <div className="pt-3 border-t border-neutral-100">
        {mission.statut === 'acceptee' && (
          <Button variant="success" size="sm" fullWidth>
            <Play className="w-4 h-4 mr-1" />
            Démarrer la mission
          </Button>
        )}
        {mission.statut === 'en_cours' && (
          <Button variant="warning" size="sm" fullWidth>
            <CheckCircle className="w-4 h-4 mr-1" />
            Terminer la mission
          </Button>
        )}
        {mission.statut === 'terminee' && (
          <Button variant="outline" size="sm" fullWidth>
            <Eye className="w-4 h-4 mr-1" />
            Voir les détails
          </Button>
        )}
        {mission.statut === 'en_attente' && (
          <Badge color="warning" size="md" className="w-full justify-center">
            En attente de validation
          </Badge>
        )}
        {mission.statut === 'annulee' && (
          <Badge color="danger" size="md" className="w-full justify-center">
            Annulée
          </Badge>
        )}
        {mission.statut === 'litige' && (
          <Badge color="danger" size="md" className="w-full justify-center">
            <AlertTriangle className="w-3 h-3" />
            Litige en cours
          </Badge>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienMesMissions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [recherche, setRecherche] = useState('');
  const [missionDetail, setMissionDetail] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mes-missions', page, statut],
    queryFn: () =>
      missionApi.getMesMissions({
        page,
        limit: 12,
        statut: statut || undefined
      }),
    keepPreviousData: true
  });

  const missions = (data?.missions || []).filter((m) => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      m.titre?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.localisation?.ville?.toLowerCase().includes(q)
    );
  });

  const pagination = data?.pagination || {};

  // Stats rapides
  const stats = {
    total: pagination.total || 0,
    enCours: missions.filter((m) => m.statut === 'en_cours').length,
    acceptees: missions.filter((m) => m.statut === 'acceptee').length,
    terminees: missions.filter((m) => m.statut === 'terminee').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Mes missions
          </h1>
          <p className="text-neutral-500 mt-1">
            {stats.total} mission(s) au total
          </p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success-100 flex items-center justify-center">
              <Play className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Acceptées</p>
              <p className="text-lg font-bold">{stats.acceptees}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">En cours</p>
              <p className="text-lg font-bold">{stats.enCours}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-success-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Terminées</p>
              <p className="text-lg font-bold">{stats.terminees}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher..."
            icon={Search}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <select
            value={statut}
            onChange={(e) => { setStatut(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="acceptee">Acceptée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
            <option value="litige">Litige</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setRecherche('');
              setStatut('');
              setPage(1);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Contenu */}
      {isLoading ? (
        <Loader text="Chargement des missions..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : missions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucune mission</p>
            <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
              {recherche || statut
                ? 'Essayez de modifier vos filtres'
                : 'Vos missions en cours et passées apparaîtront ici dès qu\'un client acceptera l\'une de vos offres.'}
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/technicien/demandes')}
            >
              Voir les demandes disponibles
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {missions.map((m) => (
              <MissionCard
                key={m._id}
                mission={m}
                onClick={setMissionDetail}
              />
            ))}
          </div>

          <Pagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            total={pagination.total || 0}
            limit={pagination.limit || 12}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Modal Détails */}
      <Modal
        isOpen={!!missionDetail}
        onClose={() => setMissionDetail(null)}
        title="Détails de la mission"
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setMissionDetail(null)}>
            Fermer
          </Button>
        }
      >
        {missionDetail && (
          <div className="space-y-4">
            <div>
              <Badge color={STATUTS_MISSION_LABELS[missionDetail.statut]?.couleur}>
                {STATUTS_MISSION_LABELS[missionDetail.statut]?.label}
              </Badge>
              <h3 className="text-lg font-bold text-neutral-900 mt-3 mb-2">
                {missionDetail.titre}
              </h3>
              <p className="text-sm text-neutral-600 whitespace-pre-line">
                {missionDetail.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
              {missionDetail.localisation?.ville && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Localisation</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    {missionDetail.localisation.ville}
                  </p>
                </div>
              )}
              {missionDetail.tarification?.prixConvenu > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Prix convenu</p>
                  <p className="text-sm font-semibold text-success-600">
                    {formatMontant(missionDetail.tarification.prixConvenu, missionDetail.tarification.devise)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-neutral-500 mb-1">Date de début</p>
                <p className="text-sm font-medium">
                  {formatDate(missionDetail.dateDebut)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Client</p>
                <p className="text-sm font-medium">
                  {missionDetail.client?.prenom} {missionDetail.client?.nom}
                </p>
              </div>
            </div>

            {missionDetail.preuves?.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Preuves ({missionDetail.preuves.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {missionDetail.preuves.map((p, i) => (
                    <div key={i} className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-neutral-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
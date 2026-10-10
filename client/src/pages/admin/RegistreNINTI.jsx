// client/src/pages/admin/RegistreNINTI.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Shield, Award, XCircle, AlertTriangle, Clock,
  Eye, MoreVertical, Ban, CheckCircle, RefreshCw, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as adminApi from '../../api/adminApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatDate, getInitiales } from '../../utils/helpers.js';

// ============================================================
// LABELS STATUT NINTI
// ============================================================
const STATUTS_NINTI_LABELS = {
  actif: { label: 'Actif', couleur: 'success' },
  expire: { label: 'Expiré', couleur: 'warning' },
  revoque: { label: 'Révoqué', couleur: 'danger' },
  suspendu: { label: 'Suspendu', couleur: 'neutral' },
  remplace: { label: 'Remplacé', couleur: 'neutral' }
};

// ============================================================
// COMPOSANT : Ligne NINTI (tableau)
// ============================================================
function NINTIRow({ ninti, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statutInfo = STATUTS_NINTI_LABELS[ninti.statut] || {
    label: ninti.statut,
    couleur: 'neutral'
  };

  const technicien = ninti.technicien || {};
  const joursRestants = ninti.dateExpiration
    ? Math.ceil((new Date(ninti.dateExpiration) - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
      {/* NINTI */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-mono text-sm font-semibold text-neutral-900">
            {ninti.numero}
          </span>
        </div>
      </td>

      {/* Technicien */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-neutral-700">
              {getInitiales(technicien)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-neutral-900 truncate">
              {technicien.prenom} {technicien.nom}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {technicien.email}
            </p>
          </div>
        </div>
      </td>

      {/* Statut */}
      <td className="px-4 py-3">
        <Badge color={statutInfo.couleur} size="sm">
          {statutInfo.label}
        </Badge>
      </td>

      {/* Début */}
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-600">
          {formatDate(ninti.dateDelivrance)}
        </span>
      </td>

      {/* Expiration */}
      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-neutral-600">
            {formatDate(ninti.dateExpiration)}
          </p>
          {ninti.statut === 'actif' && joursRestants > 0 && (
            <p className={`text-xs ${joursRestants <= 30 ? 'text-warning-600' : 'text-neutral-400'}`}>
              {joursRestants <= 30 && <Clock className="w-3 h-3 inline mr-1" />}
              {joursRestants}j restants
            </p>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-neutral-100"
          >
            <MoreVertical className="w-4 h-4 text-neutral-500" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20 text-left">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAction('voir', ninti);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <Eye className="w-4 h-4" />
                  Voir détails
                </button>

                {ninti.statut === 'actif' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAction('suspendre', ninti);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning-600 hover:bg-warning-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Suspendre
                  </button>
                )}

                {ninti.statut === 'suspendu' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAction('reactiver', ninti);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success-600 hover:bg-success-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Réactiver
                  </button>
                )}

                {ninti.statut === 'actif' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAction('revoquer', ninti);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                  >
                    <Ban className="w-4 h-4" />
                    Révoquer
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function AdminRegistreNINTI() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('');
  const [modalRevocation, setModalRevocation] = useState(null);
  const [modalSuspension, setModalSuspension] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [raison, setRaison] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-nintis', page, recherche, statut],
    queryFn: () =>
      adminApi.getNINTIs({
        page,
        limit: 20,
        q: recherche || undefined,
        statut: statut || undefined
      }),
    keepPreviousData: true
  });

  const revoquerMutation = useMutation({
    mutationFn: ({ numero, raison }) => adminApi.revoquerNINTI(numero, raison),
    onSuccess: () => {
      toast.success('NINTI révoqué');
      queryClient.invalidateQueries(['admin-nintis']);
      setModalRevocation(null);
      setRaison('');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAction = (action, ninti) => {
    switch (action) {
      case 'voir':
        setModalDetail(ninti);
        break;
      case 'revoquer':
        setModalRevocation(ninti);
        break;
      case 'suspendre':
        setModalSuspension(ninti);
        break;
      case 'reactiver':
        toast('Fonctionnalité à venir', { icon: 'ℹ️' });
        break;
      default:
        break;
    }
  };

  const nintis = data?.nintis || [];
  const pagination = data?.pagination || {};

  // Stats rapides
  const stats = {
    total: pagination.total || 0,
    actifs: nintis.filter((n) => n.statut === 'actif').length,
    expires: nintis.filter((n) => n.statut === 'expire').length,
    revoques: nintis.filter((n) => n.statut === 'revoque').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Registre NINTI
          </h1>
          <p className="text-neutral-500 mt-1">
            {stats.total} numéro(s) délivré(s)
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-lg font-bold text-neutral-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Actifs</p>
              <p className="text-lg font-bold text-neutral-900">{stats.actifs}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Expirés</p>
              <p className="text-lg font-bold text-neutral-900">{stats.expires}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Révoqués</p>
              <p className="text-lg font-bold text-neutral-900">{stats.revoques}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher par numéro, nom, email..."
            icon={Search}
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
          />

          <select
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="expire">Expiré</option>
            <option value="revoque">Révoqué</option>
            <option value="suspendu">Suspendu</option>
            <option value="remplace">Remplacé</option>
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

      {/* Tableau */}
      {isLoading ? (
        <Loader text="Chargement du registre..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : nintis.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucun NINTI trouvé</p>
            <p className="text-sm text-neutral-500 mt-1">
              {recherche || statut
                ? 'Essayez de modifier vos filtres'
                : 'Les NINTI délivrés apparaîtront ici'}
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Technicien
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Délivré le
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Expire le
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {nintis.map((n) => (
                  <NINTIRow key={n._id} ninti={n} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 border-t border-neutral-200">
            <Pagination
              page={pagination.page || 1}
              totalPages={pagination.totalPages || 1}
              total={pagination.total || 0}
              limit={pagination.limit || 20}
              onPageChange={setPage}
            />
          </div>
        </Card>
      )}

      {/* Modal Détails */}
      <Modal
        isOpen={!!modalDetail}
        onClose={() => setModalDetail(null)}
        title="Détails du NINTI"
        size="lg"
      >
        {modalDetail && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-primary text-white rounded-xl">
              <p className="text-xs text-blue-100 mb-1">Numéro NINTI</p>
              <p className="font-mono text-2xl font-bold">
                {modalDetail.numero}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Technicien</p>
                <p className="font-medium">
                  {modalDetail.technicien?.prenom} {modalDetail.technicien?.nom}
                </p>
                <p className="text-sm text-neutral-500">
                  {modalDetail.technicien?.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Statut</p>
                <Badge
                  color={
                    STATUTS_NINTI_LABELS[modalDetail.statut]?.couleur || 'neutral'
                  }
                >
                  {STATUTS_NINTI_LABELS[modalDetail.statut]?.label ||
                    modalDetail.statut}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Délivré le</p>
                <p className="font-medium">{formatDate(modalDetail.dateDelivrance)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Expire le</p>
                <p className="font-medium">{formatDate(modalDetail.dateExpiration)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Pays</p>
                <p className="font-medium">{modalDetail.codePays || 'COD'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Vérifications</p>
                <p className="font-medium">{modalDetail.nombreVerifications || 0}</p>
              </div>
            </div>

            {modalDetail.urlVerification && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">URL de vérification</p>
                <a
                  href={modalDetail.urlVerification}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline break-all"
                >
                  {modalDetail.urlVerification}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Révocation */}
      <Modal
        isOpen={!!modalRevocation}
        onClose={() => {
          setModalRevocation(null);
          setRaison('');
        }}
        title="Révoquer le NINTI"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalRevocation(null);
                setRaison('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                revoquerMutation.mutate({
                  numero: modalRevocation.numero,
                  raison
                })
              }
              loading={revoquerMutation.isLoading}
              disabled={!raison.trim()}
            >
              Confirmer la révocation
            </Button>
          </>
        }
      >
        <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg mb-4">
          <p className="text-sm text-danger-700">
            ⚠️ Cette action est <strong>irréversible</strong>. Le technicien perdra
            son accréditation et ne pourra plus recevoir de missions.
          </p>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          NINTI concerné :{' '}
          <span className="font-mono font-semibold">{modalRevocation?.numero}</span>
        </p>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Raison de la révocation *
        </label>
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          placeholder="Fraude, usurpation d'identité, non-respect grave des CGU..."
          rows={4}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>

      {/* Modal Suspension */}
      <Modal
        isOpen={!!modalSuspension}
        onClose={() => {
          setModalSuspension(null);
          setRaison('');
        }}
        title="Suspendre le NINTI"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalSuspension(null);
                setRaison('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="warning"
              onClick={() => {
                toast('Fonctionnalité à venir', { icon: 'ℹ️' });
                setModalSuspension(null);
                setRaison('');
              }}
              disabled={!raison.trim()}
            >
              Confirmer la suspension
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 mb-4">
          NINTI : <span className="font-mono font-semibold">{modalSuspension?.numero}</span>
        </p>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Raison de la suspension *
        </label>
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          placeholder="Enquête en cours, plainte reçue..."
          rows={4}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>
    </div>
  );
}
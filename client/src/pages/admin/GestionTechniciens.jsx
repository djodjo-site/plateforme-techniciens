// client/src/pages/admin/GestionTechniciens.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Shield, Award,
  MapPin, Star, Phone, Mail, MoreVertical, Ban, RefreshCw
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
import { STATUTS_TECHNICIEN_LABELS } from '../../utils/constants.js';
import { getInitiales, getImageUrl } from '../../utils/helpers.js';

// ============================================================
// COMPOSANT : Carte technicien
// ============================================================
function TechnicienCard({ technicien, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statutInfo = STATUTS_TECHNICIEN_LABELS[technicien.statut] || {
    label: technicien.statut,
    couleur: 'neutral'
  };

  return (
    <Card padding="md" hover>
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {technicien.photo ? (
            <img
              src={getImageUrl(technicien.photo)}
              alt={technicien.nom}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary-700 font-bold text-lg">
              {getInitiales(technicien)}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">
                {technicien.prenom} {technicien.nom}
              </h3>
              {technicien.titreProfessionnel && (
                <p className="text-sm text-neutral-500 truncate">
                  {technicien.titreProfessionnel}
                </p>
              )}
            </div>

            {/* Menu actions */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <MoreVertical className="w-4 h-4 text-neutral-500" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                    {!technicien.kycVerifie && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('validerKYC', technicien);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success-600 hover:bg-success-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider KYC
                      </button>
                    )}

                    {technicien.kycVerifie && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('rejeterKYC', technicien);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter KYC
                      </button>
                    )}

                    {technicien.statut !== 'suspendu' ? (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('suspendre', technicien);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        <Ban className="w-4 h-4" />
                        Suspendre
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('reactiver', technicien);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success-600 hover:bg-success-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Réactiver
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge color={statutInfo.couleur} size="sm">
              {statutInfo.label}
            </Badge>

            {technicien.kycVerifie && (
              <Badge color="success" size="sm">
                <Shield className="w-3 h-3" />
                KYC vérifié
              </Badge>
            )}

            {technicien.numeroNINTI && (
              <Badge color="primary" size="sm">
                <Award className="w-3 h-3" />
                {technicien.numeroNINTI}
              </Badge>
            )}
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-neutral-600">
            {technicien.email && (
              <div className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{technicien.email}</span>
              </div>
            )}
            {technicien.telephone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{technicien.telephone}</span>
              </div>
            )}
            {technicien.ville && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{technicien.ville}</span>
              </div>
            )}
            {technicien.statistiques?.noteMoyenne > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-accent-500 fill-accent-500 flex-shrink-0" />
                <span>{technicien.statistiques.noteMoyenne}/5</span>
                <span className="text-neutral-400">
                  ({technicien.statistiques.nombreAvis || 0})
                </span>
              </div>
            )}
          </div>

          {/* Actions principales */}
          <div className="flex gap-2 mt-3">
            <Link to={`/admin/techniciens/${technicien._id}`} className="flex-1">
              <Button variant="outline" size="sm" fullWidth>
                <Eye className="w-4 h-4 mr-1" />
                Voir profil
              </Button>
            </Link>
            {!technicien.kycVerifie && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onAction('validerKYC', technicien)}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function AdminGestionTechniciens() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('');
  const [modalRejet, setModalRejet] = useState(null);
  const [modalSuspension, setModalSuspension] = useState(null);
  const [raison, setRaison] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-techniciens', page, recherche, statut],
    queryFn: () =>
      adminApi.getTechniciens({
        page,
        limit: 12,
        q: recherche || undefined,
        statut: statut || undefined
      }),
    keepPreviousData: true
  });

  const validerKYCMutation = useMutation({
    mutationFn: (id) => adminApi.validerKYC(id),
    onSuccess: () => {
      toast.success('KYC validé avec succès');
      queryClient.invalidateQueries(['admin-techniciens']);
    },
    onError: (err) => toast.error(err.message)
  });

  const rejeterKYCMutation = useMutation({
    mutationFn: ({ id, raison }) => adminApi.rejeterKYC(id, raison),
    onSuccess: () => {
      toast.success('KYC rejeté');
      queryClient.invalidateQueries(['admin-techniciens']);
      setModalRejet(null);
      setRaison('');
    },
    onError: (err) => toast.error(err.message)
  });

  const suspendreMutation = useMutation({
    mutationFn: ({ id, raison }) => adminApi.suspendreTechnicien(id, raison),
    onSuccess: () => {
      toast.success('Technicien suspendu');
      queryClient.invalidateQueries(['admin-techniciens']);
      setModalSuspension(null);
      setRaison('');
    },
    onError: (err) => toast.error(err.message)
  });

  const reactiverMutation = useMutation({
    mutationFn: (id) => adminApi.reactiverTechnicien(id),
    onSuccess: () => {
      toast.success('Technicien réactivé');
      queryClient.invalidateQueries(['admin-techniciens']);
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAction = (action, technicien) => {
    switch (action) {
      case 'validerKYC':
        if (window.confirm(`Valider le KYC de ${technicien.prenom} ${technicien.nom} ?`)) {
          validerKYCMutation.mutate(technicien._id);
        }
        break;
      case 'rejeterKYC':
        setModalRejet(technicien);
        break;
      case 'suspendre':
        setModalSuspension(technicien);
        break;
      case 'reactiver':
        if (window.confirm(`Réactiver ${technicien.prenom} ${technicien.nom} ?`)) {
          reactiverMutation.mutate(technicien._id);
        }
        break;
      default:
        break;
    }
  };

  const techniciens = data?.techniciens || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Gestion des techniciens
          </h1>
          <p className="text-neutral-500 mt-1">
            {pagination.total || 0} technicien(s) enregistré(s)
          </p>
        </div>
      </div>

      <Card padding="md">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher par nom, email, NINTI..."
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
            <option value="en_attente_de_test">En attente de test</option>
            <option value="test_reussi">Test réussi</option>
            <option value="test_echoue">Test échoué</option>
            <option value="en_attente_paiement">En attente de paiement</option>
            <option value="ninti_actif">NINTI Actif</option>
            <option value="suspendu">Suspendu</option>
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

      {isLoading ? (
        <Loader text="Chargement des techniciens..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : techniciens.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucun technicien trouvé</p>
            <p className="text-sm text-neutral-500 mt-1">
              {recherche || statut
                ? 'Essayez de modifier vos filtres'
                : 'Les techniciens inscrits apparaîtront ici'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {techniciens.map((t) => (
              <TechnicienCard key={t._id} technicien={t} onAction={handleAction} />
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

      {/* Modal Rejeter KYC */}
      <Modal
        isOpen={!!modalRejet}
        onClose={() => {
          setModalRejet(null);
          setRaison('');
        }}
        title="Rejeter le KYC"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalRejet(null);
                setRaison('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                rejeterKYCMutation.mutate({ id: modalRejet._id, raison })
              }
              loading={rejeterKYCMutation.isLoading}
              disabled={!raison.trim()}
            >
              Confirmer le rejet
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 mb-4">
          Vous êtes sur le point de rejeter le KYC de{' '}
          <strong>{modalRejet?.prenom} {modalRejet?.nom}</strong>.
        </p>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Raison du rejet *
        </label>
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          placeholder="Documents non conformes, flous, expirés..."
          rows={4}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>

      {/* Modal Suspendre */}
      <Modal
        isOpen={!!modalSuspension}
        onClose={() => {
          setModalSuspension(null);
          setRaison('');
        }}
        title="Suspendre le technicien"
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
              variant="danger"
              onClick={() =>
                suspendreMutation.mutate({ id: modalSuspension._id, raison })
              }
              loading={suspendreMutation.isLoading}
              disabled={!raison.trim()}
            >
              Confirmer la suspension
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 mb-4">
          Vous êtes sur le point de suspendre{' '}
          <strong>{modalSuspension?.prenom} {modalSuspension?.nom}</strong>.
        </p>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Raison de la suspension *
        </label>
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          placeholder="Comportement inapproprié, fraude..."
          rows={4}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>
    </div>
  );
}
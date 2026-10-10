// client/src/pages/admin/GestionEntreprises.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Building2, Mail, Phone,
  MapPin, Users, MoreVertical, Ban, RefreshCw, Award, FileText
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
import { getImageUrl } from '../../utils/helpers.js';

// ============================================================
// LABELS STATUT ENTREPRISE
// ============================================================
const STATUTS_ENTREPRISE_LABELS = {
  en_attente_validation: { label: 'En attente validation', couleur: 'warning' },
  actif: { label: 'Actif', couleur: 'success' },
  suspendu: { label: 'Suspendu', couleur: 'danger' }
};

// ============================================================
// COMPOSANT : Carte entreprise
// ============================================================
function EntrepriseCard({ entreprise, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statutInfo = STATUTS_ENTREPRISE_LABELS[entreprise.statut] || {
    label: entreprise.statut,
    couleur: 'neutral'
  };

  return (
    <Card padding="md" hover>
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-accent-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {entreprise.logo ? (
            <img
              src={getImageUrl(entreprise.logo)}
              alt={entreprise.raisonSociale}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-8 h-8 text-accent-600" />
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">
                {entreprise.raisonSociale}
              </h3>
              {entreprise.secteurActivite && (
                <p className="text-sm text-neutral-500 truncate">
                  {entreprise.secteurActivite}
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
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                    {!entreprise.kycVerifie && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('valider', entreprise);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success-600 hover:bg-success-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider l'entreprise
                      </button>
                    )}

                    {!entreprise.kycVerifie && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('rejeter', entreprise);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning-600 hover:bg-warning-50"
                      >
                        <FileText className="w-4 h-4" />
                        Demander de nouveaux docs
                      </button>
                    )}

                    {entreprise.statut !== 'suspendu' ? (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAction('suspendre', entreprise);
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
                          onAction('reactiver', entreprise);
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

            {entreprise.kycVerifie && (
              <Badge color="success" size="sm">
                <CheckCircle className="w-3 h-3" />
                KYC vérifié
              </Badge>
            )}

            {entreprise.abonnement?.actif && (
              <Badge color="primary" size="sm">
                <Award className="w-3 h-3" />
                Abonné
              </Badge>
            )}

            {entreprise.tailleEntreprise && (
              <Badge color="neutral" size="sm">
                {entreprise.tailleEntreprise}
              </Badge>
            )}
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-neutral-600">
            {entreprise.email && (
              <div className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{entreprise.email}</span>
              </div>
            )}
            {entreprise.telephone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{entreprise.telephone}</span>
              </div>
            )}
            {entreprise.ville && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{entreprise.ville}</span>
              </div>
            )}
            {entreprise.nombreEmployes > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 flex-shrink-0" />
                <span>{entreprise.nombreEmployes} employés</span>
              </div>
            )}
            {entreprise.numeroRCCM && (
              <div className="flex items-center gap-1 col-span-2 truncate">
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">RCCM : {entreprise.numeroRCCM}</span>
              </div>
            )}
          </div>

          {/* Actions principales */}
          <div className="flex gap-2 mt-3">
            <Link to={`/admin/entreprises/${entreprise._id}`} className="flex-1">
              <Button variant="outline" size="sm" fullWidth>
                <Eye className="w-4 h-4 mr-1" />
                Voir détails
              </Button>
            </Link>
            {!entreprise.kycVerifie && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onAction('valider', entreprise)}
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
export default function AdminGestionEntreprises() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('');
  const [modalSuspension, setModalSuspension] = useState(null);
  const [raison, setRaison] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-entreprises', page, recherche, statut],
    queryFn: () =>
      adminApi.getEntreprises({
        page,
        limit: 12,
        q: recherche || undefined,
        statut: statut || undefined
      }),
    keepPreviousData: true
  });

  const validerMutation = useMutation({
    mutationFn: (id) => adminApi.validerEntreprise(id),
    onSuccess: () => {
      toast.success('Entreprise validée avec succès');
      queryClient.invalidateQueries(['admin-entreprises']);
    },
    onError: (err) => toast.error(err.message)
  });

  const rejeterMutation = useMutation({
    mutationFn: (id) => adminApi.rejeterEntreprise(id),
    onSuccess: () => {
      toast.success('Validation rejetée');
      queryClient.invalidateQueries(['admin-entreprises']);
    },
    onError: (err) => toast.error(err.message)
  });

  const suspendreMutation = useMutation({
    mutationFn: ({ id, raison }) => adminApi.suspendreEntreprise(id, raison),
    onSuccess: () => {
      toast.success('Entreprise suspendue');
      queryClient.invalidateQueries(['admin-entreprises']);
      setModalSuspension(null);
      setRaison('');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAction = (action, entreprise) => {
    switch (action) {
      case 'valider':
        if (window.confirm(`Valider ${entreprise.raisonSociale} ?`)) {
          validerMutation.mutate(entreprise._id);
        }
        break;
      case 'rejeter':
        if (window.confirm(`Rejeter la validation de ${entreprise.raisonSociale} ?`)) {
          rejeterMutation.mutate(entreprise._id);
        }
        break;
      case 'suspendre':
        setModalSuspension(entreprise);
        break;
      case 'reactiver':
        if (window.confirm(`Réactiver ${entreprise.raisonSociale} ?`)) {
          validerMutation.mutate(entreprise._id);
        }
        break;
      default:
        break;
    }
  };

  const entreprises = data?.entreprises || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Gestion des entreprises
          </h1>
          <p className="text-neutral-500 mt-1">
            {pagination.total || 0} entreprise(s) enregistrée(s)
          </p>
        </div>
      </div>

      <Card padding="md">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher par nom, email, RCCM..."
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
            <option value="en_attente_validation">En attente validation</option>
            <option value="actif">Actif</option>
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
        <Loader text="Chargement des entreprises..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : entreprises.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucune entreprise trouvée</p>
            <p className="text-sm text-neutral-500 mt-1">
              {recherche || statut
                ? 'Essayez de modifier vos filtres'
                : 'Les entreprises inscrites apparaîtront ici'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {entreprises.map((e) => (
              <EntrepriseCard key={e._id} entreprise={e} onAction={handleAction} />
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

      {/* Modal Suspension */}
      <Modal
        isOpen={!!modalSuspension}
        onClose={() => {
          setModalSuspension(null);
          setRaison('');
        }}
        title="Suspendre l'entreprise"
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
          <strong>{modalSuspension?.raisonSociale}</strong>.
        </p>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Raison de la suspension *
        </label>
        <textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          placeholder="Non-respect des CGU, abus, fraude..."
          rows={4}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>
    </div>
  );
}
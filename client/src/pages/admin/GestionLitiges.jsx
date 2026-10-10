// client/src/pages/admin/GestionLitiges.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, AlertTriangle, XCircle, Eye, Scale, Clock,
  CheckCircle, User, Wrench, MessageSquare, Send, DollarSign
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
import { formatDate, formatDateTime, dateRelative } from '../../utils/helpers.js';

// ============================================================
// LABELS
// ============================================================
const STATUTS_LITIGE = {
  ouvert: { label: 'Ouvert', couleur: 'danger' },
  en_examen: { label: 'En examen', couleur: 'warning' },
  en_mediation: { label: 'En médiation', couleur: 'info' },
  escalade: { label: 'Escaladé', couleur: 'danger' },
  resolu: { label: 'Résolu', couleur: 'success' },
  ferme: { label: 'Fermé', couleur: 'neutral' }
};

const MOTIFS_LITIGE = {
  travail_non_effectue: 'Travail non effectué',
  travail_mal_effectue: 'Travail mal effectué',
  retard: 'Retard',
  comportement_inapproprie: 'Comportement inapproprié',
  prix_non_respecte: 'Prix non respecté',
  non_paiement: 'Non-paiement',
  annulation_abusive: 'Annulation abusive',
  degats_materiels: 'Dégâts matériels',
  communication_difficile: 'Communication difficile',
  autre: 'Autre'
};

const PRIORITES = {
  basse: { label: 'Basse', couleur: 'neutral' },
  normale: { label: 'Normale', couleur: 'info' },
  haute: { label: 'Haute', couleur: 'warning' },
  urgente: { label: 'Urgente', couleur: 'danger' }
};

// ============================================================
// COMPOSANT : Carte litige
// ============================================================
function LitigeCard({ litige, onClick }) {
  const statutInfo = STATUTS_LITIGE[litige.statut] || STATUTS_LITIGE.ouvert;
  const prioriteInfo = PRIORITES[litige.priorite] || PRIORITES.normale;
  const enRetard = litige.dateLimiteTraitement
    && new Date(litige.dateLimiteTraitement) < new Date()
    && litige.statut !== 'resolu';

  return (
    <Card padding="md" hover onClick={() => onClick(litige)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <Badge color={statutInfo.couleur} size="sm">
            {statutInfo.label}
          </Badge>
          <Badge color={prioriteInfo.couleur} size="sm">
            {prioriteInfo.label}
          </Badge>
          {enRetard && (
            <Badge color="danger" size="sm">
              <Clock className="w-3 h-3" />
              En retard
            </Badge>
          )}
        </div>
        <span className="text-xs text-neutral-400 flex-shrink-0">
          {dateRelative(litige.createdAt)}
        </span>
      </div>

      {/* Motif */}
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-4 h-4 text-danger-500" />
        <span className="font-semibold text-sm text-neutral-900">
          {MOTIFS_LITIGE[litige.motif] || litige.motif}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
        {litige.description}
      </p>

      {/* Parties */}
      <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {litige.client?.prenom} {litige.client?.nom}
        </span>
        <span className="text-neutral-300">vs</span>
        <span className="flex items-center gap-1">
          <Wrench className="w-3 h-3" />
          {litige.technicien?.prenom} {litige.technicien?.nom}
        </span>
      </div>

      {/* Montant */}
      {litige.montantLitige > 0 && (
        <div className="flex items-center gap-1 text-xs">
          <DollarSign className="w-3 h-3 text-accent-500" />
          <span className="font-semibold text-neutral-700">
            {new Intl.NumberFormat('fr-FR').format(litige.montantLitige)}{' '}
            {litige.devise || 'XAF'}
          </span>
        </div>
      )}

      {/* Assigné */}
      {litige.assigneA && (
        <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
          Assigné à <strong>{litige.assigneA.prenom} {litige.assigneA.nom}</strong>
        </div>
      )}
    </Card>
  );
}

// ============================================================
// MODAL : Détail du litige
// ============================================================
function ModalDetailLitige({ litige, onClose, onDecision }) {
  const [nouveauMessage, setNouveauMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-litige', litige?._id],
    queryFn: () => adminApi.getLitige(litige._id),
    enabled: !!litige?._id
  });

  const litigeComplet = detail?.litige || litige;
  const statutInfo = STATUTS_LITIGE[litigeComplet?.statut] || STATUTS_LITIGE.ouvert;

  if (!litige) return null;

  return (
    <Modal
      isOpen={!!litige}
      onClose={onClose}
      title="Détail du litige"
      size="xl"
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Badge color={statutInfo.couleur}>
                {statutInfo.label}
              </Badge>
              <h3 className="text-lg font-bold text-neutral-900 mt-2">
                {MOTIFS_LITIGE[litigeComplet.motif] || litigeComplet.motif}
              </h3>
              <p className="text-sm text-neutral-500">
                Ouvert le {formatDateTime(litigeComplet.createdAt)}
              </p>
            </div>
            {litigeComplet.montantLitige > 0 && (
              <div className="text-right">
                <p className="text-xs text-neutral-500">Montant en jeu</p>
                <p className="text-xl font-bold text-accent-600">
                  {new Intl.NumberFormat('fr-FR').format(litigeComplet.montantLitige)}{' '}
                  {litigeComplet.devise}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm font-medium text-neutral-700 mb-2">
              Description
            </p>
            <p className="text-sm text-neutral-600 whitespace-pre-line">
              {litigeComplet.description}
            </p>
          </div>

          {/* Parties */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-neutral-200 rounded-lg">
              <p className="text-xs text-neutral-500 mb-2">CLIENT</p>
              <p className="font-semibold">
                {litigeComplet.client?.prenom} {litigeComplet.client?.nom}
              </p>
              <p className="text-sm text-neutral-500">{litigeComplet.client?.email}</p>
              {litigeComplet.client?.telephone && (
                <p className="text-sm text-neutral-500">{litigeComplet.client.telephone}</p>
              )}
            </div>

            <div className="p-4 border border-neutral-200 rounded-lg">
              <p className="text-xs text-neutral-500 mb-2">TECHNICIEN</p>
              <p className="font-semibold">
                {litigeComplet.technicien?.prenom} {litigeComplet.technicien?.nom}
              </p>
              <p className="text-sm text-neutral-500">{litigeComplet.technicien?.email}</p>
              {litigeComplet.technicien?.numeroNINTI && (
                <p className="text-sm font-mono text-primary-600">
                  {litigeComplet.technicien.numeroNINTI}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          {litigeComplet.messages && litigeComplet.messages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation ({litigeComplet.messages.length})
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {litigeComplet.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      msg.roleAuteur === 'admin'
                        ? 'bg-primary-50 border border-primary-100'
                        : 'bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-neutral-700 capitalize">
                        {msg.roleAuteur}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {dateRelative(msg.date)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{msg.contenu}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Décision */}
          {litigeComplet.decision?.prise ? (
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="font-semibold text-success-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Décision rendue
              </p>
              <p className="text-sm text-success-700 mb-2">
                En faveur de : <strong>{litigeComplet.decision.enFaveurDe}</strong>
              </p>
              <p className="text-sm text-success-700">
                {litigeComplet.decision.description}
              </p>
              {litigeComplet.decision.remboursement > 0 && (
                <p className="text-sm text-success-700 mt-2">
                  Remboursement : {litigeComplet.decision.remboursement} {litigeComplet.devise}
                </p>
              )}
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button
                variant="primary"
                onClick={() => onDecision(litigeComplet)}
              >
                <Scale className="w-4 h-4 mr-2" />
                Rendre une décision
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// MODAL : Rendre une décision
// ============================================================
function ModalDecision({ litige, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    enFaveurDe: 'client',
    description: '',
    remboursement: 0,
    avertissementTechnicien: false,
    avertissementClient: false,
    suspensionTechnicien: false
  });

  const mutation = useMutation({
    mutationFn: (data) => adminApi.rendreDecisionLitige(litige._id, data),
    onSuccess: () => {
      toast.success('Décision enregistrée');
      queryClient.invalidateQueries(['admin-litiges']);
      queryClient.invalidateQueries(['admin-litige', litige._id]);
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('La description de la décision est obligatoire');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Modal
      isOpen={!!litige}
      onClose={onClose}
      title="Rendre une décision"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={mutation.isLoading}
          >
            Confirmer la décision
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* En faveur de */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Décision en faveur de *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['client', 'technicien', 'partage'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm({ ...form, enFaveurDe: val })}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${form.enFaveurDe === val
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }
                `}
              >
                {val === 'client' && 'Client'}
                {val === 'technicien' && 'Technicien'}
                {val === 'partage' && 'Partage'}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Description de la décision *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Expliquez votre décision et les actions à entreprendre..."
            rows={5}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Remboursement */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Remboursement (XAF)
          </label>
          <input
            type="number"
            min="0"
            value={form.remboursement}
            onChange={(e) => setForm({ ...form, remboursement: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sanctions */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Sanctions
          </label>
          <div className="space-y-2">
            {[
              { key: 'avertissementTechnicien', label: 'Avertir le technicien' },
              { key: 'avertissementClient', label: 'Avertir le client' },
              { key: 'suspensionTechnicien', label: 'Suspendre le technicien' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-neutral-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function AdminGestionLitiges() {
  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('ouvert');
  const [litigeSelectionne, setLitigeSelectionne] = useState(null);
  const [modalDecision, setModalDecision] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-litiges', page, statut],
    queryFn: () =>
      adminApi.getLitiges({
        page,
        limit: 12,
        statut: statut || undefined
      }),
    keepPreviousData: true
  });

  const litiges = data?.litiges || [];
  const pagination = data?.pagination || {};

  // Filtrer par recherche côté client (pour simplifier)
  const litigesFiltres = recherche
    ? litiges.filter((l) =>
        l.motif?.toLowerCase().includes(recherche.toLowerCase()) ||
        l.description?.toLowerCase().includes(recherche.toLowerCase()) ||
        l.client?.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
        l.technicien?.nom?.toLowerCase().includes(recherche.toLowerCase())
      )
    : litiges;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Gestion des litiges
          </h1>
          <p className="text-neutral-500 mt-1">
            {pagination.total || 0} litige(s) enregistré(s)
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher par motif, nom, description..."
            icon={Search}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
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
            <option value="ouvert">Ouvert</option>
            <option value="en_examen">En examen</option>
            <option value="en_mediation">En médiation</option>
            <option value="escalade">Escaladé</option>
            <option value="resolu">Résolu</option>
            <option value="ferme">Fermé</option>
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
        <Loader text="Chargement des litiges..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : litigesFiltres.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Scale className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucun litige trouvé</p>
            <p className="text-sm text-neutral-500 mt-1">
              {recherche || statut
                ? 'Essayez de modifier vos filtres'
                : 'Les litiges ouverts apparaîtront ici'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {litigesFiltres.map((l) => (
              <LitigeCard
                key={l._id}
                litige={l}
                onClick={setLitigeSelectionne}
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

      {/* Modal Détail */}
      {litigeSelectionne && (
        <ModalDetailLitige
          litige={litigeSelectionne}
          onClose={() => setLitigeSelectionne(null)}
          onDecision={(l) => {
            setModalDecision(l);
          }}
        />
      )}

      {/* Modal Décision */}
      {modalDecision && (
        <ModalDecision
          litige={modalDecision}
          onClose={() => {
            setModalDecision(null);
            setLitigeSelectionne(null);
          }}
        />
      )}
    </div>
  );
}
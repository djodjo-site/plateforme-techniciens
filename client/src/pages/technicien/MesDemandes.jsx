// client/src/pages/technicien/MesDemandes.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, FileText, MapPin, DollarSign, XCircle, Send, Eye,
  User, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as technicienApi from '../../api/technicienApi.js';
import * as demandeApi from '../../api/demandeApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { CATEGORIES_COMPETENCES, URGENCE_LABELS, DEVISES } from '../../utils/constants.js';
import { formatMontant, dateRelative } from '../../utils/helpers.js';

// ============================================================
// CARTE DEMANDE
// ============================================================
function DemandeCard({ demande, onOffrir, onVoirDetail }) {
  const urgenceInfo = URGENCE_LABELS[demande.urgence] || {
    label: demande.urgence,
    couleur: 'neutral'
  };

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <Badge color="primary" size="sm">{demande.categorie}</Badge>
          <Badge color={urgenceInfo.couleur} size="sm">{urgenceInfo.label}</Badge>
          {demande.distanceKm !== undefined && (
            <Badge color="neutral" size="sm">
              <MapPin className="w-3 h-3" />
              {demande.distanceKm} km
            </Badge>
          )}
        </div>
        <span className="text-xs text-neutral-400 flex-shrink-0">
          {dateRelative(demande.createdAt)}
        </span>
      </div>

      <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
        {demande.titre}
      </h3>

      <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
        {demande.description}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-xs text-neutral-600">
        {demande.localisation?.ville && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate">{demande.localisation.ville}</span>
          </div>
        )}
        {demande.budget?.max > 0 && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate">
              {formatMontant(demande.budget.min || 0, demande.budget.devise)} — {formatMontant(demande.budget.max, demande.budget.devise)}
            </span>
          </div>
        )}
        {demande.dateSouhaitee && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
            <span className="truncate">
              {new Date(demande.dateSouhaitee).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
          <span className="truncate">
            {demande.client?.prenom} {demande.client?.nom}
          </span>
        </div>
      </div>

      {demande.competencesRequises?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {demande.competencesRequises.slice(0, 3).map((comp) => (
            <span key={comp} className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
              {comp}
            </span>
          ))}
          {demande.competencesRequises.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
              +{demande.competencesRequises.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-neutral-100">
        <Button variant="outline" size="sm" onClick={() => onVoirDetail(demande)} className="flex-1">
          <Eye className="w-4 h-4 mr-1" />
          Détails
        </Button>
        <Button variant="primary" size="sm" onClick={() => onOffrir(demande)} className="flex-1">
          <Send className="w-4 h-4 mr-1" />
          Faire une offre
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienMesDemandes() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('');
  const [urgence, setUrgence] = useState('');
  const [demandeDetail, setDemandeDetail] = useState(null);
  const [demandeOffre, setDemandeOffre] = useState(null);
  const [offreForm, setOffreForm] = useState({
    message: '',
    prix: 0,
    devise: 'XAF',
    delaiHeures: 24
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['demandes-disponibles', page, categorie, urgence],
    queryFn: () =>
      technicienApi.getDemandesDisponibles({
        page,
        limit: 12,
        categorie: categorie || undefined,
        urgence: urgence || undefined
      }),
    keepPreviousData: true
  });

  const offreMutation = useMutation({
    mutationFn: ({ demandeId, offre }) => demandeApi.soumettreOffre(demandeId, offre),
    onSuccess: () => {
      toast.success('Offre envoyée avec succès !');
      queryClient.invalidateQueries(['demandes-disponibles']);
      setDemandeOffre(null);
      setOffreForm({ message: '', prix: 0, devise: 'XAF', delaiHeures: 24 });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSoumettreOffre = () => {
    if (!offreForm.prix || offreForm.prix <= 0) {
      toast.error('Veuillez saisir un prix valide');
      return;
    }
    offreMutation.mutate({
      demandeId: demandeOffre._id,
      offre: offreForm
    });
  };

  const demandes = (data?.demandes || []).filter((d) => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      d.titre?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.localisation?.ville?.toLowerCase().includes(q)
    );
  });

  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Demandes disponibles
          </h1>
          <p className="text-neutral-500 mt-1">
            {pagination.total || demandes.length} demande(s) correspondant à votre profil
          </p>
        </div>
      </div>

      <Card padding="md">
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            placeholder="Rechercher..."
            icon={Search}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <select
            value={categorie}
            onChange={(e) => { setCategorie(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES_COMPETENCES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={urgence}
            onChange={(e) => { setUrgence(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes urgences</option>
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setRecherche('');
              setCategorie('');
              setUrgence('');
              setPage(1);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Loader text="Chargement des demandes..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : demandes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucune demande disponible</p>
            <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
              {recherche || categorie || urgence
                ? 'Essayez de modifier vos filtres'
                : 'Les nouvelles demandes correspondant à vos compétences et à votre zone d\'intervention apparaîtront ici.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {demandes.map((d) => (
              <DemandeCard
                key={d._id}
                demande={d}
                onOffrir={setDemandeOffre}
                onVoirDetail={setDemandeDetail}
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
        isOpen={!!demandeDetail}
        onClose={() => setDemandeDetail(null)}
        title="Détails de la demande"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDemandeDetail(null)}>Fermer</Button>
            <Button
              variant="primary"
              onClick={() => {
                setDemandeOffre(demandeDetail);
                setDemandeDetail(null);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Faire une offre
            </Button>
          </>
        }
      >
        {demandeDetail && (
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge color="primary">{demandeDetail.categorie}</Badge>
                <Badge color={URGENCE_LABELS[demandeDetail.urgence]?.couleur}>
                  {URGENCE_LABELS[demandeDetail.urgence]?.label}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{demandeDetail.titre}</h3>
              <p className="text-sm text-neutral-600 whitespace-pre-line">
                {demandeDetail.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
              {demandeDetail.localisation?.ville && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Localisation</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    {demandeDetail.localisation.ville}
                  </p>
                </div>
              )}
              {demandeDetail.budget?.max > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Budget</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-neutral-400" />
                    {formatMontant(demandeDetail.budget.min || 0, demandeDetail.budget.devise)} — {formatMontant(demandeDetail.budget.max, demandeDetail.budget.devise)}
                  </p>
                </div>
              )}
              {demandeDetail.dateSouhaitee && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Date souhaitée</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    {new Date(demandeDetail.dateSouhaitee).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-neutral-500 mb-1">Client</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" />
                  {demandeDetail.client?.prenom} {demandeDetail.client?.nom}
                </p>
              </div>
            </div>

            {demandeDetail.competencesRequises?.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">Compétences requises</p>
                <div className="flex flex-wrap gap-2">
                  {demandeDetail.competencesRequises.map((c) => (
                    <Badge key={c} color="neutral" size="sm">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {demandeDetail.offres?.length > 0 && (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-900">
                  <strong>{demandeDetail.offres.length}</strong> offre(s) déjà soumise(s)
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Faire une offre */}
      <Modal
        isOpen={!!demandeOffre}
        onClose={() => setDemandeOffre(null)}
        title="Soumettre une offre"
        footer={
          <>
            <Button variant="outline" onClick={() => setDemandeOffre(null)}>Annuler</Button>
            <Button
              variant="primary"
              onClick={handleSoumettreOffre}
              loading={offreMutation.isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer l'offre
            </Button>
          </>
        }
      >
        {demandeOffre && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">Demande concernée</p>
              <p className="text-sm font-semibold text-neutral-900">{demandeOffre.titre}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Votre prix *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={offreForm.prix}
                  onChange={(e) => setOffreForm({ ...offreForm, prix: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Devise</label>
                <select
                  value={offreForm.devise}
                  onChange={(e) => setOffreForm({ ...offreForm, devise: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {DEVISES.map((d) => (
                    <option key={d.code} value={d.code}>{d.symbole}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Délai d'intervention (heures)
              </label>
              <input
                type="number"
                min="1"
                value={offreForm.delaiHeures}
                onChange={(e) => setOffreForm({ ...offreForm, delaiHeures: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message au client
              </label>
              <textarea
                value={offreForm.message}
                onChange={(e) => setOffreForm({ ...offreForm, message: e.target.value })}
                placeholder="Présentez votre approche, votre expérience..."
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-500 mt-1">{offreForm.message.length}/1000 caractères</p>
            </div>

            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-xs text-primary-800">
                💡 Un message personnalisé augmente vos chances d'être sélectionné.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
// client/src/pages/entreprise/Annuaire.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, MapPin, Star, Award, Briefcase, Eye, Send,
  XCircle, SlidersHorizontal, Shield, Phone, Mail, Clock, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as annuaireApi from '../../api/annuaireApi.js';
import * as entrepriseApi from '../../api/entrepriseApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { CATEGORIES_COMPETENCES } from '../../utils/constants.js';
import { formatMontant, getInitiales, getImageUrl } from '../../utils/helpers.js';

// ============================================================
// CARTE TECHNICIEN
// ============================================================
function TechnicienCard({ technicien, onVoir, onContacter, onFavori, estFavori }) {
  const stats = technicien.statistiques || {};

  return (
    <Card padding="md" hover>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
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

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-neutral-900 truncate">
              {technicien.prenom} {technicien.nom}
            </h3>
            {stats.noteMoyenne > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                <span className="text-sm font-semibold">
                  {stats.noteMoyenne.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {technicien.titreProfessionnel && (
            <p className="text-sm text-neutral-500 truncate">
              {technicien.titreProfessionnel}
            </p>
          )}

          {technicien.numeroNINTI && (
            <p className="text-xs font-mono text-primary-600 mt-1">
              {technicien.numeroNINTI}
            </p>
          )}
        </div>
      </div>

      {/* Localisation */}
      {technicien.ville && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{technicien.ville}</span>
          {technicien.distanceKm !== undefined && (
            <span className="text-neutral-400">• {technicien.distanceKm} km</span>
          )}
        </div>
      )}

      {/* Catégories */}
      {technicien.categories?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {technicien.categories.slice(0, 2).map((cat) => (
            <Badge key={cat} color="primary" size="sm">{cat}</Badge>
          ))}
          {technicien.categories.length > 2 && (
            <Badge color="neutral" size="sm">
              +{technicien.categories.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Compétences */}
      {technicien.competences?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {technicien.competences.slice(0, 3).map((comp) => (
            <span
              key={comp}
              className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full"
            >
              {comp}
            </span>
          ))}
          {technicien.competences.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
              +{technicien.competences.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Infos */}
      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 mb-4 pt-3 border-t border-neutral-100">
        {technicien.tarifs?.horaire > 0 && (
          <div>
            <span className="text-neutral-400">Tarif :</span>
            <p className="font-semibold text-neutral-700">
              {formatMontant(technicien.tarifs.horaire, technicien.tarifs.devise)}/h
            </p>
          </div>
        )}
        {stats.nombreMissions > 0 && (
          <div>
            <span className="text-neutral-400">Missions :</span>
            <p className="font-semibold text-neutral-700">{stats.nombreMissions}</p>
          </div>
        )}
        {technicien.anneesExperience > 0 && (
          <div>
            <span className="text-neutral-400">Expérience :</span>
            <p className="font-semibold text-neutral-700">{technicien.anneesExperience} ans</p>
          </div>
        )}
        {technicien.disponible && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-success-500 rounded-full" />
            <span className="text-success-600 font-medium">Disponible</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onVoir(technicien)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          Profil
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onContacter(technicien)}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-1" />
          Contacter
        </Button>
        <Button
          variant={estFavori ? 'warning' : 'outline'}
          size="sm"
          onClick={() => onFavori(technicien)}
          title={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star className={`w-4 h-4 ${estFavori ? 'fill-white' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function EntrepriseAnnuaire() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('');
  const [ville, setVille] = useState('');
  const [noteMin, setNoteMin] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [showFiltres, setShowFiltres] = useState(false);
  const [modalContact, setModalContact] = useState(null);
  const [messageContact, setMessageContact] = useState('');

  // Récupération des techniciens
  const { data, isLoading, error } = useQuery({
    queryKey: ['annuaire', page, recherche, categorie, ville, noteMin, disponible],
    queryFn: () =>
      annuaireApi.rechercherTechniciens({
        page,
        limit: 12,
        q: recherche || undefined,
        categories: categorie || undefined,
        ville: ville || undefined,
        noteMinimum: noteMin || undefined,
        disponible: disponible || undefined,
        tri: 'note'
      }),
    keepPreviousData: true
  });

  // Récupération des favoris
  const { data: favorisData } = useQuery({
    queryKey: ['entreprise-favoris'],
    queryFn: entrepriseApi.getMesFavoris
  });

  const favorisIds = (favorisData?.favoris || []).map((f) => f.technicien?._id);

  // Mutations favoris
  const ajouterFavoriMutation = useMutation({
    mutationFn: (id) => entrepriseApi.ajouterFavori(id),
    onSuccess: () => {
      toast.success('Ajouté aux favoris');
      queryClient.invalidateQueries(['entreprise-favoris']);
    },
    onError: (err) => toast.error(err.message)
  });

  const retirerFavoriMutation = useMutation({
    mutationFn: (id) => entrepriseApi.retirerFavori(id),
    onSuccess: () => {
      toast.success('Retiré des favoris');
      queryClient.invalidateQueries(['entreprise-favoris']);
    },
    onError: (err) => toast.error(err.message)
  });

  // Mutation contact
  const contacterMutation = useMutation({
    mutationFn: ({ id, message }) => annuaireApi.contacterTechnicien(id, message),
    onSuccess: () => {
      toast.success('Message envoyé au technicien');
      setModalContact(null);
      setMessageContact('');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleFavori = (technicien) => {
    if (favorisIds.includes(technicien._id)) {
      retirerFavoriMutation.mutate(technicien._id);
    } else {
      ajouterFavoriMutation.mutate(technicien._id);
    }
  };

  const handleContacter = () => {
    if (!messageContact.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }
    contacterMutation.mutate({
      id: modalContact._id,
      message: messageContact.trim()
    });
  };

  const techniciens = data?.techniciens || [];
  const pagination = data?.pagination || {};

  const reinitialiser = () => {
    setRecherche('');
    setCategorie('');
    setVille('');
    setNoteMin('');
    setDisponible(false);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Annuaire des techniciens
        </h1>
        <p className="text-neutral-500 mt-1">
          {pagination.total || 0} technicien(s) certifié(s)
        </p>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Rechercher par nom, NINTI, compétence..."
              icon={Search}
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
            />
          </div>

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

          <Button
            variant="outline"
            onClick={() => setShowFiltres(!showFiltres)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {showFiltres ? 'Masquer' : 'Plus de filtres'}
          </Button>
        </div>

        {showFiltres && (
          <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
            <Input
              placeholder="Ville"
              icon={MapPin}
              value={ville}
              onChange={(e) => { setVille(e.target.value); setPage(1); }}
            />

            <select
              value={noteMin}
              onChange={(e) => { setNoteMin(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Note minimum</option>
              <option value="4">4+ étoiles</option>
              <option value="3">3+ étoiles</option>
              <option value="2">2+ étoiles</option>
            </select>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={disponible}
                onChange={(e) => { setDisponible(e.target.checked); setPage(1); }}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-neutral-700">Disponible uniquement</span>
            </label>

            <Button variant="outline" onClick={reinitialiser}>
              <Filter className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        )}
      </Card>

      {/* Contenu */}
      {isLoading ? (
        <Loader text="Recherche des techniciens..." />
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
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">
              Aucun technicien trouvé
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Essayez de modifier vos filtres
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techniciens.map((tech) => (
              <TechnicienCard
                key={tech._id}
                technicien={tech}
                onVoir={() => navigate(`/entreprise/technicien/${tech._id}`)}
                onContacter={setModalContact}
                onFavori={handleFavori}
                estFavori={favorisIds.includes(tech._id)}
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

      {/* Modal Contact */}
      <Modal
        isOpen={!!modalContact}
        onClose={() => {
          setModalContact(null);
          setMessageContact('');
        }}
        title="Contacter le technicien"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalContact(null);
                setMessageContact('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleContacter}
              loading={contacterMutation.isLoading}
              disabled={!messageContact.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </>
        }
      >
        {modalContact && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {modalContact.photo ? (
                  <img
                    src={getImageUrl(modalContact.photo)}
                    alt={modalContact.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-700 font-bold">
                    {getInitiales(modalContact)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {modalContact.prenom} {modalContact.nom}
                </p>
                <p className="text-sm text-neutral-500">
                  {modalContact.titreProfessionnel || modalContact.ville}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Votre message *
              </label>
              <textarea
                value={messageContact}
                onChange={(e) => setMessageContact(e.target.value)}
                placeholder="Décrivez votre besoin, la mission envisagée..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {messageContact.length}/1000 caractères
              </p>
            </div>

            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-xs text-primary-800">
                💡 Le technicien recevra votre message par notification et email.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
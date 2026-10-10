// client/src/pages/technicien/MesAvis.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, Search, Filter, MessageSquare, TrendingUp, Award,
  ThumbsUp, Reply, XCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as avisApi from '../../api/avisApi.js';
import * as technicienApi from '../../api/technicienApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { getInitiales, getImageUrl, dateRelative } from '../../utils/helpers.js';

// ============================================================
// COMPOSANT : ÉTOILES
// ============================================================
function Etoiles({ note, size = 'md' }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sizes[size]} ${
            n <= note ? 'text-accent-500 fill-accent-500' : 'text-neutral-300'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================
// COMPOSANT : CARTE AVIS
// ============================================================
function AvisCard({ avis, onRepondre }) {
  const auteur = avis.auteur || {};

  return (
    <Card padding="md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {auteur.photo ? (
              <img
                src={getImageUrl(auteur.photo)}
                alt={auteur.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary-700 font-semibold text-sm">
                {getInitiales(auteur)}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              {auteur.prenom} {auteur.nom}
            </p>
            {auteur.ville && (
              <p className="text-xs text-neutral-500">{auteur.ville}</p>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <Etoiles note={avis.note} size="sm" />
          <p className="text-xs text-neutral-400 mt-1">
            {dateRelative(avis.createdAt)}
          </p>
        </div>
      </div>

      {/* Titre */}
      {avis.titre && (
        <h3 className="font-semibold text-neutral-900 mb-2">
          {avis.titre}
        </h3>
      )}

      {/* Commentaire */}
      <p className="text-sm text-neutral-600 whitespace-pre-line mb-4">
        {avis.commentaire}
      </p>

      {/* Critères */}
      {avis.criteres && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {avis.criteres.qualite && (
            <div className="flex items-center justify-between text-xs p-2 bg-neutral-50 rounded">
              <span className="text-neutral-600">Qualité</span>
              <span className="font-semibold">{avis.criteres.qualite}/5</span>
            </div>
          )}
          {avis.criteres.rapidite && (
            <div className="flex items-center justify-between text-xs p-2 bg-neutral-50 rounded">
              <span className="text-neutral-600">Rapidité</span>
              <span className="font-semibold">{avis.criteres.rapidite}/5</span>
            </div>
          )}
          {avis.criteres.communication && (
            <div className="flex items-center justify-between text-xs p-2 bg-neutral-50 rounded">
              <span className="text-neutral-600">Communication</span>
              <span className="font-semibold">{avis.criteres.communication}/5</span>
            </div>
          )}
          {avis.criteres.prix && (
            <div className="flex items-center justify-between text-xs p-2 bg-neutral-50 rounded">
              <span className="text-neutral-600">Prix</span>
              <span className="font-semibold">{avis.criteres.prix}/5</span>
            </div>
          )}
        </div>
      )}

      {/* Recommandation */}
      {avis.recommande !== undefined && (
        <div className="mb-3">
          {avis.recommande ? (
            <Badge color="success" size="sm">
              <CheckCircle className="w-3 h-3" />
              Recommande
            </Badge>
          ) : (
            <Badge color="danger" size="sm">
              <XCircle className="w-3 h-3" />
              Ne recommande pas
            </Badge>
          )}
        </div>
      )}

      {/* Réponse existante */}
      {avis.reponse?.contenu ? (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="bg-primary-50 border-l-4 border-primary-500 p-3 rounded-r-lg">
            <p className="text-xs font-semibold text-primary-900 mb-1 flex items-center gap-1">
              <Reply className="w-3 h-3" />
              Votre réponse
            </p>
            <p className="text-sm text-primary-800">{avis.reponse.contenu}</p>
            <p className="text-xs text-primary-600 mt-1">
              {dateRelative(avis.reponse.date)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRepondre(avis)}
          >
            <Reply className="w-4 h-4 mr-1" />
            Répondre à cet avis
          </Button>
        </div>
      )}
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienMesAvis() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [noteFiltre, setNoteFiltre] = useState('');
  const [avisARepondre, setAvisARepondre] = useState(null);
  const [reponse, setReponse] = useState('');

  // Statistiques du profil (note moyenne, nombre d'avis)
  const { data: profilData } = useQuery({
    queryKey: ['technicien-profil-avis'],
    queryFn: technicienApi.getProfil
  });

  // Liste des avis
  const { data, isLoading, error } = useQuery({
    queryKey: ['mes-avis', page],
    queryFn: () => avisApi.getAvisTechnicien(user?._id, { page, limit: 10 }),
    enabled: !!user?._id,
    keepPreviousData: true
  });

  // Mutation : répondre à un avis
  const repondreMutation = useMutation({
    mutationFn: ({ avisId, contenu }) =>
      technicienApi.repondreAvis(avisId, contenu),
    onSuccess: () => {
      toast.success('Réponse publiée');
      queryClient.invalidateQueries(['mes-avis']);
      setAvisARepondre(null);
      setReponse('');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleRepondre = () => {
    if (!reponse.trim()) {
      toast.error('Votre réponse ne peut pas être vide');
      return;
    }
    repondreMutation.mutate({
      avisId: avisARepondre._id,
      contenu: reponse.trim()
    });
  };

  const statistiques = profilData?.technicien?.statistiques || {};

  // Filtrer localement
  const avisFiltres = (data?.avis || []).filter((a) => {
    if (recherche) {
      const q = recherche.toLowerCase();
      const match =
        a.commentaire?.toLowerCase().includes(q) ||
        a.titre?.toLowerCase().includes(q) ||
        a.auteur?.nom?.toLowerCase().includes(q) ||
        a.auteur?.prenom?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (noteFiltre && a.note !== parseInt(noteFiltre)) return false;
    return true;
  });

  const repartition = data?.repartition || [];
  const pagination = data?.pagination || {};

  const noteMoyenne = statistiques.noteMoyenne || 0;
  const nombreAvis = statistiques.nombreAvis || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Mes avis
        </h1>
        <p className="text-neutral-500 mt-1">
          Les retours de vos clients sur vos missions
        </p>
      </div>

      {/* Résumé note */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card padding="md" className="md:col-span-1">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-8 h-8 text-accent-500 fill-accent-500" />
              <span className="text-4xl font-bold text-neutral-900">
                {noteMoyenne > 0 ? noteMoyenne.toFixed(1) : '—'}
              </span>
              <span className="text-lg text-neutral-400">/ 5</span>
            </div>
            <Etoiles note={Math.round(noteMoyenne)} size="lg" />
            <p className="text-sm text-neutral-500 mt-3">
              Basée sur <strong>{nombreAvis}</strong> avis
            </p>
          </div>
        </Card>

        <Card padding="md" className="md:col-span-2">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Répartition des notes
          </h3>
          {nombreAvis > 0 ? (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const item = repartition.find((r) => r._id === n);
                const count = item?.nombre || 0;
                const pct = nombreAvis > 0 ? (count / nombreAvis) * 100 : 0;

                return (
                  <div key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-8 flex items-center gap-0.5 text-neutral-600">
                      {n} <Star className="w-3 h-3 fill-accent-500 text-accent-500" />
                    </span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-neutral-500 text-xs">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-6">
              Aucune donnée disponible
            </p>
          )}
        </Card>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher dans les avis..."
            icon={Search}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <select
            value={noteFiltre}
            onChange={(e) => setNoteFiltre(e.target.value)}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setRecherche('');
              setNoteFiltre('');
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Contenu */}
      {isLoading ? (
        <Loader text="Chargement des avis..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : avisFiltres.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">
              {recherche || noteFiltre ? 'Aucun avis correspondant' : 'Aucun avis pour le moment'}
            </p>
            <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
              {recherche || noteFiltre
                ? 'Essayez de modifier vos filtres'
                : 'Les avis de vos clients apparaîtront ici après vos premières missions.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {avisFiltres.map((avis) => (
              <AvisCard
                key={avis._id}
                avis={avis}
                onRepondre={setAvisARepondre}
              />
            ))}
          </div>

          <Pagination
            page={pagination.page || 1}
            totalPages={pagination.totalPages || 1}
            total={pagination.total || 0}
            limit={pagination.limit || 10}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Modal Répondre */}
      <Modal
        isOpen={!!avisARepondre}
        onClose={() => {
          setAvisARepondre(null);
          setReponse('');
        }}
        title="Répondre à l'avis"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setAvisARepondre(null);
                setReponse('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleRepondre}
              loading={repondreMutation.isLoading}
              disabled={!reponse.trim()}
            >
              <Reply className="w-4 h-4 mr-2" />
              Publier la réponse
            </Button>
          </>
        }
      >
        {avisARepondre && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">
                Avis de {avisARepondre.auteur?.prenom} {avisARepondre.auteur?.nom}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <Etoiles note={avisARepondre.note} size="sm" />
                <span className="text-sm font-semibold text-neutral-700">
                  {avisARepondre.note}/5
                </span>
              </div>
              <p className="text-sm text-neutral-600 line-clamp-3">
                {avisARepondre.commentaire}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Votre réponse *
              </label>
              <textarea
                value={reponse}
                onChange={(e) => setReponse(e.target.value)}
                placeholder="Remerciez le client, expliquez votre point de vue..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {reponse.length}/1000 caractères
              </p>
            </div>

            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-xs text-primary-800">
                💡 Une réponse professionnelle et courtoise améliore votre image.
                Restez toujours respectueux, même face à un avis négatif.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
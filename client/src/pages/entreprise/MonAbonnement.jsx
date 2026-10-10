// client/src/pages/entreprise/MonAbonnement.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award, CheckCircle, AlertCircle, Clock, TrendingUp, XCircle,
  Crown, Zap, Star, Shield, Users, Search, MessageSquare, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as entrepriseApi from '../../api/entrepriseApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { formatMontant, formatDate } from '../../utils/helpers.js';

// ============================================================
// CONFIGURATION DES PLANS
// ============================================================
const PLANS = [
  {
    id: 'mensuel',
    nom: 'Mensuel',
    prix: 50000,
    devise: 'XAF',
    duree: '1 mois',
    couleur: 'primary',
    populaire: false,
    avantages: [
      'Accès illimité à l\'annuaire',
      '500 consultations / mois',
      '100 contacts directs / mois',
      'Recherche avancée',
      'Support email'
    ]
  },
  {
    id: 'annuel',
    nom: 'Annuel',
    prix: 500000,
    devise: 'XAF',
    duree: '12 mois',
    couleur: 'success',
    populaire: true,
    economie: 'Économisez 100 000 XAF',
    avantages: [
      'Tout le plan Mensuel',
      'Consultations illimitées',
      'Contacts illimités',
      'Missions illimitées',
      'Support prioritaire',
      'Rapport mensuel détaillé'
    ]
  }
];

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function EntrepriseMonAbonnement() {
  const queryClient = useQueryClient();
  const [modalSouscrire, setModalSouscrire] = useState(null);
  const [modalAnnuler, setModalAnnuler] = useState(false);
  const [raisonAnnulation, setRaisonAnnulation] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['entreprise-abonnement'],
    queryFn: entrepriseApi.getMonAbonnement
  });

  const souscrireMutation = useMutation({
    mutationFn: (type) => entrepriseApi.souscrireAbonnement(type),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success('Abonnement activé !');
        queryClient.invalidateQueries(['entreprise-abonnement']);
        setModalSouscrire(null);
      }
    },
    onError: (err) => toast.error(err.message)
  });

  const annulerMutation = useMutation({
    mutationFn: (raison) => entrepriseApi.annulerAbonnement(raison),
    onSuccess: () => {
      toast.success('Abonnement annulé');
      queryClient.invalidateQueries(['entreprise-abonnement']);
      setModalAnnuler(false);
      setRaisonAnnulation('');
    },
    onError: (err) => toast.error(err.message)
  });

  if (isLoading) {
    return <Loader text="Chargement de l'abonnement..." />;
  }

  const abonnement = data?.actif;
  const joursRestants = data?.joursRestants || 0;
  const historique = data?.historique || [];
  const abonnementActif = !!abonnement;
  const bientotExpire = abonnementActif && joursRestants <= 7;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Mon abonnement
        </h1>
        <p className="text-neutral-500 mt-1">
          Gérez votre accès à l'annuaire des techniciens
        </p>
      </div>

      {/* Statut actuel */}
      {abonnementActif ? (
        <Card className={`border-2 ${bientotExpire ? 'border-danger-300' : 'border-success-300'}`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                bientotExpire ? 'bg-danger-100' : 'bg-success-100'
              }`}>
                {bientotExpire ? (
                  <AlertCircle className="w-7 h-7 text-danger-600" />
                ) : (
                  <Crown className="w-7 h-7 text-success-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-neutral-500">Abonnement actif</p>
                <p className="text-2xl font-bold capitalize">
                  {abonnement.type === 'annuel' ? 'Annuel' : 'Mensuel'}
                </p>
                <Badge color={bientotExpire ? 'danger' : 'success'} size="sm">
                  <CheckCircle className="w-3 h-3" />
                  {bientotExpire ? `Expire dans ${joursRestants} jour(s)` : 'Actif'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              {bientotExpire && (
                <Button
                  variant="danger"
                  onClick={() => setModalSouscrire(PLANS[1])}
                >
                  Renouveler
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setModalAnnuler(true)}
              >
                Annuler
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Début</p>
              <p className="font-semibold text-sm">{formatDate(abonnement.dateDebut)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Fin</p>
              <p className="font-semibold text-sm">{formatDate(abonnement.dateFin)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Prix</p>
              <p className="font-semibold text-sm">
                {formatMontant(abonnement.prix, abonnement.devise)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Jours restants</p>
              <p className={`font-semibold text-sm ${
                bientotExpire ? 'text-danger-600' : 'text-success-600'
              }`}>
                {joursRestants} jour(s)
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-2 border-accent-300 bg-accent-50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-7 h-7 text-accent-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-accent-900">
                Aucun abonnement actif
              </p>
              <p className="text-sm text-accent-700 mt-1">
                Souscrivez à un abonnement pour accéder à l'annuaire complet
                des techniciens certifiés et contacter directement les experts.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">
          Choisissez votre plan
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              padding="lg"
              className={`relative border-2 ${
                plan.populaire ? 'border-success-500' : 'border-neutral-200'
              }`}
            >
              {plan.populaire && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge color="success" size="md">
                    <Star className="w-3 h-3 fill-white" />
                    RECOMMANDÉ
                  </Badge>
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                    {plan.nom}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Pour {plan.duree}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  plan.couleur === 'success' ? 'bg-success-100' : 'bg-primary-100'
                }`}>
                  {plan.id === 'annuel' ? (
                    <Crown className="w-6 h-6 text-success-600" />
                  ) : (
                    <Zap className="w-6 h-6 text-primary-600" />
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-neutral-900">
                  {formatMontant(plan.prix, plan.devise)}
                </p>
                {plan.economie && (
                  <p className="text-sm text-success-600 font-medium mt-1">
                    💰 {plan.economie}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.avantages.map((avantage, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      plan.couleur === 'success' ? 'text-success-500' : 'text-primary-500'
                    }`} />
                    <span>{avantage}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.couleur === 'success' ? 'success' : 'primary'}
                fullWidth
                size="lg"
                onClick={() => setModalSouscrire(plan)}
                disabled={abonnementActif && abonnement.type === plan.id}
              >
                {abonnementActif && abonnement.type === plan.id
                  ? 'Plan actuel'
                  : 'Souscrire'
                }
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Avantages */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Pourquoi souscrire ?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Search, label: 'Recherche avancée', desc: 'Filtrez par compétence, ville, note...' },
            { icon: Users, label: 'Techniciens certifiés', desc: 'Uniquement des profils vérifiés NINTI' },
            { icon: MessageSquare, label: 'Contact direct', desc: 'Échangez sans intermédiaire' },
            { icon: Briefcase, label: 'Missions sécurisées', desc: 'Paiements traçables et protégés' }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{item.label}</p>
                  <p className="text-sm text-neutral-500">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Historique */}
      {historique.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Historique des abonnements
          </h2>
          <div className="space-y-3">
            {historique.map((abo) => (
              <div
                key={abo._id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div>
                  <p className="font-medium capitalize">{abo.type}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(abo.dateDebut)} → {formatDate(abo.dateFin)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    color={
                      abo.statut === 'actif' ? 'success'
                        : abo.statut === 'expire' ? 'warning'
                          : 'neutral'
                    }
                    size="sm"
                  >
                    {abo.statut}
                  </Badge>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatMontant(abo.prix, abo.devise)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Souscrire */}
      <Modal
        isOpen={!!modalSouscrire}
        onClose={() => setModalSouscrire(null)}
        title="Confirmer la souscription"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalSouscrire(null)}>
              Annuler
            </Button>
            <Button
              variant={modalSouscrire?.couleur === 'success' ? 'success' : 'primary'}
              onClick={() => souscrireMutation.mutate(modalSouscrire.id)}
              loading={souscrireMutation.isLoading}
            >
              Confirmer
            </Button>
          </>
        }
      >
        {modalSouscrire && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Vous allez souscrire au plan{' '}
              <strong>{modalSouscrire.nom}</strong>.
            </p>
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-900">
                <strong>Prix :</strong> {formatMontant(modalSouscrire.prix, modalSouscrire.devise)}
              </p>
              <p className="text-sm text-primary-900">
                <strong>Durée :</strong> {modalSouscrire.duree}
              </p>
            </div>
            <div className="p-3 bg-accent-50 border border-accent-200 rounded-lg">
              <p className="text-xs text-accent-800">
                ⚠️ Le paiement par Mobile Money sera intégré prochainement.
                Pour l'instant, la souscription est simulée.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Annuler */}
      <Modal
        isOpen={modalAnnuler}
        onClose={() => {
          setModalAnnuler(false);
          setRaisonAnnulation('');
        }}
        title="Annuler l'abonnement"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalAnnuler(false);
                setRaisonAnnulation('');
              }}
            >
              Retour
            </Button>
            <Button
              variant="danger"
              onClick={() => annulerMutation.mutate(raisonAnnulation)}
              loading={annulerMutation.isLoading}
              disabled={!raisonAnnulation.trim()}
            >
              Confirmer l'annulation
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 mb-4">
          Vous perdrez l'accès à l'annuaire à la fin de la période en cours.
          Cette action peut être annulée en souscrivant à nouveau.
        </p>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Raison de l'annulation *
        </label>
        <textarea
          value={raisonAnnulation}
          onChange={(e) => setRaisonAnnulation(e.target.value)}
          placeholder="Trop cher, plus besoin, autre..."
          rows={3}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </Modal>
    </div>
  );
}
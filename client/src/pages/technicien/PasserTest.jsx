// client/src/pages/technicien/PasserTest.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, Clock, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, ArrowLeft, Shield, Award, Flag
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as testApi from '../../api/testApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { TEST_CONFIG } from '../../utils/constants.js';

// ============================================================
// ÉTATS DE LA PAGE
// ============================================================
const ETAT = {
  CHARGEMENT: 'chargement',
  INTRO: 'intro',
  EN_COURS: 'en_cours',
  RESULTAT: 'resultat',
  NON_ELIGIBLE: 'non_eligible'
};

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienPasserTest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [etat, setEtat] = useState(ETAT.CHARGEMENT);
  const [test, setTest] = useState(null);
  const [reponses, setReponses] = useState({});
  const [questionActuelle, setQuestionActuelle] = useState(0);
  const [tempsRestant, setTempsRestant] = useState(0);
  const [resultat, setResultat] = useState(null);
  const [modalQuitter, setModalQuitter] = useState(false);
  const [modalSoumettre, setModalSoumettre] = useState(false);

  const securiteRef = useRef({
    changementsOnglet: 0,
    copiesDetectees: 0,
    clicsDroits: 0
  });

  // ============================================================
  // CHARGER L'ÉLIGIBILITÉ
  // ============================================================
  const { data: eligibilite, isLoading } = useQuery({
    queryKey: ['test-eligibilite'],
    queryFn: testApi.getEligibilite
  });

  useEffect(() => {
    if (!eligibilite) return;

    if (!eligibilite.eligible) {
      setEtat(ETAT.NON_ELIGIBLE);
      return;
    }

    if (etat === ETAT.CHARGEMENT) {
      setEtat(ETAT.INTRO);
    }
  }, [eligibilite, etat]);

  // ============================================================
  // DÉMARRER LE TEST
  // ============================================================
  const demarrerMutation = useMutation({
    mutationFn: testApi.demarrerTest,
    onSuccess: (data) => {
      setTest(data);
      setReponses({});
      setQuestionActuelle(0);
      setTempsRestant(data.dureeMinutes * 60);
      setEtat(ETAT.EN_COURS);
      toast.success('Le test commence ! Bonne chance 🎓');
    },
    onError: (err) => {
      toast.error(err.message);
      navigate('/technicien/dashboard');
    }
  });

  // ============================================================
  // SOUMETTRE LE TEST
  // ============================================================
  const soumettreMutation = useMutation({
    mutationFn: (donnees) => testApi.soumettreTest(test._id, donnees.reponses, donnees.securite),
    onSuccess: (data) => {
      setResultat(data.resultat);
      setEtat(ETAT.RESULTAT);
      queryClient.invalidateQueries(['technicien-profil']);
      queryClient.invalidateQueries(['technicien-profil-dashboard']);
      queryClient.invalidateQueries(['test-eligibilite']);

      if (data.resultat.reussi) {
        toast.success(`Félicitations ! Vous avez obtenu ${data.resultat.score}% 🎉`);
      } else {
        toast.error(`Score : ${data.resultat.score}%. Seuil requis : ${TEST_CONFIG.SEUIL_REUSSITE}%`);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // ============================================================
  // TIMER
  // ============================================================
  useEffect(() => {
    if (etat !== ETAT.EN_COURS || tempsRestant <= 0) return;

    const interval = setInterval(() => {
      setTempsRestant((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // Temps écoulé → soumission automatique
          handleSoumissionAuto();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [etat, tempsRestant]);

  // ============================================================
  // ANTI-TRICHE : changements d'onglet
  // ============================================================
  useEffect(() => {
    if (etat !== ETAT.EN_COURS) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        securiteRef.current.changementsOnglet += 1;
        toast.error(`⚠️ Changement d'onglet détecté (${securiteRef.current.changementsOnglet})`, {
          duration: 3000
        });

        if (test?._id) {
          testApi.signalerIncident(test._id, 'changement_onglet').catch(() => {});
        }
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      securiteRef.current.clicsDroits += 1;
    };

    const handleCopy = (e) => {
      securiteRef.current.copiesDetectees += 1;
      toast.error('⚠️ Copie détectée', { duration: 2000 });
      e.preventDefault();

      if (test?._id) {
        testApi.signalerIncident(test._id, 'copie').catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [etat, test]);

  // ============================================================
  // NAVIGATION QUESTION
  // ============================================================
  const questions = test?.questions || [];
  const question = questions[questionActuelle];

  const reponsesQuestion = reponses[questionActuelle] || [];

  const toggleReponse = (lettre) => {
    const nouvelleReponses = { ...reponses };
    const actuelles = nouvelleReponses[questionActuelle] || [];

    if (question.type === 'multiple') {
      // Multiple : toggle
      if (actuelles.includes(lettre)) {
        nouvelleReponses[questionActuelle] = actuelles.filter((l) => l !== lettre);
      } else {
        nouvelleReponses[questionActuelle] = [...actuelles, lettre];
      }
    } else {
      // QCM ou Vrai/Faux : une seule réponse
      nouvelleReponses[questionActuelle] = [lettre];
    }

    setReponses(nouvelleReponses);
  };

  const suivant = () => {
    if (questionActuelle < questions.length - 1) {
      setQuestionActuelle(questionActuelle + 1);
    }
  };

  const precedent = () => {
    if (questionActuelle > 0) {
      setQuestionActuelle(questionActuelle - 1);
    }
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const formatReponses = () => {
    return questions.map((q, index) => ({
      questionId: q._id,
      reponses: reponses[index] || [],
      tempsReponse: 0
    }));
  };

  const handleSoumission = () => {
    const donnees = {
      reponses: formatReponses(),
      securite: securiteRef.current
    };
    soumettreMutation.mutate(donnees);
  };

  const handleSoumissionAuto = useCallback(() => {
    if (!test) return;
    toast.error('⏰ Temps écoulé ! Soumission automatique');
    handleSoumission();
  }, [test, reponses]);

  // ============================================================
  // FORMATAGE DU TEMPS
  // ============================================================
  const formatTemps = (secondes) => {
    const m = Math.floor(secondes / 60);
    const s = secondes % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const tempsCouleur = () => {
    const total = test?.dureeMinutes * 60 || 1800;
    const ratio = tempsRestant / total;
    if (ratio < 0.1) return 'text-danger-600 bg-danger-50';
    if (ratio < 0.3) return 'text-accent-600 bg-accent-50';
    return 'text-primary-600 bg-primary-50';
  };

  const reponsesDonnees = Object.keys(reponses).length;
  const progression = (reponsesDonnees / questions.length) * 100;

  // ============================================================
  // RENDER
  // ============================================================

  // 1. CHARGEMENT
  if (isLoading || etat === ETAT.CHARGEMENT) {
    return <Loader text="Vérification de votre éligibilité..." fullScreen />;
  }

  // 2. NON ÉLIGIBLE
  if (etat === ETAT.NON_ELIGIBLE) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-danger-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Non éligible au test
            </h1>
            <p className="text-neutral-500 mb-6">
              {eligibilite?.heuresRestantes > 0
                ? `Vous devez attendre ${eligibilite.heuresRestantes} heure(s) avant de pouvoir repasser le test.`
                : eligibilite?.statut === 'ninti_actif'
                  ? 'Vous avez déjà un NINTI actif.'
                  : 'Vous n\'êtes pas autorisé à passer le test actuellement.'}
            </p>
            <Button onClick={() => navigate('/technicien/dashboard')}>
              Retour au tableau de bord
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. INTRO
  if (etat === ETAT.INTRO) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <div className="text-center">
          <div className="inline-flex w-16 h-16 bg-gradient-primary rounded-2xl items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Test de certification
          </h1>
          <p className="text-neutral-500 mt-2">
            Prouvez vos compétences pour devenir technicien certifié
          </p>
        </div>

        {/* Règles */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Règles du test
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-700">1</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  {TEST_CONFIG.NB_QUESTIONS} questions
                </p>
                <p className="text-sm text-neutral-500">
                  Réparties sur toutes les catégories de compétences
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-700">2</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  Durée : {TEST_CONFIG.DUREE_MINUTES} minutes
                </p>
                <p className="text-sm text-neutral-500">
                  Timer visible en permanence. Soumission automatique à la fin.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-700">3</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  Seuil de réussite : {TEST_CONFIG.SEUIL_REUSSITE}%
                </p>
                <p className="text-sm text-neutral-500">
                  En dessous, vous devrez attendre {TEST_CONFIG.DELAI_REPASSAGE_HEURES}h avant de repasser.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-danger-600" />
              </div>
              <div>
                <p className="font-medium text-danger-900">
                  Anti-triche activé
                </p>
                <p className="text-sm text-danger-600">
                  Changements d'onglet, copies et clics droits sont détectés et enregistrés.
                </p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Catégories */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            Catégories évaluées
          </h2>
          <div className="flex flex-wrap gap-2">
            {['Réseaux', 'Sécurité informatique', 'Maintenance matérielle',
              'Systèmes d\'exploitation', 'Base de données', 'Support utilisateur'].map((cat) => (
              <Badge key={cat} color="primary">{cat}</Badge>
            ))}
          </div>
        </Card>

        {/* Info tentative */}
        {eligibilite?.nombreTentatives > 0 && (
          <Card className="border border-accent-200 bg-accent-50">
            <p className="text-sm text-accent-800">
              <strong>Tentative n°{eligibilite.nombreTentatives + 1}</strong> — 
              Score du dernier test : {eligibilite.scoreDernierTest || 0}%
            </p>
          </Card>
        )}

        {/* Bouton démarrer */}
        <div className="text-center">
          <Button
            size="xl"
            variant="success"
            onClick={() => demarrerMutation.mutate()}
            loading={demarrerMutation.isLoading}
            icon={GraduationCap}
          >
            Démarrer le test
          </Button>
          <p className="text-xs text-neutral-500 mt-3">
            En cliquant, le chronomètre démarre immédiatement
          </p>
        </div>
      </div>
    );
  }

  // 4. TEST EN COURS
  if (etat === ETAT.EN_COURS && question) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header sticky */}
        <div className="sticky top-0 z-20 bg-neutral-50 pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Card padding="md">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Badge color="primary" size="lg">
                  Question {questionActuelle + 1} / {questions.length}
                </Badge>
                <Badge color="neutral">{question.categorie}</Badge>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${tempsCouleur()}`}>
                <Clock className="w-5 h-5" />
                {formatTemps(tempsRestant)}
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>{reponsesDonnees} / {questions.length} répondues</span>
                <span>{Math.round(progression)}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                  style={{ width: `${progression}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Question */}
        <Card>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                color={
                  question.difficulte === 'facile' ? 'success'
                    : question.difficulte === 'difficile' ? 'danger'
                      : 'warning'
                }
                size="sm"
              >
                {question.difficulte}
              </Badge>
              {question.type === 'multiple' && (
                <Badge color="info" size="sm">
                  Plusieurs réponses possibles
                </Badge>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-neutral-900">
              {question.enonce}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options.map((option) => {
              const selected = reponsesQuestion.includes(option.lettre);
              return (
                <button
                  key={option.lettre}
                  type="button"
                  onClick={() => toggleReponse(option.lettre)}
                  className={`
                    w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left
                    transition-all duration-150
                    ${selected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-neutral-50'
                    }
                  `}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${selected
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-500'
                    }
                  `}>
                    {selected ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{option.lettre}</span>
                    )}
                  </div>
                  <span className={`flex-1 text-sm ${selected ? 'font-medium text-primary-900' : 'text-neutral-700'}`}>
                    {option.texte}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={precedent}
            disabled={questionActuelle === 0}
            icon={ArrowLeft}
          >
            Précédent
          </Button>

          <Button
            variant="danger"
            onClick={() => setModalQuitter(true)}
            icon={Flag}
          >
            Terminer
          </Button>

          {questionActuelle < questions.length - 1 ? (
            <Button onClick={suivant} icon={ArrowRight} iconPosition="right">
              Suivant
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={() => setModalSoumettre(true)}
              icon={CheckCircle}
            >
              Soumettre
            </Button>
          )}
        </div>

        {/* Navigation rapide */}
        <Card padding="sm">
          <p className="text-xs text-neutral-500 mb-2">Navigation rapide :</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => {
              const repondu = reponses[i]?.length > 0;
              const actuel = i === questionActuelle;
              return (
                <button
                  key={i}
                  onClick={() => setQuestionActuelle(i)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-semibold transition-colors
                    ${actuel
                      ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                      : repondu
                        ? 'bg-success-100 text-success-700 hover:bg-success-200'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Modal Quitter */}
        <Modal
          isOpen={modalQuitter}
          onClose={() => setModalQuitter(false)}
          title="Terminer le test ?"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalQuitter(false)}>
                Continuer le test
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setModalQuitter(false);
                  setModalSoumettre(true);
                }}
              >
                Terminer maintenant
              </Button>
            </>
          }
        >
          <p className="text-sm text-neutral-600">
            Il vous reste <strong>{questions.length - reponsesDonnees} question(s)</strong> sans réponse.
            Elles seront comptées comme incorrectes.
          </p>
        </Modal>

        {/* Modal Soumettre */}
        <Modal
          isOpen={modalSoumettre}
          onClose={() => setModalSoumettre(false)}
          title="Confirmer la soumission"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalSoumettre(false)}>
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleSoumission}
                loading={soumettreMutation.isLoading}
              >
                Confirmer et voir le résultat
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Vous êtes sur le point de soumettre votre test définitivement.
            </p>
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-900">
                <strong>{reponsesDonnees}</strong> question(s) répondue(s) sur <strong>{questions.length}</strong>
              </p>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // 5. RÉSULTAT
  if (etat === ETAT.RESULTAT && resultat) {
    const reussi = resultat.reussi;

    return (
      <div className="max-w-2xl mx-auto py-6 space-y-6">
        <Card className={reussi ? 'border-2 border-success-300' : 'border-2 border-danger-300'}>
          <div className="text-center py-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              reussi ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              {reussi ? (
                <CheckCircle className="w-10 h-10 text-success-600" />
              ) : (
                <XCircle className="w-10 h-10 text-danger-600" />
              )}
            </div>

            <h1 className={`text-3xl font-bold mb-2 ${
              reussi ? 'text-success-700' : 'text-danger-700'
            }`}>
              {reussi ? 'Félicitations ! 🎉' : 'Test non réussi'}
            </h1>

            <p className="text-neutral-500 mb-6">
              {reussi
                ? 'Vous avez réussi le test de certification'
                : `Le seuil de réussite est de ${TEST_CONFIG.SEUIL_REUSSITE}%`}
            </p>

            {/* Score */}
            <div className="max-w-xs mx-auto mb-6">
              <div className="text-5xl font-bold text-neutral-900 mb-2">
                {resultat.score}%
              </div>
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    reussi ? 'bg-success-500' : 'bg-danger-500'
                  }`}
                  style={{ width: `${resultat.score}%` }}
                />
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600">
                  {resultat.nombreBonnesReponses}
                </p>
                <p className="text-xs text-neutral-500">Correctes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-danger-600">
                  {resultat.nombreMauvaisesReponses}
                </p>
                <p className="text-xs text-neutral-500">Incorrectes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-500">
                  {resultat.nombreSansReponse}
                </p>
                <p className="text-xs text-neutral-500">Sans réponse</p>
              </div>
            </div>

            {/* Actions */}
            {reussi ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Prochaine étape : payez votre accréditation pour recevoir votre NINTI
                </p>
                <Button
                  size="lg"
                  variant="success"
                  onClick={() => navigate('/technicien/payer-accreditation')}
                  icon={Award}
                >
                  Payer mon accréditation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Vous pourrez repasser le test dans {TEST_CONFIG.DELAI_REPASSAGE_HEURES} heures.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/technicien/dashboard')}
                >
                  Retour au tableau de bord
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Performance par catégorie */}
        {resultat.performanceCategories?.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Performance par catégorie
            </h2>
            <div className="space-y-3">
              {resultat.performanceCategories.map((perf) => (
                <div key={perf.categorie}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-700 font-medium">{perf.categorie}</span>
                    <span className={`font-semibold ${
                      perf.score >= 60 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {perf.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        perf.score >= 60 ? 'bg-success-500' : 'bg-danger-500'
                      }`}
                      style={{ width: `${perf.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
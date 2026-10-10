// client/src/pages/auth/InscriptionTechnicien.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, User, Mail, Lock, Phone, MapPin,
  Check, Eye, EyeOff, Shield, Award, Briefcase, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../hooks/useAuth.js';
import * as authApi from '../../api/authApi.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

// ============================================================
// ÉTAPES
// ============================================================
const ETAPES = [
  { id: 1, label: 'Compte', icone: User },
  { id: 2, label: 'Localisation', icone: MapPin },
  { id: 3, label: 'Confirmation', icone: Check }
];

// ============================================================
// COMPOSANT STEPPER
// ============================================================
function Stepper({ etapeActuelle }) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
      {ETAPES.map((etape, index) => {
        const Icon = etape.icone;
        const complete = etapeActuelle > etape.id;
        const active = etapeActuelle === etape.id;

        return (
          <div key={etape.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200 font-semibold text-sm
                  ${complete
                    ? 'bg-success-500 text-white'
                    : active
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-neutral-200 text-neutral-500'
                  }
                `}
              >
                {complete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  active ? 'text-primary-600' : complete ? 'text-success-600' : 'text-neutral-400'
                }`}
              >
                {etape.label}
              </span>
            </div>
            {index < ETAPES.length - 1 && (
              <div
                className={`
                  w-12 md:w-20 h-0.5 mx-2 mb-6 transition-colors
                  ${complete ? 'bg-success-500' : 'bg-neutral-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ÉTAPE 1 : COMPTE
// ============================================================
function EtapeCompte({ data, setData, errors, setErrors }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Prénom"
          placeholder="Jonathan"
          value={data.prenom}
          onChange={(e) => {
            setData({ ...data, prenom: e.target.value });
            setErrors({ ...errors, prenom: null });
          }}
          error={errors.prenom}
          icon={User}
          required
        />

        <Input
          label="Nom"
          placeholder="Lukoki"
          value={data.nom}
          onChange={(e) => {
            setData({ ...data, nom: e.target.value });
            setErrors({ ...errors, nom: null });
          }}
          error={errors.nom}
          icon={User}
          required
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="vous@exemple.com"
        value={data.email}
        onChange={(e) => {
          setData({ ...data, email: e.target.value });
          setErrors({ ...errors, email: null });
        }}
        error={errors.email}
        icon={Mail}
        required
      />

      <Input
        label="Téléphone"
        type="tel"
        placeholder="+243900000000"
        value={data.telephone}
        onChange={(e) => {
          setData({ ...data, telephone: e.target.value });
          setErrors({ ...errors, telephone: null });
        }}
        error={errors.telephone}
        icon={Phone}
        hint="Format international : +243XXXXXXXXX"
        required
      />

      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          placeholder="Au moins 8 caractères"
          value={data.motDePasse}
          onChange={(e) => {
            setData({ ...data, motDePasse: e.target.value });
            setErrors({ ...errors, motDePasse: null });
          }}
          error={errors.motDePasse}
          icon={Lock}
          hint="8 caractères min, une majuscule, une minuscule, un chiffre"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-neutral-400 hover:text-neutral-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <Input
        label="Confirmer le mot de passe"
        type={showPassword ? 'text' : 'password'}
        placeholder="Retapez le mot de passe"
        value={data.confirmationMotDePasse}
        onChange={(e) => {
          setData({ ...data, confirmationMotDePasse: e.target.value });
          setErrors({ ...errors, confirmationMotDePasse: null });
        }}
        error={errors.confirmationMotDePasse}
        icon={Lock}
        required
      />
    </div>
  );
}

// ============================================================
// ÉTAPE 2 : LOCALISATION
// ============================================================
function EtapeLocalisation({ data, setData, errors, setErrors }) {
  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 text-sm">
              Pourquoi ces informations ?
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Votre localisation permet aux clients de trouver un technicien proche
              d'eux. Vous pourrez la modifier à tout moment dans votre profil.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Pays <span className="text-danger-500">*</span>
          </label>
          <select
            value={data.pays}
            onChange={(e) => setData({ ...data, pays: e.target.value })}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Congo">Congo (RDC)</option>
            <option value="Cameroun">Cameroun</option>
            <option value="Gabon">Gabon</option>
            <option value="Sénégal">Sénégal</option>
            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
            <option value="Bénin">Bénin</option>
            <option value="Togo">Togo</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <Input
          label="Ville"
          placeholder="Kinshasa"
          value={data.ville}
          onChange={(e) => {
            setData({ ...data, ville: e.target.value });
            setErrors({ ...errors, ville: null });
          }}
          error={errors.ville}
          icon={MapPin}
          required
        />
      </div>

      <Input
        label="Adresse (optionnel)"
        placeholder="Avenue, quartier, commune..."
        value={data.adresse}
        onChange={(e) => setData({ ...data, adresse: e.target.value })}
        icon={MapPin}
        hint="Vous pourrez préciser votre position exacte plus tard"
      />

      <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-accent-900 text-sm">
              Prochaines étapes après l'inscription
            </p>
            <ul className="text-xs text-accent-800 mt-2 space-y-1 list-disc list-inside">
              <li>Compléter votre profil professionnel (compétences, tarifs, bio)</li>
              <li>Passer le test de certification (seuil : 60%)</li>
              <li>Payer votre accréditation pour obtenir votre NINTI</li>
              <li>Commencer à recevoir des demandes de missions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ÉTAPE 3 : CONFIRMATION
// ============================================================
function EtapeConfirmation({ data, accepteCGU, setAccepteCGU }) {
  return (
    <div className="space-y-5">
      <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-center">
        <div className="w-14 h-14 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-white" />
        </div>
        <p className="font-semibold text-success-900">
          Vos informations sont prêtes !
        </p>
        <p className="text-sm text-success-700 mt-1">
          Vérifiez le récapitulatif avant de valider
        </p>
      </div>

      <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100">
        <div className="p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
            Identité
          </p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Nom complet : </span>
              <span className="font-medium">{data.prenom} {data.nom}</span>
            </div>
            <div>
              <span className="text-neutral-500">Email : </span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div>
              <span className="text-neutral-500">Téléphone : </span>
              <span className="font-medium">{data.telephone}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
            Localisation
          </p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Pays : </span>
              <span className="font-medium">{data.pays}</span>
            </div>
            <div>
              <span className="text-neutral-500">Ville : </span>
              <span className="font-medium">{data.ville}</span>
            </div>
            {data.adresse && (
              <div className="col-span-2">
                <span className="text-neutral-500">Adresse : </span>
                <span className="font-medium">{data.adresse}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <p className="text-sm font-medium text-primary-900 mb-2">
          Ce qui vous attend
        </p>
        <div className="space-y-2">
          {[
            { icon: Shield, text: 'Test de certification en 40 questions' },
            { icon: Award, text: 'Obtention du NINTI après réussite' },
            { icon: Briefcase, text: 'Réception de missions près de chez vous' }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-sm text-primary-800">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
        <input
          type="checkbox"
          checked={accepteCGU}
          onChange={(e) => setAccepteCGU(e.target.checked)}
          className="mt-0.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-neutral-700">
          J'accepte les{' '}
          <a href="/cgu" className="text-primary-600 hover:underline font-medium">
            Conditions Générales d'Utilisation
          </a>{' '}
          et la{' '}
          <a href="/confidentialite" className="text-primary-600 hover:underline font-medium">
            Politique de Confidentialité
          </a>
          . Je certifie que les informations fournies sont exactes.
        </span>
      </label>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function InscriptionTechnicien() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [etape, setEtape] = useState(1);
  const [accepteCGU, setAccepteCGU] = useState(false);
  const [errors, setErrors] = useState({});

  const [data, setData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmationMotDePasse: '',
    pays: 'Congo',
    ville: '',
    adresse: ''
  });

  // ============================================================
  // VALIDATION PAR ÉTAPE
  // ============================================================
  const validerEtape1 = async () => {
    const err = {};

    if (!data.prenom.trim()) err.prenom = 'Le prénom est obligatoire';
    if (!data.nom.trim()) err.nom = 'Le nom est obligatoire';

    if (!data.email.trim()) {
      err.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      err.email = 'Email invalide';
    } else {
      // Vérifier la disponibilité
      try {
        const res = await authApi.verifierEmailDisponible(data.email);
        if (!res.disponible) err.email = 'Cet email est déjà utilisé';
      } catch (e) {
        // Ignorer silencieusement
      }
    }

    if (!data.telephone.trim()) {
      err.telephone = 'Le téléphone est obligatoire';
    } else if (!/^\+?[0-9]{8,15}$/.test(data.telephone)) {
      err.telephone = 'Format invalide (ex: +243900000000)';
    }

    if (!data.motDePasse) {
      err.motDePasse = 'Le mot de passe est obligatoire';
    } else if (data.motDePasse.length < 8) {
      err.motDePasse = 'Au moins 8 caractères';
    } else if (!/[A-Z]/.test(data.motDePasse)) {
      err.motDePasse = 'Au moins une majuscule';
    } else if (!/[0-9]/.test(data.motDePasse)) {
      err.motDePasse = 'Au moins un chiffre';
    }

    if (data.motDePasse !== data.confirmationMotDePasse) {
      err.confirmationMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validerEtape2 = () => {
    const err = {};
    if (!data.ville.trim()) err.ville = 'La ville est obligatoire';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ============================================================
  // NAVIGATION
  // ============================================================
  const suivant = async () => {
    if (etape === 1) {
      const valide = await validerEtape1();
      if (!valide) {
        toast.error('Corrigez les erreurs avant de continuer');
        return;
      }
    } else if (etape === 2) {
      const valide = validerEtape2();
      if (!valide) {
        toast.error('Corrigez les erreurs avant de continuer');
        return;
      }
    }

    setEtape(etape + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const precedent = () => {
    setEtape(etape - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const soumettre = async () => {
    if (!accepteCGU) {
      toast.error('Vous devez accepter les CGU');
      return;
    }

    const donnees = {
      email: data.email,
      motDePasse: data.motDePasse,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      role: 'technicien',
      ville: data.ville,
      adresse: data.adresse || undefined,
      pays: data.pays
    };

    const resultat = await register(donnees);

    if (resultat.success) {
      navigate('/technicien/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="p-6">
        <Link
          to="/inscription"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Changer de type de compte
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Devenir technicien certifié
          </h1>
          <p className="text-neutral-500 mt-2">
            Créez votre compte en quelques minutes
          </p>
        </div>

        {/* Stepper */}
        <Stepper etapeActuelle={etape} />

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {etape === 1 && (
            <EtapeCompte
              data={data}
              setData={setData}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {etape === 2 && (
            <EtapeLocalisation
              data={data}
              setData={setData}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {etape === 3 && (
            <EtapeConfirmation
              data={data}
              accepteCGU={accepteCGU}
              setAccepteCGU={setAccepteCGU}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-neutral-200">
            {etape > 1 ? (
              <Button variant="outline" onClick={precedent} disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
            ) : (
              <div />
            )}

            {etape < 3 ? (
              <Button onClick={suivant}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={soumettre}
                loading={loading}
                disabled={!accepteCGU}
              >
                <Check className="w-4 h-4 mr-2" />
                Créer mon compte
              </Button>
            )}
          </div>
        </div>

        {/* Lien connexion */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/connexion"
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
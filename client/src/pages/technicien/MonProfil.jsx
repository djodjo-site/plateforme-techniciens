// client/src/pages/technicien/MonProfil.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Briefcase, MapPin, DollarSign, Clock, Award, GraduationCap,
  Plus, Trash2, Save, AlertCircle, CheckCircle, Camera, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../hooks/useAuth.js';
import * as technicienApi from '../../api/technicienApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { CATEGORIES_COMPETENCES, DEVISES } from '../../utils/constants.js';

// ============================================================
// SECTION
// ============================================================
function Section({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <div className="flex items-start gap-3 mb-5 pb-5 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {description && (
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienMonProfil() {
  const queryClient = useQueryClient();
  const { user, updateProfil: updateAuthUser } = useAuth();

  const [form, setForm] = useState({
    titreProfessionnel: '',
    biographie: '',
    anneesExperience: 0,
    competences: [],
    categories: [],
    langues: ['Français'],
    rayonIntervention: 20,
    zonesDesservies: [],
    adressePrincipale: '',
    accepteUrgences: false,
    tarifs: {
      horaire: 0,
      deplacement: 0,
      devise: 'XAF',
      negociable: true
    },
    horairesDisponibilite: {
      lundi: '08:00-18:00',
      mardi: '08:00-18:00',
      mercredi: '08:00-18:00',
      jeudi: '08:00-18:00',
      vendredi: '08:00-18:00',
      samedi: '09:00-15:00',
      dimanche: 'fermé'
    },
    preferences: {
      accepteDistance: true,
      accepteParticuliers: true,
      accepteEntreprises: true,
      maxMissionsSimultanees: 3
    }
  });

  const [nouvelleCompetence, setNouvelleCompetence] = useState('');
  const [modalCertification, setModalCertification] = useState(false);
  const [modalDiplome, setModalDiplome] = useState(false);
  const [certificationForm, setCertificationForm] = useState({
    nom: '', organisme: '', dateObtention: '', dateExpiration: ''
  });
  const [diplomeForm, setDiplomeForm] = useState({
    intitule: '', etablissement: '', annee: ''
  });

  // Charger le profil
  const { data, isLoading } = useQuery({
    queryKey: ['technicien-profil'],
    queryFn: technicienApi.getProfil
  });

  const technicien = data?.technicien;

  // Hydrater le formulaire quand les données arrivent
  useEffect(() => {
    if (technicien) {
      setForm({
        titreProfessionnel: technicien.titreProfessionnel || '',
        biographie: technicien.biographie || '',
        anneesExperience: technicien.anneesExperience || 0,
        competences: technicien.competences || [],
        categories: technicien.categories || [],
        langues: technicien.langues || ['Français'],
        rayonIntervention: technicien.rayonIntervention || 20,
        zonesDesservies: technicien.zonesDesservies || [],
        adressePrincipale: technicien.adressePrincipale || '',
        accepteUrgences: technicien.accepteUrgences || false,
        tarifs: technicien.tarifs || {
          horaire: 0, deplacement: 0, devise: 'XAF', negociable: true
        },
        horairesDisponibilite: technicien.horairesDisponibilite || {
          lundi: '08:00-18:00',
          mardi: '08:00-18:00',
          mercredi: '08:00-18:00',
          jeudi: '08:00-18:00',
          vendredi: '08:00-18:00',
          samedi: '09:00-15:00',
          dimanche: 'fermé'
        },
        preferences: technicien.preferences || {
          accepteDistance: true,
          accepteParticuliers: true,
          accepteEntreprises: true,
          maxMissionsSimultanees: 3
        }
      });
    }
  }, [technicien]);

  // Mutation : sauvegarder
  const saveMutation = useMutation({
    mutationFn: (data) => technicienApi.updateProfil(data),
    onSuccess: () => {
      toast.success('Profil mis à jour avec succès');
      queryClient.invalidateQueries(['technicien-profil']);
      queryClient.invalidateQueries(['technicien-profil-dashboard']);
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  // Gestion compétences
  const ajouterCompetence = () => {
    const comp = nouvelleCompetence.trim();
    if (!comp) return;
    if (form.competences.includes(comp)) {
      toast.error('Cette compétence existe déjà');
      return;
    }
    if (form.competences.length >= 20) {
      toast.error('Maximum 20 compétences');
      return;
    }
    setForm({ ...form, competences: [...form.competences, comp] });
    setNouvelleCompetence('');
  };

  const retirerCompetence = (comp) => {
    setForm({
      ...form,
      competences: form.competences.filter((c) => c !== comp)
    });
  };

  // Gestion catégories
  const toggleCategorie = (cat) => {
    if (form.categories.includes(cat)) {
      setForm({
        ...form,
        categories: form.categories.filter((c) => c !== cat)
      });
    } else {
      setForm({ ...form, categories: [...form.categories, cat] });
    }
  };

  // Gestion certifications
  const handleAjouterCertification = async () => {
    if (!certificationForm.nom.trim()) {
      toast.error('Le nom de la certification est obligatoire');
      return;
    }
    try {
      await technicienApi.ajouterCertification(certificationForm);
      toast.success('Certification ajoutée');
      queryClient.invalidateQueries(['technicien-profil']);
      setModalCertification(false);
      setCertificationForm({ nom: '', organisme: '', dateObtention: '', dateExpiration: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSupprimerCertification = async (certId) => {
    if (!window.confirm('Supprimer cette certification ?')) return;
    try {
      await technicienApi.supprimerCertification(certId);
      toast.success('Certification supprimée');
      queryClient.invalidateQueries(['technicien-profil']);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Gestion diplômes
  const handleAjouterDiplome = async () => {
    if (!diplomeForm.intitule.trim()) {
      toast.error('L\'intitulé du diplôme est obligatoire');
      return;
    }
    try {
      await technicienApi.ajouterDiplome(diplomeForm);
      toast.success('Diplôme ajouté');
      queryClient.invalidateQueries(['technicien-profil']);
      setModalDiplome(false);
      setDiplomeForm({ intitule: '', etablissement: '', annee: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSupprimerDiplome = async (diplomeId) => {
    if (!window.confirm('Supprimer ce diplôme ?')) return;
    try {
      await technicienApi.supprimerDiplome(diplomeId);
      toast.success('Diplôme supprimé');
      queryClient.invalidateQueries(['technicien-profil']);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <Loader text="Chargement du profil..." />;
  }

  const profilComplet = form.competences.length > 0
    && form.categories.length > 0
    && form.biographie
    && form.tarifs.horaire > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Mon profil professionnel
          </h1>
          <p className="text-neutral-500 mt-1">
            Complétez votre profil pour apparaître dans l'annuaire et recevoir des missions
          </p>
        </div>
        {profilComplet ? (
          <Badge color="success" size="lg">
            <CheckCircle className="w-4 h-4" />
            Profil complet
          </Badge>
        ) : (
          <Badge color="warning" size="lg">
            <AlertCircle className="w-4 h-4" />
            Profil incomplet
          </Badge>
        )}
      </div>

      {!profilComplet && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-accent-800">
              <p className="font-semibold mb-1">Complétez ces champs obligatoires :</p>
              <ul className="space-y-1 list-disc list-inside">
                {!form.biographie && <li>Biographie</li>}
                {form.competences.length === 0 && <li>Au moins une compétence</li>}
                {form.categories.length === 0 && <li>Au moins une catégorie</li>}
                {form.tarifs.horaire === 0 && <li>Tarif horaire</li>}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====== SECTION 1 : INFOS DE BASE ====== */}
        <Section
          icon={Briefcase}
          title="Informations professionnelles"
          description="Votre identité professionnelle"
        >
          <div className="space-y-5">
            <Input
              label="Titre professionnel"
              placeholder="Ex: Expert réseaux Cisco"
              value={form.titreProfessionnel}
              onChange={(e) => setForm({ ...form, titreProfessionnel: e.target.value })}
              hint="Un titre court et accrocheur (max 100 caractères)"
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Biographie professionnelle
              </label>
              <textarea
                value={form.biographie}
                onChange={(e) => setForm({ ...form, biographie: e.target.value })}
                placeholder="Présentez votre parcours, vos spécialités, vos valeurs..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {form.biographie.length}/1000 caractères
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Années d'expérience
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.anneesExperience}
                  onChange={(e) => setForm({ ...form, anneesExperience: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Langues parlées
                </label>
                <input
                  type="text"
                  value={form.langues.join(', ')}
                  onChange={(e) => setForm({
                    ...form,
                    langues: e.target.value.split(',').map((l) => l.trim()).filter(Boolean)
                  })}
                  placeholder="Français, Anglais, Lingala..."
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Séparées par des virgules
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ====== SECTION 2 : COMPÉTENCES ====== */}
        <Section
          icon={Award}
          title="Compétences"
          description="Vos savoir-faire techniques"
        >
          <div className="space-y-4">
            {/* Ajout compétence */}
            <div className="flex gap-2">
              <input
                type="text"
                value={nouvelleCompetence}
                onChange={(e) => setNouvelleCompetence(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterCompetence())}
                placeholder="Ex: Cisco, Linux, Cybersécurité..."
                className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button type="button" onClick={ajouterCompetence} icon={Plus}>
                Ajouter
              </Button>
            </div>

            {/* Liste compétences */}
            {form.competences.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.competences.map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {comp}
                    <button
                      type="button"
                      onClick={() => retirerCompetence(comp)}
                      className="hover:text-danger-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-4">
                Aucune compétence ajoutée
              </p>
            )}
            <p className="text-xs text-neutral-500">
              {form.competences.length}/20 compétences
            </p>
          </div>
        </Section>

        {/* ====== SECTION 3 : CATÉGORIES ====== */}
        <Section
          icon={Briefcase}
          title="Domaines d'expertise"
          description="Sélectionnez vos domaines principaux (au moins 1)"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES_COMPETENCES.map((cat) => {
              const selected = form.categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategorie(cat)}
                  className={`
                    p-3 rounded-lg border-2 text-sm font-medium text-left
                    transition-all
                    ${selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                      ${selected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'}
                    `}>
                      {selected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {form.categories.length > 0 && (
            <p className="text-xs text-success-600 mt-3">
              ✓ {form.categories.length} catégorie(s) sélectionnée(s)
            </p>
          )}
        </Section>

        {/* ====== SECTION 4 : TARIFS ====== */}
        <Section
          icon={DollarSign}
          title="Tarifs"
          description="Vos prix pour vos prestations"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tarif horaire *
              </label>
              <input
                type="number"
                min="0"
                value={form.tarifs.horaire}
                onChange={(e) => setForm({
                  ...form,
                  tarifs: { ...form.tarifs, horaire: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Frais de déplacement
              </label>
              <input
                type="number"
                min="0"
                value={form.tarifs.deplacement}
                onChange={(e) => setForm({
                  ...form,
                  tarifs: { ...form.tarifs, deplacement: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Devise
              </label>
              <select
                value={form.tarifs.devise}
                onChange={(e) => setForm({
                  ...form,
                  tarifs: { ...form.tarifs, devise: e.target.value }
                })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {DEVISES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label} ({d.symbole})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tarifs.negociable}
              onChange={(e) => setForm({
                ...form,
                tarifs: { ...form.tarifs, negociable: e.target.checked }
              })}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">
              Mes tarifs sont négociables
            </span>
          </label>
        </Section>

        {/* ====== SECTION 5 : ZONE D'INTERVENTION ====== */}
        <Section
          icon={MapPin}
          title="Zone d'intervention"
          description="Où pouvez-vous travailler ?"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Adresse principale
              </label>
              <Input
                placeholder="Avenue, quartier, commune, ville"
                value={form.adressePrincipale}
                onChange={(e) => setForm({ ...form, adressePrincipale: e.target.value })}
                icon={MapPin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rayon d'intervention : {form.rayonIntervention} km
              </label>
              <input
                type="range"
                min="1"
                max="200"
                value={form.rayonIntervention}
                onChange={(e) => setForm({ ...form, rayonIntervention: parseInt(e.target.value) })}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>1 km</span>
                <span>200 km</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.accepteUrgences}
                onChange={(e) => setForm({ ...form, accepteUrgences: e.target.checked })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                J'accepte les interventions urgentes (24/7)
              </span>
            </label>
          </div>
        </Section>

        {/* ====== SECTION 6 : HORAIRES ====== */}
        <Section
          icon={Clock}
          title="Horaires de disponibilité"
          description="Vos plages horaires de travail"
        >
          <div className="space-y-3">
            {Object.entries(form.horairesDisponibilite).map(([jour, horaire]) => (
              <div key={jour} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-neutral-700 capitalize">
                  {jour}
                </span>
                <input
                  type="text"
                  value={horaire}
                  onChange={(e) => setForm({
                    ...form,
                    horairesDisponibilite: {
                      ...form.horairesDisponibilite,
                      [jour]: e.target.value
                    }
                  })}
                  placeholder="08:00-18:00 ou fermé"
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* ====== SECTION 7 : PRÉFÉRENCES ====== */}
        <Section
          icon={User}
          title="Préférences de travail"
          description="Comment souhaitez-vous travailler ?"
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.preferences.accepteDistance}
                onChange={(e) => setForm({
                  ...form,
                  preferences: { ...form.preferences, accepteDistance: e.target.checked }
                })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                J'accepte les missions à distance (visio, téléassistance)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.preferences.accepteParticuliers}
                onChange={(e) => setForm({
                  ...form,
                  preferences: { ...form.preferences, accepteParticuliers: e.target.checked }
                })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                J'accepte les missions pour particuliers
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.preferences.accepteEntreprises}
                onChange={(e) => setForm({
                  ...form,
                  preferences: { ...form.preferences, accepteEntreprises: e.target.checked }
                })}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                J'accepte les missions pour entreprises
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Nombre maximum de missions simultanées
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.preferences.maxMissionsSimultanees}
                onChange={(e) => setForm({
                  ...form,
                  preferences: {
                    ...form.preferences,
                    maxMissionsSimultanees: parseInt(e.target.value) || 1
                  }
                })}
                className="w-32 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </Section>

        {/* ====== SECTION 8 : CERTIFICATIONS ====== */}
        <Section
          icon={GraduationCap}
          title="Certifications professionnelles"
          description="Vos certifications externes (Cisco, Microsoft, etc.)"
        >
          {technicien?.certifications?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {technicien.certifications.map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-start justify-between gap-3 p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{cert.nom}</p>
                    {cert.organisme && (
                      <p className="text-sm text-neutral-500">{cert.organisme}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      {cert.dateObtention && (
                        <span>Obtenu : {new Date(cert.dateObtention).toLocaleDateString('fr-FR')}</span>
                      )}
                      {cert.verifie ? (
                        <Badge color="success" size="sm">
                          <CheckCircle className="w-3 h-3" />
                          Vérifié
                        </Badge>
                      ) : (
                        <Badge color="warning" size="sm">En attente</Badge>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSupprimerCertification(cert._id)}
                    className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-4 mb-4">
              Aucune certification ajoutée
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setModalCertification(true)}
            icon={Plus}
          >
            Ajouter une certification
          </Button>
        </Section>

        {/* ====== SECTION 9 : DIPLÔMES ====== */}
        <Section
          icon={GraduationCap}
          title="Diplômes et formations"
          description="Vos diplômes académiques"
        >
          {technicien?.diplomes?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {technicien.diplomes.map((dip) => (
                <div
                  key={dip._id}
                  className="flex items-start justify-between gap-3 p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{dip.intitule}</p>
                    {dip.etablissement && (
                      <p className="text-sm text-neutral-500">{dip.etablissement}</p>
                    )}
                    {dip.annee && (
                      <p className="text-xs text-neutral-500 mt-1">Année : {dip.annee}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSupprimerDiplome(dip._id)}
                    className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-4 mb-4">
              Aucun diplôme ajouté
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setModalDiplome(true)}
            icon={Plus}
          >
            Ajouter un diplôme
          </Button>
        </Section>

        {/* ====== BOUTON SAUVEGARDER ====== */}
        <div className="sticky bottom-4 z-10">
          <Card padding="md" className="border-2 border-primary-200 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-neutral-600">
                N'oubliez pas d'enregistrer vos modifications
              </p>
              <Button
                type="submit"
                size="lg"
                variant="primary"
                loading={saveMutation.isLoading}
                icon={Save}
              >
                Enregistrer
              </Button>
            </div>
          </Card>
        </div>
      </form>

      {/* Modal Certification */}
      <Modal
        isOpen={modalCertification}
        onClose={() => setModalCertification(false)}
        title="Ajouter une certification"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalCertification(false)}>
              Annuler
            </Button>
            <Button onClick={handleAjouterCertification}>
              Ajouter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom de la certification *"
            placeholder="Ex: CCNA, Azure Administrator..."
            value={certificationForm.nom}
            onChange={(e) => setCertificationForm({ ...certificationForm, nom: e.target.value })}
            required
          />
          <Input
            label="Organisme émetteur"
            placeholder="Cisco, Microsoft, AWS..."
            value={certificationForm.organisme}
            onChange={(e) => setCertificationForm({ ...certificationForm, organisme: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date d'obtention"
              type="date"
              value={certificationForm.dateObtention}
              onChange={(e) => setCertificationForm({ ...certificationForm, dateObtention: e.target.value })}
            />
            <Input
              label="Date d'expiration"
              type="date"
              value={certificationForm.dateExpiration}
              onChange={(e) => setCertificationForm({ ...certificationForm, dateExpiration: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Diplôme */}
      <Modal
        isOpen={modalDiplome}
        onClose={() => setModalDiplome(false)}
        title="Ajouter un diplôme"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalDiplome(false)}>
              Annuler
            </Button>
            <Button onClick={handleAjouterDiplome}>
              Ajouter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Intitulé du diplôme *"
            placeholder="Ex: Licence en informatique"
            value={diplomeForm.intitule}
            onChange={(e) => setDiplomeForm({ ...diplomeForm, intitule: e.target.value })}
            required
          />
          <Input
            label="Établissement"
            placeholder="Université, école..."
            value={diplomeForm.etablissement}
            onChange={(e) => setDiplomeForm({ ...diplomeForm, etablissement: e.target.value })}
          />
          <Input
            label="Année d'obtention"
            type="number"
            min="1970"
            max="2030"
            value={diplomeForm.annee}
            onChange={(e) => setDiplomeForm({ ...diplomeForm, annee: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
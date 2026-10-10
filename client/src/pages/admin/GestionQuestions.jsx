// client/src/pages/admin/GestionQuestions.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Plus, Edit, Trash2, BookOpen, Award,
  XCircle, CheckCircle, Eye, BarChart3, AlertTriangle
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
import { CATEGORIES_COMPETENCES } from '../../utils/constants.js';

const DIFFICULTES = [
  { value: 'facile', label: 'Facile', couleur: 'success' },
  { value: 'moyen', label: 'Moyen', couleur: 'warning' },
  { value: 'difficile', label: 'Difficile', couleur: 'danger' }
];

const TYPES_QUESTION = [
  { value: 'qcm', label: 'QCM (une bonne réponse)' },
  { value: 'multiple', label: 'Multiple (plusieurs bonnes réponses)' },
  { value: 'vrai_faux', label: 'Vrai / Faux' }
];

// ============================================================
// FORMULAIRE QUESTION (création / édition)
// ============================================================
function QuestionForm({ question, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState(
    question || {
      enonce: '',
      type: 'qcm',
      options: [
        { lettre: 'A', texte: '', estCorrecte: false },
        { lettre: 'B', texte: '', estCorrecte: false },
        { lettre: 'C', texte: '', estCorrecte: false },
        { lettre: 'D', texte: '', estCorrecte: false }
      ],
      categorie: '',
      difficulte: 'moyen',
      explication: '',
      points: 1,
      validee: true,
      actif: true
    }
  );

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...form.options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // QCM / vrai_faux : une seule bonne réponse
    if ((form.type === 'qcm' || form.type === 'vrai_faux') && field === 'estCorrecte' && value) {
      newOptions.forEach((o, i) => {
        if (i !== index) o.estCorrecte = false;
      });
    }

    setForm((prev) => ({ ...prev, options: newOptions }));
  };

  const handleTypeChange = (type) => {
    if (type === 'vrai_faux') {
      setForm((prev) => ({
        ...prev,
        type,
        options: [
          { lettre: 'A', texte: 'Vrai', estCorrecte: true },
          { lettre: 'B', texte: 'Faux', estCorrecte: false }
        ]
      }));
    } else {
      setForm((prev) => ({ ...prev, type }));
    }
  };

  const addOption = () => {
    if (form.options.length >= 6) return;
    const lettres = ['A', 'B', 'C', 'D', 'E', 'F'];
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { lettre: lettres[prev.options.length], texte: '', estCorrecte: false }
      ]
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    const newOptions = form.options.filter((_, i) => i !== index);
    // Réattribuer les lettres
    const lettres = ['A', 'B', 'C', 'D', 'E', 'F'];
    newOptions.forEach((o, i) => {
      o.lettre = lettres[i];
    });
    setForm((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.enonce.trim()) {
      toast.error('L\'énoncé est obligatoire');
      return;
    }
    if (!form.categorie) {
      toast.error('La catégorie est obligatoire');
      return;
    }
    if (form.options.some((o) => !o.texte.trim())) {
      toast.error('Toutes les options doivent être remplies');
      return;
    }
    if (!form.options.some((o) => o.estCorrecte)) {
      toast.error('Au moins une bonne réponse est requise');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Énoncé */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Énoncé de la question *
        </label>
        <textarea
          value={form.enonce}
          onChange={(e) => updateField('enonce', e.target.value)}
          placeholder="Quelle est la plage d'adresses IP privées de classe A ?"
          rows={3}
          required
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Type + Catégorie + Difficulté */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Type *
          </label>
          <select
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {TYPES_QUESTION.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Catégorie *
          </label>
          <select
            value={form.categorie}
            onChange={(e) => updateField('categorie', e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sélectionner...</option>
            {CATEGORIES_COMPETENCES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Difficulté *
          </label>
          <select
            value={form.difficulte}
            onChange={(e) => updateField('difficulte', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {DIFFICULTES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-neutral-700">
            Options de réponse *
          </label>
          {form.type === 'qcm' || form.type === 'multiple' ? (
            <button
              type="button"
              onClick={addOption}
              disabled={form.options.length >= 6}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              + Ajouter une option
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          {form.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateOption(index, 'estCorrecte', !option.estCorrecte)}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                  border-2 transition-colors
                  ${option.estCorrecte
                    ? 'bg-success-500 border-success-500'
                    : 'bg-white border-neutral-300 hover:border-success-400'
                  }
                `}
                title={option.estCorrecte ? 'Bonne réponse' : 'Marquer comme correcte'}
              >
                {option.estCorrecte && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </button>

              <span className="font-mono text-sm font-semibold text-neutral-500 w-6">
                {option.lettre}.
              </span>

              <input
                type="text"
                value={option.texte}
                onChange={(e) => updateOption(index, 'texte', e.target.value)}
                placeholder={`Option ${option.lettre}`}
                disabled={form.type === 'vrai_faux'}
                required
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
              />

              {form.options.length > 2 && form.type !== 'vrai_faux' && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-2">
          Cliquez sur le cercle pour marquer la ou les bonnes réponses.
        </p>
      </div>

      {/* Explication */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Explication (affichée après le test)
        </label>
        <textarea
          value={form.explication}
          onChange={(e) => updateField('explication', e.target.value)}
          placeholder="Ex: La plage 10.0.0.0/8 est réservée aux réseaux privés de classe A."
          rows={2}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Points
        </label>
        <input
          type="number"
          min="0.5"
          max="5"
          step="0.5"
          value={form.points}
          onChange={(e) => updateField('points', parseFloat(e.target.value))}
          className="w-32 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={isLoading}>
          {question ? 'Modifier' : 'Créer'} la question
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// COMPOSANT : Carte question
// ============================================================
function QuestionCard({ question, onEdit, onDelete }) {
  const difficulteInfo = DIFFICULTES.find((d) => d.value === question.difficulte) || {
    label: question.difficulte,
    couleur: 'neutral'
  };

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <Badge color="primary" size="sm">
            {question.categorie}
          </Badge>
          <Badge color={difficulteInfo.couleur} size="sm">
            {difficulteInfo.label}
          </Badge>
          <Badge color="neutral" size="sm">
            {question.type.toUpperCase()}
          </Badge>
          {question.validee && (
            <Badge color="success" size="sm">
              <CheckCircle className="w-3 h-3" />
              Validée
            </Badge>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(question)}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(question)}
            className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600"
            title="Archiver"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="font-medium text-neutral-900 mb-3 line-clamp-2">
        {question.enonce}
      </p>

      <div className="space-y-1.5 mb-3">
        {question.options?.map((option) => (
          <div
            key={option.lettre}
            className={`flex items-start gap-2 text-sm ${
              option.estCorrecte
                ? 'text-success-700 font-medium'
                : 'text-neutral-600'
            }`}
          >
            <span className="font-mono text-xs font-semibold w-5 flex-shrink-0">
              {option.lettre}.
            </span>
            <span className="flex-1">{option.texte}</span>
            {option.estCorrecte && (
              <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {question.explication && (
        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 {question.explication}
          </p>
        </div>
      )}

      {/* Statistiques */}
      {question.statistiques?.nombreFoisPosee > 0 && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {question.statistiques.nombreFoisPosee} fois posée
          </span>
          <span
            className={
              question.statistiques.tauxReussite >= 70
                ? 'text-success-600'
                : question.statistiques.tauxReussite >= 40
                  ? 'text-accent-600'
                  : 'text-danger-600'
            }
          >
            <BarChart3 className="w-3 h-3 inline mr-1" />
            {question.statistiques.tauxReussite}% réussite
          </span>
        </div>
      )}
    </Card>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function AdminGestionQuestions() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('');
  const [difficulte, setDifficulte] = useState('');
  const [modalForm, setModalForm] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-questions', page, recherche, categorie, difficulte],
    queryFn: () =>
      adminApi.getQuestions({
        page,
        limit: 12,
        q: recherche || undefined,
        categorie: categorie || undefined,
        difficulte: difficulte || undefined
      }),
    keepPreviousData: true
  });

  const creerMutation = useMutation({
    mutationFn: (data) => adminApi.creerQuestion(data),
    onSuccess: () => {
      toast.success('Question créée');
      queryClient.invalidateQueries(['admin-questions']);
      setModalForm(null);
    },
    onError: (err) => toast.error(err.message)
  });

  const modifierMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.modifierQuestion(id, data),
    onSuccess: () => {
      toast.success('Question modifiée');
      queryClient.invalidateQueries(['admin-questions']);
      setModalForm(null);
    },
    onError: (err) => toast.error(err.message)
  });

  const supprimerMutation = useMutation({
    mutationFn: (id) => adminApi.supprimerQuestion(id),
    onSuccess: () => {
      toast.success('Question archivée');
      queryClient.invalidateQueries(['admin-questions']);
      setModalDelete(null);
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (formData) => {
    if (modalForm?._id) {
      modifierMutation.mutate({ id: modalForm._id, data: formData });
    } else {
      creerMutation.mutate(formData);
    }
  };

  const questions = data?.questions || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Gestion des questions
          </h1>
          <p className="text-neutral-500 mt-1">
            {pagination.total || 0} question(s) dans la banque
          </p>
        </div>
        <Button onClick={() => setModalForm({})} icon={Plus}>
          Nouvelle question
        </Button>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            placeholder="Rechercher dans les énoncés..."
            icon={Search}
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
          />

          <select
            value={categorie}
            onChange={(e) => {
              setCategorie(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES_COMPETENCES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={difficulte}
            onChange={(e) => {
              setDifficulte(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes difficultés</option>
            {DIFFICULTES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setRecherche('');
              setCategorie('');
              setDifficulte('');
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
        <Loader text="Chargement des questions..." />
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Erreur de chargement</p>
            <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
          </div>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucune question trouvée</p>
            <p className="text-sm text-neutral-500 mt-1">
              {recherche || categorie || difficulte
                ? 'Essayez de modifier vos filtres'
                : 'Cliquez sur "Nouvelle question" pour en créer une'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {questions.map((q) => (
              <QuestionCard
                key={q._id}
                question={q}
                onEdit={(question) => setModalForm(question)}
                onDelete={(question) => setModalDelete(question)}
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

      {/* Modal Formulaire */}
      <Modal
        isOpen={!!modalForm}
        onClose={() => setModalForm(null)}
        title={modalForm?._id ? 'Modifier la question' : 'Nouvelle question'}
        size="xl"
      >
        <QuestionForm
          question={modalForm?._id ? modalForm : null}
          onSubmit={handleSubmit}
          onCancel={() => setModalForm(null)}
          isLoading={creerMutation.isLoading || modifierMutation.isLoading}
        />
      </Modal>

      {/* Modal Suppression */}
      <Modal
        isOpen={!!modalDelete}
        onClose={() => setModalDelete(null)}
        title="Archiver la question"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => supprimerMutation.mutate(modalDelete._id)}
              loading={supprimerMutation.isLoading}
            >
              Archiver
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <p className="text-sm text-neutral-700 mb-2">
              Vous êtes sur le point d'archiver cette question. Elle ne sera plus
              utilisée dans les tests.
            </p>
            <p className="text-sm font-medium text-neutral-900 p-2 bg-neutral-50 rounded">
              {modalDelete?.enonce}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
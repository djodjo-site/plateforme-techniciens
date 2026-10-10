// server/middlewares/validationMiddleware.js
const { body, param, query, validationResult } = require('express-validator');

const valider = (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      erreurs: erreurs.array().map((e) => ({
        champ: e.path,
        message: e.msg,
        valeur: e.value
      }))
    });
  }
  next();
};

// ===== RÈGLES D'AUTHENTIFICATION =====

const reglesInscription = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('motDePasse')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[a-z]/).withMessage('Doit contenir une minuscule')
    .matches(/[A-Z]/).withMessage('Doit contenir une majuscule')
    .matches(/[0-9]/).withMessage('Doit contenir un chiffre'),
  body('nom')
    .trim().notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .trim().notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('telephone')
    .trim().notEmpty().withMessage('Le téléphone est obligatoire')
    .matches(/^\+?[0-9]{8,15}$/).withMessage('Numéro de téléphone invalide'),
  body('role')
    .optional()
    .isIn(['technicien', 'entreprise', 'particulier'])
    .withMessage('Rôle invalide')
];

const reglesConnexion = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('motDePasse').notEmpty().withMessage('Le mot de passe est obligatoire')
];

// ===== RÈGLES TECHNICIEN =====

const reglesProfilTechnicien = [
  body('titreProfessionnel')
    .optional()
    .isLength({ max: 100 }).withMessage('Maximum 100 caractères'),
  body('biographie')
    .optional()
    .isLength({ max: 1000 }).withMessage('Maximum 1000 caractères'),
  body('anneesExperience')
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage('Valeur entre 0 et 60'),
  body('competences')
    .optional()
    .isArray({ max: 20 }).withMessage('Maximum 20 compétences'),
  body('rayonIntervention')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Rayon entre 1 et 200 km'),
  body('tarifs.horaire')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le tarif doit être positif'),
  body('tarifs.devise')
    .optional()
    .isIn(['XAF', 'USD', 'EUR', 'CDF']).withMessage('Devise invalide')
];

// ===== RÈGLES ENTREPRISE =====

const reglesProfilEntreprise = [
  body('raisonSociale')
    .trim().notEmpty().withMessage('La raison sociale est obligatoire')
    .isLength({ max: 150 }).withMessage('Maximum 150 caractères'),
  body('numeroRCCM').optional().trim(),
  body('numeroImpot').optional().trim(),
  body('siteWeb').optional().isURL().withMessage('URL invalide'),
  body('nombreEmployes').optional().isInt({ min: 0 })
];

// ===== RÈGLES QUESTION =====

const reglesQuestion = [
  body('enonce').trim().notEmpty().withMessage('L\'énoncé est obligatoire'),
  body('type').isIn(['qcm', 'vrai_faux', 'multiple']).withMessage('Type invalide'),
  body('options').isArray({ min: 2, max: 6 }).withMessage('Entre 2 et 6 options'),
  body('categorie').notEmpty().withMessage('La catégorie est obligatoire'),
  body('difficulte').isIn(['facile', 'moyen', 'difficile']).withMessage('Difficulté invalide'),
  body('points').optional().isFloat({ min: 0.5, max: 5 })
];

// ===== RÈGLES DEMANDE =====

const reglesDemande = [
  body('titre').trim().notEmpty().withMessage('Le titre est obligatoire').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('La description est obligatoire').isLength({ max: 5000 }),
  body('categorie').notEmpty().withMessage('La catégorie est obligatoire'),
  body('urgence').optional().isIn(['basse', 'normale', 'haute', 'urgente']),
  body('budget.min').optional().isFloat({ min: 0 }),
  body('budget.max').optional().isFloat({ min: 0 })
];

// ===== RÈGLES MISSION =====

const reglesMission = [
  body('dateDebut').optional().isISO8601().withMessage('Date invalide'),
  body('tarification.prixConvenu').optional().isFloat({ min: 0 })
];

// ===== RÈGLES AVIS =====

const reglesAvis = [
  body('note').isInt({ min: 1, max: 5 }).withMessage('Note entre 1 et 5'),
  body('commentaire').trim().notEmpty().withMessage('Le commentaire est obligatoire').isLength({ max: 2000 }),
  body('criteres.qualite').optional().isInt({ min: 1, max: 5 }),
  body('criteres.rapidite').optional().isInt({ min: 1, max: 5 }),
  body('criteres.communication').optional().isInt({ min: 1, max: 5 }),
  body('criteres.prix').optional().isInt({ min: 1, max: 5 })
];

// ===== RÈGLES MESSAGE =====

const reglesMessage = [
  body('destinataire').isMongoId().withMessage('Destinataire invalide'),
  body('contenu').trim().notEmpty().withMessage('Le message ne peut pas être vide').isLength({ max: 5000 })
];

// ===== RÈGLES PARAM =====

const validerMongoId = (champ = 'id') => [
  param(champ).isMongoId().withMessage(`${champ} invalide`)
];

const validerPagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

module.exports = {
  valider,
  reglesInscription,
  reglesConnexion,
  reglesProfilTechnicien,
  reglesProfilEntreprise,
  reglesQuestion,
  reglesDemande,
  reglesMission,
  reglesAvis,
  reglesMessage,
  validerMongoId,
  validerPagination
};
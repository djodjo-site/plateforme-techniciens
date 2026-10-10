// server/services/testService.js
const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
const Technicien = require('../models/Technicien');
const { TEST, STATUTS_TECHNICIEN } = require('../config/constants');
const { logger } = require('../utils/logger');
const { genererCodeOTP } = require('../utils/helpers');

const demarrerTest = async (technicienId) => {
  const technicien = await Technicien.findById(technicienId);
  if (!technicien) throw new Error('Technicien introuvable');

  if (technicien.statut === STATUTS_TECHNICIEN.NINTI_ACTIF) {
    throw new Error('Vous avez déjà un NINTI actif');
  }

  if (technicien.statut === STATUTS_TECHNICIEN.TEST_REUSSI) {
    throw new Error('Vous avez déjà réussi le test, veuillez payer votre accréditation');
  }

  if (!technicien.peutPasserTest()) {
    const heures = technicien.tempsRestantAvantRepassage();
    throw new Error(`Vous devez attendre ${heures} heure(s) avant de repasser le test`);
  }

  // Vérifier qu'il existe assez de questions
  const nombreQuestionsDisponibles = await Question.countDocuments({
    actif: true,
    validee: true,
    archivee: false
  });

  if (nombreQuestionsDisponibles < TEST.NB_QUESTIONS) {
    throw new Error(`Pas assez de questions disponibles (${nombreQuestionsDisponibles}/${TEST.NB_QUESTIONS})`);
  }

  // Générer un test équilibré par catégorie
  let questions = await Question.genererTestEquilibre(TEST.NB_QUESTIONS);

  if (questions.length < TEST.NB_QUESTIONS) {
    const supplement = await Question.genererTestAleatoire(
      TEST.NB_QUESTIONS - questions.length
    );
    const idsExistants = questions.map((q) => q._id.toString());
    const supplementFiltre = supplement.filter(
      (q) => !idsExistants.includes(q._id.toString())
    );
    questions = [...questions, ...supplementFiltre];
  }

  // Mélanger les questions
  questions = questions.sort(() => Math.random() - 0.5);

  // Mélanger les options de chaque question
  questions = questions.map((q) => ({
    ...q,
    options: q.options.sort(() => Math.random() - 0.5)
  }));

  const tentative = (technicien.nombreTentativesTest || 0) + 1;

  // Calculer le total des points
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  // Créer le TestResult en cours
  const testResult = await TestResult.create({
  technicien: technicienId,
  nombreQuestions: questions.length,
  totalPoints,
  tentative,
  dateDebut: new Date(),
  dateFin: new Date(),
  statut: 'en_cours',
  score: 0,           // ← AJOUT
  reussi: false,      // ← AJOUT
  configuration: {
    nombreQuestions: TEST.NB_QUESTIONS,
    dureeMinutes: TEST.DUREE_MINUTES,
    seuilReussite: TEST.SEUIL_REUSSITE,
    melangeQuestions: true,
    melangeOptions: true
  },
  reponses: questions.map((q) => ({
    question: q._id,
    reponsesDonnees: [],
    estCorrecte: false,
    pointsObtenus: 0,
    pointsPossibles: q.points || 1,
    categorie: q.categorie,
    difficulte: q.difficulte
  })),
  securite: {
    adresseIP: null,
    userAgent: null,
    scoreFiabilite: 100,
    invalide: false,
    changementsOnglet: 0,
    copiesDetectees: 0,
    clicsDroits: 0
  }
});

  // Incrémenter le nombre de tentatives du technicien
  technicien.nombreTentativesTest = tentative;
  await technicien.save();

  logger.info('Test démarré', { technicienId, testId: testResult._id, tentative });

  // Retourner les questions SANS les bonnes réponses
  const questionsPubliques = questions.map((q) => ({
    _id: q._id,
    enonce: q.enonce,
    type: q.type,
    options: q.options.map((o) => ({ lettre: o.lettre, texte: o.texte })),
    categorie: q.categorie,
    difficulte: q.difficulte,
    points: q.points || 1,
    tempsRecommande: q.tempsRecommande || 45
  }));

  return {
    testId: testResult._id,
    tentative,
    dureeMinutes: TEST.DUREE_MINUTES,
    seuilReussite: TEST.SEUIL_REUSSITE,
    nombreQuestions: questions.length,
    totalPoints,
    questions: questionsPubliques,
    dateDebut: testResult.dateDebut
  };
};

const soumettreTest = async (testId, technicienId, reponsesSoumises, securite = {}) => {
  const testResult = await TestResult.findById(testId);
  if (!testResult) throw new Error('Test introuvable');

  if (testResult.technicien.toString() !== technicienId.toString()) {
    throw new Error('Non autorisé à soumettre ce test');
  }

  if (testResult.statut !== 'en_cours') {
    throw new Error('Ce test est déjà terminé ou invalidé');
  }

  // Charger les questions avec les bonnes réponses
  const questionsIds = testResult.reponses.map((r) => r.question);
  const questions = await Question.find({ _id: { $in: questionsIds } });

  const questionsMap = new Map();
  questions.forEach((q) => questionsMap.set(q._id.toString(), q));

  let nombreBonnesReponses = 0;
  let nombreMauvaisesReponses = 0;
  let nombreSansReponse = 0;
  let pointsObtenus = 0;

  // Traiter chaque réponse
  for (const reponseTest of testResult.reponses) {
    const questionId = reponseTest.question.toString();
    const question = questionsMap.get(questionId);

    if (!question) continue;

    const soumission = reponsesSoumises.find(
      (r) => r.questionId === questionId
    );

    if (!soumission || !soumission.reponses || soumission.reponses.length === 0) {
      nombreSansReponse++;
      reponseTest.reponsesDonnees = [];
      reponseTest.estCorrecte = false;
      reponseTest.pointsObtenus = 0;
      continue;
    }

    const estCorrecte = question.verifierReponse(soumission.reponses);
    reponseTest.reponsesDonnees = soumission.reponses;
    reponseTest.estCorrecte = estCorrecte;
    reponseTest.tempsReponse = soumission.tempsReponse || 0;

    if (estCorrecte) {
      nombreBonnesReponses++;
      reponseTest.pointsObtenus = reponseTest.pointsPossibles;
      pointsObtenus += reponseTest.pointsPossibles;
    } else {
      nombreMauvaisesReponses++;
      reponseTest.pointsObtenus = 0;
    }

    // Enregistrer les stats de la question
    await question.enregistrerUtilisation(
      estCorrecte,
      soumission.tempsReponse || 0
    );
  }

  // Mettre à jour le TestResult
  testResult.nombreBonnesReponses = nombreBonnesReponses;
  testResult.nombreMauvaisesReponses = nombreMauvaisesReponses;
  testResult.nombreSansReponse = nombreSansReponse;
  testResult.pointsObtenus = pointsObtenus;
  testResult.dateFin = new Date();
  testResult.statut = 'termine';

  // Sécurité
  if (securite.changementsOnglet) {
    testResult.securite.changementsOnglet = securite.changementsOnglet;
  }
  if (securite.copiesDetectees) {
    testResult.securite.copiesDetectees = securite.copiesDetectees;
  }
  if (securite.adresseIP) {
    testResult.securite.adresseIP = securite.adresseIP;
  }
  if (securite.userAgent) {
    testResult.securite.userAgent = securite.userAgent;
  }

  // Calculer la fiabilité
  let fiabilite = 100;
  if (testResult.securite.changementsOnglet > 3) fiabilite -= 15;
  if (testResult.securite.changementsOnglet > 5) fiabilite -= 30;
  if (testResult.securite.copiesDetectees > 0) fiabilite -= 10 * testResult.securite.copiesDetectees;
  testResult.securite.scoreFiabilite = Math.max(0, fiabilite);

  // Invalider si trop suspect
  if (testResult.securite.scoreFiabilite < 30) {
    testResult.securite.invalide = true;
    testResult.securite.raisonInvalidation = 'Comportement suspect détecté';
    testResult.statut = 'invalide';
  }

  // Calculer la performance par catégorie
  testResult.calculerPerformanceCategories();

  await testResult.save();

  logger.info('Test soumis', {
    testId,
    technicienId,
    score: testResult.score,
    reussi: testResult.reussi,
    fiabilite: testResult.securite.scoreFiabilite
  });

  return testResult;
};

const obtenirResultatTest = async (testId, userId) => {
  const test = await TestResult.findById(testId)
    .populate('reponses.question', 'enonce categorie difficulte explication options');

  if (!test) throw new Error('Test introuvable');

  if (test.technicien.toString() !== userId.toString()) {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Non autorisé à consulter ce test');
    }
  }

  if (test.statut === 'en_cours') {
    throw new Error('Le test n\'est pas encore terminé');
  }

  return test;
};

const historiqueTests = async (technicienId) => {
  return TestResult.historiqueTechnicien(technicienId);
};

const verifierEligibilite = async (technicienId) => {
  const technicien = await Technicien.findById(technicienId);
  if (!technicien) throw new Error('Technicien introuvable');

  const nombreQuestionsDisponibles = await Question.countDocuments({
    actif: true,
    validee: true,
    archivee: false
  });

  const peutPasser = technicien.peutPasserTest();
  const heuresRestantes = peutPasser ? 0 : technicien.tempsRestantAvantRepassage();

  return {
    eligible: peutPasser && nombreQuestionsDisponibles >= TEST.NB_QUESTIONS,
    statut: technicien.statut,
    peutPasser,
    heuresRestantes,
    nombreTentatives: technicien.nombreTentativesTest || 0,
    scoreDernierTest: technicien.scoreTest,
    questionsDisponibles: nombreQuestionsDisponibles,
    questionsRequises: TEST.NB_QUESTIONS,
    seuilReussite: TEST.SEUIL_REUSSITE,
    dureeMinutes: TEST.DUREE_MINUTES
  };
};

const sauvegarderReponseTemporaire = async (testId, technicienId, donnees) => {
  const test = await TestResult.findById(testId).select('+reponsesTemporaires');
  if (!test) throw new Error('Test introuvable');
  if (test.technicien.toString() !== technicienId.toString()) {
    throw new Error('Non autorisé');
  }
  if (test.statut !== 'en_cours') {
    throw new Error('Test déjà terminé');
  }

  test.reponsesTemporaires = donnees;
  await test.save({ validateBeforeSave: false });
  return true;
};

const genererCodeDemarrage = () => {
  return genererCodeOTP(6);
};

module.exports = {
  demarrerTest,
  soumettreTest,
  obtenirResultatTest,
  historiqueTests,
  verifierEligibilite,
  sauvegarderReponseTemporaire,
  genererCodeDemarrage
};
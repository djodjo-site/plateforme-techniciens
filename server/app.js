// server/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import des middlewares personnalisés
const errorMiddleware = require('./middlewares/errorMiddleware');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const technicienRoutes = require('./routes/technicienRoutes');
const entrepriseRoutes = require('./routes/entrepriseRoutes');
const testRoutes = require('./routes/testRoutes');
const nintiRoutes = require('./routes/nintiRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const abonnementRoutes = require('./routes/abonnementRoutes');
const annuaireRoutes = require('./routes/annuaireRoutes');
const demandeRoutes = require('./routes/demandeRoutes');
const missionRoutes = require('./routes/missionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const avisRoutes = require('./routes/avisRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ===== SÉCURITÉ =====
app.use(helmet());

// ===== CORS =====
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api', limiter);

// Rate limiting plus strict pour l'authentification
// Désactivé en développement pour faciliter les tests
if (process.env.NODE_ENV === 'production') {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
  });
  app.use('/api/auth/connexion', authLimiter);
}
// ===== PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===== LOGGING =====
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===== FICHIERS STATIQUES =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTE DE SANTÉ =====
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API Plateforme Techniciens opérationnelle',
    timestamp: new Date().toISOString(),
    environnement: process.env.NODE_ENV
  });
});

// ===== ROUTES API =====
app.use('/api/auth', authRoutes);
app.use('/api/techniciens', technicienRoutes);
app.use('/api/entreprises', entrepriseRoutes);
app.use('/api/test', testRoutes);
app.use('/api/ninti', nintiRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/abonnements', abonnementRoutes);
app.use('/api/annuaire', annuaireRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/admin', adminRoutes);

// ===== GESTION DES ROUTES INEXISTANTES =====
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} introuvable`
  });
});
// ===== ROUTES API =====
app.use('/api/auth', authRoutes);
// ... etc
app.use('/api/paiements', paiementRoutes);
// ...

// ===== GESTION CENTRALISÉE DES ERREURS =====
app.use(errorMiddleware);

module.exports = app;
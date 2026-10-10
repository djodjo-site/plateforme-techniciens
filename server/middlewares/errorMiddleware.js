// server/middlewares/errorMiddleware.js

const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur :', err);
  }

  // ===== ERREURS MONGOOSE =====

  // ID MongoDB invalide
  if (err.name === 'CastError') {
    error.message = 'Ressource introuvable';
    error.statusCode = 404;
  }

  // Validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // Duplicata (clé unique)
  if (err.code === 11000) {
    const champ = Object.keys(err.keyValue)[0];
    error.message = `La valeur pour le champ "${champ}" existe déjà`;
    error.statusCode = 400;
  }

  // ===== ERREURS JWT =====

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token invalide';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expiré, veuillez vous reconnecter';
    error.statusCode = 401;
  }

  // ===== ERREURS STRIPE =====

  if (err.type && err.type.startsWith('Stripe')) {
    error.message = err.message || 'Erreur de paiement';
    error.statusCode = 402;
  }

  // ===== ERREURS MULTER =====

  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'Fichier trop volumineux';
    error.statusCode = 413;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Champ de fichier inattendu';
    error.statusCode = 400;
  }

  // ===== RÉPONSE =====
  const statusCode = error.statusCode || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      erreur: err
    })
  });
};

module.exports = errorMiddleware;
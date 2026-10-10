// server/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const proteger = async (req, res, next) => {
  try {
    let token;

    // 1. Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Ou depuis les cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé, veuillez vous connecter'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    if (!user.actif) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé, veuillez contacter l\'administrateur'
      });
    }

    if (user.compteVerrouille) {
      return res.status(403).json({
        success: false,
        message: 'Compte verrouillé, veuillez contacter l\'administrateur'
      });
    }

    // Attacher l'utilisateur à la requête
     user.role = user.role?.toLowerCase();

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé, token invalide ou expiré'
    });
  }
};

const protegerOptionnel = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (user && user.actif) {
      user.role = user.role?.toLowerCase();
      req.user = user;
      req.userId = user._id.toString();
      req.userRole = user.role;
    }
    next();
  } catch (error) {
    next();
  }
};

const verifierEmailVerifie = (req, res, next) => {
  if (!req.user.emailVerifie) {
    return res.status(403).json({
      success: false,
      message: 'Veuillez vérifier votre adresse email avant de continuer'
    });
  }
  next();
};

module.exports = {
  proteger,
  protegerOptionnel,
  verifierEmailVerifie
};
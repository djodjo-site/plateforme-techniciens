// server/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  if (!user || !user._id) {
    throw new Error('Utilisateur invalide pour la génération du token');
  }

  const payload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'plateforme-techniciens',
    audience: 'plateforme-techniciens-client'
  });
};

const generateRefreshToken = (user) => {
  if (!user || !user._id) {
    throw new Error('Utilisateur invalide pour la génération du refresh token');
  }

  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'plateforme-techniciens',
      audience: 'plateforme-techniciens-refresh'
    }
  );
};

const generateTokenVerificationEmail = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

const generateTokenResetPassword = () => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHashed = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHashed };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'plateforme-techniciens',
      audience: 'plateforme-techniciens-client'
    });
  } catch (error) {
    throw new Error(`Token invalide : ${error.message}`);
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

const envoyerTokenCookie = (res, token, dureeJours = 7) => {
  const options = {
    expires: new Date(Date.now() + dureeJours * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('token', token, options);
};

const supprimerTokenCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateTokenVerificationEmail,
  generateTokenResetPassword,
  verifyToken,
  decodeToken,
  envoyerTokenCookie,
  supprimerTokenCookie
};
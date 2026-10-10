// server/controllers/authController.js
const User = require('../models/User');
const Technicien = require('../models/Technicien');
const Entreprise = require('../models/Entreprise');
const { ROLES, STATUTS_TECHNICIEN, STATUTS_ENTREPRISE } = require('../config/constants');
const { generateToken, envoyerTokenCookie, supprimerTokenCookie } = require('../utils/generateToken');
const { genererTokenAleatoire, hasherDonnee } = require('../utils/hashPassword');
const mailService = require('../services/mailService');
const { logger } = require('../utils/logger');

const inscription = async (req, res, next) => {
  try {
    const { email, motDePasse, nom, prenom, telephone, role = ROLES.PARTICULIER, ...extra } = req.body;

    const roleNormalise = role?.toLowerCase();

    const emailExiste = await User.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const telephoneExiste = await User.findOne({ telephone });
    if (telephoneExiste) {
      return res.status(400).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
    }

    const donneesBase = { email, motDePasse, nom, prenom, telephone };

    let user;
    if (roleNormalise === ROLES.TECHNICIEN) {
      user = await Technicien.create({
        ...donneesBase,
        statut: STATUTS_TECHNICIEN.EN_ATTENTE_DE_TEST,
        ville: extra.ville || null,
        pays: extra.pays || 'Congo'
      });
    } else if (roleNormalise === ROLES.ENTREPRISE) {
      if (!extra.raisonSociale) {
        return res.status(400).json({ success: false, message: 'La raison sociale est obligatoire' });
      }
      user = await Entreprise.create({
        ...donneesBase,
        raisonSociale: extra.raisonSociale,
        nomCommercial: extra.nomCommercial || null,
        numeroRCCM: extra.numeroRCCM || null,
        numeroImpot: extra.numeroImpot || null,
        secteurActivite: extra.secteurActivite || null,
        tailleEntreprise: extra.tailleEntreprise || 'PME',
        ville: extra.ville || null,
        statut: STATUTS_ENTREPRISE.EN_ATTENTE_VALIDATION
      });
    } else {
      user = await User.create(donneesBase);
    }

    const tokenVerification = genererTokenAleatoire(32);
    user.tokenVerificationEmail = hasherDonnee(tokenVerification);
    await user.save({ validateBeforeSave: false });

    try {
      await mailService.envoyerVerificationEmail(user, tokenVerification);
    } catch (mailError) {
      logger.warn('Email de vérification non envoyé', { error: mailError.message });
    }

    const token = generateToken(user);
    envoyerTokenCookie(res, token);

    logger.info('Inscription réussie', { userId: user._id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie. Vérifiez votre email.',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

const connexion = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email }).select('+motDePasse +tentativesConnexion +compteVerrouille');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    if (user.compteVerrouille) {
      return res.status(403).json({ success: false, message: 'Compte verrouillé. Contactez l\'administrateur.' });
    }

    if (!user.actif) {
      return res.status(403).json({ success: false, message: 'Compte désactivé' });
    }

    const motDePasseValide = await user.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      await User.incrementerTentatives(user._id);
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    await User.resetTentatives(user._id);

    const token = generateToken(user);
    envoyerTokenCookie(res, token);

    logger.info('Connexion réussie', { userId: user._id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

const deconnexion = async (req, res, next) => {
  try {
    supprimerTokenCookie(res);
    res.status(200).json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

const profil = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }
    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const verifierEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const tokenHashed = hasherDonnee(token);

    const user = await User.findOne({ tokenVerificationEmail: tokenHashed }).select('+tokenVerificationEmail');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token de vérification invalide ou expiré' });
    }

    user.emailVerifie = true;
    user.tokenVerificationEmail = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email vérifié avec succès' });
  } catch (error) {
    next(error);
  }
};

const renvoyerVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    if (user.emailVerifie) return res.status(400).json({ success: false, message: 'Email déjà vérifié' });

    const tokenVerification = genererTokenAleatoire(32);
    user.tokenVerificationEmail = hasherDonnee(tokenVerification);
    await user.save({ validateBeforeSave: false });

    try {
      await mailService.envoyerVerificationEmail(user, tokenVerification);
    } catch (mailError) {
      logger.warn('Email non envoyé', { error: mailError.message });
    }

    res.status(200).json({ success: true, message: 'Email de vérification renvoyé' });
  } catch (error) {
    next(error);
  }
};

const motDePasseOublie = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ success: true, message: 'Si l\'email existe, un lien a été envoyé' });
    }

    const tokenReset = genererTokenAleatoire(32);
    user.tokenResetMotDePasse = hasherDonnee(tokenReset);
    user.tokenResetExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await mailService.envoyerResetMotDePasse(user, tokenReset);
    } catch (mailError) {
      logger.warn('Email reset non envoyé', { error: mailError.message });
    }

    res.status(200).json({ success: true, message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    next(error);
  }
};

const resetMotDePasse = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { motDePasse } = req.body;
    const tokenHashed = hasherDonnee(token);

    const user = await User.findOne({
      tokenResetMotDePasse: tokenHashed,
      tokenResetExpire: { $gt: new Date() }
    }).select('+tokenResetMotDePasse +tokenResetExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    }

    user.motDePasse = motDePasse;
    user.tokenResetMotDePasse = undefined;
    user.tokenResetExpire = undefined;
    user.tentativesConnexion = 0;
    user.compteVerrouille = false;
    await user.save();

    const jwtToken = generateToken(user);
    envoyerTokenCookie(res, jwtToken);

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      token: jwtToken
    });
  } catch (error) {
    next(error);
  }
};

const changerMotDePasse = async (req, res, next) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const user = await User.findById(req.userId).select('+motDePasse');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const valide = await user.comparerMotDePasse(ancienMotDePasse);
    if (!valide) {
      return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });
    }

    user.motDePasse = nouveauMotDePasse;
    await user.save();

    const jwtToken = generateToken(user);
    envoyerTokenCookie(res, jwtToken);

    res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès', token: jwtToken });
  } catch (error) {
    next(error);
  }
};

const mettreAJourProfil = async (req, res, next) => {
  try {
    const champs = ['nom', 'prenom', 'telephone', 'ville', 'adresse', 'dateNaissance', 'langue'];
    const updates = {};
    champs.forEach((c) => {
      if (req.body[c] !== undefined) updates[c] = req.body[c];
    });

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const uploadPhotoProfil = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

    const url = `/uploads/profils/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { photo: url }, { new: true });

    res.status(200).json({ success: true, photo: url, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

const verifierDisponibiliteEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const existe = await User.findOne({ email });
    res.status(200).json({ success: true, disponible: !existe });
  } catch (error) {
    next(error);
  }
};

const verifierDisponibiliteTelephone = async (req, res, next) => {
  try {
    const { telephone } = req.query;
    const existe = await User.findOne({ telephone });
    res.status(200).json({ success: true, disponible: !existe });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  inscription,
  connexion,
  deconnexion,
  profil,
  verifierEmail,
  renvoyerVerification,
  motDePasseOublie,
  resetMotDePasse,
  changerMotDePasse,
  mettreAJourProfil,
  uploadPhotoProfil,
  verifierDisponibiliteEmail,
  verifierDisponibiliteTelephone
};
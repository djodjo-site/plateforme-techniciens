// server/middlewares/roleMiddleware.js
const { ROLES } = require('../config/constants');

// Helper : comparaison de rôle insensible à la casse
const roleMatch = (userRole, allowedRoles) => {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase();
  return allowedRoles.map((r) => r.toLowerCase()).includes(normalized);
};

const autoriserRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!roleMatch(req.user.role, roles)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}`
      });
    }

    next();
  };
};

const estAdmin = (req, res, next) => {
  if (!req.user || !roleMatch(req.user.role, [ROLES.ADMIN])) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

const estTechnicien = (req, res, next) => {
  if (!req.user || !roleMatch(req.user.role, [ROLES.TECHNICIEN])) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux techniciens'
    });
  }
  next();
};

const estEntreprise = (req, res, next) => {
  if (!req.user || !roleMatch(req.user.role, [ROLES.ENTREPRISE])) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux entreprises'
    });
  }
  next();
};

const estParticulier = (req, res, next) => {
  if (!req.user || !roleMatch(req.user.role, [ROLES.PARTICULIER])) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux particuliers'
    });
  }
  next();
};

const estSuperAdmin = (req, res, next) => {
  if (
    !req.user ||
    !roleMatch(req.user.role, [ROLES.ADMIN]) ||
    req.user.niveauAcces !== 'super_admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé au super administrateur'
    });
  }
  next();
};

const aPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !roleMatch(req.user.role, [ROLES.ADMIN])) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    if (req.user.niveauAcces === 'super_admin') return next();

    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission requise : ${permission}`
      });
    }

    next();
  };
};

const estProprietaireOuAdmin = (champId = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    if (roleMatch(req.user.role, [ROLES.ADMIN])) return next();

    const idRessource = req.params[champId] || req.body[champId] || req.params.id;

    if (idRessource && idRessource.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }

    next();
  };
};

module.exports = {
  autoriserRoles,
  estAdmin,
  estTechnicien,
  estEntreprise,
  estParticulier,
  estSuperAdmin,
  aPermission,
  estProprietaireOuAdmin
};
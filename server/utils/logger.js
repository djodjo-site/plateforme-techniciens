// server/utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const dossierLogs = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(dossierLogs)) {
  fs.mkdirSync(dossierLogs, { recursive: true });
}

const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
  ),

  fichier: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  )
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'plateforme-techniciens',
    environnement: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.File({
      filename: path.join(dossierLogs, 'error.log'),
      level: 'error',
      format: formats.fichier,
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(dossierLogs, 'combined.log'),
      format: formats.fichier,
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(dossierLogs, 'warnings.log'),
      level: 'warn',
      format: formats.fichier,
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(dossierLogs, 'exceptions.log'),
      format: formats.fichier
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(dossierLogs, 'rejections.log'),
      format: formats.fichier
    })
  ],
  exitOnError: false
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: formats.console,
    level: 'debug'
  }));
}

const loggerAvecContexte = (contexte) => ({
  info: (message, meta = {}) => logger.info(`[${contexte}] ${message}`, meta),
  warn: (message, meta = {}) => logger.warn(`[${contexte}] ${message}`, meta),
  error: (message, meta = {}) => logger.error(`[${contexte}] ${message}`, meta),
  debug: (message, meta = {}) => logger.debug(`[${contexte}] ${message}`, meta)
});

const logRequete = (req, res, next) => {
  const debut = Date.now();

  res.on('finish', () => {
    const duree = Date.now() - debut;
    const niveau = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[niveau](`${req.method} ${req.originalUrl}`, {
      statut: res.statusCode,
      duree: `${duree}ms`,
      ip: req.ip,
      user: req.userId || 'anonyme'
    });
  });

  next();
};

const logErreur = (erreur, contexte = null, meta = {}) => {
  logger.error(erreur.message, {
    contexte,
    stack: erreur.stack,
    ...meta
  });
};

const logActionAdmin = (adminId, action, cible = null, details = {}) => {
  logger.info(`Action admin: ${action}`, {
    adminId,
    cible,
    ...details
  });
};

const logPaiement = (paiementId, montant, statut, utilisateurId) => {
  logger.info(`Paiement ${statut}`, {
    paiementId,
    montant,
    utilisateurId
  });
};

const logSecurite = (type, details = {}) => {
  logger.warn(`Sécurité: ${type}`, details);
};

const logTest = (technicienId, score, reussi) => {
  logger.info(`Test terminé`, {
    technicienId,
    score,
    reussi
  });
};

const logSocket = (evenement, userId, details = {}) => {
  logger.debug(`Socket: ${evenement}`, { userId, ...details });
};

const logPerformance = (operation, dureeMs, meta = {}) => {
  const niveau = dureeMs > 1000 ? 'warn' : 'debug';
  logger[niveau](`Performance: ${operation}`, { dureeMs, ...meta });
};

const viderLogsAnciens = async (joursConservation = 30) => {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() - joursConservation);

  try {
    const fichiers = fs.readdirSync(dossierLogs);
    let supprimes = 0;

    fichiers.forEach((fichier) => {
      const chemin = path.join(dossierLogs, fichier);
      const stats = fs.statSync(chemin);
      if (stats.mtime < dateLimite) {
        fs.unlinkSync(chemin);
        supprimes++;
      }
    });

    logger.info(`Nettoyage logs : ${supprimes} fichier(s) supprimé(s)`);
    return supprimes;
  } catch (error) {
    logger.error('Erreur nettoyage logs', { error: error.message });
    return 0;
  }
};

module.exports = {
  logger,
  loggerAvecContexte,
  logRequete,
  logErreur,
  logActionAdmin,
  logPaiement,
  logSecurite,
  logTest,
  logSocket,
  logPerformance,
  viderLogsAnciens
};
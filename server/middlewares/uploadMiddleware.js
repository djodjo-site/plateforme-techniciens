// server/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const creerDossierSiAbsent = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dossier = 'uploads/';

    if (file.fieldname === 'photo' || file.fieldname === 'avatar') {
      dossier += 'profils/';
    } else if (file.fieldname === 'logo') {
      dossier += 'profils/';
    } else if (
      file.fieldname.includes('KYC') ||
      file.fieldname.includes('identite') ||
      file.fieldname.includes('document') ||
      file.fieldname.includes('rccm') ||
      file.fieldname.includes('impot')
    ) {
      dossier += 'documents/';
    } else if (file.fieldname.includes('demande') || file.fieldname.includes('preuve')) {
      dossier += 'demandes/';
    } else {
      dossier += 'autres/';
    }

    creerDossierSiAbsent(dossier);
    cb(null, dossier);
  },

  filename: (req, file, cb) => {
    const userId = req.userId || 'anonyme';
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    const nomFichier = `${userId}_${timestamp}_${random}${extension}`;
    cb(null, nomFichier);
  }
});

const fileFilter = (req, file, cb) => {
  const typesImages = /jpeg|jpg|png|gif|webp/;
  const typesDocs = /pdf|doc|docx|xls|xlsx/;

  const extension = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeType = file.mimetype;

  const estImage = typesImages.test(extension) && mimeType.startsWith('image/');
  const estDoc = typesDocs.test(extension);

  if (estImage || estDoc) {
    return cb(null, true);
  }

  cb(new Error('Type de fichier non autorisé. Images (jpeg, jpg, png, gif, webp) ou documents (pdf, doc, xls) uniquement.'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Mo
    files: 10
  },
  fileFilter
});

const uploadPhoto = upload.single('photo');
const uploadLogo = upload.single('logo');
const uploadDocuments = upload.array('documents', 10);
const uploadKYCTechnicien = upload.fields([
  { name: 'pieceIdentiteRecto', maxCount: 1 },
  { name: 'pieceIdentiteVerso', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'justificatifDomicile', maxCount: 1 }
]);
const uploadKYCEntreprise = upload.fields([
  { name: 'rccm', maxCount: 1 },
  { name: 'numeroImpot', maxCount: 1 },
  { name: 'attestationFiscale', maxCount: 1 },
  { name: 'statuts', maxCount: 1 }
]);
const uploadPreuvesMission = upload.array('preuves', 10);
const uploadFichiersDemande = upload.array('fichiers', 5);

const gererErreursUpload = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Fichier trop volumineux (max 5 Mo)'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        message: 'Trop de fichiers envoyés'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Champ de fichier inattendu : ${err.field}`
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload : ${err.message}`
    });
  }
  next(err);
};

const supprimerFichier = (cheminFichier) => {
  try {
    const cheminComplet = path.join(__dirname, '..', cheminFichier);
    if (fs.existsSync(cheminComplet)) {
      fs.unlinkSync(cheminComplet);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur suppression fichier :', error.message);
    return false;
  }
};

module.exports = {
  upload,
  uploadPhoto,
  uploadLogo,
  uploadDocuments,
  uploadKYCTechnicien,
  uploadKYCEntreprise,
  uploadPreuvesMission,
  uploadFichiersDemande,
  gererErreursUpload,
  supprimerFichier
};
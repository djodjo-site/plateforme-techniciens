// server/services/geolocService.js
const Technicien = require('../models/Technicien');
const Demande = require('../models/Demande');
const { logger } = require('../utils/logger');
const { calculerDistanceKm } = require('../utils/helpers');

const rechercherTechniciensProches = async (longitude, latitude, options = {}) => {
  const {
    rayonKm = 50,
    categories = [],
    competences = [],
    noteMinimum = 0,
    disponible = true,
    limite = 50
  } = options;

  const query = {
    statut: 'ninti_actif',
    positionActuelle: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: rayonKm * 1000
      }
    }
  };

  if (disponible) query.disponible = true;
  if (categories.length > 0) query.categories = { $in: categories };
  if (competences.length > 0) query.competences = { $in: competences };
  if (noteMinimum > 0) query['statistiques.noteMoyenne'] = { $gte: noteMinimum };

  const techniciens = await Technicien.find(query)
    .select('-motDePasse -documentsKYC -avertissements')
    .limit(limite);

  // Calculer la distance pour chaque technicien
  const resultats = techniciens.map((t) => {
    const coords = t.positionActuelle?.coordinates || [0, 0];
    const distance = calculerDistanceKm(
      parseFloat(latitude),
      parseFloat(longitude),
      coords[1],
      coords[0]
    );

    return {
      ...t.toObject(),
      distanceKm: distance
    };
  });

  return resultats.sort((a, b) => a.distanceKm - b.distanceKm);
};

const rechercherDemandesProches = async (technicienId, options = {}) => {
  const technicien = await Technicien.findById(technicienId);
  if (!technicien) throw new Error('Technicien introuvable');

  const coords = technicien.positionActuelle?.coordinates;
  if (!coords || (coords[0] === 0 && coords[1] === 0)) {
    return [];
  }

  const query = {
    statut: 'ouverte',
    dateExpiration: { $gt: new Date() },
    'offres.technicien': { $ne: technicienId },
    $or: [
      { categorie: { $in: technicien.categories } },
      { competencesRequises: { $in: technicien.competences } }
    ]
  };

  query['localisation.position'] = {
    $near: {
      $geometry: technicien.positionActuelle,
      $maxDistance: (technicien.rayonIntervention || 50) * 1000
    }
  };

  const demandes = await Demande.find(query)
    .populate('client', 'nom prenom photo ville')
    .limit(options.limite || 50);

  return demandes.map((d) => {
    const dCoords = d.localisation?.position?.coordinates || [0, 0];
    const distance = calculerDistanceKm(
      coords[1],
      coords[0],
      dCoords[1],
      dCoords[0]
    );
    return { ...d.toObject(), distanceKm: distance };
  });
};

const mettreAJourPosition = async (technicienId, longitude, latitude) => {
  const technicien = await Technicien.findByIdAndUpdate(
    technicienId,
    {
      positionActuelle: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    },
    { new: true }
  );

  if (!technicien) throw new Error('Technicien introuvable');

  logger.debug('Position technicien mise à jour', {
    technicienId,
    longitude,
    latitude
  });

  return technicien;
};

const calculerDistanceEntre = (lat1, lon1, lat2, lon2) => {
  return calculerDistanceKm(lat1, lon1, lat2, lon2);
};

const estDansRayon = (lat1, lon1, lat2, lon2, rayonKm) => {
  const distance = calculerDistanceKm(lat1, lon1, lat2, lon2);
  return {
    dansRayon: distance <= rayonKm,
    distanceKm: distance
  };
};

const obtenirCoordonneesAdresse = async (adresse) => {
  // Stub : à connecter à un service de géocodage (Google Maps, Mapbox, Nominatim)
  logger.warn('obtenirCoordonneesAdresse: service de géocodage non configuré');
  return null;
};

const obtenirAdresseCoordonnees = async (longitude, latitude) => {
  // Stub : à connecter à un service de géocodage inverse
  logger.warn('obtenirAdresseCoordonnees: service de géocodage non configuré');
  return null;
};

const statistiquesGeographiques = async () => {
  const parVille = await Technicien.aggregate([
    { $match: { statut: 'ninti_actif' } },
    { $group: { _id: '$ville', nombre: { $sum: 1 } } },
    { $sort: { nombre: -1 } }
  ]);

  const parProvince = await Technicien.aggregate([
    { $match: { statut: 'ninti_actif' } },
    { $group: { _id: '$province', nombre: { $sum: 1 } } },
    { $sort: { nombre: -1 } }
  ]);

  const parCategorieVille = await Technicien.aggregate([
    { $match: { statut: 'ninti_actif' } },
    { $unwind: '$categories' },
    {
      $group: {
        _id: { ville: '$ville', categorie: '$categories' },
        nombre: { $sum: 1 }
      }
    },
    { $sort: { nombre: -1 } }
  ]);

  return { parVille, parProvince, parCategorieVille };
};

const zonesSansTechnicien = async (rayonKm = 50) => {
  // Retourne les villes avec des demandes mais peu de techniciens
  const demandesParVille = await Demande.aggregate([
    { $match: { statut: 'ouverte' } },
    { $group: { _id: '$localisation.ville', nombreDemandes: { $sum: 1 } } },
    { $sort: { nombreDemandes: -1 } }
  ]);

  const techniciensParVille = await Technicien.aggregate([
    { $match: { statut: 'ninti_actif' } },
    { $group: { _id: '$ville', nombreTechniciens: { $sum: 1 } } }
  ]);

  const mapTechniciens = {};
  techniciensParVille.forEach((t) => {
    mapTechniciens[t._id] = t.nombreTechniciens;
  });

  const zonesCritiques = demandesParVille
    .map((d) => {
      const nbTech = mapTechniciens[d._id] || 0;
      return {
        ville: d._id,
        nombreDemandes: d.nombreDemandes,
        nombreTechniciens: nbTech,
        ratio: nbTech > 0 ? d.nombreDemandes / nbTech : d.nombreDemandes
      };
    })
    .filter((z) => z.ratio > 5 || z.nombreTechniciens === 0)
    .sort((a, b) => b.ratio - a.ratio);

  return zonesCritiques;
};

module.exports = {
  rechercherTechniciensProches,
  rechercherDemandesProches,
  mettreAJourPosition,
  calculerDistanceEntre,
  estDansRayon,
  obtenirCoordonneesAdresse,
  obtenirAdresseCoordonnees,
  statistiquesGeographiques,
  zonesSansTechnicien
};
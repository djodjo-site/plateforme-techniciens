const Notification = require('../models/Notification');

const mesNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, lu } = req.query;
    const skip = (page - 1) * limit;

    const query = { destinataire: req.userId };
    if (lu !== undefined) query.lu = lu === 'true';

    const [notifications, total, nonLues] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.nonLues(req.userId)
    ]);

    res.status(200).json({
      success: true,
      notifications,
      nonLues,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const compterNonLues = async (req, res, next) => {
  try {
    const nombre = await Notification.nonLues(req.userId);
    res.status(200).json({ success: true, nombre });
  } catch (error) {
    next(error);
  }
};

const marquerLue = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification introuvable' });
    if (notification.destinataire.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await notification.marquerLue();
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const marquerToutesLues = async (req, res, next) => {
  try {
    await Notification.marquerToutesLues(req.userId);
    res.status(200).json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    next(error);
  }
};

const supprimer = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification introuvable' });
    if (notification.destinataire.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    next(error);
  }
};

const supprimerToutes = async (req, res, next) => {
  try {
    await Notification.deleteMany({ destinataire: req.userId, lu: true });
    res.status(200).json({ success: true, message: 'Notifications lues supprimées' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  mesNotifications,
  compterNonLues,
  marquerLue,
  marquerToutesLues,
  supprimer,
  supprimerToutes
};
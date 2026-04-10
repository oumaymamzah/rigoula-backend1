const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const SettingsController = require('../controllers/SettingsController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET - Récupérer tous les paramètres (Public)
router.get('/', SettingsController.getAllSettings);

// PUT - Mettre à jour les paramètres (Admin)
router.put('/', verifyToken, isAdmin, SettingsController.updateSettings);

// POST - Upload du logo (Admin)
router.post('/upload-logo', verifyToken, isAdmin, upload.single('logo'), SettingsController.uploadLogo);

module.exports = router;
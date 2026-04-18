const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/MediaController');

// GET - Récupérer un média stocké dans MongoDB Atlas
router.get('/:id', MediaController.getMedia);

module.exports = router;

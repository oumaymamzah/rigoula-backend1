const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET - Tous les événements (Public)
router.get('/', EventController.getAllEvents);

// GET - Événements à venir (Public)
router.get('/upcoming', EventController.getUpcomingEvents);

// GET - Un événement par ID (Public)
router.get('/:id', EventController.getEventById);

// POST - Ajouter un événement (Admin)
router.post('/', verifyToken, isAdmin, upload.single('image'), EventController.createEvent);

// PUT - Modifier un événement (Admin)
router.put('/:id', verifyToken, isAdmin, upload.single('image'), EventController.updateEvent);

// DELETE - Supprimer un événement (Admin)
router.delete('/:id', verifyToken, isAdmin, EventController.deleteEvent);

module.exports = router;
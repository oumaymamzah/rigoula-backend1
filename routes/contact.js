const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/ContactController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST - Envoyer un message de contact (Public)
router.post('/', ContactController.submitContact);

// GET - Tous les messages de contact (Admin)
router.get('/', verifyToken, isAdmin, ContactController.getAllContacts);

// GET - Messages non lus (Admin)
router.get('/unread', verifyToken, isAdmin, (req, res) => {
  const { getDb } = require('../config/db');
  getDb()
    .then((db) => db.collection('contacts').find({ statut: 'non_lu' }).sort({ created_at: -1 }).toArray())
    .then((results) => res.json({ success: true, data: results, count: results.length }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// PUT - Changer le statut d'un message (Admin)
router.put('/:id/status', verifyToken, isAdmin, ContactController.updateContactStatus);

// DELETE - Supprimer un message (Admin)
router.delete('/:id', verifyToken, isAdmin, ContactController.deleteContact);

module.exports = router;

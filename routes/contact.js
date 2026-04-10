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
  // This can be added to model/controller if needed
  const db = require('../config/db');
  const sql = "SELECT * FROM contacts WHERE statut = 'non_lu' ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: results, count: results.length });
  });
});

// PUT - Changer le statut d'un message (Admin)
router.put('/:id/status', verifyToken, isAdmin, (req, res) => {
  const db = require('../config/db');
  const { statut } = req.body;
  const sql = 'UPDATE contacts SET statut = ? WHERE id = ?';
  db.query(sql, [statut, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Statut mis à jour' });
  });
});

// DELETE - Supprimer un message (Admin)
router.delete('/:id', verifyToken, isAdmin, ContactController.deleteContact);

module.exports = router;
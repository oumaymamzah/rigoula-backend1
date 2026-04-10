const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const UserController = require('../controllers/UserController');
const { verifyToken } = require('../middleware/auth');

// POST - Inscription (Nouveau client)
router.post('/register', UserController.register);

// POST - Connexion (Client ou Admin)
router.post('/login', UserController.login);

// GET - Obtenir le profil de l'utilisateur connecté
router.get('/profile', verifyToken, UserController.getProfile);

// PUT - Modifier le profil
router.put('/profile', verifyToken, UserController.updateProfile);

// PUT - Changer le mot de passe
router.put('/change-password', require('../middleware/auth').verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
    }
    
    // Récupérer l'utilisateur
    const sql = 'SELECT password FROM users WHERE id = ?';
    db.query(sql, [req.user.id], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const user = results[0];
      
      // Vérifier l'ancien mot de passe
      const isValid = await bcrypt.compare(oldPassword, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
      }
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Mettre à jour
      const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
      db.query(updateSql, [hashedPassword, req.user.id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ success: true, message: 'Mot de passe modifié avec succès' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');
const { toNumber } = require('../utils/mongoHelpers');
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
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ id: toNumber(req.user.id) }, { projection: { password: 1 } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isValid = await bcrypt.compare(oldPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.collection('users').updateOne(
      { id: toNumber(req.user.id) },
      { $set: { password: hashedPassword } }
    );

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
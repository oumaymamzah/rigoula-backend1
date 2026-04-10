const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET - Récupérer tous les utilisateurs (Admin uniquement)
router.get('/', verifyToken, isAdmin, UserController.getAllUsers);

// GET - Récupérer un utilisateur par ID (Admin uniquement)
router.get('/:id', verifyToken, isAdmin, UserController.getUserById);

// POST - Créer un nouvel utilisateur (Admin uniquement)
router.post('/', verifyToken, isAdmin, UserController.createUser);

// PUT - Modifier un utilisateur (Admin uniquement)
router.put('/:id', verifyToken, isAdmin, UserController.updateUser);

// DELETE - Supprimer un utilisateur (Admin uniquement)
router.delete('/:id', verifyToken, isAdmin, UserController.deleteUser);

module.exports = router;
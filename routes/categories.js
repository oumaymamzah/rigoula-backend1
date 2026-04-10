const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET - Toutes les catégories
router.get('/', CategoryController.getAllCategories);

// GET - Une catégorie par ID
router.get('/:id', CategoryController.getCategoryById);

// POST - Ajouter une catégorie (Admin)
router.post('/', verifyToken, isAdmin, CategoryController.createCategory);

// PUT - Modifier une catégorie (Admin)
router.put('/:id', verifyToken, isAdmin, CategoryController.updateCategory);

// DELETE - Supprimer une catégorie (Admin)
router.delete('/:id', verifyToken, isAdmin, CategoryController.deleteCategory);

module.exports = router;
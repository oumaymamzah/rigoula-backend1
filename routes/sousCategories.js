const express = require('express');
const router = express.Router();
const SubCategoryController = require('../controllers/SubCategoryController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET - Toutes les sous-catégories
router.get('/', SubCategoryController.getAllSubCategories);

// GET - Sous-catégories par catégorie
router.get('/category/:categoryId', SubCategoryController.getSubCategoriesByCategory);

// POST - Ajouter une sous-catégorie (Admin)
router.post('/', verifyToken, isAdmin, SubCategoryController.createSubCategory);

// PUT - Modifier une sous-catégorie (Admin)
router.put('/:id', verifyToken, isAdmin, SubCategoryController.updateSubCategory);

// DELETE - Supprimer une sous-catégorie (Admin)
router.delete('/:id', verifyToken, isAdmin, SubCategoryController.deleteSubCategory);

module.exports = router;
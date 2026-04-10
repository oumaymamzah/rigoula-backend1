const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET - Tous les produits avec filtres
router.get('/', ProductController.getAllProducts);

// GET - Un produit par ID
router.get('/:id', ProductController.getProductById);

// POST - Ajouter un produit (Admin)
router.post('/', verifyToken, isAdmin, ProductController.createProduct);

// PUT - Modifier un produit (Admin)
router.put('/:id', verifyToken, isAdmin, ProductController.updateProduct);

// DELETE - Supprimer un produit (Admin)
router.delete('/:id', verifyToken, isAdmin, ProductController.deleteProduct);

module.exports = router;
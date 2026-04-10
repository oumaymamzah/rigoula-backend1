const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const { verifyToken } = require('../middleware/auth');

// GET - Voir son panier
router.get('/', verifyToken, CartController.getCart);

// POST - Ajouter au panier
router.post('/add', verifyToken, CartController.addToCart);

// PUT - Modifier la quantité
router.put('/:id', verifyToken, CartController.updateCartItem);

// DELETE - Supprimer du panier
router.delete('/:id', verifyToken, CartController.removeFromCart);

// DELETE - Vider le panier
router.delete('/', verifyToken, CartController.clearCart);

module.exports = router;
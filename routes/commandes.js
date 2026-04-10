const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST - Créer une commande depuis le panier
router.post('/create', verifyToken, OrderController.createOrder);

// GET - Toutes les commandes (Admin) - SANS AUTH POUR TEST
router.get('/test/all', OrderController.getAllOrders);

// GET - Mes commandes
router.get('/my-orders', verifyToken, OrderController.getUserOrders);

// GET - Détails d'une commande
router.get('/:id', verifyToken, OrderController.getOrderById);

// GET - Toutes les commandes (Admin)
router.get('/', verifyToken, isAdmin, OrderController.getAllOrders);

// PUT - Changer le statut d'une commande (Admin)
router.put('/:id/status', verifyToken, isAdmin, OrderController.updateOrderStatus);

module.exports = router;
const Cart = require('../models/Cart');

class CartController {
  static async getCart(req, res) {
    try {
      const items = await Cart.findByUserId(req.user.id);
      const total = items.reduce((sum, item) => sum + parseFloat(item.total_ligne), 0);
      res.json({
        success: true,
        data: items,
        total: total.toFixed(2)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async addToCart(req, res) {
    try {
      const { produit_id, quantite } = req.body;

      // Check stock
      const Product = require('../models/Product');
      const product = await Product.findById(produit_id);
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      if (product.stock < quantite) {
        return res.status(400).json({ message: 'Stock insuffisant' });
      }

      const result = await Cart.addItem(req.user.id, produit_id, quantite);
      res.json({ success: true, message: 'Produit ajouté au panier' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCartItem(req, res) {
    try {
      const { quantite } = req.body;
      const updated = await Cart.updateQuantityById(req.params.id, req.user.id, quantite);
      if (!updated) {
        return res.status(404).json({ message: 'Produit non trouvé dans le panier' });
      }
      res.json({ success: true, message: 'Quantité mise à jour' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async removeFromCart(req, res) {
    try {
      const removed = await Cart.removeItemById(req.params.id, req.user.id);
      if (!removed) {
        return res.status(404).json({ message: 'Produit non trouvé dans le panier' });
      }
      res.json({ success: true, message: 'Produit retiré du panier' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async clearCart(req, res) {
    try {
      await Cart.clearCart(req.user.id);
      res.json({ success: true, message: 'Panier vidé' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CartController;
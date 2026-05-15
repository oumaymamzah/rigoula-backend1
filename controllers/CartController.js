const Cart = require('../models/Cart');
const Product = require('../models/Product');

const toPositiveInteger = (value) => {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
};

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
      const quantity = toPositiveInteger(quantite);

      if (!produit_id || !quantity) {
        return res.status(400).json({ message: 'Produit et quantite valide requis' });
      }

      const product = await Product.findById(produit_id);
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      const existingItem = await Cart.findByUserAndProduct(req.user.id, produit_id);
      const requestedTotal = Number(existingItem?.quantite || 0) + quantity;

      if (Number(product.stock || 0) < requestedTotal) {
        return res.status(400).json({ message: 'Stock insuffisant' });
      }

      await Cart.addItem(req.user.id, produit_id, quantity);
      res.json({ success: true, message: 'Produit ajoute au panier' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCartItem(req, res) {
    try {
      const { quantite } = req.body;
      const quantity = toPositiveInteger(quantite);

      if (!quantity) {
        return res.status(400).json({ message: 'Quantite valide requise' });
      }

      const item = await Cart.findItemById(req.params.id, req.user.id);
      if (!item) {
        return res.status(404).json({ message: 'Produit non trouve dans le panier' });
      }

      const product = await Product.findById(item.produit_id);
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouve' });
      }

      if (Number(product.stock || 0) < quantity) {
        return res.status(400).json({ message: 'Stock insuffisant' });
      }

      const updated = await Cart.updateQuantityById(req.params.id, req.user.id, quantity);
      if (!updated) {
        return res.status(404).json({ message: 'Produit non trouve dans le panier' });
      }
      res.json({ success: true, message: 'Quantite mise a jour' });
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

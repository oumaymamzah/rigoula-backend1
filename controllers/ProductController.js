const Product = require('../models/Product');

class ProductController {
  static async getAllProducts(req, res) {
    try {
      const filters = req.query;
      const products = await Product.findAll(filters);
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createProduct(req, res) {
    try {
      const productData = req.body;
      const productId = await Product.create(productData);
      res.status(201).json({
        success: true,
        message: 'Produit ajouté avec succès',
        id: productId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const productData = req.body;
      const updated = await Product.update(req.params.id, productData);
      if (!updated) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      res.json({ success: true, message: 'Produit modifié avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const deleted = await Product.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      res.json({ success: true, message: 'Produit supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProductController;
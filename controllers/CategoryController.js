const Category = require('../models/Category');

class CategoryController {
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll();
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createCategory(req, res) {
    try {
      const categoryData = req.body;
      const categoryId = await Category.create(categoryData);
      res.status(201).json({
        success: true,
        message: 'Catégorie ajoutée',
        id: categoryId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCategory(req, res) {
    try {
      const categoryData = req.body;
      const updated = await Category.update(req.params.id, categoryData);
      if (!updated) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ success: true, message: 'Catégorie modifiée' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const deleted = await Category.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      res.json({ success: true, message: 'Catégorie supprimée' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CategoryController;
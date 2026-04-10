const SubCategory = require('../models/SubCategory');

class SubCategoryController {
  static async getAllSubCategories(req, res) {
    try {
      const subCategories = await SubCategory.findAll();
      res.json({ success: true, data: subCategories });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSubCategoriesByCategory(req, res) {
    try {
      const subCategories = await SubCategory.findByCategoryId(req.params.categoryId);
      res.json({ success: true, data: subCategories });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSubCategoryById(req, res) {
    try {
      const subCategory = await SubCategory.findById(req.params.id);
      if (!subCategory) {
        return res.status(404).json({ message: 'Sous-catégorie non trouvée' });
      }
      res.json({ success: true, data: subCategory });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createSubCategory(req, res) {
    try {
      const subCategoryData = req.body;
      const subCategoryId = await SubCategory.create(subCategoryData);
      res.status(201).json({
        success: true,
        message: 'Sous-catégorie ajoutée',
        id: subCategoryId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateSubCategory(req, res) {
    try {
      const subCategoryData = req.body;
      const updated = await SubCategory.update(req.params.id, subCategoryData);
      if (!updated) {
        return res.status(404).json({ message: 'Sous-catégorie non trouvée' });
      }
      res.json({ success: true, message: 'Sous-catégorie modifiée' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteSubCategory(req, res) {
    try {
      const deleted = await SubCategory.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Sous-catégorie non trouvée' });
      }
      res.json({ success: true, message: 'Sous-catégorie supprimée' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SubCategoryController;
const db = require('../config/db');

class SubCategory {
  static async findAll() {
    const sql = `
      SELECT sc.*, c.nom as categorie_nom
      FROM sous_categories sc
      LEFT JOIN categories c ON sc.category_id = c.id
    `;
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findByCategoryId(categoryId) {
    const sql = 'SELECT * FROM sous_categories WHERE category_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [categoryId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT * FROM sous_categories WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async create(subCategoryData) {
    const { nom, description, category_id } = subCategoryData;
    const sql = 'INSERT INTO sous_categories (nom, description, category_id) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [nom, description, category_id], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async update(id, subCategoryData) {
    const { nom, description, category_id } = subCategoryData;
    const sql = 'UPDATE sous_categories SET nom=?, description=?, category_id=? WHERE id=?';
    return new Promise((resolve, reject) => {
      db.query(sql, [nom, description, category_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    const sql = 'DELETE FROM sous_categories WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = SubCategory;
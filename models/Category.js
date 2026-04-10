const db = require('../config/db');

class Category {
  static async findAll() {
    const sql = 'SELECT * FROM categories ORDER BY created_at DESC';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async create(categoryData) {
    const { nom, description } = categoryData;
    const sql = 'INSERT INTO categories (nom, description) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [nom, description], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async update(id, categoryData) {
    const { nom, description } = categoryData;
    const sql = 'UPDATE categories SET nom=?, description=? WHERE id=?';
    return new Promise((resolve, reject) => {
      db.query(sql, [nom, description, id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    const sql = 'DELETE FROM categories WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Category;
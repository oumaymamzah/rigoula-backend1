const db = require('../config/db');

class Product {
  static async findAll(filters = {}) {
    const { category_id, sous_category_id, search, min_price, max_price } = filters;

    let sql = `
      SELECT p.*, c.nom as categorie_nom, sc.nom as sous_categorie_nom
      FROM produits p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sous_categories sc ON p.sous_category_id = sc.id
      WHERE 1=1
    `;

    const params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (sous_category_id) {
      sql += ' AND p.sous_category_id = ?';
      params.push(sous_category_id);
    }

    if (search) {
      sql += ' AND (p.nom LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (min_price) {
      sql += ' AND p.prix >= ?';
      params.push(min_price);
    }

    if (max_price) {
      sql += ' AND p.prix <= ?';
      params.push(max_price);
    }

    sql += ' ORDER BY p.created_at DESC';

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    const sql = `
      SELECT p.*, c.nom as categorie_nom, sc.nom as sous_categorie_nom
      FROM produits p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sous_categories sc ON p.sous_category_id = sc.id
      WHERE p.id = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async create(productData) {
    const { nom, description, prix, prix_promo, stock, image, category_id, sous_category_id } = productData;
    const sql = 'INSERT INTO produits (nom, description, prix, prix_promo, stock, image, category_id, sous_category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    return new Promise((resolve, reject) => {
      db.query(sql, [nom, description, prix, prix_promo, stock, image, category_id, sous_category_id], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async update(id, productData) {
    const { nom, description, prix, prix_promo, stock, image, category_id, sous_category_id } = productData;
    const sql = 'UPDATE produits SET nom=?, description=?, prix=?, prix_promo=?, stock=?, image=?, category_id=?, sous_category_id=? WHERE id=?';

    return new Promise((resolve, reject) => {
      db.query(sql, [nom, description, prix, prix_promo, stock, image, category_id, sous_category_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    const sql = 'DELETE FROM produits WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Product;
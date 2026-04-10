const db = require('../config/db');

class Cart {
  static async findByUserId(userId) {
    const sql = `
      SELECT p.*, pr.nom, pr.prix, pr.image, pr.stock,
             (p.quantite * pr.prix) as total_ligne
      FROM panier p
      JOIN produits pr ON p.produit_id = pr.id
      WHERE p.user_id = ?
    `;
    return new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async addItem(userId, productId, quantity) {
    // Check if item already in cart
    const checkSql = 'SELECT * FROM panier WHERE user_id = ? AND produit_id = ?';
    return new Promise((resolve, reject) => {
      db.query(checkSql, [userId, productId], (err, results) => {
        if (err) reject(err);
        else if (results.length > 0) {
          // Update quantity
          const updateSql = 'UPDATE panier SET quantite = quantite + ? WHERE user_id = ? AND produit_id = ?';
          db.query(updateSql, [quantity, userId, productId], (err, result) => {
            if (err) reject(err);
            else resolve(result.affectedRows > 0);
          });
        } else {
          // Insert new
          const insertSql = 'INSERT INTO panier (user_id, produit_id, quantite) VALUES (?, ?, ?)';
          db.query(insertSql, [userId, productId, quantity], (err, result) => {
            if (err) reject(err);
            else resolve(result.insertId);
          });
        }
      });
    });
  }

  static async updateQuantity(userId, productId, quantity) {
    const sql = 'UPDATE panier SET quantite = ? WHERE user_id = ? AND produit_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [quantity, userId, productId], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async removeItem(userId, productId) {
    const sql = 'DELETE FROM panier WHERE user_id = ? AND produit_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [userId, productId], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async updateQuantityById(cartId, userId, quantity) {
    const sql = 'UPDATE panier SET quantite = ? WHERE id = ? AND user_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [quantity, cartId, userId], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async removeItemById(cartId, userId) {
    const sql = 'DELETE FROM panier WHERE id = ? AND user_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [cartId, userId], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async clearCart(userId) {
    const sql = 'DELETE FROM panier WHERE user_id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, result) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

module.exports = Cart;
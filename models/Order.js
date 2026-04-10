const db = require('../config/db');

class Order {
  static async findAll() {
    const sql = 'SELECT * FROM commandes ORDER BY created_at DESC';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findByUserId(userId) {
    const sql = 'SELECT * FROM commandes WHERE user_id = ? ORDER BY created_at DESC';
    return new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT * FROM commandes WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async create(orderData) {
    const { user_id, total, statut, adresse_livraison, telephone_contact, details } = orderData;
    const sql = 'INSERT INTO commandes (user_id, total, statut, adresse_livraison, telephone_contact, details) VALUES (?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [user_id, total, statut || 'en_attente', adresse_livraison, telephone_contact, JSON.stringify(details)], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async updateStatus(id, statut) {
    const sql = 'UPDATE commandes SET statut = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [statut, id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    const sql = 'DELETE FROM commandes WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Order;
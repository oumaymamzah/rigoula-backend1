const db = require('../config/db');
const bcrypt = require('bcryptjs');
const hashPassword = require('../hashPassword');

class User {
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.query(sql, [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, nom, prenom, email, telephone, role, created_at FROM users WHERE id = ?';
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, nom, prenom, email, telephone, role, created_at FROM users';
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async create(userData) {
    const { nom, prenom, email, password, telephone, role = 'client' } = userData;
    const hashedPassword = await hashPassword(password);
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO users (nom, prenom, email, password, telephone, role) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(sql, [nom, prenom, email, hashedPassword, telephone, role], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async update(id, userData) {
    const { nom, prenom, email, telephone, role } = userData;
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET nom=?, prenom=?, email=?, telephone=?, role=? WHERE id=?';
      db.query(sql, [nom, prenom, email, telephone, role, id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async updateProfile(id, profileData) {
    const { nom, prenom, telephone } = profileData;
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET nom=?, prenom=?, telephone=? WHERE id=?';
      db.query(sql, [nom, prenom, telephone, id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
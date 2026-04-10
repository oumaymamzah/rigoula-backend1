const db = require('../config/db');

class Contact {
  static async create(contactData) {
    const { nom, email, sujet, message } = contactData;
    const sql = 'INSERT INTO contacts (nom, email, sujet, message) VALUES (?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [nom, email, sujet, message], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async findAll() {
    const sql = 'SELECT * FROM contacts ORDER BY created_at DESC';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT * FROM contacts WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async delete(id) {
    const sql = 'DELETE FROM contacts WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Contact;
const db = require('../config/db');

class Event {
  static async findAll() {
    const sql = 'SELECT * FROM evenements ORDER BY date_evenement DESC';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) resolve([]);
        else resolve(results);
      });
    });
  }

  static async findUpcoming() {
    const sql = 'SELECT * FROM evenements WHERE date_evenement >= CURDATE() ORDER BY date_evenement ASC';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT * FROM evenements WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  static async create(eventData) {
    const { titre, description, date_evenement, lieu, image } = eventData;
    const sql = 'INSERT INTO evenements (titre, description, date_evenement, lieu, image) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [titre, description, date_evenement, lieu, image], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async update(id, eventData) {
    const { titre, description, date_evenement, lieu, image } = eventData;
    const sql = 'UPDATE evenements SET titre=?, description=?, date_evenement=?, lieu=?, image=? WHERE id=?';
    return new Promise((resolve, reject) => {
      db.query(sql, [titre, description, date_evenement, lieu, image, id], (err, result) => {
        if (err) resolve(false);
        else resolve(result.affectedRows > 0);
      });
    });
  }


  static async delete(id) {
    const sql = 'DELETE FROM evenements WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Event;
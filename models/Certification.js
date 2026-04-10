const db = require('../config/db');

class Certification {
  static async findAll() {
    const sql = 'SELECT * FROM certifications ORDER BY date_obtention DESC';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) {
          console.error('❌ Erreur BD findAll:', err);
          reject(err);
        } else {
          console.log('✅ Certifications trouvées:', results.length);
          resolve(results);
        }
      });
    });
  }

  static async findById(id) {
    const sql = 'SELECT * FROM certifications WHERE id = ?';
    console.log('🔎 Avant requête - ID:', id, 'Type:', typeof id);
    
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, results) => {
        if (err) {
          console.error('❌ Erreur BD findById SQL:', err);
          resolve(null);
        } else {
          console.log('✅ DB retourné', results.length, 'résultat(s) pour ID', id);
          if (results.length > 0) {
            console.log('✅ Données:', results[0]);
          }
          resolve(results[0] || null);
        }
      });
    });
  }

  static async create(certificationData) {
    const { titre, description, organisme, date_obtention, images } = certificationData;
    const sql = 'INSERT INTO certifications (titre, description, organisme, date_obtention, images) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [titre, description, organisme, date_obtention, images], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async update(id, certificationData) {
    const { titre, description, organisme, date_obtention, images } = certificationData;
    const sql = 'UPDATE certifications SET titre=?, description=?, organisme=?, date_obtention=?, images=? WHERE id=?';
    console.log('🟡 Update query avec ID:', id);
    
    return new Promise((resolve, reject) => {
      db.query(sql, [titre, description, organisme, date_obtention, images, id], (err, result) => {
        if (err) {
          console.error('❌ Erreur BD update:', err);
          resolve(false);
        } else {
          console.log('✅ Update affectedRows:', result.affectedRows);
          resolve(result.affectedRows > 0);
        }
      });
    });
  }

  static async delete(id) {
    const sql = 'DELETE FROM certifications WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Certification;
const db = require('../config/db');

class Settings {
  static async findAll() {
    const sql = 'SELECT * FROM site_settings';
    return new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async update(settings) {
    const promises = Object.keys(settings).map(key => {
      return new Promise((resolve, reject) => {
        const sql = 'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?';
        db.query(sql, [settings[key], key], (err, result) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    return Promise.all(promises);
  }
}

module.exports = Settings;
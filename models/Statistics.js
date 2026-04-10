const db = require('../config/db');

class Statistics {
  static async logVisit(visitData) {
    const { page, ip_address, user_agent } = visitData;
    const sql = 'INSERT INTO visites (page, ip_address, user_agent) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
      db.query(sql, [page, ip_address, user_agent], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  static async getDashboardStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM users WHERE role = "client"',
      'SELECT COUNT(*) as total FROM produits',
      'SELECT COUNT(*) as total FROM commandes',
      'SELECT SUM(total) as revenue FROM commandes WHERE statut != "annulee"',
      'SELECT COUNT(*) as total FROM commandes WHERE statut = "en_attente"',
      'SELECT COUNT(*) as total FROM contacts WHERE statut = "non_lu"',
      'SELECT COUNT(*) as total FROM produits WHERE stock = 0',
      'SELECT COUNT(*) as total FROM visites WHERE DATE(visited_at) = CURDATE()',
      'SELECT COUNT(*) as total FROM visites WHERE MONTH(visited_at) = MONTH(CURDATE()) AND YEAR(visited_at) = YEAR(CURDATE())'
    ];

    const promises = queries.map((sql, index) => {
      return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
          if (err) {
            console.error(`❌ Erreur requête ${index + 1}:`, sql, 'Erreur:', err.message);
            resolve(0); // Retourner 0 en cas d'erreur plutôt que de rejeter
          } else {
            const value = results[0].total !== undefined ? results[0].total : (results[0].revenue || 0);
            resolve(value);
          }
        });
      });
    });

    return Promise.all(promises);
  }

  // Add other methods as needed
}

module.exports = Statistics;
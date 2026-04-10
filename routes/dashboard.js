const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Top produits + répartition (même données pour les 2 figures)
router.get('/top-produits-stats', (req, res) => {
  try {
    console.log('📊 Requête top-produits-stats reçue');
    
    const sql = `
      SELECT 
        p.id,
        p.nom AS name,
        COALESCE(SUM(cd.quantite), 0) AS total_vendu
      FROM produits p
      LEFT JOIN commande_details cd ON p.id = cd.produit_id
      WHERE p.id IS NOT NULL
      GROUP BY p.id, p.nom
      HAVING COALESCE(SUM(cd.quantite), 0) > 0
      ORDER BY COALESCE(SUM(cd.quantite), 0) DESC
      LIMIT 5
    `;

    console.log('🔍 Exécution requête SQL...');
    db.query(sql, (err, rows) => {
      if (err) {
        console.error('❌ Erreur SQL détaillée:', {
          message: err.message,
          code: err.code,
          errno: err.errno,
          sqlState: err.sqlState
        });
        return res.status(500).json({ 
          error: 'Erreur base de données', 
          message: err.message 
        });
      }

      console.log('✅ Résultat requête:', rows?.length, 'lignes récupérées');

      if (!rows || rows.length === 0) {
        console.log('⚠️ Aucun produit vendu');
        return res.json([]);
      }

      const totalVendu = rows.reduce((acc, r) => acc + (parseInt(r.total_vendu) || 0), 0);
      const max = Math.max(1, parseInt(rows[0]?.total_vendu) || 1);

      const result = rows.map(r => ({
        name: String(r.name || '').trim(),
        total_vendu: parseInt(r.total_vendu) || 0,
        pct: Math.round((parseInt(r.total_vendu) || 0) / max * 100),
        pct_donut: totalVendu > 0 ? Math.round((parseInt(r.total_vendu) || 0) / totalVendu * 100) : 0,
      }));

      console.log('✅ Top produits traités:', result.length);
      res.json(result);
    });
  } catch (err) {
    console.error('❌ Erreur try-catch:', err.message);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: err.message 
    });
  }
});

module.exports = router;

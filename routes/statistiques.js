const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/StatisticsController');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST - Enregistrer une visite (Public)
router.post('/visit', StatisticsController.logVisit);

// GET - Statistiques globales du dashboard (Admin)
router.get('/dashboard', verifyToken, isAdmin, StatisticsController.getDashboardStats);

// GET - Statistiques des ventes par mois (Admin)
router.get('/sales-by-month', verifyToken, isAdmin, (req, res) => {
  const sql = `
    SELECT 
      MONTH(created_at) as mois,
      YEAR(created_at) as annee,
      COUNT(*) as nb_commandes,
      SUM(total) as chiffre_affaires
    FROM commandes
    WHERE statut != 'annulee'
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY annee DESC, mois DESC
    LIMIT 12
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// GET - Top 10 produits les plus vendus (Admin)
router.get('/top-products', verifyToken, isAdmin, (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.nom,
      p.image,
      SUM(cd.quantite) as total_vendu,
      SUM(cd.quantite * cd.prix_unitaire) as revenue
    FROM commande_details cd
    JOIN produits p ON cd.produit_id = p.id
    JOIN commandes c ON cd.commande_id = c.id
    WHERE c.statut != 'annulee'
    GROUP BY p.id
    ORDER BY total_vendu DESC
    LIMIT 10
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Calculate percentages based on total quantity
    const totalQuantity = results.reduce((sum, product) => sum + product.total_vendu, 0);
    const productsWithPercentage = results.map(product => ({
      ...product,
      pourcentage: totalQuantity > 0 ? Math.round((product.total_vendu / totalQuantity) * 100) : 0
    }));
    
    res.json({ success: true, data: productsWithPercentage });
  });
});

// GET - Visites par page (Admin)
router.get('/visits-by-page', verifyToken, isAdmin, (req, res) => {
  const sql = `
    SELECT 
      page,
      COUNT(*) as nb_visites,
      COUNT(DISTINCT ip_address) as visiteurs_uniques
    FROM visites
    WHERE DATE(visited_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY page
    ORDER BY nb_visites DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// GET - Visites des 7 derniers jours (Admin)
router.get('/visits-last-7-days', verifyToken, isAdmin, (req, res) => {
  const sql = `
    SELECT 
      DATE(visited_at) as date,
      COUNT(*) as nb_visites
    FROM visites
    WHERE DATE(visited_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(visited_at)
    ORDER BY date ASC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, data: results });
  });
});

module.exports = router;
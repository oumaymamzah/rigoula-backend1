const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/StatisticsController');
const { getDb } = require('../config/db');
const { startOfDay, toNumber } = require('../utils/mongoHelpers');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST - Enregistrer une visite (Public)
router.post('/visit', StatisticsController.logVisit);

// GET - Statistiques globales du dashboard (Admin)
router.get('/dashboard', verifyToken, isAdmin, StatisticsController.getDashboardStats);

// GET - Statistiques des ventes par mois (Admin)
router.get('/sales-by-month', verifyToken, isAdmin, (req, res) => {
  getDb()
    .then((db) => db.collection('commandes').aggregate([
      { $match: { statut: { $ne: 'annulee' } } },
      {
        $group: {
          _id: {
            annee: { $year: '$created_at' },
            mois: { $month: '$created_at' }
          },
          nb_commandes: { $sum: 1 },
          chiffre_affaires: { $sum: '$total' }
        }
      },
      { $sort: { '_id.annee': -1, '_id.mois': -1 } },
      { $limit: 12 }
    ]).toArray())
    .then((rows) => res.json({
      success: true,
      data: rows.map((r) => ({
        mois: r._id.mois,
        annee: r._id.annee,
        nb_commandes: r.nb_commandes,
        chiffre_affaires: r.chiffre_affaires
      }))
    }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// GET - Top 10 produits les plus vendus (Admin)
router.get('/top-products', verifyToken, isAdmin, (req, res) => {
  getDb()
    .then(async (db) => {
      const validOrders = await db.collection('commandes').find(
        { statut: { $ne: 'annulee' } },
        { projection: { _id: 0, id: 1 } }
      ).toArray();
      const validOrderIds = validOrders.map((o) => o.id);

      if (!validOrderIds.length) {
        return [];
      }

      const grouped = await db.collection('commande_details').aggregate([
        { $match: { commande_id: { $in: validOrderIds } } },
        {
          $group: {
            _id: '$produit_id',
            total_vendu: { $sum: '$quantite' },
            revenue: { $sum: { $multiply: ['$quantite', '$prix_unitaire'] } }
          }
        },
        { $sort: { total_vendu: -1 } },
        { $limit: 10 }
      ]).toArray();

      const productIds = grouped.map((g) => toNumber(g._id));
      const products = productIds.length
        ? await db.collection('produits').find({ id: { $in: productIds } }).toArray()
        : [];
      const productMap = new Map(products.map((p) => [p.id, p]));

      return grouped.map((g) => ({
        id: g._id,
        nom: productMap.get(toNumber(g._id))?.nom || null,
        image: productMap.get(toNumber(g._id))?.image || null,
        total_vendu: g.total_vendu,
        revenue: g.revenue
      }));
    })
    .then((results) => {
      const totalQuantity = results.reduce((sum, product) => sum + (product.total_vendu || 0), 0);
      const productsWithPercentage = results.map((product) => ({
        ...product,
        pourcentage: totalQuantity > 0 ? Math.round((product.total_vendu / totalQuantity) * 100) : 0
      }));
      res.json({ success: true, data: productsWithPercentage });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// GET - Visites par page (Admin)
router.get('/visits-by-page', verifyToken, isAdmin, (req, res) => {
  getDb()
    .then((db) => {
      const fromDate = startOfDay(new Date());
      fromDate.setDate(fromDate.getDate() - 30);

      return db.collection('visites').aggregate([
        { $match: { visited_at: { $gte: fromDate } } },
        {
          $group: {
            _id: '$page',
            nb_visites: { $sum: 1 },
            ips: { $addToSet: '$ip_address' }
          }
        },
        { $sort: { nb_visites: -1 } }
      ]).toArray();
    })
    .then((rows) => res.json({
      success: true,
      data: rows.map((r) => ({
        page: r._id,
        nb_visites: r.nb_visites,
        visiteurs_uniques: r.ips.length
      }))
    }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// GET - Visites des 7 derniers jours (Admin)
router.get('/visits-last-7-days', verifyToken, isAdmin, (req, res) => {
  getDb()
    .then((db) => {
      const fromDate = startOfDay(new Date());
      fromDate.setDate(fromDate.getDate() - 7);

      return db.collection('visites').aggregate([
        { $match: { visited_at: { $gte: fromDate } } },
        {
          $group: {
            _id: {
              y: { $year: '$visited_at' },
              m: { $month: '$visited_at' },
              d: { $dayOfMonth: '$visited_at' }
            },
            nb_visites: { $sum: 1 }
          }
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
      ]).toArray();
    })
    .then((rows) => res.json({
      success: true,
      data: rows.map((r) => ({
        date: `${r._id.y}-${String(r._id.m).padStart(2, '0')}-${String(r._id.d).padStart(2, '0')}`,
        nb_visites: r.nb_visites
      }))
    }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

module.exports = router;
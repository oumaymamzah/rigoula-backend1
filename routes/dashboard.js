const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { toNumber } = require('../utils/mongoHelpers');

// Top produits + répartition (même données pour les 2 figures)
router.get('/top-produits-stats', async (req, res) => {
  try {
    console.log('📊 Requête top-produits-stats reçue');
    const db = await getDb();

    const validOrders = await db.collection('commandes').find(
      { statut: { $ne: 'annulee' } },
      { projection: { _id: 0, id: 1 } }
    ).toArray();
    const validOrderIds = validOrders.map((o) => o.id);

    if (!validOrderIds.length) {
      return res.json([]);
    }

    const grouped = await db.collection('commande_details').aggregate([
      { $match: { commande_id: { $in: validOrderIds } } },
      {
        $group: {
          _id: '$produit_id',
          total_vendu: { $sum: '$quantite' }
        }
      },
      { $match: { total_vendu: { $gt: 0 } } },
      { $sort: { total_vendu: -1 } },
      { $limit: 5 }
    ]).toArray();

    if (!grouped.length) {
      return res.json([]);
    }

    const productIds = grouped.map((g) => toNumber(g._id));
    const products = await db.collection('produits').find({ id: { $in: productIds } }).toArray();
    const productMap = new Map(products.map((p) => [p.id, p.nom]));

    // Filtrer les produits qui n'existent plus (supprimés)
    const validGrouped = grouped.filter((g) => productMap.has(toNumber(g._id)));

    if (!validGrouped.length) {
      return res.json([]);
    }

    const totalVendu = validGrouped.reduce((acc, r) => acc + (Number(r.total_vendu) || 0), 0);
    const max = Math.max(1, Number(validGrouped[0]?.total_vendu) || 1);

    const result = validGrouped.map((r) => {
      const total = Number(r.total_vendu) || 0;
      return {
        name: String(productMap.get(toNumber(r._id)) || '').trim(),
        total_vendu: total,
        pct: Math.round(total / max * 100),
        pct_donut: totalVendu > 0 ? Math.round(total / totalVendu * 100) : 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error('❌ Erreur try-catch:', err.message);
    res.status(500).json({
      error: 'Erreur serveur',
      message: err.message
    });
  }
});

module.exports = router;

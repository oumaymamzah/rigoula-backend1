const { getDb } = require('../config/db');
const { nextId, startOfDay } = require('../utils/mongoHelpers');

class Statistics {
  static async logVisit(visitData) {
    const { page, ip_address, user_agent } = visitData;
    const db = await getDb();
    const id = await nextId(db, 'visites');
    await db.collection('visites').insertOne({
      id,
      page,
      ip_address,
      user_agent,
      visited_at: new Date()
    });
    return id;
  }

  static async getDashboardStats() {
    const db = await getDb();
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalUsers,
      totalProduits,
      totalCommandes,
      revenueRows,
      pendingOrders,
      unreadMessages,
      outOfStock,
      todayVisits,
      monthVisits
    ] = await Promise.all([
      db.collection('users').countDocuments({ role: 'client' }),
      db.collection('produits').countDocuments({}),
      db.collection('commandes').countDocuments({}),
      db.collection('commandes').aggregate([
        { $match: { statut: { $ne: 'annulee' } } },
        { $group: { _id: null, revenue: { $sum: '$total' } } }
      ]).toArray(),
      db.collection('commandes').countDocuments({ statut: 'en_attente' }),
      db.collection('contacts').countDocuments({ statut: 'non_lu' }),
      db.collection('produits').countDocuments({ stock: 0 }),
      db.collection('visites').countDocuments({ visited_at: { $gte: today, $lt: tomorrow } }),
      db.collection('visites').countDocuments({ visited_at: { $gte: monthStart, $lt: nextMonth } })
    ]);

    const revenue = revenueRows[0]?.revenue || 0;
    return [
      totalUsers,
      totalProduits,
      totalCommandes,
      revenue,
      pendingOrders,
      unreadMessages,
      outOfStock,
      todayVisits,
      monthVisits
    ];
  }

  // Add other methods as needed
}

module.exports = Statistics;
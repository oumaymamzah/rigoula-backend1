const Statistics = require('../models/Statistics');

class StatisticsController {
  static async logVisit(req, res) {
    try {
      const { page } = req.body;
      const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const user_agent = req.headers['user-agent'];

      await Statistics.logVisit({ page, ip_address, user_agent });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getDashboardStats(req, res) {
    try {
      console.log('📊 Récupération des statistiques du dashboard...');
      const stats = await Statistics.getDashboardStats();
      console.log('📊 Stats reçues:', stats);
      
      const [totalUsers, totalProduits, totalCommandes, revenue, pendingOrders, unreadMessages, outOfStock, todayVisits, monthVisits] = stats;

      console.log('✅ Dashboard stats calculées:');
      console.log('  - Total Users:', totalUsers);
      console.log('  - Total Produits:', totalProduits);
      console.log('  - Total Commandes:', totalCommandes);
      console.log('  - Revenue:', revenue);
      console.log('  - Pending Orders:', pendingOrders);
      console.log('  - Unread Messages:', unreadMessages);
      console.log('  - Out of Stock:', outOfStock);
      console.log('  - Today Visits:', todayVisits);
      console.log('  - Month Visits:', monthVisits);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalProduits,
          totalCommandes,
          revenue: parseFloat(revenue || 0).toFixed(2),
          pendingOrders,
          unreadMessages,
          outOfStock,
          todayVisits,
          monthVisits
        }
      });
    } catch (error) {
      console.error('❌ Erreur getDashboardStats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StatisticsController;
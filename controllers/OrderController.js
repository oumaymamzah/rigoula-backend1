const { sendOrderStatusEmail } = require('../services/emailService');
const { nextId, toNumber } = require('../utils/mongoHelpers');

class OrderController {
  static async getAllOrders(req, res) {
    try {
      const { getDb } = require('../config/db');
      const mongoDb = await getDb();

      const [commandes, users] = await Promise.all([
        mongoDb.collection('commandes').find({}).sort({ created_at: -1 }).toArray(),
        mongoDb.collection('users').find({}, { projection: { _id: 0, id: 1, email: 1 } }).toArray()
      ]);

      if (!commandes || commandes.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const userMap = new Map(users.map((u) => [u.id, u.email]));
      const commandeIds = commandes.map((c) => c.id);

      const details = await mongoDb
        .collection('commande_details')
        .find({ commande_id: { $in: commandeIds } })
        .toArray();

      const detailByCommande = new Map();
      details.forEach((detail) => {
        const key = toNumber(detail.commande_id);
        if (!detailByCommande.has(key)) detailByCommande.set(key, []);
        detailByCommande.get(key).push(detail);
      });

      const productIds = [...new Set(details.map((d) => toNumber(d.produit_id)))];
      const products = productIds.length
        ? await mongoDb.collection('produits').find({ id: { $in: productIds } }).toArray()
        : [];
      const productMap = new Map(products.map((p) => [p.id, p.nom]));

      const resultatsFinaux = commandes.map((commande) => {
        const orderDetails = detailByCommande.get(toNumber(commande.id)) || [];
        const adresseParts = String(commande.adresse_livraison || '').split('###');

        const produits = orderDetails.map((detail) => {
          const prix = Number(detail.prix_unitaire || 0);
          const quantite = Number(detail.quantite || 0);
          return {
            id: detail.id,
            produit_id: detail.produit_id,
            quantite,
            prix_unitaire: prix,
            prix,
            sousTotal: prix * quantite,
            nom: productMap.get(toNumber(detail.produit_id)) || null
          };
        });

        return {
          id: commande.id,
          user_id: commande.user_id,
          total: commande.total,
          statut: commande.statut,
          created_at: commande.created_at,
          adresse_livraison: commande.adresse_livraison,
          telephone_contact: commande.telephone_contact,
          email: userMap.get(commande.user_id) || null,
          nom: adresseParts[0] || '',
          prenom: adresseParts[1] || '',
          adresse: adresseParts[2] || '',
          nb_produits: orderDetails.length,
          produits
        };
      });

      res.json({ success: true, data: resultatsFinaux });
    } catch (error) {
      console.error('❌ Erreur getAllOrders:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserOrders(req, res) {
    try {
      const { getDb } = require('../config/db');
      const mongoDb = await getDb();
      const userId = toNumber(req.user.id);

      const commandes = await mongoDb
        .collection('commandes')
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();

      if (!commandes || commandes.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const commandeIds = commandes.map((c) => c.id);
      const details = await mongoDb
        .collection('commande_details')
        .find({ commande_id: { $in: commandeIds } })
        .toArray();

      const detailByCommande = new Map();
      details.forEach((detail) => {
        const key = toNumber(detail.commande_id);
        if (!detailByCommande.has(key)) detailByCommande.set(key, []);
        detailByCommande.get(key).push(detail);
      });

      const productIds = [...new Set(details.map((d) => toNumber(d.produit_id)))];
      const products = productIds.length
        ? await mongoDb.collection('produits').find({ id: { $in: productIds } }).toArray()
        : [];
      const productMap = new Map(products.map((p) => [p.id, p.nom]));

      const resultatsFinaux = commandes.map((commande) => {
        const orderDetails = detailByCommande.get(toNumber(commande.id)) || [];
        const adresseParts = String(commande.adresse_livraison || '').split('###');

        const produits = orderDetails.map((detail) => {
          const prix = Number(detail.prix_unitaire || 0);
          const quantite = Number(detail.quantite || 0);
          return {
            id: detail.id,
            produit_id: detail.produit_id,
            quantite,
            prix_unitaire: prix,
            prix,
            sousTotal: prix * quantite,
            nom: productMap.get(toNumber(detail.produit_id)) || null
          };
        });

        return {
          id: commande.id,
          user_id: commande.user_id,
          total: commande.total,
          statut: commande.statut,
          created_at: commande.created_at,
          adresse_livraison: commande.adresse_livraison,
          telephone_contact: commande.telephone_contact,
          nom: adresseParts[0] || '',
          prenom: adresseParts[1] || '',
          adresse: adresseParts[2] || '',
          nb_produits: orderDetails.length,
          produits
        };
      });

      res.json({ success: true, data: resultatsFinaux });
    } catch (error) {
      console.error('❌ Erreur getUserOrders:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrderById(req, res) {
    try {
      const { getDb } = require('../config/db');
      const mongoDb = await getDb();
      const order = await mongoDb.collection('commandes').findOne({ id: toNumber(req.params.id) });
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }
      if (req.user?.role !== 'admin' && toNumber(order.user_id) !== toNumber(req.user.id)) {
        return res.status(403).json({ message: 'Acces refuse' });
      }
      delete order._id;
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createOrder(req, res) {
    try {
      const { adresse_livraison, telephone_contact, nom, prenom } = req.body;
      const { getDb } = require('../config/db');
      const mongoDb = await getDb();
      const userId = toNumber(req.user.id);

      const panierItems = await mongoDb.collection('panier').find({ user_id: userId }).toArray();
      if (!panierItems.length) {
        return res.status(400).json({ message: 'Le panier est vide' });
      }

      const productIds = [...new Set(panierItems.map((p) => toNumber(p.produit_id)))];
      const products = await mongoDb.collection('produits').find({ id: { $in: productIds } }).toArray();
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of panierItems) {
        const product = productMap.get(toNumber(item.produit_id));
        if (!product) {
          return res.status(404).json({ message: 'Produit non trouvé' });
        }
        if (Number(product.stock || 0) < Number(item.quantite || 0)) {
          return res.status(400).json({ message: `Stock insuffisant pour ${product.nom}` });
        }
      }

      const total = panierItems.reduce((sum, item) => {
        const product = productMap.get(toNumber(item.produit_id)) || {};
        return sum + Number(product.prix || 0) * Number(item.quantite || 0);
      }, 0);

      const adresseAvecNom = `${nom || ''}###${prenom || ''}###${adresse_livraison || ''}`;
      const commandeId = await nextId(mongoDb, 'commandes');

      await mongoDb.collection('commandes').insertOne({
        id: commandeId,
        user_id: userId,
        total,
        statut: 'en_attente',
        adresse_livraison: adresseAvecNom,
        telephone_contact,
        created_at: new Date()
      });

      for (const item of panierItems) {
        const product = productMap.get(toNumber(item.produit_id)) || {};
        const detailId = await nextId(mongoDb, 'commande_details');
        await mongoDb.collection('commande_details').insertOne({
          id: detailId,
          commande_id: commandeId,
          produit_id: toNumber(item.produit_id),
          quantite: Number(item.quantite || 0),
          prix_unitaire: Number(product.prix || 0)
        });

        await mongoDb.collection('produits').updateOne(
          { id: toNumber(item.produit_id) },
          { $inc: { stock: -Number(item.quantite || 0) } }
        );
      }

      await mongoDb.collection('panier').deleteMany({ user_id: userId });

      res.status(201).json({
        success: true,
        message: 'Commande créée avec succès',
        commandeId,
        total
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { statut } = req.body;
      const { getDb } = require('../config/db');
      const mongoDb = await getDb();
      const orderId = toNumber(req.params.id);
      const order = await mongoDb.collection('commandes').findOne({ id: orderId });
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      const updateResult = await mongoDb.collection('commandes').updateOne(
        { id: orderId },
        { $set: { statut } }
      );
      if (!updateResult.matchedCount) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      const user = await mongoDb.collection('users').findOne({ id: toNumber(order.user_id) });
      if (user?.email) {
        sendOrderStatusEmail({
          email: user.email,
          orderId: req.params.id,
          statut
        }).catch((mailErr) => {
          console.error('⚠️ Email statut commande non envoyé:', mailErr.message);
        });
      }

      res.json({ success: true, message: 'Statut mis à jour' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteOrder(req, res) {
    try {
      const { getDb } = require('../config/db');
      const mongoDb = await getDb();
      const orderId = toNumber(req.params.id);

      const orderResult = await mongoDb.collection('commandes').deleteOne({ id: orderId });
      await mongoDb.collection('commande_details').deleteMany({ commande_id: orderId });

      if (!orderResult.deletedCount) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }
      res.json({ success: true, message: 'Commande supprimée' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = OrderController;

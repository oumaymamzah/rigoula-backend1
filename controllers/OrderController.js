const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendOrderStatusEmail } = require('../services/emailService');

class OrderController {
  static async getAllOrders(req, res) {
    try {
      const db = require('../config/db');
      
      const sqlCommandes = `
        SELECT DISTINCT c.id,
               c.user_id,
               c.total,
               c.statut,
               c.created_at,
               c.adresse_livraison,
               c.telephone_contact,
               u.email
        FROM commandes c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `;

      db.query(sqlCommandes, async (err, commandes) => {
        try {
          if (err) {
            console.error('❌ Erreur requête commandes:', err);
            return res.status(500).json({ error: err.message });
          }

          if (!commandes || commandes.length === 0) {
            console.log('⚠️ Aucune commande trouvée');
            return res.json({ success: true, data: [] });
          }

          const resultatsFinaux = [];

          for (let commande of commandes) {
            try {
              const sqlCount = `
                SELECT COUNT(*) as nb_produits
                FROM commande_details
                WHERE commande_id = ?
              `;

              const countResult = await new Promise((resolve, reject) => {
                db.query(sqlCount, [commande.id], (err, result) => {
                  if (err) reject(err);
                  else resolve(result[0]?.nb_produits || 0);
                });
              });

              const sqlProduits = `
                SELECT cd.id,
                       cd.produit_id,
                       cd.quantite,
                       cd.prix_unitaire,
                       CAST(cd.prix_unitaire AS DECIMAL(10,2)) as prix,
                       CAST(cd.prix_unitaire * cd.quantite AS DECIMAL(10,2)) as sousTotal,
                       pr.nom
                FROM commande_details cd
                LEFT JOIN produits pr ON cd.produit_id = pr.id
                WHERE cd.commande_id = ?
              `;

              const produits = await new Promise((resolve, reject) => {
                db.query(sqlProduits, [commande.id], (err, results) => {
                  if (err) reject(err);
                  else resolve(results || []);
                });
              });

              const adresseParts = (commande.adresse_livraison || '').split('###');

              resultatsFinaux.push({
                id: commande.id,
                user_id: commande.user_id,
                total: commande.total,
                statut: commande.statut,
                created_at: commande.created_at,
                adresse_livraison: commande.adresse_livraison,
                telephone_contact: commande.telephone_contact,
                email: commande.email,
                nom: adresseParts[0] || '',
                prenom: adresseParts[1] || '',
                adresse: adresseParts[2] || '',
                nb_produits: countResult,
                produits: produits
              });
            } catch (itemErr) {
              console.error('❌ Erreur traitement commande', commande.id, ':', itemErr.message);
            }
          }

          res.json({ success: true, data: resultatsFinaux });
        } catch (err) {
          console.error('❌ Erreur dans le callback:', err.message);
          res.status(500).json({ error: err.message });
        }
      });
    } catch (error) {
      console.error('❌ Erreur getAllOrders:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserOrders(req, res) {
    try {
      const db = require('../config/db');
      const sql = `
        SELECT c.id,
               c.user_id,
               c.total,
               c.statut,
               c.created_at,
               c.adresse_livraison,
               c.telephone_contact
        FROM commandes c
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `;

      db.query(sql, [req.user.id], async (err, commandes) => {
        try {
          if (err) {
            console.error('❌ Erreur requête commandes utilisateur:', err);
            return res.status(500).json({ error: err.message });
          }

          if (!commandes || commandes.length === 0) {
            console.log('⚠️ Aucune commande pour utilisateur', req.user.id);
            return res.json({ success: true, data: [] });
          }

          const resultatsFinaux = [];

          for (let commande of commandes) {
            try {
              const sqlCount = `
                SELECT COUNT(*) as nb_produits
                FROM commande_details
                WHERE commande_id = ?
              `;

              const countResult = await new Promise((resolve, reject) => {
                db.query(sqlCount, [commande.id], (err, result) => {
                  if (err) reject(err);
                  else resolve(result[0]?.nb_produits || 0);
                });
              });

              const sqlProduits = `
                SELECT cd.id,
                       cd.produit_id,
                       cd.quantite,
                       cd.prix_unitaire,
                       CAST(cd.prix_unitaire AS DECIMAL(10,2)) as prix,
                       CAST(cd.prix_unitaire * cd.quantite AS DECIMAL(10,2)) as sousTotal,
                       pr.nom
                FROM commande_details cd
                LEFT JOIN produits pr ON cd.produit_id = pr.id
                WHERE cd.commande_id = ?
              `;

              const produits = await new Promise((resolve, reject) => {
                db.query(sqlProduits, [commande.id], (err, results) => {
                  if (err) reject(err);
                  else resolve(results || []);
                });
              });

              const adresseParts = (commande.adresse_livraison || '').split('###');

              resultatsFinaux.push({
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
                nb_produits: countResult,
                produits: produits
              });
            } catch (itemErr) {
              console.error('❌ Erreur traitement commande utilisateur', commande.id, ':', itemErr.message);
            }
          }

          res.json({ success: true, data: resultatsFinaux });
        } catch (err) {
          console.error('❌ Erreur dans le callback getUserOrders:', err.message);
          res.status(500).json({ error: err.message });
        }
      });
    } catch (error) {
      console.error('❌ Erreur getUserOrders:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrderById(req, res) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createOrder(req, res) {
    try {
      const { adresse_livraison, telephone_contact, nom, prenom } = req.body;
      const db = require('../config/db');

      // Get cart
      const getPanierSql = `
        SELECT p.*, pr.prix, pr.stock, pr.nom
        FROM panier p
        JOIN produits pr ON p.produit_id = pr.id
        WHERE p.user_id = ?
      `;

      db.query(getPanierSql, [req.user.id], (err, panierItems) => {
        if (err) return res.status(500).json({ error: err.message });

        if (panierItems.length === 0) {
          return res.status(400).json({ message: 'Le panier est vide' });
        }

        // Check stock
        for (let item of panierItems) {
          if (item.stock < item.quantite) {
            return res.status(400).json({ message: `Stock insuffisant pour ${item.nom}` });
          }
        }

        // Calculate total
        const total = panierItems.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

        // Create order
        const adresseAvecNom = (nom || '') + '###' + (prenom || '') + '###' + (adresse_livraison || '');

        const createCommandeSql = 'INSERT INTO commandes (user_id, total, adresse_livraison, telephone_contact) VALUES (?, ?, ?, ?)';

        db.query(createCommandeSql, [req.user.id, total, adresseAvecNom, telephone_contact], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const commandeId = result.insertId;

          // Add details
          const detailsPromises = panierItems.map(item => {
            return new Promise((resolve, reject) => {
              const insertDetailSql = 'INSERT INTO commande_details (commande_id, produit_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)';
              db.query(insertDetailSql, [commandeId, item.produit_id, item.quantite, item.prix], (err) => {
                if (err) reject(err);

                // Decrease stock
                const updateStockSql = 'UPDATE produits SET stock = stock - ? WHERE id = ?';
                db.query(updateStockSql, [item.quantite, item.produit_id], (err) => {
                  if (err) reject(err);
                  resolve();
                });
              });
            });
          });

          Promise.all(detailsPromises)
            .then(() => {
              // Clear cart
              const clearPanierSql = 'DELETE FROM panier WHERE user_id = ?';
              db.query(clearPanierSql, [req.user.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                  success: true,
                  message: 'Commande créée avec succès',
                  commandeId,
                  total
                });
              });
            })
            .catch(err => res.status(500).json({ error: err.message }));
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { statut } = req.body;
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      const updated = await Order.updateStatus(req.params.id, statut);
      if (!updated) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      const user = await User.findById(order.user_id);
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
      const deleted = await Order.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }
      res.json({ success: true, message: 'Commande supprimée' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = OrderController;
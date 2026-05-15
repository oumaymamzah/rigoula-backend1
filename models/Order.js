const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class Order {
  static async findAll() {
    const db = await getDb();
    const rows = await db.collection('commandes').find({}).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  static async findByUserId(userId) {
    const db = await getDb();
    const rows = await db
      .collection('commandes')
      .find({ user_id: toNumber(userId) })
      .sort({ created_at: -1 })
      .toArray();
    return rows.map(stripMongoId);
  }

  static async findById(id) {
    const db = await getDb();
    const row = await db.collection('commandes').findOne({ id: toNumber(id) });
    return row ? stripMongoId(row) : null;
  }

  static async create(orderData) {
    const { user_id, total, statut, adresse_livraison, telephone_contact, details } = orderData;
    const db = await getDb();
    const id = await nextId(db, 'commandes');
    await db.collection('commandes').insertOne({
      id,
      user_id: toNumber(user_id),
      total: Number(total),
      statut: statut || 'en_attente',
      adresse_livraison,
      telephone_contact,
      details,
      created_at: new Date()
    });
    return id;
  }

  static async updateStatus(id, statut) {
    const db = await getDb();
    const result = await db.collection('commandes').updateOne(
      { id: toNumber(id) },
      { $set: { statut } }
    );
    return result.matchedCount > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const orderId = toNumber(id);
    const [orderResult] = await Promise.all([
      db.collection('commandes').deleteOne({ id: orderId }),
      db.collection('commande_details').deleteMany({ commande_id: orderId })
    ]);
    return orderResult.deletedCount > 0;
  }
}

module.exports = Order;
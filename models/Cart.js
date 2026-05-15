const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class Cart {
  static async findByUserId(userId) {
    const db = await getDb();
    const cartRows = await db.collection('panier').find({ user_id: toNumber(userId) }).toArray();
    if (!cartRows.length) return [];

    const productIds = [...new Set(cartRows.map((item) => toNumber(item.produit_id)))];
    const products = await db.collection('produits').find({ id: { $in: productIds } }).toArray();
    const productsById = new Map(products.map((p) => [p.id, p]));

    return cartRows.map((item) => {
      const product = productsById.get(toNumber(item.produit_id)) || {};
      return {
        ...stripMongoId(item),
        nom: product.nom,
        prix: Number(product.prix || 0),
        image: product.image,
        stock: Number(product.stock || 0),
        total_ligne: Number(item.quantite || 0) * Number(product.prix || 0)
      };
    });
  }

  static async findByUserAndProduct(userId, productId) {
    const db = await getDb();
    const item = await db.collection('panier').findOne({
      user_id: toNumber(userId),
      produit_id: toNumber(productId)
    });
    return item ? stripMongoId(item) : null;
  }

  static async findItemById(cartId, userId) {
    const db = await getDb();
    const item = await db.collection('panier').findOne({
      id: toNumber(cartId),
      user_id: toNumber(userId)
    });
    return item ? stripMongoId(item) : null;
  }

  static async addItem(userId, productId, quantity) {
    // Check if item already in cart
    const db = await getDb();
    const existing = await db.collection('panier').findOne({
      user_id: toNumber(userId),
      produit_id: toNumber(productId)
    });

    if (existing) {
      const result = await db.collection('panier').updateOne(
        { user_id: toNumber(userId), produit_id: toNumber(productId) },
        { $inc: { quantite: Number(quantity) } }
      );
      return result.matchedCount > 0;
    }

    const id = await nextId(db, 'panier');
    await db.collection('panier').insertOne({
      id,
      user_id: toNumber(userId),
      produit_id: toNumber(productId),
      quantite: Number(quantity)
    });
    return id;
  }

  static async updateQuantity(userId, productId, quantity) {
    const db = await getDb();
    const result = await db.collection('panier').updateOne(
      { user_id: toNumber(userId), produit_id: toNumber(productId) },
      { $set: { quantite: Number(quantity) } }
    );
    return result.matchedCount > 0;
  }

  static async removeItem(userId, productId) {
    const db = await getDb();
    const result = await db.collection('panier').deleteOne({
      user_id: toNumber(userId),
      produit_id: toNumber(productId)
    });
    return result.deletedCount > 0;
  }

  static async updateQuantityById(cartId, userId, quantity) {
    const db = await getDb();
    const result = await db.collection('panier').updateOne(
      { id: toNumber(cartId), user_id: toNumber(userId) },
      { $set: { quantite: Number(quantity) } }
    );
    return result.matchedCount > 0;
  }

  static async removeItemById(cartId, userId) {
    const db = await getDb();
    const result = await db.collection('panier').deleteOne({ id: toNumber(cartId), user_id: toNumber(userId) });
    return result.deletedCount > 0;
  }

  static async clearCart(userId) {
    const db = await getDb();
    await db.collection('panier').deleteMany({ user_id: toNumber(userId) });
    return true;
  }
}

module.exports = Cart;

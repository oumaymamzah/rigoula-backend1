const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class Category {
  static async findAll() {
    const db = await getDb();
    const categories = await db.collection('categories').find({}).sort({ created_at: -1 }).toArray();
    return categories.map(stripMongoId);
  }

  static async findById(id) {
    const db = await getDb();
    const category = await db.collection('categories').findOne({ id: toNumber(id) });
    return category ? stripMongoId(category) : null;
  }

  static async create(categoryData) {
    const { nom, description } = categoryData;
    const db = await getDb();
    const id = await nextId(db, 'categories');
    await db.collection('categories').insertOne({
      id,
      nom,
      description,
      created_at: new Date()
    });
    return id;
  }

  static async update(id, categoryData) {
    const { nom, description } = categoryData;
    const db = await getDb();
    const result = await db.collection('categories').updateOne(
      { id: toNumber(id) },
      { $set: { nom, description } }
    );
    return result.matchedCount > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('categories').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }
}

module.exports = Category;
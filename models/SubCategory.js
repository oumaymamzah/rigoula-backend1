const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class SubCategory {
  static async findAll() {
    const db = await getDb();
    const subCategories = await db.collection('sous_categories').find({}).toArray();
    if (!subCategories.length) return [];

    const categoryIds = [...new Set(subCategories.map((sc) => toNumber(sc.category_id)).filter((v) => v !== null && v !== undefined))];
    const categories = categoryIds.length
      ? await db.collection('categories').find({ id: { $in: categoryIds } }).toArray()
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.nom]));

    return subCategories.map((sc) => ({
      ...stripMongoId(sc),
      categorie_nom: categoryMap.get(toNumber(sc.category_id)) || null
    }));
  }

  static async findByCategoryId(categoryId) {
    const db = await getDb();
    const rows = await db.collection('sous_categories').find({ category_id: toNumber(categoryId) }).toArray();
    return rows.map(stripMongoId);
  }

  static async findById(id) {
    const db = await getDb();
    const row = await db.collection('sous_categories').findOne({ id: toNumber(id) });
    return row ? stripMongoId(row) : null;
  }

  static async create(subCategoryData) {
    const { nom, description, category_id } = subCategoryData;
    const db = await getDb();
    const id = await nextId(db, 'sous_categories');
    await db.collection('sous_categories').insertOne({
      id,
      nom,
      description,
      category_id: toNumber(category_id),
      created_at: new Date()
    });
    return id;
  }

  static async update(id, subCategoryData) {
    const { nom, description, category_id } = subCategoryData;
    const db = await getDb();
    const result = await db.collection('sous_categories').updateOne(
      { id: toNumber(id) },
      { $set: { nom, description, category_id: toNumber(category_id) } }
    );
    return result.matchedCount > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('sous_categories').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }
}

module.exports = SubCategory;
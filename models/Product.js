const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class Product {
  static async findAll(filters = {}) {
    const { category_id, sous_category_id, search, min_price, max_price } = filters;
    const db = await getDb();
    const query = {};

    if (category_id) {
      query.category_id = toNumber(category_id);
    }

    if (sous_category_id) {
      query.sous_category_id = toNumber(sous_category_id);
    }

    if (min_price || max_price) {
      query.prix = {};
      if (min_price) query.prix.$gte = Number(min_price);
      if (max_price) query.prix.$lte = Number(max_price);
    }

    if (search) {
      query.$or = [
        { nom: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } }
      ];
    }

    const products = await db.collection('produits').find(query).sort({ created_at: -1 }).toArray();

    const categoryIds = [...new Set(products.map((p) => toNumber(p.category_id)).filter((v) => v !== null && v !== undefined))];
    const subCategoryIds = [...new Set(products.map((p) => toNumber(p.sous_category_id)).filter((v) => v !== null && v !== undefined))];

    const [categories, subCategories] = await Promise.all([
      categoryIds.length ? db.collection('categories').find({ id: { $in: categoryIds } }).toArray() : [],
      subCategoryIds.length ? db.collection('sous_categories').find({ id: { $in: subCategoryIds } }).toArray() : []
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.nom]));
    const subCategoryMap = new Map(subCategories.map((sc) => [sc.id, sc.nom]));

    return products.map((product) => ({
      ...stripMongoId(product),
      categorie_nom: categoryMap.get(toNumber(product.category_id)) || null,
      sous_categorie_nom: subCategoryMap.get(toNumber(product.sous_category_id)) || null
    }));
  }

  static async findById(id) {
    const db = await getDb();
    const product = await db.collection('produits').findOne({ id: toNumber(id) });
    if (!product) return null;

    const [category, subCategory] = await Promise.all([
      product.category_id ? db.collection('categories').findOne({ id: toNumber(product.category_id) }) : null,
      product.sous_category_id ? db.collection('sous_categories').findOne({ id: toNumber(product.sous_category_id) }) : null
    ]);

    return {
      ...stripMongoId(product),
      categorie_nom: category?.nom || null,
      sous_categorie_nom: subCategory?.nom || null
    };
  }

  static async create(productData) {
    const { nom, description, prix, prix_promo, stock, image, category_id, sous_category_id } = productData;
    const db = await getDb();
    const id = await nextId(db, 'produits');
    await db.collection('produits').insertOne({
      id,
      nom,
      description,
      prix: Number(prix),
      prix_promo: prix_promo !== null && prix_promo !== undefined && prix_promo !== '' ? Number(prix_promo) : null,
      stock: Number(stock),
      image,
      category_id: toNumber(category_id),
      sous_category_id: sous_category_id !== null && sous_category_id !== undefined && sous_category_id !== '' ? toNumber(sous_category_id) : null,
      created_at: new Date()
    });
    return id;
  }

  static async update(id, productData) {
    const { nom, description, prix, prix_promo, stock, image, category_id, sous_category_id } = productData;
    const db = await getDb();
    const result = await db.collection('produits').updateOne(
      { id: toNumber(id) },
      {
        $set: {
          nom,
          description,
          prix: Number(prix),
          prix_promo: prix_promo !== null && prix_promo !== undefined && prix_promo !== '' ? Number(prix_promo) : null,
          stock: Number(stock),
          image,
          category_id: toNumber(category_id),
          sous_category_id: sous_category_id !== null && sous_category_id !== undefined && sous_category_id !== '' ? toNumber(sous_category_id) : null
        }
      }
    );
    return result.matchedCount > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('produits').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }
}

module.exports = Product;
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri =
  process.env.MONGODB_URI ||
  `mongodb://${process.env.DB_HOST || '127.0.0.1'}:27017`;
const mongoDbName = process.env.MONGODB_DB || process.env.DB_NAME || 'rigoula';

let dbPromise;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

async function getDb() {
  if (!dbPromise) {
    const client = new MongoClient(mongoUri);
    dbPromise = client.connect().then((connectedClient) => {
      console.log(`✅ Connecté à MongoDB (${mongoDbName})`);
      return connectedClient.db(mongoDbName);
    });
  }
  return dbPromise;
}

async function nextId(db, tableName) {
  await db.collection('counters').updateOne(
    { _id: tableName },
    { $inc: { seq: 1 } },
    { upsert: true }
  );
  const counter = await db.collection('counters').findOne({ _id: tableName });
  return counter.seq;
}

async function findProductsWithNames(db, products) {
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

async function executeQuery(sql, params) {
  const db = await getDb();
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normalized === 'select * from users where email = ?') {
    const user = await db.collection('users').findOne({ email: params[0] });
    return user ? [stripMongoId(user)] : [];
  }

  if (normalized === 'select id, nom, prenom, email, telephone, role, created_at from users where id = ?') {
    const user = await db.collection('users').findOne({ id: toNumber(params[0]) });
    return user ? [stripMongoId(user)] : [];
  }

  if (normalized === 'select id, nom, prenom, email, telephone, role, created_at from users') {
    const users = await db.collection('users').find({}).toArray();
    return users.map(stripMongoId);
  }

  if (normalized === 'insert into users (nom, prenom, email, password, telephone, role) values (?, ?, ?, ?, ?, ?)') {
    const id = await nextId(db, 'users');
    const [nom, prenom, email, password, telephone, role] = params;
    await db.collection('users').insertOne({
      id,
      nom,
      prenom,
      email,
      password,
      telephone,
      role,
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update users set nom=?, prenom=?, email=?, telephone=?, role=? where id=?') {
    const [nom, prenom, email, telephone, role, id] = params;
    const result = await db.collection('users').updateOne(
      { id: toNumber(id) },
      { $set: { nom, prenom, email, telephone, role } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'update users set nom=?, prenom=?, telephone=? where id=?') {
    const [nom, prenom, telephone, id] = params;
    const result = await db.collection('users').updateOne(
      { id: toNumber(id) },
      { $set: { nom, prenom, telephone } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from users where id = ?') {
    const id = toNumber(params[0]);
    const result = await db.collection('users').deleteOne({ id });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'select password from users where id = ?') {
    const user = await db.collection('users').findOne({ id: toNumber(params[0]) });
    return user ? [{ password: user.password }] : [];
  }

  if (normalized === 'update users set password = ? where id = ?') {
    const [password, id] = params;
    const result = await db.collection('users').updateOne(
      { id: toNumber(id) },
      { $set: { password } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'select * from categories order by created_at desc') {
    const rows = await db.collection('categories').find({}).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from categories where id = ?') {
    const row = await db.collection('categories').findOne({ id: toNumber(params[0]) });
    return row ? [stripMongoId(row)] : [];
  }

  if (normalized === 'insert into categories (nom, description) values (?, ?)') {
    const id = await nextId(db, 'categories');
    const [nom, description] = params;
    await db.collection('categories').insertOne({ id, nom, description, created_at: new Date() });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update categories set nom=?, description=? where id=?') {
    const [nom, description, id] = params;
    const result = await db.collection('categories').updateOne(
      { id: toNumber(id) },
      { $set: { nom, description } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from categories where id = ?') {
    const result = await db.collection('categories').deleteOne({ id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized.includes('select sc.*, c.nom as categorie_nom from sous_categories sc left join categories c on sc.category_id = c.id')) {
    const subCategories = await db.collection('sous_categories').find({}).toArray();
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

  if (normalized === 'select * from sous_categories where category_id = ?') {
    const rows = await db.collection('sous_categories').find({ category_id: toNumber(params[0]) }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from sous_categories where id = ?') {
    const row = await db.collection('sous_categories').findOne({ id: toNumber(params[0]) });
    return row ? [stripMongoId(row)] : [];
  }

  if (normalized === 'insert into sous_categories (nom, description, category_id) values (?, ?, ?)') {
    const id = await nextId(db, 'sous_categories');
    const [nom, description, category_id] = params;
    await db.collection('sous_categories').insertOne({
      id,
      nom,
      description,
      category_id: toNumber(category_id),
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update sous_categories set nom=?, description=?, category_id=? where id=?') {
    const [nom, description, category_id, id] = params;
    const result = await db.collection('sous_categories').updateOne(
      { id: toNumber(id) },
      { $set: { nom, description, category_id: toNumber(category_id) } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from sous_categories where id = ?') {
    const result = await db.collection('sous_categories').deleteOne({ id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized.includes('from produits p left join categories c on p.category_id = c.id left join sous_categories sc on p.sous_category_id = sc.id where 1=1')) {
    const query = {};
    let cursor = 0;

    if (normalized.includes('and p.category_id = ?')) {
      query.category_id = toNumber(params[cursor]);
      cursor += 1;
    }

    if (normalized.includes('and p.sous_category_id = ?')) {
      query.sous_category_id = toNumber(params[cursor]);
      cursor += 1;
    }

    let searchTerm = null;
    if (normalized.includes('and (p.nom like ? or p.description like ?)')) {
      searchTerm = String(params[cursor] || '').replace(/%/g, '').toLowerCase();
      cursor += 2;
    }

    if (normalized.includes('and p.prix >= ?')) {
      query.prix = { ...(query.prix || {}), $gte: Number(params[cursor]) };
      cursor += 1;
    }

    if (normalized.includes('and p.prix <= ?')) {
      query.prix = { ...(query.prix || {}), $lte: Number(params[cursor]) };
    }

    let products = await db.collection('produits').find(query).sort({ created_at: -1 }).toArray();

    if (searchTerm) {
      products = products.filter((p) => {
        const nom = String(p.nom || '').toLowerCase();
        const description = String(p.description || '').toLowerCase();
        return nom.includes(searchTerm) || description.includes(searchTerm);
      });
    }

    return findProductsWithNames(db, products);
  }

  if (normalized.includes('from produits p left join categories c on p.category_id = c.id left join sous_categories sc on p.sous_category_id = sc.id where p.id = ?')) {
    const product = await db.collection('produits').findOne({ id: toNumber(params[0]) });
    if (!product) return [];
    const rows = await findProductsWithNames(db, [product]);
    return rows;
  }

  if (normalized === 'insert into produits (nom, description, prix, prix_promo, stock, image, category_id, sous_category_id) values (?, ?, ?, ?, ?, ?, ?, ?)') {
    const id = await nextId(db, 'produits');
    const [nom, description, prix, prix_promo, stock, image, category_id, sous_category_id] = params;
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
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update produits set nom=?, description=?, prix=?, prix_promo=?, stock=?, image=?, category_id=?, sous_category_id=? where id=?') {
    const [nom, description, prix, prix_promo, stock, image, category_id, sous_category_id, id] = params;
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
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from produits where id = ?') {
    const result = await db.collection('produits').deleteOne({ id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'update produits set stock = stock - ? where id = ?') {
    const [quantity, id] = params;
    const result = await db.collection('produits').updateOne(
      { id: toNumber(id) },
      { $inc: { stock: -Number(quantity) } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized.includes('from panier p join produits pr on p.produit_id = pr.id where p.user_id = ?')) {
    const userId = toNumber(params[0]);
    const cartRows = await db.collection('panier').find({ user_id: userId }).toArray();
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

  if (normalized === 'select * from panier where user_id = ? and produit_id = ?') {
    const [user_id, produit_id] = params;
    const rows = await db.collection('panier').find({
      user_id: toNumber(user_id),
      produit_id: toNumber(produit_id)
    }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'update panier set quantite = quantite + ? where user_id = ? and produit_id = ?') {
    const [delta, user_id, produit_id] = params;
    const result = await db.collection('panier').updateOne(
      { user_id: toNumber(user_id), produit_id: toNumber(produit_id) },
      { $inc: { quantite: Number(delta) } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'insert into panier (user_id, produit_id, quantite) values (?, ?, ?)') {
    const id = await nextId(db, 'panier');
    const [user_id, produit_id, quantite] = params;
    await db.collection('panier').insertOne({
      id,
      user_id: toNumber(user_id),
      produit_id: toNumber(produit_id),
      quantite: Number(quantite)
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update panier set quantite = ? where user_id = ? and produit_id = ?') {
    const [quantite, user_id, produit_id] = params;
    const result = await db.collection('panier').updateOne(
      { user_id: toNumber(user_id), produit_id: toNumber(produit_id) },
      { $set: { quantite: Number(quantite) } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from panier where user_id = ? and produit_id = ?') {
    const [user_id, produit_id] = params;
    const result = await db.collection('panier').deleteOne({
      user_id: toNumber(user_id),
      produit_id: toNumber(produit_id)
    });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'update panier set quantite = ? where id = ? and user_id = ?') {
    const [quantite, id, user_id] = params;
    const result = await db.collection('panier').updateOne(
      { id: toNumber(id), user_id: toNumber(user_id) },
      { $set: { quantite: Number(quantite) } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from panier where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const result = await db.collection('panier').deleteOne({
      id: toNumber(id),
      user_id: toNumber(user_id)
    });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'delete from panier where user_id = ?') {
    const result = await db.collection('panier').deleteMany({ user_id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'select * from commandes order by created_at desc') {
    const rows = await db.collection('commandes').find({}).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from commandes where user_id = ? order by created_at desc') {
    const rows = await db.collection('commandes').find({ user_id: toNumber(params[0]) }).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from commandes where id = ?') {
    const row = await db.collection('commandes').findOne({ id: toNumber(params[0]) });
    return row ? [stripMongoId(row)] : [];
  }

  if (normalized === 'insert into commandes (user_id, total, statut, adresse_livraison, telephone_contact, details) values (?, ?, ?, ?, ?, ?)') {
    const id = await nextId(db, 'commandes');
    const [user_id, total, statut, adresse_livraison, telephone_contact, details] = params;
    await db.collection('commandes').insertOne({
      id,
      user_id: toNumber(user_id),
      total: Number(total),
      statut,
      adresse_livraison,
      telephone_contact,
      details,
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'insert into commandes (user_id, total, adresse_livraison, telephone_contact) values (?, ?, ?, ?)') {
    const id = await nextId(db, 'commandes');
    const [user_id, total, adresse_livraison, telephone_contact] = params;
    await db.collection('commandes').insertOne({
      id,
      user_id: toNumber(user_id),
      total: Number(total),
      statut: 'en_attente',
      adresse_livraison,
      telephone_contact,
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update commandes set statut = ? where id = ?') {
    const [statut, id] = params;
    const result = await db.collection('commandes').updateOne(
      { id: toNumber(id) },
      { $set: { statut } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from commandes where id = ?') {
    const id = toNumber(params[0]);
    const [orderResult, detailsResult] = await Promise.all([
      db.collection('commandes').deleteOne({ id }),
      db.collection('commande_details').deleteMany({ commande_id: id })
    ]);
    return { affectedRows: orderResult.deletedCount, deletedDetails: detailsResult.deletedCount };
  }

  if (normalized.includes('select distinct c.id, c.user_id, c.total, c.statut, c.created_at, c.adresse_livraison, c.telephone_contact, u.email from commandes c left join users u on c.user_id = u.id order by c.created_at desc')) {
    const [orders, users] = await Promise.all([
      db.collection('commandes').find({}).sort({ created_at: -1 }).toArray(),
      db.collection('users').find({}, { projection: { _id: 0, id: 1, email: 1 } }).toArray()
    ]);
    const userMap = new Map(users.map((u) => [u.id, u.email]));
    return orders.map((order) => ({
      id: order.id,
      user_id: order.user_id,
      total: order.total,
      statut: order.statut,
      created_at: order.created_at,
      adresse_livraison: order.adresse_livraison,
      telephone_contact: order.telephone_contact,
      email: userMap.get(order.user_id) || null
    }));
  }

  if (normalized.includes('select c.id, c.user_id, c.total, c.statut, c.created_at, c.adresse_livraison, c.telephone_contact from commandes c where c.user_id = ? order by c.created_at desc')) {
    const rows = await db.collection('commandes').find({ user_id: toNumber(params[0]) }).sort({ created_at: -1 }).toArray();
    return rows.map((order) => ({
      id: order.id,
      user_id: order.user_id,
      total: order.total,
      statut: order.statut,
      created_at: order.created_at,
      adresse_livraison: order.adresse_livraison,
      telephone_contact: order.telephone_contact
    }));
  }

  if (normalized === 'select count(*) as nb_produits from commande_details where commande_id = ?') {
    const count = await db.collection('commande_details').countDocuments({ commande_id: toNumber(params[0]) });
    return [{ nb_produits: count }];
  }

  if (normalized.includes('select cd.id, cd.produit_id, cd.quantite, cd.prix_unitaire, cast(cd.prix_unitaire as decimal(10,2)) as prix, cast(cd.prix_unitaire * cd.quantite as decimal(10,2)) as soustotal, pr.nom from commande_details cd left join produits pr on cd.produit_id = pr.id where cd.commande_id = ?')) {
    const commandeId = toNumber(params[0]);
    const details = await db.collection('commande_details').find({ commande_id: commandeId }).toArray();
    const productIds = [...new Set(details.map((d) => toNumber(d.produit_id)))];
    const products = productIds.length ? await db.collection('produits').find({ id: { $in: productIds } }).toArray() : [];
    const productMap = new Map(products.map((p) => [p.id, p.nom]));

    return details.map((detail) => ({
      id: detail.id,
      produit_id: detail.produit_id,
      quantite: detail.quantite,
      prix_unitaire: Number(detail.prix_unitaire),
      prix: Number(detail.prix_unitaire),
      sousTotal: Number(detail.prix_unitaire) * Number(detail.quantite),
      nom: productMap.get(toNumber(detail.produit_id)) || null
    }));
  }

  if (normalized === 'insert into commande_details (commande_id, produit_id, quantite, prix_unitaire) values (?, ?, ?, ?)') {
    const id = await nextId(db, 'commande_details');
    const [commande_id, produit_id, quantite, prix_unitaire] = params;
    await db.collection('commande_details').insertOne({
      id,
      commande_id: toNumber(commande_id),
      produit_id: toNumber(produit_id),
      quantite: Number(quantite),
      prix_unitaire: Number(prix_unitaire)
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'insert into contacts (nom, email, sujet, message) values (?, ?, ?, ?)') {
    const id = await nextId(db, 'contacts');
    const [nom, email, sujet, message] = params;
    await db.collection('contacts').insertOne({
      id,
      nom,
      email,
      sujet,
      message,
      statut: 'non_lu',
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'select * from contacts order by created_at desc') {
    const rows = await db.collection('contacts').find({}).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from contacts where id = ?') {
    const row = await db.collection('contacts').findOne({ id: toNumber(params[0]) });
    return row ? [stripMongoId(row)] : [];
  }

  if (normalized === "select * from contacts where statut = 'non_lu' order by created_at desc") {
    const rows = await db.collection('contacts').find({ statut: 'non_lu' }).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'update contacts set statut = ? where id = ?') {
    const [statut, id] = params;
    const result = await db.collection('contacts').updateOne(
      { id: toNumber(id) },
      { $set: { statut } }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from contacts where id = ?') {
    const result = await db.collection('contacts').deleteOne({ id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'select * from evenements order by date_evenement desc') {
    const rows = await db.collection('evenements').find({}).sort({ date_evenement: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from evenements where date_evenement >= curdate() order by date_evenement asc') {
    const today = startOfDay(new Date());
    const rows = await db.collection('evenements').find({ date_evenement: { $gte: today } }).sort({ date_evenement: 1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from evenements where id = ?') {
    const row = await db.collection('evenements').findOne({ id: toNumber(params[0]) });
    return row ? [stripMongoId(row)] : [];
  }

  if (normalized === 'insert into evenements (titre, description, date_evenement, lieu, image) values (?, ?, ?, ?, ?)') {
    const id = await nextId(db, 'evenements');
    const [titre, description, date_evenement, lieu, image] = params;
    await db.collection('evenements').insertOne({
      id,
      titre,
      description,
      date_evenement: new Date(date_evenement),
      lieu,
      image,
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update evenements set titre=?, description=?, date_evenement=?, lieu=?, image=? where id=?') {
    const [titre, description, date_evenement, lieu, image, id] = params;
    const result = await db.collection('evenements').updateOne(
      { id: toNumber(id) },
      {
        $set: {
          titre,
          description,
          date_evenement: new Date(date_evenement),
          lieu,
          image
        }
      }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from evenements where id = ?') {
    const result = await db.collection('evenements').deleteOne({ id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'select * from certifications order by date_obtention desc') {
    const rows = await db.collection('certifications').find({}).sort({ date_obtention: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'select * from certifications where id = ?') {
    const row = await db.collection('certifications').findOne({ id: toNumber(params[0]) });
    return row ? [stripMongoId(row)] : [];
  }

  if (normalized === 'insert into certifications (titre, description, organisme, date_obtention, images) values (?, ?, ?, ?, ?)') {
    const id = await nextId(db, 'certifications');
    const [titre, description, organisme, date_obtention, images] = params;
    await db.collection('certifications').insertOne({
      id,
      titre,
      description,
      organisme,
      date_obtention: new Date(date_obtention),
      images,
      created_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'update certifications set titre=?, description=?, organisme=?, date_obtention=?, images=? where id=?') {
    const [titre, description, organisme, date_obtention, images, id] = params;
    const result = await db.collection('certifications').updateOne(
      { id: toNumber(id) },
      {
        $set: {
          titre,
          description,
          organisme,
          date_obtention: new Date(date_obtention),
          images
        }
      }
    );
    return { affectedRows: result.matchedCount };
  }

  if (normalized === 'delete from certifications where id = ?') {
    const result = await db.collection('certifications').deleteOne({ id: toNumber(params[0]) });
    return { affectedRows: result.deletedCount };
  }

  if (normalized === 'insert into visites (page, ip_address, user_agent) values (?, ?, ?)') {
    const id = await nextId(db, 'visites');
    const [page, ip_address, user_agent] = params;
    await db.collection('visites').insertOne({
      id,
      page,
      ip_address,
      user_agent,
      visited_at: new Date()
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (normalized === 'select count(*) as total from users where role = "client"') {
    const total = await db.collection('users').countDocuments({ role: 'client' });
    return [{ total }];
  }

  if (normalized === 'select count(*) as total from produits') {
    const total = await db.collection('produits').countDocuments({});
    return [{ total }];
  }

  if (normalized === 'select count(*) as total from commandes') {
    const total = await db.collection('commandes').countDocuments({});
    return [{ total }];
  }

  if (normalized === 'select sum(total) as revenue from commandes where statut != "annulee"') {
    const rows = await db.collection('commandes').aggregate([
      { $match: { statut: { $ne: 'annulee' } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } }
    ]).toArray();
    return [{ revenue: rows[0]?.revenue || 0 }];
  }

  if (normalized === 'select count(*) as total from commandes where statut = "en_attente"') {
    const total = await db.collection('commandes').countDocuments({ statut: 'en_attente' });
    return [{ total }];
  }

  if (normalized === 'select count(*) as total from contacts where statut = "non_lu"') {
    const total = await db.collection('contacts').countDocuments({ statut: 'non_lu' });
    return [{ total }];
  }

  if (normalized === 'select count(*) as total from produits where stock = 0') {
    const total = await db.collection('produits').countDocuments({ stock: 0 });
    return [{ total }];
  }

  if (normalized === 'select count(*) as total from visites where date(visited_at) = curdate()') {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const total = await db.collection('visites').countDocuments({ visited_at: { $gte: today, $lt: tomorrow } });
    return [{ total }];
  }

  if (normalized === 'select count(*) as total from visites where month(visited_at) = month(curdate()) and year(visited_at) = year(curdate())') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const total = await db.collection('visites').countDocuments({ visited_at: { $gte: start, $lt: end } });
    return [{ total }];
  }

  if (normalized.includes('select month(created_at) as mois, year(created_at) as annee, count(*) as nb_commandes, sum(total) as chiffre_affaires from commandes where statut != \'annulee\' group by year(created_at), month(created_at) order by annee desc, mois desc limit 12')) {
    const rows = await db.collection('commandes').aggregate([
      { $match: { statut: { $ne: 'annulee' } } },
      {
        $group: {
          _id: {
            annee: { $year: '$created_at' },
            mois: { $month: '$created_at' }
          },
          nb_commandes: { $sum: 1 },
          chiffre_affaires: { $sum: '$total' }
        }
      },
      { $sort: { '_id.annee': -1, '_id.mois': -1 } },
      { $limit: 12 }
    ]).toArray();

    return rows.map((r) => ({
      mois: r._id.mois,
      annee: r._id.annee,
      nb_commandes: r.nb_commandes,
      chiffre_affaires: r.chiffre_affaires
    }));
  }

  if (normalized.includes('select p.id, p.nom, p.image, sum(cd.quantite) as total_vendu, sum(cd.quantite * cd.prix_unitaire) as revenue from commande_details cd join produits p on cd.produit_id = p.id join commandes c on cd.commande_id = c.id where c.statut != \'annulee\' group by p.id order by total_vendu desc limit 10')) {
    const validOrders = await db.collection('commandes').find(
      { statut: { $ne: 'annulee' } },
      { projection: { _id: 0, id: 1 } }
    ).toArray();
    const validOrderIds = validOrders.map((o) => o.id);

    const grouped = await db.collection('commande_details').aggregate([
      { $match: { commande_id: { $in: validOrderIds } } },
      {
        $group: {
          _id: '$produit_id',
          total_vendu: { $sum: '$quantite' },
          revenue: { $sum: { $multiply: ['$quantite', '$prix_unitaire'] } }
        }
      },
      { $sort: { total_vendu: -1 } },
      { $limit: 10 }
    ]).toArray();

    const productIds = grouped.map((g) => g._id);
    const products = productIds.length ? await db.collection('produits').find({ id: { $in: productIds } }).toArray() : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g) => ({
      id: g._id,
      nom: productMap.get(g._id)?.nom || null,
      image: productMap.get(g._id)?.image || null,
      total_vendu: g.total_vendu,
      revenue: g.revenue
    }));
  }

  if (normalized.includes('select page, count(*) as nb_visites, count(distinct ip_address) as visiteurs_uniques from visites where date(visited_at) >= date_sub(curdate(), interval 30 day) group by page order by nb_visites desc')) {
    const fromDate = startOfDay(new Date());
    fromDate.setDate(fromDate.getDate() - 30);

    const rows = await db.collection('visites').aggregate([
      { $match: { visited_at: { $gte: fromDate } } },
      {
        $group: {
          _id: '$page',
          nb_visites: { $sum: 1 },
          ips: { $addToSet: '$ip_address' }
        }
      },
      { $sort: { nb_visites: -1 } }
    ]).toArray();

    return rows.map((r) => ({
      page: r._id,
      nb_visites: r.nb_visites,
      visiteurs_uniques: r.ips.length
    }));
  }

  if (normalized.includes('select date(visited_at) as date, count(*) as nb_visites from visites where date(visited_at) >= date_sub(curdate(), interval 7 day) group by date(visited_at) order by date asc')) {
    const fromDate = startOfDay(new Date());
    fromDate.setDate(fromDate.getDate() - 7);

    const rows = await db.collection('visites').aggregate([
      { $match: { visited_at: { $gte: fromDate } } },
      {
        $group: {
          _id: {
            y: { $year: '$visited_at' },
            m: { $month: '$visited_at' },
            d: { $dayOfMonth: '$visited_at' }
          },
          nb_visites: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]).toArray();

    return rows.map((r) => ({
      date: `${r._id.y}-${String(r._id.m).padStart(2, '0')}-${String(r._id.d).padStart(2, '0')}`,
      nb_visites: r.nb_visites
    }));
  }

  if (normalized.includes('select p.id, p.nom as name, coalesce(sum(cd.quantite), 0) as total_vendu from produits p left join commande_details cd on p.id = cd.produit_id where p.id is not null group by p.id, p.nom having coalesce(sum(cd.quantite), 0) > 0 order by coalesce(sum(cd.quantite), 0) desc limit 5')) {
    const grouped = await db.collection('commande_details').aggregate([
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

    const productIds = grouped.map((g) => g._id);
    const products = productIds.length ? await db.collection('produits').find({ id: { $in: productIds } }).toArray() : [];
    const productMap = new Map(products.map((p) => [p.id, p.nom]));

    return grouped.map((g) => ({
      id: g._id,
      name: productMap.get(g._id) || null,
      total_vendu: g.total_vendu
    }));
  }

  if (normalized === 'select * from site_settings') {
    const rows = await db.collection('site_settings').find({}).toArray();
    return rows.map(stripMongoId);
  }

  if (normalized === 'update site_settings set setting_value = ? where setting_key = ?') {
    const [setting_value, setting_key] = params;
    const result = await db.collection('site_settings').updateOne(
      { setting_key },
      { $set: { setting_value } },
      { upsert: true }
    );
    return { affectedRows: result.matchedCount + (result.upsertedCount || 0) };
  }

  throw new Error(`Requête non supportée par l'adaptateur MongoDB: ${sql}`);
}

const db = {
  query(sql, params, callback) {
    let queryParams = params;
    let cb = callback;

    if (typeof params === 'function') {
      cb = params;
      queryParams = [];
    }

    if (typeof cb !== 'function') {
      throw new Error('db.query requiert un callback');
    }

    setImmediate(async () => {
      try {
        const result = await executeQuery(sql, queryParams || []);
        cb(null, result);
      } catch (error) {
        cb(error);
      }
    });
  },
  getDb
};

module.exports = db;
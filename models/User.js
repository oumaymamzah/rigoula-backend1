const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');
const bcrypt = require('bcryptjs');
const hashPassword = require('../hashPassword');

class User {
  static async findByEmail(email) {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    return user ? stripMongoId(user) : null;
  }

  static async findById(id) {
    const db = await getDb();
    const user = await db.collection('users').findOne(
      { id: toNumber(id) },
      { projection: { _id: 0, id: 1, nom: 1, prenom: 1, email: 1, telephone: 1, role: 1, created_at: 1 } }
    );
    return user || null;
  }

  static async findAll() {
    const db = await getDb();
    const users = await db
      .collection('users')
      .find({}, { projection: { _id: 0, id: 1, nom: 1, prenom: 1, email: 1, telephone: 1, role: 1, created_at: 1 } })
      .toArray();
    return users;
  }

  static async create(userData) {
    const { nom, prenom, email, password, telephone, role = 'client' } = userData;
    const hashedPassword = await hashPassword(password);
    const db = await getDb();
    const id = await nextId(db, 'users');
    await db.collection('users').insertOne({
      id,
      nom,
      prenom,
      email,
      password: hashedPassword,
      telephone,
      role,
      created_at: new Date()
    });
    return id;
  }

  static async update(id, userData) {
    const { nom, prenom, email, telephone, role, password } = userData;
    const db = await getDb();
    const updates = {};

    if (nom !== undefined) updates.nom = nom;
    if (prenom !== undefined) updates.prenom = prenom;
    if (email !== undefined) updates.email = email;
    if (telephone !== undefined) updates.telephone = telephone;
    if (role !== undefined) updates.role = role;
    if (password) updates.password = await hashPassword(password);

    if (!Object.keys(updates).length) return false;

    const result = await db.collection('users').updateOne(
      { id: toNumber(id) },
      { $set: updates }
    );
    return result.matchedCount > 0;
  }

  static async updateProfile(id, profileData) {
    const { nom, prenom, telephone } = profileData;
    const db = await getDb();
    const result = await db.collection('users').updateOne(
      { id: toNumber(id) },
      { $set: { nom, prenom, telephone } }
    );
    return result.matchedCount > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('users').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;

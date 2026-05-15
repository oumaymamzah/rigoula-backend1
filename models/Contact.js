const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class Contact {
  static async create(contactData) {
    const { nom, email, telephone, sujet, message } = contactData;
    const db = await getDb();
    const id = await nextId(db, 'contacts');
    await db.collection('contacts').insertOne({
      id,
      nom,
      email,
      telephone: telephone || '',
      sujet,
      message,
      statut: 'non_lu',
      created_at: new Date()
    });
    return id;
  }

  static async findAll() {
    const db = await getDb();
    const rows = await db.collection('contacts').find({}).sort({ created_at: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  static async findById(id) {
    const db = await getDb();
    const row = await db.collection('contacts').findOne({ id: toNumber(id) });
    return row ? stripMongoId(row) : null;
  }

  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('contacts').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }

  static async updateStatus(id, statut) {
    const db = await getDb();
    const result = await db.collection('contacts').updateOne(
      { id: toNumber(id) },
      { $set: { statut } }
    );
    return result.matchedCount > 0;
  }
}

module.exports = Contact;

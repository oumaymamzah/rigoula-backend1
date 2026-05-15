const { getDb } = require('../config/db');
const { nextId, stripMongoId, toNumber } = require('../utils/mongoHelpers');

class Certification {
  static async findAll() {
    const db = await getDb();
    const rows = await db.collection('certifications').find({}).sort({ date_obtention: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  static async findById(id) {
    const db = await getDb();
    const row = await db.collection('certifications').findOne({ id: toNumber(id) });
    return row ? stripMongoId(row) : null;
  }

  static async create(certificationData) {
    const { titre, description, organisme, date_obtention, images } = certificationData;
    const db = await getDb();
    const id = await nextId(db, 'certifications');
    await db.collection('certifications').insertOne({
      id,
      titre,
      description,
      organisme,
      date_obtention: new Date(date_obtention),
      images,
      created_at: new Date()
    });
    return id;
  }

  static async update(id, certificationData) {
    const { titre, description, organisme, date_obtention, images } = certificationData;
    const db = await getDb();
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
    return result.matchedCount > 0;
  }

  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('certifications').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }
}

module.exports = Certification;
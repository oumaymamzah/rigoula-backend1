const { getDb } = require('../config/db');
const { nextId, stripMongoId, startOfDay, toNumber } = require('../utils/mongoHelpers');

class Event {
  static async findAll() {
    const db = await getDb();
    const rows = await db.collection('evenements').find({}).sort({ date_evenement: -1 }).toArray();
    return rows.map(stripMongoId);
  }

  static async findUpcoming() {
    const db = await getDb();
    const today = startOfDay(new Date());
    const rows = await db
      .collection('evenements')
      .find({ date_evenement: { $gte: today } })
      .sort({ date_evenement: 1 })
      .toArray();
    return rows.map(stripMongoId);
  }

  static async findById(id) {
    const db = await getDb();
    const row = await db.collection('evenements').findOne({ id: toNumber(id) });
    return row ? stripMongoId(row) : null;
  }

  static async create(eventData) {
    const { titre, description, date_evenement, lieu, image } = eventData;
    const db = await getDb();
    const id = await nextId(db, 'evenements');
    await db.collection('evenements').insertOne({
      id,
      titre,
      description,
      date_evenement: new Date(date_evenement),
      lieu,
      image,
      created_at: new Date()
    });
    return id;
  }

  static async update(id, eventData) {
    const { titre, description, date_evenement, lieu, image } = eventData;
    const db = await getDb();
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
    return result.matchedCount > 0;
  }


  static async delete(id) {
    const db = await getDb();
    const result = await db.collection('evenements').deleteOne({ id: toNumber(id) });
    return result.deletedCount > 0;
  }
}

module.exports = Event;
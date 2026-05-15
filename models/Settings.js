const { getDb } = require('../config/db');
const { stripMongoId } = require('../utils/mongoHelpers');

class Settings {
  static async findAll() {
    const db = await getDb();
    const rows = await db.collection('site_settings').find({}).toArray();
    return rows.map(stripMongoId);
  }

  static async update(settings) {
    const db = await getDb();
    const operations = Object.keys(settings).map((key) => ({
      updateOne: {
        filter: { setting_key: key },
        update: { $set: { setting_value: settings[key] } },
        upsert: true
      }
    }));

    if (!operations.length) return [];
    return db.collection('site_settings').bulkWrite(operations);
  }
}

module.exports = Settings;
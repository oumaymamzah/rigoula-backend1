const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB || 'rigoula';

let dbPromise;

async function getDb() {
  if (!dbPromise) {
    const client = new MongoClient(mongoUri);
    dbPromise = client
      .connect()
      .then((connectedClient) => {
        console.log(`Connecte a MongoDB (${mongoDbName})`);
        return connectedClient.db(mongoDbName);
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }
  return dbPromise;
}

module.exports = { getDb };

const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

const nextId = async (db, collectionName) => {
  const counter = await db.collection('counters').findOneAndUpdate(
    { _id: collectionName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const document = counter?.value || counter;
  return document.seq;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

module.exports = {
  toNumber,
  stripMongoId,
  nextId,
  startOfDay
};

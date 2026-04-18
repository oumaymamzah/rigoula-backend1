const { ObjectId } = require('mongodb');
const db = require('../config/db');

const MEDIA_ROUTE_PREFIX = '/api/media/';

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const buildMediaPath = (id) => `${MEDIA_ROUTE_PREFIX}${id}`;

const extractMediaId = (reference) => {
  if (!reference || typeof reference !== 'string') return null;
  const match = reference.match(/\/api\/media\/([a-f\d]{24})/i);
  if (!match) return null;
  return match[1];
};

const saveUploadedMedia = async (file, metadata = {}) => {
  if (!file || !file.buffer || !file.mimetype) {
    throw new Error('Fichier média invalide');
  }

  const mongo = await db.getDb();
  const result = await mongo.collection('media_assets').insertOne({
    contentType: file.mimetype,
    data: file.buffer,
    originalName: file.originalname || null,
    size: Number(file.size || file.buffer.length || 0),
    metadata,
    created_at: new Date()
  });

  return buildMediaPath(result.insertedId.toString());
};

const getMediaById = async (id) => {
  if (!isObjectId(id)) return null;
  const mongo = await db.getDb();
  return mongo.collection('media_assets').findOne({ _id: new ObjectId(id) });
};

const deleteMediaByReference = async (reference) => {
  const id = extractMediaId(reference);
  if (!id) return false;

  const mongo = await db.getDb();
  const result = await mongo.collection('media_assets').deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};

module.exports = {
  buildMediaPath,
  extractMediaId,
  saveUploadedMedia,
  getMediaById,
  deleteMediaByReference
};

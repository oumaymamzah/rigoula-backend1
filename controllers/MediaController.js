const { getMediaById } = require('../services/mediaService');

class MediaController {
  static async getMedia(req, res) {
    try {
      const media = await getMediaById(req.params.id);
      if (!media || !media.data) {
        return res.status(404).json({ message: 'Média non trouvé' });
      }

      res.setHeader('Content-Type', media.contentType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      if (media.size) {
        res.setHeader('Content-Length', String(media.size));
      }

      return res.send(media.data.buffer ? media.data.buffer : media.data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MediaController;

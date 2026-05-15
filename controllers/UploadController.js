const { getDb } = require('../config/db');
const { saveUploadedMedia, deleteMediaByReference } = require('../services/mediaService');

class UploadController {
  static async uploadProductImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
      }

      const imageUrl = await saveUploadedMedia(req.file, {
        type: 'product',
        uploadedBy: req.user?.id || null
      });

      res.json({
        success: true,
        message: 'Image uploadée et prête pour sauvegarde Atlas',
        imageUrl: imageUrl,
        data: { imagePath: imageUrl }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
      }

      const db = await getDb();
      const previousLogoRow = await db.collection('site_settings').findOne({ setting_key: 'site_logo' });
      const previousLogo = previousLogoRow?.setting_value || null;

      const logoUrl = await saveUploadedMedia(req.file, {
        type: 'site_logo',
        uploadedBy: req.user?.id || null
      });

      await db.collection('site_settings').updateOne(
        { setting_key: 'site_logo' },
        { $set: { setting_value: logoUrl } },
        { upsert: true }
      );

      if (previousLogo && previousLogo !== logoUrl) {
        await deleteMediaByReference(previousLogo);
      }

      res.json({
        success: true,
        message: 'Logo uploadé et sauvegardé avec succès',
        logoUrl: logoUrl,
        data: { logoPath: logoUrl }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async uploadPresentationImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Aucun fichier uploadé' 
        });
      }

      const db = await getDb();
      const previousImageRow = await db.collection('site_settings').findOne({ setting_key: 'presentation_image' });
      const previousImage = previousImageRow?.setting_value || null;

      const imageUrl = await saveUploadedMedia(req.file, {
        type: 'presentation_image',
        uploadedBy: req.user?.id || null
      });

      console.log('📸 Image URL:', imageUrl);

      await db.collection('site_settings').updateOne(
        { setting_key: 'presentation_image' },
        { $set: { setting_value: imageUrl } },
        { upsert: true }
      );

      if (previousImage && previousImage !== imageUrl) {
        await deleteMediaByReference(previousImage);
      }

      res.json({
        success: true,
        message: 'Image de présentation uploadée avec succès',
        data: { imagePath: imageUrl }
      });

    } catch (error) {
      console.error('❌ ERREUR:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = UploadController;
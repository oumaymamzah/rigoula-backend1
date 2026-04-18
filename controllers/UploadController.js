const db = require('../config/db');
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

      const previousLogo = await new Promise((resolve) => {
        db.query('SELECT * FROM site_settings', (err, results) => {
          if (err || !Array.isArray(results)) {
            resolve(null);
            return;
          }
          const logoSetting = results.find((row) => row.setting_key === 'site_logo');
          resolve(logoSetting?.setting_value || null);
        });
      });

      const logoUrl = await saveUploadedMedia(req.file, {
        type: 'site_logo',
        uploadedBy: req.user?.id || null
      });

      db.query(
        'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
        [logoUrl, 'site_logo'],
        async (err) => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }

          if (previousLogo && previousLogo !== logoUrl) {
            await deleteMediaByReference(previousLogo);
          }

          res.json({
            success: true,
            message: 'Logo uploadé et sauvegardé avec succès',
            logoUrl: logoUrl,
            data: { logoPath: logoUrl }
          });
        }
      );
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

      const previousImage = await new Promise((resolve) => {
        db.query('SELECT * FROM site_settings', (err, results) => {
          if (err || !Array.isArray(results)) {
            resolve(null);
            return;
          }
          const imageSetting = results.find((row) => row.setting_key === 'presentation_image');
          resolve(imageSetting?.setting_value || null);
        });
      });

      const imageUrl = await saveUploadedMedia(req.file, {
        type: 'presentation_image',
        uploadedBy: req.user?.id || null
      });

      console.log('📸 Image URL:', imageUrl);

      db.query(
        'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
        [imageUrl, 'presentation_image'],
        async (err, result) => {
          if (err) {
            console.error('❌ DB Error:', err.message);
            return res.status(500).json({ 
              success: false, 
              error: err.message 
            });
          }

          if (previousImage && previousImage !== imageUrl) {
            await deleteMediaByReference(previousImage);
          }

          console.log('✅ UPDATE OK:', result.affectedRows, 'ligne(s) modifiée(s)');

          res.json({
            success: true,
            message: 'Image de présentation uploadée avec succès',
            data: { imagePath: imageUrl }
          });
        }
      );

    } catch (error) {
      console.error('❌ ERREUR:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = UploadController;
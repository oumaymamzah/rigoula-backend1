const db = require('../config/db');

class UploadController {
  static uploadProductImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
      }

      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;

      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        imageUrl: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
      }

      const logoUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;

      db.query(
        'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
        [logoUrl, 'site_logo'],
        (err) => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }

          res.json({
            success: true,
            message: 'Logo uploadé et sauvegardé avec succès',
            logoUrl: logoUrl,
            filename: req.file.filename,
            data: { logoPath: logoUrl }
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static uploadPresentationImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Aucun fichier uploadé' 
        });
      }

      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;

      console.log('📸 Image URL:', imageUrl);

      db.query(
        'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
        [imageUrl, 'presentation_image'],
        (err, result) => {
          if (err) {
            console.error('❌ DB Error:', err.message);
            return res.status(500).json({ 
              success: false, 
              error: err.message 
            });
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
const Settings = require('../models/Settings');

const DEFAULT_SETTINGS = {
  site_name: 'Rigoula',
  site_description: 'Votre partenaire de confiance pour des produits agricoles biologiques de qualité supérieure en Tunisie.',
  hero_title: 'Bienvenue chez Rigoula',
  hero_subtitle: 'Des produits agricoles biologiques frais et de qualité supérieure',
  about_title: 'À propos de Rigoula',
  about_description: 'Rigoula valorise les produits biologiques et le savoir-faire local.',
  contact_phone: '+216 71 234 567',
  contact_email: 'contact@rigoula.com',
  contact_address: 'Tunis, Tunisie',
  facebook_url: '#',
  instagram_url: '#',
  twitter_url: '#',
  linkedin_url: '#',
  site_logo: ''
};

class SettingsController {
  static async getAllSettings(req, res) {
    try {
      let results = await Settings.findAll();

      // Initialisation automatique si la collection est vide.
      if (!results || results.length === 0) {
        await Settings.update(DEFAULT_SETTINGS);
        results = await Settings.findAll();
      }

      const settings = {};
      results.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });

      res.json({
        success: true,
        data: {
          ...DEFAULT_SETTINGS,
          ...settings
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateSettings(req, res) {
    try {
      const settings = req.body;
      await Settings.update(settings);
      res.json({ success: true, message: 'Paramètres mis à jour' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
      }

      const logoUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;

      // Sauvegarder l'URL du logo dans les paramètres
      await Settings.update({ site_logo: logoUrl });

      res.json({
        success: true,
        message: 'Logo uploadé et sauvegardé avec succès',
        logoUrl: logoUrl,
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SettingsController;
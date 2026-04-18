const Settings = require('../models/Settings');
const { saveUploadedMedia, deleteMediaByReference } = require('../services/mediaService');

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
      const currentSettingsRows = await Settings.findAll();
      const currentSettings = {};
      currentSettingsRows.forEach((row) => {
        currentSettings[row.setting_key] = row.setting_value;
      });

      await Settings.update(settings);

      const mediaKeys = ['site_logo', 'presentation_image'];
      for (const key of mediaKeys) {
        const previousValue = currentSettings[key];
        const newValue = settings[key];
        if (newValue && previousValue && previousValue !== newValue) {
          await deleteMediaByReference(previousValue);
        }
      }

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

      const currentSettings = await Settings.findAll();
      const previousLogo = currentSettings.find((row) => row.setting_key === 'site_logo')?.setting_value;

      const logoUrl = await saveUploadedMedia(req.file, {
        type: 'site_logo',
        uploadedBy: req.user?.id || null
      });

      // Sauvegarder l'image logo directement dans MongoDB Atlas
      await Settings.update({ site_logo: logoUrl });

      if (previousLogo && previousLogo !== logoUrl) {
        await deleteMediaByReference(previousLogo);
      }

      res.json({
        success: true,
        message: 'Logo uploadé et sauvegardé avec succès',
        logoUrl: logoUrl
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SettingsController;
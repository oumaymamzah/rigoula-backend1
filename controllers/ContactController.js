const Contact = require('../models/Contact');

class ContactController {
  static async submitContact(req, res) {
    try {
      const { nom, email, telephone, sujet, message } = req.body;

      if (!nom || !email || !message) {
        return res.status(400).json({ message: 'Nom, email et message sont obligatoires' });
      }

      const contactId = await Contact.create({ nom, email, telephone, sujet, message });
      res.status(201).json({
        success: true,
        message: 'Message envoyé avec succès',
        id: contactId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllContacts(req, res) {
    try {
      const contacts = await Contact.findAll();
      res.json({ success: true, data: contacts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getContactById(req, res) {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: 'Message non trouvé' });
      }
      res.json({ success: true, data: contact });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteContact(req, res) {
    try {
      const deleted = await Contact.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Message non trouvé' });
      }
      res.json({ success: true, message: 'Message supprimé' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ContactController;
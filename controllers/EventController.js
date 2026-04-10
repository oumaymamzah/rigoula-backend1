const Event = require('../models/Event');

class EventController {
  static async getAllEvents(req, res) {
    try {
      const events = await Event.findAll();
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUpcomingEvents(req, res) {
    try {
      const events = await Event.findUpcoming();
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getEventById(req, res) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
      res.json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createEvent(req, res) {
    try {
      const { titre, description, date_evenement, lieu } = req.body;
      const image = req.file ? req.file.filename : null;

      if (!titre || !date_evenement) {
        return res.status(400).json({ message: 'Titre et date sont obligatoires' });
      }

      const eventId = await Event.create({ titre, description, date_evenement, lieu, image });
      res.status(201).json({
        success: true,
        message: 'Événement ajouté avec succès',
        id: eventId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateEvent(req, res) {
    try {
      const { titre, description, date_evenement, lieu } = req.body;
      const image = req.file ? req.file.filename : req.body.image;

      if (!titre || !date_evenement) {
        return res.status(400).json({ message: 'Titre et date sont obligatoires' });
      }

      const updated = await Event.update(req.params.id, { titre, description, date_evenement, lieu, image });
      if (!updated) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
      res.json({ success: true, message: 'Événement modifié avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  static async deleteEvent(req, res) {
    try {
      const deleted = await Event.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Événement non trouvé' });
      }
      res.json({ success: true, message: 'Événement supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = EventController;
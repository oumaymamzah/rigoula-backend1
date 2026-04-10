const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../services/emailService');

class UserController {
  static async register(req, res) {
    try {
      const { nom, prenom, email, password, telephone } = req.body;

      // Validation
      if (!nom || !prenom || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
      }

      // Check if email exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Create user
      const userId = await User.create({ nom, prenom, email, password, telephone });

      // Notification email (tentative immédiate)
      let emailNotice = null;
      try {
        await sendWelcomeEmail({ email, nom, prenom });
      } catch (mailErr) {
        console.error('⚠️ Email inscription non envoyé:', mailErr.message);
        emailNotice = 'Inscription réussie, mais email de bienvenue non envoyé.';
      }

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        userId,
        emailNotice
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { nom, prenom, telephone } = req.body;
      const updated = await User.updateProfile(req.user.id, { nom, prenom, telephone });
      if (!updated) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ success: true, message: 'Profil mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createUser(req, res) {
    try {
      const { nom, prenom, email, password, telephone, role } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      const userId = await User.create({ nom, prenom, email, password, telephone, role });

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        userId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { nom, prenom, email, telephone, role } = req.body;
      const updated = await User.update(req.params.id, { nom, prenom, email, telephone, role });
      if (!updated) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ success: true, message: 'Utilisateur modifié avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const deleted = await User.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
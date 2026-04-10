const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== ROUTES ======
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const produitsRoutes = require('./routes/produits');
const categoriesRoutes = require('./routes/categories');
const sousCategoriesRoutes = require('./routes/sousCategories');
const evenementsRoutes = require('./routes/evenements');
const panierRoutes = require('./routes/panier');
const commandesRoutes = require('./routes/commandes');
const contactRoutes = require('./routes/contact');
const statistiquesRoutes = require('./routes/statistiques');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const certificationsRoutes = require('./routes/certifications');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/produits', produitsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/sous-categories', sousCategoriesRoutes);
app.use('/api/evenements', evenementsRoutes);
app.use('/api/panier', panierRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/orders', commandesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/certifications', certificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API E-commerce Rigoula fonctionne!',
    status: 'success'
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
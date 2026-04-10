const jwt = require('jsonwebtoken');

// Vérifier le token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(403).json({ message: 'Token manquant' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// Vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Admin uniquement.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin };
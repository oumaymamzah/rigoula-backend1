const express = require('express');
const router = express.Router();
const CertificationController = require('../controllers/CertificationController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET - Toutes les certifications (Public)
router.get('/', CertificationController.getAllCertifications);

// GET - Une certification par ID (Public)
router.get('/:id', CertificationController.getCertificationById);

// POST - Ajouter une certification (Admin)
router.post('/', verifyToken, isAdmin, upload.array('images', 10), CertificationController.createCertification);

// PUT - Modifier une certification (Admin)
router.put('/:id', verifyToken, isAdmin, upload.array('images', 10), CertificationController.updateCertification);

// DELETE - Supprimer une certification (Admin)
router.delete('/:id', verifyToken, isAdmin, CertificationController.deleteCertification);

module.exports = router;
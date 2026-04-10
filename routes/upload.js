const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UploadController = require('../controllers/UploadController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST - Upload une image de produit
router.post('/product', verifyToken, isAdmin, upload.single('image'), UploadController.uploadProductImage);

// POST - Upload un logo (Admin)
router.post('/logo', verifyToken, isAdmin, upload.single('logo'), UploadController.uploadLogo);

// POST - Upload image de présentation (Admin)
router.post('/presentation-image', verifyToken, isAdmin, upload.single('image'), UploadController.uploadPresentationImage);

module.exports = router;
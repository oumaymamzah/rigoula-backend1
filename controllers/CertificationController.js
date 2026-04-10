const Certification = require('../models/Certification');

class CertificationController {

  static async getAllCertifications(req, res) {
    try {
      const certifications = await Certification.findAll();
      console.log('📋 Certifications trouvées:', certifications.length);
      
      // Parser les images et construire les URLs
      const parsedCertifications = certifications.map(cert => {
        try {
          let images = [];
          if (cert.images) {
            // Parser le JSON
            const parsed = typeof cert.images === 'string' ? JSON.parse(cert.images) : cert.images;
            // Si c'est un tableau
            if (Array.isArray(parsed)) {
              images = parsed.map(img => `http://localhost:5000/uploads/products/${img}`);
            } else if (typeof parsed === 'string') {
              // Si c'est une string unique
              images = [`http://localhost:5000/uploads/products/${parsed}`];
            }
          }
          return {
            ...cert,
            image: images
          };
        } catch (err) {
          console.log('⚠️ Image non JSON:', cert.id, '-', cert.images);
          // Si c'est juste un nom de fichier
          const imageUrl = cert.images ? `http://localhost:5000/uploads/products/${cert.images}` : null;
          return {
            ...cert,
            image: imageUrl ? [imageUrl] : []
          };
        }
      });
      
      console.log('📤 Envoi au frontend:', parsedCertifications.length, 'certifications');
      res.json({ success: true, data: parsedCertifications });
    } catch (error) {
      console.error('❌ Erreur getAllCertifications:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getCertificationById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      console.log('🔍 Recherche certification ID:', id);
      
      const certification = await Certification.findById(id);
      if (!certification) {
        console.log('❌ Certification', id, 'non trouvée');
        return res.status(404).json({ message: 'Certification non trouvée' });
      }
      
      console.log('✅ Certification trouvée:', certification.titre);
      
      // Parser les images et construire les URLs
      try {
        let images = [];
        if (certification.images) {
          const parsed = typeof certification.images === 'string' ? JSON.parse(certification.images) : certification.images;
          if (Array.isArray(parsed)) {
            images = parsed.map(img => `http://localhost:5000/uploads/products/${img}`);
          } else if (typeof parsed === 'string') {
            images = [`http://localhost:5000/uploads/products/${parsed}`];
          }
        }
        certification.image = images;
      } catch (err) {
        console.log('⚠️ Image non JSON:', certification.id);
        certification.image = certification.images ? [`http://localhost:5000/uploads/products/${certification.images}`] : [];
      }
      
      res.json({ success: true, data: certification });
    } catch (error) {
      console.error('❌ Erreur getCertificationById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async createCertification(req, res) {
    try {
      const { titre, description, organisme, date_obtention } = req.body;
      const images = req.files && req.files.length > 0 
        ? JSON.stringify(req.files.map(f => f.filename)) 
        : null;

      if (!titre) {
        return res.status(400).json({ message: 'Le titre est obligatoire' });
      }

      const certificationId = await Certification.create({ titre, description, organisme, date_obtention, images });
      res.status(201).json({
        success: true,
        message: 'Certification ajoutée avec succès',
        id: certificationId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCertification(req, res) {
    try {
      const { titre, description, organisme, date_obtention, imagesToKeep } = req.body;
      const id = parseInt(req.params.id, 10);
      console.log('🟡 updateCertification appelé avec ID:', id, 'Type:', typeof id);
      console.log('🟡 Body reçu:', { titre, description, organisme, date_obtention });
      console.log('🟡 imagesToKeep reçu:', imagesToKeep);

      if (!titre) {
        return res.status(400).json({ message: 'Le titre est obligatoire' });
      }

      // Récupérer la certification existante pour les images
      console.log('🟡 Recherche certification existante avec ID:', id);
      const existingCertification = await Certification.findById(id);
      console.log('🟡 Résultat findById:', existingCertification);
      if (!existingCertification) {
        console.log('❌ Certification ID', id, 'non trouvée dans la BD');
        return res.status(404).json({ message: 'Certification non trouvée' });
      }
      console.log('✅ Certification trouvée:', existingCertification.titre);

      // Traiter les images
      let images;
      
      // Récupérer la liste des images à conserver (envoyées par le frontend)
      let imagesToKeepArray = [];
      if (imagesToKeep) {
        try {
          imagesToKeepArray = typeof imagesToKeep === 'string' 
            ? JSON.parse(imagesToKeep)
            : imagesToKeep;
          if (!Array.isArray(imagesToKeepArray)) {
            imagesToKeepArray = [imagesToKeepArray];
          }
        } catch (err) {
          imagesToKeepArray = [];
        }
      }
      
      console.log('🟡 Images à conserver:', imagesToKeepArray);

      if (req.files && req.files.length > 0) {
        // Si de nouveaux fichiers sont uploadés, les ajouter à la liste
        const newImages = req.files.map(f => f.filename);
        const allImages = [...imagesToKeepArray, ...newImages];
        images = JSON.stringify(allImages);
        console.log('✅ Images finales (existantes + nouvelles):', allImages);
      } else {
        // Sinon, utiliser uniquement les images à conserver
        images = JSON.stringify(imagesToKeepArray);
        console.log('✅ Images finales (existantes uniquement):', imagesToKeepArray);
      }

      const updated = await Certification.update(id, { titre, description, organisme, date_obtention, images });
      if (!updated) {
        return res.status(404).json({ message: 'Certification non trouvée' });
      }
      res.json({ success: true, message: 'Certification modifiée avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteCertification(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await Certification.delete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Certification non trouvée' });
      }
      res.json({ success: true, message: 'Certification supprimée avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CertificationController;
const Certification = require('../models/Certification');
const { saveUploadedMedia, deleteMediaByReference } = require('../services/mediaService');

const parseImageList = (imagesField) => {
  if (!imagesField) return [];
  if (Array.isArray(imagesField)) return imagesField.filter(Boolean);

  if (typeof imagesField === 'string') {
    try {
      const parsed = JSON.parse(imagesField);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === 'string' && parsed) return [parsed];
      return [];
    } catch (error) {
      return imagesField ? [imagesField] : [];
    }
  }

  return [];
};

class CertificationController {

  static async getAllCertifications(req, res) {
    try {
      const certifications = await Certification.findAll();

      const parsedCertifications = certifications.map((cert) => {
        const images = parseImageList(cert.images);
        return {
          ...cert,
          images,
          image: images
        };
      });

      res.json({ success: true, data: parsedCertifications });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCertificationById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const certification = await Certification.findById(id);
      if (!certification) {
        return res.status(404).json({ message: 'Certification non trouvée' });
      }

      const images = parseImageList(certification.images);
      certification.images = images;
      certification.image = images;
      
      res.json({ success: true, data: certification });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createCertification(req, res) {
    try {
      const { titre, description, organisme, date_obtention } = req.body;
      const uploadedImages = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const mediaPath = await saveUploadedMedia(file, {
            type: 'certification',
            uploadedBy: req.user?.id || null
          });
          uploadedImages.push(mediaPath);
        }
      }

      const images = uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null;

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

      if (!titre) {
        return res.status(400).json({ message: 'Le titre est obligatoire' });
      }

      const existingCertification = await Certification.findById(id);
      if (!existingCertification) {
        return res.status(404).json({ message: 'Certification non trouvée' });
      }

      const previousImages = parseImageList(existingCertification.images);
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

      imagesToKeepArray = imagesToKeepArray.filter((img) => typeof img === 'string' && img);

      const newImages = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const mediaPath = await saveUploadedMedia(file, {
            type: 'certification',
            uploadedBy: req.user?.id || null
          });
          newImages.push(mediaPath);
        }
      }

      const finalImages = [...imagesToKeepArray, ...newImages];
      const images = finalImages.length > 0 ? JSON.stringify(finalImages) : null;

      for (const previousImage of previousImages) {
        if (!finalImages.includes(previousImage)) {
          await deleteMediaByReference(previousImage);
        }
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
      const existingCertification = await Certification.findById(id);
      if (!existingCertification) {
        return res.status(404).json({ message: 'Certification non trouvée' });
      }

      const deleted = await Certification.delete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Certification non trouvée' });
      }

      const images = parseImageList(existingCertification.images);
      for (const imageRef of images) {
        await deleteMediaByReference(imageRef);
      }

      res.json({ success: true, message: 'Certification supprimée avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CertificationController;
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const FOLDER_NAME = 'taskflow';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============ SUBIR ARCHIVO ============

const uploadFile = async (file, options = {}) => {
  try {
    // Modo desarrollo (simulado)
    if (process.env.NODE_ENV === 'development' && 
        (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'placeholder')) {
      console.log('📁 [DEV] Archivo simulado subido');
      return {
        secure_url: 'https://via.placeholder.com/400x300?text=Dev+Upload',
        public_id: 'dev_placeholder'
      };
    }

    const result = await cloudinary.uploader.upload(file, {  // <-- RESALTAR: Subida a Cloudinary
      folder: options.folder || FOLDER_NAME,
      resource_type: 'auto'
    });

    console.log(`📁 Archivo subido: ${result.secure_url}`);
    return result;

  } catch (error) {
    console.error('❌ Error subiendo archivo:', error.message);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
};

// ============ ELIMINAR ARCHIVO ============

const deleteFile = async (publicId) => {
  try {
    if (process.env.NODE_ENV === 'development' && 
        (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'placeholder')) {
      console.log('📁 [DEV] Archivo simulado eliminado:', publicId);
      return { success: true };
    }

    const result = await cloudinary.uploader.destroy(publicId);  // <-- RESALTAR: Eliminación
    if (result.result === 'ok') {
      console.log(`📁 Archivo eliminado: ${publicId}`);
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error.message);
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
};

// ============ VALIDAR ARCHIVO ============

const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No se proporcionó ningún archivo' };
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo excede el tamaño máximo` };
  }
  return { valid: true, error: null };
};

// ============ EXPORTAR ============

module.exports = {
  uploadFile,
  deleteFile,
  validateFile
};
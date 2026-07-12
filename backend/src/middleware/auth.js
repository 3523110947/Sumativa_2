const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// ============ MIDDLEWARE DE AUTENTICACIÓN ============

const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado. No se proporcionó token.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado.'
      });
    }

    // Adjuntar usuario al request
    req.user = user;
    req.userId = user.id;

    next();

  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado. Inicia sesión nuevamente.'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Error de autenticación.'
    });
  }
};

// ============ MIDDLEWARE DE ROLES ============

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere rol: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// ============ EXPORTAR ============

module.exports = {
  auth,
  checkRole
};
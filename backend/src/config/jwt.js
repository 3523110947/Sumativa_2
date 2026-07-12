const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// ============ GENERAR TOKEN ============

const generateToken = (id) => {
  try {
    return jwt.sign({ id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    });
  } catch (error) {
    console.error('❌ Error generando token:', error.message);
    throw new Error('Error al generar token de autenticación');
  }
};

// ============ VERIFICAR TOKEN ============

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    throw new Error('Error al verificar token');
  }
};

// ============ DECODIFICAR TOKEN (sin verificar) ============

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Error decodificando token:', error.message);
    return null;
  }
};

// ============ EXPORTAR ============

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
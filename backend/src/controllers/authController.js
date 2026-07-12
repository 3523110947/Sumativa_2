const User = require('../models/User');
const { query } = require('../config/database');
const { generateToken } = require('../config/jwt');

// ============ REGISTRO ============

exports.register = async (req, res) => {
  try {
    console.log('📝 Registro:', req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    const userId = await User.create(name, email, password);
    const user = await User.findById(userId);
    const token = generateToken(userId);

    console.log('✅ Usuario registrado:', email);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error en register:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// ============ LOGIN ============

exports.login = async (req, res) => {
  try {
    console.log('📝 Login:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son obligatorios'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const token = generateToken(user.id);

    console.log('✅ Login exitoso:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

// ============ OBTENER USUARIO ACTUAL ============

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error en getMe:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ACTUALIZAR PERFIL ============

exports.updateProfile = async (req, res) => {
  try {
    console.log('📝 Actualizando perfil de usuario:', req.user.id);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre es requerido'
      });
    }

    // Actualizar directamente con SQL
    await query(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, req.user.id]
    );

    // Obtener usuario actualizado
    const user = await User.findById(req.user.id);

    console.log('✅ Perfil actualizado para:', user.email);

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error en updateProfile:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ CAMBIAR CONTRASEÑA ============

exports.changePassword = async (req, res) => {
  try {
    console.log('🔑 Cambiando contraseña para usuario:', req.user.id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    console.log('✅ Contraseña actualizada para:', user.email);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('❌ Error en changePassword:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
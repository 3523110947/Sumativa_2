const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============ CREAR USUARIO ============

const create = async (name, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  const result = await query(sql, [name, email, hashedPassword]);
  return result.insertId;
};

// ============ BUSCAR POR EMAIL ============

const findByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const rows = await query(sql, [email]);
  return rows[0] || null;
};

// ============ BUSCAR POR ID ============

const findById = async (id) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const rows = await query(sql, [id]);
  return rows[0] || null;
};

// ============ COMPARAR CONTRASEÑA ============

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ============ EXPORTAR ============

module.exports = {
  create,
  findByEmail,
  findById,
  comparePassword
};
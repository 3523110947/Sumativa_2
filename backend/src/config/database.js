const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const connectDB = async () => {
  try {
    console.log('📡 Intentando conectar a MySQL...');

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'taskflow',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    const connection = await pool.getConnection();
    console.log('✅ MySQL conectado correctamente');
    connection.release();

    // Crear tablas
    await createTables();

    return pool;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('❌ Asegúrate de que:');
    console.error('   1. XAMPP esté corriendo con MySQL activo');
    console.error('   2. La base de datos "taskflow" existe');
    console.error('   3. Los datos de .env son correctos');
    return null;
  }
};

const query = async (sql, params = []) => {
  try {
    if (!pool) throw new Error('Base de datos no conectada');
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ Error en consulta:', error.message);
    throw error;
  }
};

const createTables = async () => {
  try {
    // ============ TABLA users ============
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'member') DEFAULT 'member',
        is_active BOOLEAN DEFAULT TRUE,
        last_login DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users creada/verificada');

    // ============ TABLA projects ============
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(500) DEFAULT '',
        owner_id INT NOT NULL,
        status ENUM('active', 'archived', 'completed') DEFAULT 'active',
        due_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla projects creada/verificada');

    // ============ TABLA project_members ============
    await query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('owner', 'manager', 'member') DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_member (project_id, user_id)
      )
    `);
    console.log('✅ Tabla project_members creada/verificada');

    // ============ TABLA tasks ============
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(500) DEFAULT '',
        project_id INT NOT NULL,
        assigned_to INT DEFAULT NULL,
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
        due_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla tasks creada/verificada');

    // ============ TABLA task_comments ============
    await query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla task_comments creada/verificada');

    // ============ TABLA task_attachments ============
    await query(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        public_id VARCHAR(255) DEFAULT NULL,
        uploaded_by INT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla task_attachments creada/verificada');

    console.log('✅ Todas las tablas creadas/verificadas correctamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
    throw error;
  }
};

module.exports = { connectDB, query, pool };
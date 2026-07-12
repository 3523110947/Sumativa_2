const { query } = require('../config/database');

// ============ LISTAR PROYECTOS ============

exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await query(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
      ORDER BY p.created_at DESC
    `, [userId, userId]);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('❌ Error en getProjects:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ CREAR PROYECTO ============

exports.createProject = async (req, res) => {
  try {
    const { name, description, due_date } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del proyecto es requerido'
      });
    }

    const result = await query(
      'INSERT INTO projects (name, description, due_date, owner_id) VALUES (?, ?, ?, ?)',
      [name, description || '', due_date || null, userId]
    );

    const newProject = await query('SELECT * FROM projects WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: newProject[0]
    });
  } catch (error) {
    console.error('❌ Error en createProject:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ OBTENER PROYECTO POR ID ============

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await query(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ? AND (p.owner_id = ? OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      ))
    `, [id, userId, userId]);

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    // Obtener miembros del proyecto
    const members = await query(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      WHERE u.id = ? OR u.id IN (
        SELECT user_id FROM project_members WHERE project_id = ?
      )
    `, [project[0].owner_id, id]);

    res.json({
      success: true,
      data: {
        ...project[0],
        members
      }
    });
  } catch (error) {
    console.error('❌ Error en getProjectById:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ACTUALIZAR PROYECTO ============

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, due_date, status } = req.body;
    const userId = req.user.id;

    // Verificar que el proyecto existe y el usuario es owner
    const project = await query(
      'SELECT * FROM projects WHERE id = ? AND owner_id = ?',
      [id, userId]
    );

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado o no tienes permisos'
      });
    }

    await query(
      'UPDATE projects SET name = ?, description = ?, due_date = ?, status = ? WHERE id = ?',
      [name || project[0].name, description || project[0].description, due_date || project[0].due_date, status || project[0].status, id]
    );

    const updated = await query('SELECT * FROM projects WHERE id = ?', [id]);

    res.json({
      success: true,
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Error en updateProject:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ELIMINAR PROYECTO ============

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el proyecto existe y el usuario es owner
    const project = await query(
      'SELECT * FROM projects WHERE id = ? AND owner_id = ?',
      [id, userId]
    );

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado o no tienes permisos'
      });
    }

    // Eliminar tareas del proyecto
    await query('DELETE FROM tasks WHERE project_id = ?', [id]);

    // Eliminar miembros
    await query('DELETE FROM project_members WHERE project_id = ?', [id]);

    // Eliminar proyecto
    await query('DELETE FROM projects WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Proyecto eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error en deleteProject:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ AGREGAR MIEMBRO ============

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const ownerId = req.user.id;

    // Verificar que el proyecto existe y el usuario es owner
    const project = await query(
      'SELECT * FROM projects WHERE id = ? AND owner_id = ?',
      [id, ownerId]
    );

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado o no tienes permisos'
      });
    }

    // Verificar que el usuario existe
    const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que no sea el owner
    if (userId === ownerId) {
      return res.status(400).json({
        success: false,
        error: 'El owner ya es miembro del proyecto'
      });
    }

    // Verificar que no sea ya miembro
    const existing = await query(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya es miembro del proyecto'
      });
    }

    await query(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Miembro agregado correctamente'
    });
  } catch (error) {
    console.error('❌ Error en addMember:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ELIMINAR MIEMBRO ============

exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const ownerId = req.user.id;

    // Verificar que el proyecto existe y el usuario es owner
    const project = await query(
      'SELECT * FROM projects WHERE id = ? AND owner_id = ?',
      [id, ownerId]
    );

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado o no tienes permisos'
      });
    }

    // No permitir eliminar al owner
    if (userId === ownerId) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar al owner del proyecto'
      });
    }

    await query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Miembro eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error en removeMember:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
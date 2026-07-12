const { query } = require('../config/database');

// ============ LISTAR TAREAS ============

exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, status, priority } = req.query;

    let sql = `
      SELECT t.*, 
             u.name as assigned_to_name,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.project_id IN (
        SELECT id FROM projects WHERE owner_id = ?
        UNION
        SELECT project_id FROM project_members WHERE user_id = ?
      )
    `;

    const params = [userId, userId];

    if (projectId) {
      sql += ' AND t.project_id = ?';
      params.push(projectId);
    }

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY t.created_at DESC';

    const tasks = await query(sql, params);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Error en getTasks:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ CREAR TAREA ============

exports.createTask = async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, due_date } = req.body;
    const userId = req.user.id;

    if (!title || !project_id) {
      return res.status(400).json({
        success: false,
        error: 'Título y proyecto son requeridos'
      });
    }

    // Verificar que el proyecto existe y el usuario tiene acceso
    const project = await query(
      `SELECT * FROM projects 
       WHERE id = ? AND (owner_id = ? OR id IN (
         SELECT project_id FROM project_members WHERE user_id = ?
       ))`,
      [project_id, userId, userId]
    );

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado o no tienes acceso'
      });
    }

    const result = await query(
      `INSERT INTO tasks 
       (title, description, project_id, assigned_to, priority, due_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || '', project_id, assigned_to || null, priority || 'medium', due_date || null]
    );

    const newTask = await query(
      `SELECT t.*, u.name as assigned_to_name, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newTask[0]
    });
  } catch (error) {
    console.error('❌ Error en createTask:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ OBTENER TAREA POR ID ============

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await query(
      `SELECT t.*, 
              u.name as assigned_to_name,
              p.name as project_name,
              p.owner_id as project_owner_id
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ? AND t.project_id IN (
         SELECT id FROM projects WHERE owner_id = ?
         UNION
         SELECT project_id FROM project_members WHERE user_id = ?
       )`,
      [id, userId, userId]
    );

    if (task.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      data: task[0]
    });
  } catch (error) {
    console.error('❌ Error en getTaskById:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ACTUALIZAR TAREA ============

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, due_date, status } = req.body;
    const userId = req.user.id;

    // Verificar que la tarea existe y el usuario tiene acceso
    const task = await query(
      `SELECT * FROM tasks t
       WHERE t.id = ? AND t.project_id IN (
         SELECT id FROM projects WHERE owner_id = ?
         UNION
         SELECT project_id FROM project_members WHERE user_id = ?
       )`,
      [id, userId, userId]
    );

    if (task.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    await query(
      `UPDATE tasks 
       SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?, status = ?
       WHERE id = ?`,
      [
        title || task[0].title,
        description || task[0].description,
        assigned_to || task[0].assigned_to,
        priority || task[0].priority,
        due_date || task[0].due_date,
        status || task[0].status,
        id
      ]
    );

    const updated = await query(
      `SELECT t.*, u.name as assigned_to_name, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Error en updateTask:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ACTUALIZAR ESTADO ============

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'El estado es requerido'
      });
    }

    // Verificar que la tarea existe y el usuario tiene acceso
    const task = await query(
      `SELECT * FROM tasks t
       WHERE t.id = ? AND t.project_id IN (
         SELECT id FROM projects WHERE owner_id = ?
         UNION
         SELECT project_id FROM project_members WHERE user_id = ?
       )`,
      [id, userId, userId]
    );

    if (task.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    await query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );

    const updated = await query('SELECT * FROM tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Error en updateTaskStatus:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ ELIMINAR TAREA ============

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la tarea existe y el usuario tiene acceso
    const task = await query(
      `SELECT * FROM tasks t
       WHERE t.id = ? AND t.project_id IN (
         SELECT id FROM projects WHERE owner_id = ?
         UNION
         SELECT project_id FROM project_members WHERE user_id = ?
       )`,
      [id, userId, userId]
    );

    if (task.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    await query('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Tarea eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error en deleteTask:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
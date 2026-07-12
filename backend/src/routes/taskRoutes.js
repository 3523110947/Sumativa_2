const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');

// ============ TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ============

router.use(auth);

// ============ RUTAS DE TAREAS ============

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/projectController');

// ============ TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN ============

router.use(auth);

// ============ RUTAS DE PROYECTOS ============

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// ============ RUTAS DE MIEMBROS ============

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
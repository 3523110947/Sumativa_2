const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
require('dotenv').config();

const app = express();

// ============ MIDDLEWARE ============

// CORS - Permite todos los orígenes (para desarrollo)
app.use(cors());

// Parsear JSON
app.use(express.json());

// ============ RUTAS ============

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'TaskFlow API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Error 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ============ EXPORTAR ============

module.exports = app;
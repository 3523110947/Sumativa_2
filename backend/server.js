const app = require('./src/app');
const { connectDB } = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Conectar a la base de datos y luego iniciar el servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
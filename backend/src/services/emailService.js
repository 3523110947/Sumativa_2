const sgMail = require('@sendgrid/mail');  
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@taskflow.com';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';


const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY?.includes('SG.')) {
      console.log('📧 [DEV] Email enviado a:', to);
      return { success: true };
    }

    const msg = {  // <-- RESALTAR: Estructura del mensaje
      to,
      from: FROM_EMAIL,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, '') || ''
    };

    await sgMail.send(msg);  // <-- RESALTAR: Envío del correo
    console.log(`📧 Email enviado a: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ PLANTILLAS DE CORREOS ============

const sendWelcomeEmail = async (to, name) => {
  const html = `
    <h2>¡Bienvenido a TaskFlow, ${name}! 🎉</h2>
    <p>Nos alegra tenerte a bordo.</p>
    <a href="${APP_URL}/login">Iniciar Sesión</a>
  `;
  return sendEmail({ to, subject: '¡Bienvenido a TaskFlow!', html });
};

const sendProjectCreated = async ({ to, projectName, createdBy }) => {
  const html = `
    <h2>📁 Nuevo Proyecto: ${projectName}</h2>
    <p><strong>${createdBy}</strong> te ha agregado al proyecto.</p>
  `;
  return sendEmail({ to, subject: `Nuevo proyecto: ${projectName}`, html });
};

const sendTaskAssigned = async ({ to, taskTitle, projectName, assignedBy }) => {
  const html = `
    <h2>✅ Nueva Tarea Asignada</h2>
    <p><strong>${assignedBy}</strong> te ha asignado: <strong>${taskTitle}</strong></p>
    <p>Proyecto: ${projectName}</p>
  `;
  return sendEmail({ to, subject: `Nueva tarea: ${taskTitle}`, html });
};

// ============ EXPORTAR ============

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendProjectCreated,
  sendTaskAssigned
};
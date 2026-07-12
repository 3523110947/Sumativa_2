// ============================================
// DASHBOARD
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    requireAuth();

    try {
        // Cargar estadísticas
        await loadStats();

        // Cargar proyectos recientes
        await loadRecentProjects();

        // Cargar tareas recientes
        await loadRecentTasks();

    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showAlert('Error al cargar los datos del dashboard', 'danger');
    }
});

// ============ CARGAR ESTADÍSTICAS ============

const loadStats = async () => {
    try {
        // Proyectos
        const projectsData = await projectsAPI.getAll();
        const projects = projectsData.data || [];
        
        // Tareas
        const tasksData = await tasksAPI.getAll();
        const tasks = tasksData.data || [];

        // Calcular estadísticas
        const stats = {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            completedProjects: projects.filter(p => p.status === 'completed').length,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
            pendingTasks: tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length
        };

        // Actualizar DOM
        updateStatsUI(stats);

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        throw error;
    }
};

// ============ ACTUALIZAR UI DE ESTADÍSTICAS ============

const updateStatsUI = (stats) => {
    const elements = {
        totalProjects: document.getElementById('totalProjects'),
        activeProjects: document.getElementById('activeProjects'),
        completedProjects: document.getElementById('completedProjects'),
        totalTasks: document.getElementById('totalTasks'),
        completedTasks: document.getElementById('completedTasks'),
        pendingTasks: document.getElementById('pendingTasks')
    };

    if (elements.totalProjects) elements.totalProjects.textContent = stats.totalProjects;
    if (elements.activeProjects) elements.activeProjects.textContent = stats.activeProjects;
    if (elements.completedProjects) elements.completedProjects.textContent = stats.completedProjects;
    if (elements.totalTasks) elements.totalTasks.textContent = stats.totalTasks;
    if (elements.completedTasks) elements.completedTasks.textContent = stats.completedTasks;
    if (elements.pendingTasks) elements.pendingTasks.textContent = stats.pendingTasks;
};

// ============ CARGAR PROYECTOS RECIENTES ============

const loadRecentProjects = async () => {
    try {
        const data = await projectsAPI.getAll();
        const projects = data.data || [];
        const recent = projects.slice(0, 3);

        const container = document.getElementById('recentProjects');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">No hay proyectos</p>';
            return;
        }

        container.innerHTML = recent.map(project => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <div class="fw-semibold small">${escapeHtml(project.name)}</div>
                    <div class="text-muted small">${project.members?.length || 1} miembros</div>
                </div>
                <span class="badge-status ${project.status}">
                    ${getStatusLabel(project.status)}
                </span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error cargando proyectos recientes:', error);
    }
};

// ============ CARGAR TAREAS RECIENTES ============

const loadRecentTasks = async () => {
    try {
        const data = await tasksAPI.getAll();
        const tasks = data.data || [];
        const recent = tasks.slice(0, 3);

        const container = document.getElementById('recentTasks');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">No hay tareas</p>';
            return;
        }

        container.innerHTML = recent.map(task => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <div class="fw-semibold small">${escapeHtml(task.title)}</div>
                    <div class="text-muted small">${task.project?.name || 'Sin proyecto'}</div>
                </div>
                <span class="badge-priority ${task.priority || 'medium'}">
                    ${getPriorityLabel(task.priority)}
                </span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error cargando tareas recientes:', error);
    }
};

// ============ FUNCIONES AUXILIARES ============

const getStatusLabel = (status) => {
    const labels = {
        active: 'Activo',
        archived: 'Archivado',
        completed: 'Completado'
    };
    return labels[status] || status;
};

const getPriorityLabel = (priority) => {
    const labels = {
        high: 'Alta',
        medium: 'Media',
        low: 'Baja'
    };
    return labels[priority] || priority;
};

const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const showAlert = (message, type = 'info') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector('.main-content') || document.body;
    container.prepend(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
};
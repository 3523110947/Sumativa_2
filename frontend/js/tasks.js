// ============================================
// TAREAS
// ============================================

let currentProjectId = null;
let currentTasks = [];
let editingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadProjectInfo();
    loadTasks();
    setupTaskForm();
    setupFilters();
});

// ============ CARGAR INFORMACIÓN DEL PROYECTO ============

const loadProjectInfo = () => {
    const params = new URLSearchParams(window.location.search);
    currentProjectId = params.get('projectId');

    if (!currentProjectId) {
        showAlert('No se especificó un proyecto', 'danger');
        document.getElementById('projectName').textContent = 'Proyecto no encontrado';
        return;
    }

    // Cargar nombre del proyecto
    projectsAPI.getById(currentProjectId)
        .then(data => {
            if (data.success && data.data) {
                document.getElementById('projectName').textContent = data.data.name || 'Tareas del Proyecto';
            }
        })
        .catch(() => {
            document.getElementById('projectName').textContent = 'Tareas del Proyecto';
        });
};

// ============ CARGAR TAREAS ============

const loadTasks = async () => {
    if (!currentProjectId) return;

    try {
        const data = await tasksAPI.getAll({ projectId: currentProjectId });
        currentTasks = data.data || [];
        renderTasks(currentTasks);
    } catch (error) {
        console.error('Error cargando tareas:', error);
        showAlert('Error al cargar tareas', 'danger');
        document.getElementById('tasksList').innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted">Error al cargar tareas</p>
            </div>
        `;
    }
};

// ============ RENDERIZAR TAREAS ============

const renderTasks = (tasks) => {
    const container = document.getElementById('tasksList');
    if (!container) return;

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <h5 class="text-muted">No hay tareas en este proyecto</h5>
                <p class="text-muted small">Crea tu primera tarea</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="card-custom mb-3 task-item" data-id="${task.id}">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <h5 class="fw-bold mb-1">${escapeHtml(task.title)}</h5>
                        <span class="badge-priority ${task.priority || 'medium'}">
                            ${getPriorityLabel(task.priority)}
                        </span>
                        <span class="badge-status ${task.status === 'done' ? 'completed' : task.status === 'in_progress' ? 'active' : 'archived'}">
                            ${getStatusLabel(task.status)}
                        </span>
                    </div>
                    ${task.description ? `<p class="text-muted small mb-2">${escapeHtml(task.description)}</p>` : ''}
                    <div class="d-flex gap-3 small text-muted">
                        ${task.assigned_to_name ? `<span><i class="fas fa-user"></i> ${escapeHtml(task.assigned_to_name)}</span>` : ''}
                        ${task.due_date ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.due_date)}</span>` : ''}
                    </div>
                </div>
                <div class="d-flex gap-2 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-custom" onclick="editTask('${task.id}')">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger-custom" onclick="deleteTask('${task.id}')">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="mt-2 d-flex gap-2 flex-wrap">
                <button class="btn btn-sm btn-outline-secondary" onclick="changeStatus('${task.id}', 'todo')">📋</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="changeStatus('${task.id}', 'in_progress')">🔄</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="changeStatus('${task.id}', 'review')">👀</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="changeStatus('${task.id}', 'done')">✅</button>
            </div>
        </div>
    `).join('');
};

// ============ CONFIGURAR FORMULARIO ============

const setupTaskForm = () => {
    const form = document.getElementById('taskForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const priority = document.getElementById('taskPriority').value;
        const due_date = document.getElementById('taskDueDate').value;
        const status = document.getElementById('taskStatus').value;
        const taskId = document.getElementById('taskId').value;

        if (!title) {
            showAlert('El título es requerido', 'danger');
            return;
        }

        const data = { 
            title, 
            description, 
            project_id: currentProjectId,
            priority, 
            due_date,
            status 
        };

        try {
            let response;
            if (taskId) {
                response = await tasksAPI.update(taskId, data);
                showAlert('Tarea actualizada', 'success');
            } else {
                response = await tasksAPI.create(data);
                showAlert('Tarea creada', 'success');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
            if (modal) modal.hide();

            form.reset();
            document.getElementById('taskId').value = '';
            document.getElementById('taskModalTitle').textContent = 'Nueva Tarea';
            await loadTasks();

        } catch (error) {
            console.error('Error guardando tarea:', error);
            showAlert(error.message || 'Error al guardar tarea', 'danger');
        }
    });
};

// ============ ABRIR MODAL CREAR TAREA ============

const openCreateTaskModal = () => {
    editingTaskId = null;
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Nueva Tarea';
    document.getElementById('taskStatus').value = 'todo';
    const modal = new bootstrap.Modal(document.getElementById('taskModal'));
    modal.show();
};

// ============ EDITAR TAREA ============

const editTask = async (id) => {
    try {
        const data = await tasksAPI.getById(id);
        const task = data.data;

        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskDueDate').value = task.due_date || '';
        document.getElementById('taskStatus').value = task.status || 'todo';
        document.getElementById('taskModalTitle').textContent = 'Editar Tarea';

        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        modal.show();

    } catch (error) {
        console.error('Error cargando tarea:', error);
        showAlert('Error al cargar tarea', 'danger');
    }
};

// ============ CAMBIAR ESTADO ============

const changeStatus = async (id, status) => {
    try {
        await tasksAPI.updateStatus(id, status);
        showAlert('Estado actualizado', 'success');
        await loadTasks();
    } catch (error) {
        console.error('Error cambiando estado:', error);
        showAlert('Error al cambiar estado', 'danger');
    }
};

// ============ ELIMINAR TAREA ============

const deleteTask = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
        await tasksAPI.delete(id);
        showAlert('Tarea eliminada', 'success');
        await loadTasks();
    } catch (error) {
        console.error('Error eliminando tarea:', error);
        showAlert('Error al eliminar tarea', 'danger');
    }
};

// ============ CONFIGURAR FILTROS ============

const setupFilters = () => {
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');

    if (filterStatus) {
        filterStatus.addEventListener('change', () => filterTasks());
    }

    if (filterPriority) {
        filterPriority.addEventListener('change', () => filterTasks());
    }
};

const filterTasks = () => {
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';

    const filtered = currentTasks.filter(task => {
        const matchesStatus = status === 'all' || task.status === status;
        const matchesPriority = priority === 'all' || task.priority === priority;
        return matchesStatus && matchesPriority;
    });

    renderTasks(filtered);
};

// ============ FUNCIONES AUXILIARES ============

const getStatusLabel = (status) => {
    const labels = {
        todo: 'Por Hacer',
        in_progress: 'En Progreso',
        review: 'En Revisión',
        done: 'Completado'
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

const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-MX');
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
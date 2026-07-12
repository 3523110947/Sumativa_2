// ============================================
// PROYECTOS
// ============================================

let currentProjects = [];
let editingProjectId = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadProjects();
    setupProjectForm();
    setupSearchAndFilters();
});

// ============ CARGAR PROYECTOS ============

const loadProjects = async () => {
    try {
        const data = await projectsAPI.getAll();
        currentProjects = data.data || [];
        renderProjects(currentProjects);

    } catch (error) {
        console.error('Error cargando proyectos:', error);
        showAlert('Error al cargar proyectos', 'danger');
    }
};

// ============ RENDERIZAR PROYECTOS ============

const renderProjects = (projects) => {
    const container = document.getElementById('projectsList');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <h5 class="text-muted">No hay proyectos</h5>
                <p class="text-muted small">Crea tu primer proyecto</p>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="card-custom mb-3" data-id="${project.id}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="fw-bold mb-1">${escapeHtml(project.name)}</h5>
                    <p class="text-muted small mb-2">${escapeHtml(project.description || 'Sin descripción')}</p>
                    <div class="d-flex gap-3 small text-muted">
                        <span>📅 ${project.due_date ? formatDate(project.due_date) : 'Sin fecha'}</span>
                        <span>📊 ${project.status || 'Activo'}</span>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-info" onclick="viewTasks('${project.id}')">
                        📋 Tareas
                    </button>
                    <button class="btn btn-sm btn-outline-custom" onclick="editProject('${project.id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger-custom" onclick="deleteProject('${project.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// ============ VER TAREAS DEL PROYECTO ============

const viewTasks = (projectId) => {
    window.location.href = `tasks.html?projectId=${projectId}`;
};

// ============ CONFIGURAR FORMULARIO DE PROYECTO ============

const setupProjectForm = () => {
    const form = document.getElementById('projectForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('projectName').value;
        const description = document.getElementById('projectDescription').value;
        const due_date = document.getElementById('projectDueDate').value;
        const status = document.getElementById('projectStatus')?.value || 'active';

        const data = { name, description, due_date, status };

        try {
            let response;
            if (editingProjectId) {
                response = await projectsAPI.update(editingProjectId, data);
                showAlert('Proyecto actualizado', 'success');
            } else {
                response = await projectsAPI.create(data);
                showAlert('Proyecto creado', 'success');
            }

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
            if (modal) modal.hide();

            // Recargar lista
            await loadProjects();

            // Resetear formulario
            form.reset();
            editingProjectId = null;
            document.getElementById('modalTitle').textContent = 'Nuevo Proyecto';

        } catch (error) {
            console.error('Error guardando proyecto:', error);
            showAlert(error.message || 'Error al guardar proyecto', 'danger');
        }
    });
};

// ============ EDITAR PROYECTO ============

const editProject = async (id) => {
    try {
        const data = await projectsAPI.getById(id);
        const project = data.data;

        // Llenar formulario
        document.getElementById('projectName').value = project.name || '';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectDueDate').value = project.due_date || '';
        if (document.getElementById('projectStatus')) {
            document.getElementById('projectStatus').value = project.status || 'active';
        }

        editingProjectId = id;
        document.getElementById('modalTitle').textContent = 'Editar Proyecto';

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('projectModal'));
        modal.show();

    } catch (error) {
        console.error('Error cargando proyecto:', error);
        showAlert('Error al cargar proyecto', 'danger');
    }
};

// ============ ELIMINAR PROYECTO ============

const deleteProject = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    try {
        await projectsAPI.delete(id);
        showAlert('Proyecto eliminado', 'success');
        await loadProjects();

    } catch (error) {
        console.error('Error eliminando proyecto:', error);
        showAlert('Error al eliminar proyecto', 'danger');
    }
};

// ============ CONFIGURAR BÚSQUEDA Y FILTROS ============

const setupSearchAndFilters = () => {
    const searchInput = document.getElementById('searchProjects');
    const filterSelect = document.getElementById('filterStatus');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterProjects();
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterProjects();
        });
    }
};

const filterProjects = () => {
    const searchTerm = document.getElementById('searchProjects')?.value.toLowerCase() || '';
    const filterStatus = document.getElementById('filterStatus')?.value || 'all';

    const filtered = currentProjects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
                             (project.description || '').toLowerCase().includes(searchTerm);
        const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    renderProjects(filtered);
};

// ============ ABRIR MODAL CREAR PROYECTO ============

const openCreateProjectModal = () => {
    editingProjectId = null;
    document.getElementById('projectForm').reset();
    document.getElementById('modalTitle').textContent = 'Nuevo Proyecto';
    if (document.getElementById('projectStatus')) {
        document.getElementById('projectStatus').value = 'active';
    }
    const modal = new bootstrap.Modal(document.getElementById('projectModal'));
    modal.show();
};

// ============ FUNCIONES AUXILIARES ============

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
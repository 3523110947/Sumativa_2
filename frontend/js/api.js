// ============================================
// CONFIGURACIÓN DE API
// ============================================

const API_URL = 'http://localhost:5000/api';

// Obtener token del localStorage
const getToken = () => localStorage.getItem('token');

// Función para hacer peticiones autenticadas
const fetchAPI = async (endpoint, options = {}) => {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
    }

    return data;
};

// ============================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================

const authAPI = {
    // Registrar usuario
    register: async (name, email, password) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return response.json();
    },

    // Iniciar sesión
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return response.json();
    },

    // Obtener usuario actual
    getMe: async () => {
        return fetchAPI('/auth/me');
    },

    // Actualizar perfil
    updateProfile: async (data) => {
        return fetchAPI('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Cambiar contraseña
    changePassword: async (currentPassword, newPassword) => {
        return fetchAPI('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }
};

// ============================================
// SERVICIOS DE PROYECTOS
// ============================================

const projectsAPI = {
    // Listar proyectos
    getAll: async () => {
        return fetchAPI('/projects');
    },

    // Obtener un proyecto
    getById: async (id) => {
        return fetchAPI(`/projects/${id}`);
    },

    // Crear proyecto
    create: async (data) => {
        return fetchAPI('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Actualizar proyecto
    update: async (id, data) => {
        return fetchAPI(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Eliminar proyecto
    delete: async (id) => {
        return fetchAPI(`/projects/${id}`, {
            method: 'DELETE'
        });
    },

    // Agregar miembro
    addMember: async (id, userId) => {
        return fetchAPI(`/projects/${id}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    },

    // Eliminar miembro
    removeMember: async (id, userId) => {
        return fetchAPI(`/projects/${id}/members/${userId}`, {
            method: 'DELETE'
        });
    },

    // Estadísticas
    getStats: async () => {
        return fetchAPI('/projects/stats');
    }
};

// ============================================
// SERVICIOS DE TAREAS
// ============================================

const tasksAPI = {
    // Listar tareas (con filtros)
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/tasks?${params}`);
    },

    // Obtener tarea
    getById: async (id) => {
        return fetchAPI(`/tasks/${id}`);
    },

    // Crear tarea
    create: async (data) => {
        return fetchAPI('/tasks', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Actualizar tarea
    update: async (id, data) => {
        return fetchAPI(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Cambiar estado
    updateStatus: async (id, status) => {
        return fetchAPI(`/tasks/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    // Eliminar tarea
    delete: async (id) => {
        return fetchAPI(`/tasks/${id}`, {
            method: 'DELETE'
        });
    },

    // Estadísticas
    getStats: async () => {
        return fetchAPI('/tasks/stats');
    },

    // Agregar comentario
    addComment: async (id, text) => {
        return fetchAPI(`/tasks/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    },

    // Eliminar comentario
    deleteComment: async (taskId, commentId) => {
        return fetchAPI(`/tasks/${taskId}/comments/${commentId}`, {
            method: 'DELETE'
        });
    }
};
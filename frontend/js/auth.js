// ============================================
// AUTENTICACIÓN
// ============================================

// ============ FUNCIONES DE SESIÓN ============

// Guardar sesión
const saveSession = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

// Cerrar sesión
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Obtener usuario actual
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

// Verificar si está autenticado
const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// Redirigir si no está autenticado
const requireAuth = () => {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
};

// Redirigir si ya está autenticado
const requireGuest = () => {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
    }
};

// ============ LOGIN ============

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const btnText = submitBtn.innerHTML;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Cargando...';
        if (errorDiv) errorDiv.style.display = 'none';

        try {
            const data = await authAPI.login(email, password);

            if (data.success) {
                saveSession(data.token, data.user);
                window.location.href = 'dashboard.html';
            } else {
                if (errorDiv) {
                    errorDiv.textContent = data.error || 'Credenciales inválidas';
                    errorDiv.style.display = 'block';
                } else {
                    alert(data.error || 'Credenciales inválidas');
                }
            }
        } catch (error) {
            if (errorDiv) {
                errorDiv.textContent = 'Error al conectar con el servidor';
                errorDiv.style.display = 'block';
            } else {
                alert('Error al conectar con el servidor');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnText;
        }
    });
}

// ============ REGISTRO ============

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('registerError');
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const btnText = submitBtn.innerHTML;

        // Validar contraseña
        if (password.length < 6) {
            if (errorDiv) {
                errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
                errorDiv.style.display = 'block';
            } else {
                alert('La contraseña debe tener al menos 6 caracteres');
            }
            return;
        }

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Cargando...';
        if (errorDiv) errorDiv.style.display = 'none';

        try {
            const data = await authAPI.register(name, email, password);

            if (data.success) {
                saveSession(data.token, data.user);
                window.location.href = 'dashboard.html';
            } else {
                if (errorDiv) {
                    errorDiv.textContent = data.error || 'Error al registrarse';
                    errorDiv.style.display = 'block';
                } else {
                    alert(data.error || 'Error al registrarse');
                }
            }
        } catch (error) {
            if (errorDiv) {
                errorDiv.textContent = 'Error al conectar con el servidor';
                errorDiv.style.display = 'block';
            } else {
                alert('Error al conectar con el servidor');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnText;
        }
    });
}

// ============ LOGOUT ============

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// ============ VERIFICAR SESIÓN EN DASHBOARD ============

// Esta función se ejecuta en páginas protegidas (dashboard, projects, etc.)
document.addEventListener('DOMContentLoaded', () => {
    const protectedPages = ['dashboard.html', 'projects.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        requireAuth();
        
        // Mostrar nombre del usuario en la navbar
        const user = getCurrentUser();
        if (user) {
            const userNameElements = document.querySelectorAll('.user-name-display');
            userNameElements.forEach(el => el.textContent = user.name || user.email);
            
            const avatarElements = document.querySelectorAll('.user-avatar');
            avatarElements.forEach(el => {
                const initial = (user.name || 'U').charAt(0).toUpperCase();
                el.textContent = initial;
            });
        }
    }

    // Páginas de invitados (login, register)
    const guestPages = ['index.html', 'register.html'];
    if (guestPages.includes(currentPage)) {
        requireGuest();
    }
});
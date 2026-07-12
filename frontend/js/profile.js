// ============================================
// PERFIL DE USUARIO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadProfile();
    setupProfileForm();
    setupPasswordForm();
});

// ============ CARGAR PERFIL ============

const loadProfile = async () => {
    try {
        const data = await authAPI.getMe();
        const user = data.user || getCurrentUser();

        // Llenar formulario
        const nameElement = document.getElementById('profileName');
        const emailElement = document.getElementById('profileEmail');

        if (nameElement) nameElement.value = user.name || '';
        if (emailElement) emailElement.value = user.email || '';

        console.log('✅ Perfil cargado para:', user.email);

    } catch (error) {
        console.error('Error cargando perfil:', error);
        showAlert('Error al cargar perfil', 'danger');
    }
};

// ============ ACTUALIZAR PERFIL ============

const setupProfileForm = () => {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('profileName').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.innerHTML;

        if (!name) {
            showAlert('El nombre es requerido', 'danger');
            return;
        }

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Guardando...';

        try {
            const data = await authAPI.updateProfile({ name });

            if (data.success) {
                // Actualizar usuario en localStorage
                const user = getCurrentUser();
                if (user) {
                    user.name = name;
                    localStorage.setItem('user', JSON.stringify(user));
                }
                showAlert('Perfil actualizado correctamente', 'success');
            } else {
                showAlert(data.error || 'Error al actualizar perfil', 'danger');
            }

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            showAlert('Error al actualizar perfil', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnText;
        }
    });
};

// ============ CAMBIAR CONTRASEÑA ============

const setupPasswordForm = () => {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.innerHTML;

        // Validar
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Todos los campos son obligatorios', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Las contraseñas no coinciden', 'danger');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('La contraseña debe tener al menos 6 caracteres', 'danger');
            return;
        }

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Guardando...';

        try {
            const data = await authAPI.changePassword(currentPassword, newPassword);

            if (data.success) {
                showAlert('Contraseña actualizada correctamente', 'success');
                form.reset();
            } else {
                showAlert(data.error || 'Error al cambiar contraseña', 'danger');
            }

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            showAlert('Error al cambiar contraseña', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnText;
        }
    });
};

// ============ FUNCIONES AUXILIARES ============

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
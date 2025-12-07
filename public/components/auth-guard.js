// ===================== AUTH GUARD =====================
// Sistema de control de acceso basado en roles

/**
 * Obtiene el usuario actual del localStorage
 * @returns {Object|null} Usuario actual o null si no está autenticado
 */
export function getCurrentUser() {
    const session = localStorage.getItem('textileflow_session');
    if (!session) return null;

    try {
        return JSON.parse(session);
    } catch (error) {
        console.error("Error al parsear sesión:", error);
        return null;
    }
}

/**
 * Verifica si el usuario es administrador
 * @returns {boolean} True si es admin, false si no
 */
export function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;

    const rol = user.rol || user.role || '';
    return rol.toLowerCase() === 'administrador' || rol.toLowerCase() === 'admin';
}

/**
 * Requiere que el usuario esté autenticado
 * Redirige a login si no lo está
 */
export function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        console.warn("⚠️ Usuario no autenticado, redirigiendo a login");
        window.location.href = '/pages/login.html';
        return false;
    }
    return true;
}

/**
 * Requiere que el usuario sea administrador
 * Redirige a employee dashboard si es empleado
 * Redirige a login si no está autenticado
 */
export function requireAdmin() {
    const user = getCurrentUser();

    if (!user) {
        console.warn("⚠️ Usuario no autenticado, redirigiendo a login");
        window.location.href = '/pages/login.html';
        return false;
    }

    if (!isAdmin()) {
        console.warn("⚠️ Acceso denegado: se requiere rol de administrador");
        window.location.href = '/pages/employee/dashboard.html';
        return false;
    }

    return true;
}

/**
 * Redirige al dashboard correspondiente según el rol
 */
export function redirectToDashboard() {
    if (isAdmin()) {
        window.location.href = '/pages/admin/dashboard.html';
    } else {
        window.location.href = '/pages/employee/dashboard.html';
    }
}

/**
 * Cierra sesión y redirige a login
 */
export function logout() {
    localStorage.removeItem('textileflow_session');
    window.location.href = '/pages/login.html';
}

console.log("✅ Auth Guard cargado");

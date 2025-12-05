/**
 * Sistema de Sesión Simplificado
 * Maneja la sesión del usuario de forma directa sin dependencias complejas
 */

const SESSION_KEY = 'textileflow_session';

class SessionManager {
    /**
     * Guarda la sesión del usuario
     */
    static saveSession(userData) {
        const sessionData = {
            uid: userData.uid,
            email: userData.email,
            nombre: userData.nombre || '',
            apellido: userData.apellido || '',
            displayName: userData.displayName || `${userData.nombre || ''} ${userData.apellido || ''}`.trim() || userData.email,
            rol: userData.rol || userData.role || 'Empleado',
            role: userData.rol || userData.role || 'Empleado', // Compatibilidad
            timestamp: Date.now()
        };

        console.log('💾 SessionManager - Guardando sesión:', sessionData);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        console.log('✅ Sesión guardada correctamente');

        return sessionData;
    }

    /**
     * Obtiene la sesión actual
     */
    static getSession() {
        try {
            const session = localStorage.getItem(SESSION_KEY);
            if (!session) {
                console.log('⚠️ No hay sesión en localStorage');
                return null;
            }

            const sessionData = JSON.parse(session);
            console.log('✅ Sesión recuperada:', sessionData);
            return sessionData;
        } catch (error) {
            console.error('❌ Error al recuperar sesión:', error);
            return null;
        }
    }

    /**
     * Verifica si hay una sesión activa
     */
    static hasSession() {
        return this.getSession() !== null;
    }

    /**
     * Limpia la sesión
     */
    static clearSession() {
        console.log('🗑️ Limpiando sesión');
        localStorage.removeItem(SESSION_KEY);
    }

    /**
     * Verifica si el usuario es administrador
     */
    static isAdmin() {
        const session = this.getSession();
        if (!session) return false;

        const rol = session.rol || session.role || '';
        return rol === 'Administrador' || rol === 'admin';
    }

    /**
     * Redirige al login si no hay sesión
     */
    static requireSession() {
        if (!this.hasSession()) {
            console.log('❌ No hay sesión, redirigiendo a login');
            window.location.href = './login.html';
            return false;
        }
        return true;
    }
}

// Exportar para uso en módulos
export default SessionManager;

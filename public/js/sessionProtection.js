function protectPage() {
    const session = localStorage.getItem('textileflow_session');
    
    if (!session) {
        console.warn('⚠️ No hay sesión activa. Redirigiendo al login...');
        window.location.replace('../login.html');
        return false;
    }

    try {
        const sessionData = JSON.parse(session);
        
        if (!sessionData.uid || !sessionData.email) {
            console.warn('Sesión corrupta. Limpiando y redirigiendo...');
            localStorage.removeItem('textileflow_session');
            window.location.replace('../login.html');
            return false;
        }

        // Opcional: verificar que la sesión no haya expirado (por ejemplo, > 24 horas)
        const sessionAge = Date.now() - (sessionData.timestamp || 0);
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 horas en ms

        if (sessionAge > maxSessionAge) {
            console.warn('⚠️ Sesión expirada. Redirigiendo al login...');
            localStorage.removeItem('textileflow_session');
            window.location.replace('../login.html');
            return false;
        }

        console.log('✅ Sesión válida. Página protegida.');
        return true;

    } catch (e) {
        console.error('❌ Error al validar sesión:', e);
        localStorage.removeItem('textileflow_session');
        window.location.replace('../login.html');
        return false;
    }
}

/**
 * Prevenir que se cachee la página después de logout
 * Esto evita que el usuario pueda volver atrás con el botón "atrás" del navegador
 */
function preventPageCache() {
    // Headers HTTP (en cliente-side no se puede controlar directamente)
    // Pero podemos agregar meta tags
    
    const noCacheMetaTags = [
        { name: 'pragma', content: 'no-cache' },
        { name: 'cache-control', content: 'no-cache, no-store, must-revalidate' },
        { name: 'expires', content: '0' }
    ];

    noCacheMetaTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.httpEquiv = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
    });

    // Usar history.replaceState para que no se pueda volver atrás
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
        // Si intentan retroceder, volver a empujar el estado
        window.history.pushState(null, '', window.location.href);
    });
}

/**
 * Logout seguro que limpia todo y redirige
 */
function secureLogout() {
    console.log('🔐 Ejecutando logout seguro...');
    
    // Limpiar todo el localStorage
    localStorage.removeItem('textileflow_session');
    localStorage.clear(); // Limpia TODO localStorage
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar cookies (si existen)
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('✅ Datos de sesión limpiados completamente');
    
    // Redirigir al login con replace (no se puede volver atrás)
    window.location.replace('../login.html');
}

// Ejecutar protección al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión
    const isProtected = protectPage();
    
    if (isProtected) {
        // Prevenir caché si hay sesión válida
        preventPageCache();
    }
});

// Exportar funciones para usar en global scope
window.protectPage = protectPage;
window.secureLogout = secureLogout;
window.preventPageCache = preventPageCache;

console.log('✅ Módulo de protección de sesión cargado');

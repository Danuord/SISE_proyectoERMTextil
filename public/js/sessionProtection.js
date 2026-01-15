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
            localStorage.removeItem('textileflow_session');
            window.location.replace('../login.html');
            return false;
        }

        return true;

    } catch (e) {
        console.error('Error al validar sesión:', e);
        localStorage.removeItem('textileflow_session');
        window.location.replace('../login.html');
        return false;
    }
}

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

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
    });
}

function secureLogout() {
    console.log('🔐 Ejecutando logout seguro...');
    
    // Limpiar todo el localStorage
    localStorage.removeItem('textileflow_session');
    localStorage.clear();
    
    sessionStorage.clear();

    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  
    window.location.replace('../login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const isProtected = protectPage();
    
    if (isProtected) {
        preventPageCache();
    }
});

// Exportar funciones para usar en global scope
window.protectPage = protectPage;
window.secureLogout = secureLogout;
window.preventPageCache = preventPageCache;


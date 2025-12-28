# 🔐 Guía de Seguridad de Sesión en TextileFlow

## Problema Identificado

Cuando el usuario hace logout y luego presiona el botón "atrás" del navegador, podía volver a la página anterior sin validar sesión. Esto es un **riesgo de seguridad**.

## Solución Implementada

Se ha creado un sistema de protección de sesión en `public/js/sessionProtection.js` que:

### 1. **Verifica Sesión Activa** (`protectPage()`)
- Se ejecuta automáticamente al cargar cualquier página protegida
- Verifica que exista sesión válida en `localStorage`
- Valida que tenga `uid` y `email`
- Verifica que no haya expirado (máximo 24 horas)
- Si algo falla → redirige automáticamente al login

### 2. **Previene Caché de Navegador** (`preventPageCache()`)
- Agrega meta tags para indicar al navegador que NO cachee la página
- Usa `history.replaceState()` para bloquear el botón "atrás"
- Si el usuario intenta ir atrás → lo mantiene en la misma página

### 3. **Logout Seguro** (`secureLogout()`)
- Limpia `localStorage` completamente
- Limpia `sessionStorage`
- Limpia cookies
- Usa `window.location.replace()` (no se puede volver atrás)
- Redirige al login

## ¿Cómo está Implementado?

### En el HTML (Ejemplo: `pages/admin/dashboard.html`)

```html
<head>
    ...
    <!-- Protección de sesión -->
    <script src="../../js/sessionProtection.js"></script>
</head>
```

### En el JavaScript del Logout

```javascript
window.logout = async function () {
    console.log('🔐 Iniciando logout seguro...');
    try {
        // Logout en Firebase
        await authService.logout();
        console.log('✅ Sesión de Firebase cerrada');
        
        // Logout seguro (limpia todo y bloquea retroceso)
        secureLogout();
    } catch (e) {
        console.error('Error en logout:', e);
        // Hacer logout seguro de todas formas
        secureLogout();
    }
};
```

## Flujo de Seguridad

```
1. Usuario accede a localhost:5000
   ↓
2. index.html redirige a pages/login.html (si no hay sesión)
   ↓
3. Usuario inicia sesión exitosamente
   ↓
4. app.js redirige a pages/admin/dashboard.html
   ↓
5. sessionProtection.js se ejecuta automáticamente
   ├─ Verifica sesión válida ✓
   ├─ Previene caché del navegador ✓
   ├─ Bloquea botón atrás ✓
   ↓
6. Usuario hace click en "Cerrar Sesión"
   ↓
7. secureLogout() limpia TODO y redirige a login
   ↓
8. Si usuario presiona atrás → se mantiene en login
   ↓
9. Si intenta acceder directamente a dashboard sin sesión
   → sessionProtection.js lo redirige al login
```

## Protección en Múltiples Páginas

Ahora necesitas agregar `sessionProtection.js` a TODAS las páginas protegidas:

### Páginas Admin que Necesitan Protección
- ✅ `pages/admin/dashboard.html` (YA PROTEGIDA)
- ⏳ `pages/admin/rrhh.html`
- ⏳ `pages/admin/inventario.html`
- ⏳ `pages/admin/asistencia.html`
- ⏳ `pages/admin/pagos.html`
- ⏳ `pages/admin/reportes.html`
- ⏳ `pages/admin/configuracion.html`
- ⏳ `pages/admin/profile.html`

### Páginas Employee que Necesitan Protección
- ✅ `pages/employee/dashboard.html` (YA PROTEGIDA)
- ⏳ `pages/employee/asistencias.html`
- ⏳ `pages/employee/payments.html`
- ⏳ `pages/employee/profile.html`

### Cómo Agregar Protección

Para cada página protegida, en el `<head>`:

```html
<head>
    ...
    <!-- Protección de sesión -->
    <script src="../../js/sessionProtection.js"></script>
</head>
```

Y en el script de logout:

```javascript
window.logout = async function () {
    console.log('🔐 Iniciando logout seguro...');
    try {
        await authService.logout(); // o tu función de logout
        secureLogout(); // Esta función limpia todo y bloquea retroceso
    } catch (e) {
        secureLogout(); // Logout seguro de todas formas
    }
};
```

## Funciones Disponibles (Global Scope)

```javascript
// Verificar si hay sesión válida
protectPage() → boolean

// Prevenir que se cachee la página
preventPageCache() → void

// Logout seguro
secureLogout() → void
```

## Validación Adicional

Para mayor seguridad, también puedes validar rol del usuario:

```javascript
const session = localStorage.getItem('textileflow_session');
if (session) {
    const sessionData = JSON.parse(session);
    
    // Verificar que el admin está en página admin
    if (sessionData.rol !== 'admin') {
        console.warn('⚠️ Usuario no autorizado');
        window.location.replace('../../pages/login.html');
    }
}
```

## Pruebas de Seguridad

Realiza estos tests para verificar la seguridad:

1. **Test de Logout:**
   - Inicia sesión ✓
   - Haz click en "Cerrar Sesión" ✓
   - Presiona el botón "atrás" del navegador
   - **Resultado esperado:** Permanece en login, NO vuelve al dashboard

2. **Test de Caché:**
   - Inicia sesión ✓
   - Abre DevTools → Storage → localStorage
   - Elimina `textileflow_session`
   - Presiona el botón "atrás"
   - **Resultado esperado:** Redirige automáticamente a login

3. **Test de Acceso Directo:**
   - Sin sesión activa
   - Escribe directamente en URL: `localhost:5000/pages/admin/dashboard.html`
   - **Resultado esperado:** Redirige automáticamente a login

4. **Test de Sesión Expirada:**
   - Abre DevTools → Console
   - Ejecuta: `localStorage.setItem('textileflow_session', JSON.stringify({uid:'test',email:'test',timestamp:Date.now()-86400000*2}))`
   - Recarga la página (F5)
   - **Resultado esperado:** Sesión expirada, redirige a login

## Mejoras Futuras

Para aún mayor seguridad, considera:

1. **JWT Tokens con Expiración**
   - Usar tokens JWT en lugar de solo localStorage
   - Validar token en backend

2. **Refresh Tokens**
   - Implementar refresh tokens automáticos
   - Expiración corta (15 minutos)

3. **HTTPS Obligatorio**
   - En producción, usar HTTPS
   - Cookies con flag `secure` y `httpOnly`

4. **Verificación Biométrica**
   - Huella dactilar o reconocimiento facial para logout

5. **Auditoría de Sesión**
   - Registrar todos los logins y logouts
   - Detectar accesos sospechosos

## Contacto y Soporte

Si tienes dudas sobre la implementación de seguridad:
- Revisa los logs de la consola del navegador (F12)
- Verifica que `sessionProtection.js` está siendo cargado
- Confirma que `secureLogout()` está siendo llamado

# TextileFlow ERP

## Sistema Web para la Gestión Administrativa y Comercial de Microempresas Textiles

<div align="center">

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellow)
![License](https://img.shields.io/badge/License-MIT-green)
![Firebase](https://img.shields.io/badge/Firebase-10.13.1-orange)

</div>

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Módulos Implementados](#módulos-implementados)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura y Flujo de Datos](#arquitectura-y-flujo-de-datos)
- [Posibles Mejoras](#posibles-mejoras)
- [Instalación](#instalación)
- [Tecnologías](#tecnologías)
- [Equipo](#equipo)

---

## Descripción General

**TextileFlow ERP** es un sistema web integral diseñado para centralizar y automatizar los procesos administrativos y comerciales de microempresas en el sector textil. La plataforma proporciona una solución modular, escalable y accesible desde cualquier dispositivo con navegador web.

### 🎯 Objetivo Principal

Proporcionar una solución de bajo costo y fácil implementación que permita a las microempresas textiles:
- Gestionar de manera centralizada recursos humanos, inventario y asistencias
- Generar reportes y análisis de datos para tomar decisiones informadas
- Automatizar procesos operativos y reducir errores administrativos
- Escalar su negocio de manera sostenible con infraestructura cloud

### ✨ Características Principales

#### 🔐 Seguridad y Autenticación
- Sistema de autenticación robusto con Firebase Authentication
- Control de acceso basado en roles (RBAC) con dos roles: Admin y Empleado
- Protección de rutas mediante AuthGuard
- Gestión segura de sesiones
- Validación de datos en formularios

#### 📊 Dashboards Especializados
- **Dashboard Admin:** Vista completa del sistema con KPIs y acceso a todos los módulos
- **Dashboard Empleado:** Vista limitada con acceso solo a asistencias y perfil personal
- Información de usuario en tiempo real con sidebar reutilizable
- Navegación intuitiva y responsiva

#### 👥 Gestión Integral de Recursos Humanos
- CRUD completo de empleados
- Campos detallados: documentos, contacto, dirección, rol y contraseña
- Búsqueda y filtrado avanzado en tiempo real
- Validación de unicidad para documentos y emails
- Exportación a PDF y Excel

#### 📦 Gestión de Inventario Avanzada
- CRUD de artículos y categorías
- Sistema flexible de atributos y valores de atributos
- Control de stock dinámico
- Actualizaciones en tiempo real con listeners de Firestore
- Interfaz modular con modales para gestión de datos

#### ⏱️ Control Completo de Asistencias
- Registro de entrada y salida con timestamps automáticos
- Horarios configurables (predeterminados y personalizados)
- Reportes de asistencias, tardanzas y ausencias
- Estadísticas diarias y mensuales
- Historial completo de asistencias por empleado

#### 💰 Gestión de Nómina y Pagos
- Cálculo y registro de pagos a empleados
- Reportes mensuales de nómina
- Exportación de comprobantes de pago en PDF
- Filtrado y búsqueda de pagos

#### 📈 Reportes y Análisis
- Múltiples tipos de reportes (asistencias, tardanzas, ausencias)
- Visualización con gráficos dinámicos (Chart.js)
- Filtrado por fecha y empleado
- Exportación a PDF, Excel e impresión

#### 📱 Interfaz Responsiva
- Diseño adaptable para desktop, tablet y móvil
- Tablas con scroll horizontal para datos amplios
- Menú hamburguesa en dispositivos móviles
- Componentes UI consistentes y accesibles

---

## Módulos Implementados

Actualmente, el sistema cuenta con **múltiples módulos funcionales** que se conectan directamente a Firebase Firestore. Se soportan dos tipos de usuarios: **Administradores** y **Empleados**, cada uno con sus propios dashboards y acceso a módulos específicos.

### 🔐 Módulo de Autenticación y Gestión de Usuarios

- **Sistema de Login Robusto:** Autenticación con email/contraseña integrada con Firebase Authentication.
- **Registro de Usuarios:** Creación de nuevos usuarios con validación de datos.
- **Control de Acceso Basado en Roles (RBAC):** Dos roles principales con permisos granulares.
- **Protección de Rutas:** Implementación de AuthGuard para proteger páginas según el rol del usuario.
- **Manejo de Sesiones:** Persistencia de sesiones con localStorage y recuperación de datos de usuario.
- **Ubicación del Código:** `public/src/auth/` y `public/components/auth-guard.js`.

### 👥 Módulo de Recursos Humanos (RRHH)

- **Gestión Completa de Empleados:** Funcionalidad CRUD (Crear, Leer, Actualizar, Desactivar) para la administración del personal.
- **Información de Empleados:** Campos completos incluyendo tipo de documento, número, nombre, apellido, email, teléfono, dirección, rol y contraseña.
- **Búsqueda y Filtrado Avanzado:** Búsqueda en tiempo real por documento, nombre, email; filtros por tipo de documento, rol y estado.
- **Gestión de Estado:** Activación e inactivación de empleados sin eliminación de registros.
- **Validaciones de Datos:** Verificación de documentos y emails únicos en la base de datos.
- **Exportación de Datos:** Genera reportes de empleados en formatos **PDF** y **Excel**.
- **Interfaz Reutilizable:** Componente de tabla horizontal con scroll para visualizar todos los datos.
- **Ubicación del Código:** `public/pages/admin/rrhh.html`, `public/js/rrhh.js`, `public/css/modules/rrhh.css`.

### 📦 Módulo de Inventario

- **Gestión de Artículos:** Creación y edición de productos con control de stock.
- **Categorización Dinámica:** Soporte completo para categorías, atributos (ej. "Color", "Talla") y valores de atributos (ej. "Rojo", "M").
- **Control de Stock:** Administración y seguimiento del inventario de cada artículo.
- **Actualizaciones en Tiempo Real:** Utiliza listeners de Firestore (`onSnapshot`) para sincronización automática de datos.
- **Modales Dinámicos:** Interfaz intuitiva con modales para agregar/editar categorías, atributos y artículos.
- **Ubicación del Código:** `public/pages/admin/inventario.html`, `public/js/inventario.js`, `public/css/modules/inventario.css`.

### ⏱️ Módulo de Asistencias

- **Registro de Asistencias:** Marcaje de entrada y salida con timestamp automático.
- **Horarios Configurables:** Soporte para horarios por defecto y horarios personalizados por día.
- **Reportes de Asistencia:** Generación de reportes mensuales, tardanzas y ausencias.
- **Estadísticas Diarias:** Resumen de asistencias, tardanzas y ausencias por empleado.
- **Dashboards por Rol:** Vistas diferentes para administradores y empleados.
- **Historial de Asistencias:** Visualización del registro completo de asistencias.
- **Exportación:** Capacidad de exportar reportes a PDF y Excel.
- **Ubicación del Código:** `public/pages/admin/asistencia.html`, `public/js/asistencias.js`, `public/css/modules/asistencia.css`.

### 💰 Módulo de Pagos

- **Gestión de Nómina:** Cálculo y registro de pagos a empleados.
- **Reportes de Pago:** Generación de reportes de pagos mensuales.
- **Filtrado por Empleado:** Visualización de pagos específicos por empleado.
- **Exportación a PDF:** Generación de comprobantes de pago en formato PDF.
- **Ubicación del Código:** `public/pages/admin/pagos.html`, `public/js/pagos.js`.

### 📊 Módulo de Reportes

- **Reportes Multimodales:** Generación de diferentes tipos de reportes sobre asistencias, tardanzas y ausencias.
- **Gráficos Dinámicos:** Visualización con Chart.js para análisis de datos.
- **Filtrado por Fecha y Empleado:** Reportes personalizados según criterios específicos.
- **Exportación Múltiple:** Exportación a PDF, Excel e impresión directa.
- **Ubicación del Código:** `public/pages/admin/reportes.html`, `public/js/reportes.js`.

### 🎛️ Módulo de Configuración

- **Gestión de Horarios:** Configuración de horarios predeterminados y horarios personalizados.
- **Ajustes del Sistema:** Panel de configuración para parámetros generales.
- **Ubicación del Código:** `public/pages/admin/configuracion.html`, `public/js/configuracion.js`.

### 👤 Módulo de Perfil de Usuario

- **Información Personal:** Visualización y edición de datos del usuario actual.
- **Disponible para Ambos Roles:** Dashboards de perfil para administradores y empleados.
- **Ubicación del Código:** `public/pages/admin/profile.html`, `public/pages/employee/profile.html`.

---

## Estructura del Proyecto

La estructura de carpetas se organiza principalmente dentro del directorio `public/`, que contiene todos los archivos estáticos servidos al cliente, divididos entre lógica de aplicación y estilos.

```
/
├── 📄 .firebaserc                # Configuración de proyectos de Firebase
├── 📄 firebase.json              # Configuración de Firebase Hosting
├── 📄 firestore.rules            # Reglas de seguridad de Firestore
├── 📁 public/
│   ├── 📄 index.html             # Punto de entrada principal
│   ├── 📁 assets/                # Recursos estáticos (imágenes, fuentes)
│   ├── 📁 components/            # Componentes reutilizables
│   │   ├── auth-guard.js         # Protección de rutas basada en roles
│   │   └── sidebar.js            # Componente sidebar reutilizable
│   ├── 📁 css/                   # Hojas de estilo
│   │   ├── dashboard.css         # Estilos generales de layout
│   │   ├── auth/
│   │   │   ├── login.css
│   │   │   └── register.css
│   │   ├── common/
│   │   │   ├── navbar.css
│   │   │   └── sidebar.css
│   │   └── modules/              # Estilos específicos por módulo
│   │       ├── rrhh.css
│   │       ├── inventario.css
│   │       ├── asistencia.css
│   │       ├── pagos.css
│   │       ├── reportes.css
│   │       └── admin/
│   │           ├── common.css
│   │           ├── rrhh.css
│   │           ├── asistencia.css
│   │           ├── pagos.css
│   │           ├── profile.css
│   │           ├── dashboard.css
│   │           ├── configuracion.css
│   │           └── reportes.css
│   ├── 📁 js/                    # Lógica de la aplicación
│   │   ├── app.js                # Lógica principal de la aplicación
│   │   ├── rrhh.js               # Lógica del módulo de RRHH
│   │   ├── inventario.js         # Lógica del módulo de Inventario
│   │   ├── asistencias.js        # Lógica del módulo de Asistencias
│   │   ├── employee-asistencias.js
│   │   ├── employee-dashboard.js
│   │   ├── employee-payments.js
│   │   ├── employee-profile.js
│   │   ├── pagos.js              # Lógica del módulo de Pagos
│   │   ├── reportes.js           # Lógica de Reportes
│   │   ├── reportes-attendance.js
│   │   ├── dashboard.js
│   │   ├── admin-profile.js
│   │   ├── configuracion.js
│   │   ├── sidebar.js            # Funciones del sidebar
│   │   ├── schedules.js          # Gestión de horarios
│   │   └── rrhh.js
│   ├── 📁 pages/                 # Archivos HTML de cada página/módulo
│   │   ├── login.html
│   │   ├── admin/
│   │   │   ├── dashboard.html
│   │   │   ├── rrhh.html
│   │   │   ├── inventario.html
│   │   │   ├── asistencia.html
│   │   │   ├── pagos.html
│   │   │   ├── profile.html
│   │   │   ├── reportes.html
│   │   │   └── configuracion.html
│   │   └── employee/
│   │       ├── dashboard.html
│   │       ├── asistencias.html
│   │       ├── payments.html
│   │       └── profile.html
│   └── 📁 src/                   # Código modular y servicios
│       ├── app.js                # Punto de entrada modular
│       ├── 📁 auth/              # Sistema de autenticación
│       │   ├── 📁 login/
│       │   │   └── login.js
│       │   ├── 📁 register/
│       │   │   └── register.js
│       │   ├── 📁 guards/
│       │   │   └── authGuard.js  # Protección de rutas
│       │   └── 📁 services/
│       │       └── authService.js
│       ├── 📁 common/
│       │   └── 📁 sidebar/
│       │       └── (Componente sidebar modular)
│       ├── 📁 config/
│       │   ├── constants.js      # Constantes globales
│       │   ├── environment.js    # Variables de entorno
│       │   └── firebase.js       # Configuración de Firebase
│       ├── 📁 modules/           # Módulos ERP
│       │   ├── 📁 asistencia/
│       │   │   ├── 📁 pages/
│       │   │   ├── 📁 components/
│       │   │   ├── 📁 services/
│       │   │   │   ├── attendanceService.js
│       │   │   │   ├── scheduleService.js
│       │   │   │   └── statsService.js
│       │   │   └── 📁 utils/
│       │   │       └── attendanceUtils.js
│       │   ├── 📁 dashboard/
│       │   ├── 📁 inventario/
│       │   ├── 📁 rrhh/
│       │   ├── 📁 ventas/
│       │   ├── 📁 pagos/
│       │   └── 📁 reportes/
│       ├── 📁 store/             # Estado global
│       │   ├── authStore.js
│       │   └── (Otros stores)
│       └── 📁 utils/             # Utilidades
│           ├── logger.js         # Sistema de logging
│           ├── router.js         # Router personalizado
│           ├── sessionManager.js # Gestión de sesiones
│           └── persistentLogger.js
└── 📄 README.md                  # Este archivo
```

---

## Arquitectura y Flujo de Datos

### Arquitectura de Software

El proyecto sigue una arquitectura de **Aplicación de Múltiples Páginas (MPA)**. Cada página HTML (ej. `rrhh.html`) es un punto de entrada que carga sus propios scripts. Sin embargo, la lógica de estos scripts es **monolítica**, mezclando la manipulación del DOM, la lógica de negocio y el acceso a datos en un solo archivo (ej. `rrhh.js`).

### Estructura de Código por Módulo

A continuación se describe la estructura de código **actual** y la **recomendada (objetivo)**.

#### Estructura Actual (Monolítica)
La lógica está centralizada en un único archivo JavaScript por módulo.
```
/public
├── 📁 pages/admin/
│   └── 📄 rrhh.html       # (Vista) Contiene el HTML y la UI del módulo.
└── 📁 js/
    └── 📄 rrhh.js         # (Controlador + Modelo)
                          # - Manipula el DOM (ej. llena tablas, abre modales).
                          # - Contiene la lógica para guardar/editar/eliminar.
                          # - Realiza las llamadas directas a Firebase Firestore.
```

#### Estructura Recomendada (Modular con Capa de Servicios)
Esta estructura, ya insinuada en el proyecto, separa responsabilidades y es la ideal para la escalabilidad.
```
/public
├── 📁 pages/admin/
│   └── 📄 rrhh.html       # (Vista) UI del módulo.
├── 📁 js/
│   └── 📄 rrhhPage.js     # (Controlador)
                          # - Lógica de la UI.
                          # - Llama al servicio para operaciones de datos.
                          # - No conoce los detalles de implementación de Firebase.
└── 📁 src/modules/rrhh/
    └── 📁 services/
        └── 📄 rrhhService.js # (Modelo/Servicio)
                             # - Encapsula toda la lógica de negocio.
                             # - Contiene todas las querys y llamadas a Firestore.
                             # - Devuelve los datos a la capa de controlador.
```

### Estructura Recomendada (Modular con Capa de Servicios)

Esta estructura separa responsabilidades en tres capas:

```
public/
├── pages/
│   └── module.html          # Vista (Presentación)
├── js/
│   └── modulePage.js        # Controlador (Lógica de UI)
└── src/modules/
    └── module/
        └── services/
            └── moduleService.js  # Servicio (Lógica de negocio + Datos)
```

**Flujo de datos:**
```
Usuario interactúa con UI (module.html)
    ↓
Controlador maneja eventos (modulePage.js)
    ↓
Servicio ejecuta lógica de negocio (moduleService.js)
    ↓
Firebase Firestore (Datos)
```

## Guía de Uso de Módulos

### 📝 Usando el Módulo de RRHH

1. **Acceder:** Dashboard Admin → RRHH
2. **Agregar Empleado:** Click en "Agregar Usuario" → Completar formulario
3. **Buscar:** Usar el campo de búsqueda para filtrar por documento, nombre o email
4. **Filtros:** Filtrar por tipo de documento, rol o estado
5. **Editar:** Click en el botón editar en la fila del empleado
6. **Desactivar:** Click en el botón de estado para activar/desactivar
7. **Eliminar:** Click en el botón eliminar (se pedirá confirmación)
8. **Exportar:** Botones PDF/Excel para generar reportes

**Campos disponibles:**
- Tipo de Documento (CC, CE, NIT, PA)
- Número de Documento
- Nombre, Apellido
- Email (único)
- Teléfono
- Dirección
- Rol (Empleado o Admin)
- Contraseña (para acceso al sistema)

### 📦 Usando el Módulo de Inventario

1. **Acceder:** Dashboard Admin → Inventario
2. **Crear Categoría:** Click en "Agregar Categoría" → Nombre + Descripción
3. **Crear Atributo:** Click en "Agregar Atributo" → Nombre (ej: "Color", "Talla")
4. **Crear Valor:** Click en "Agregar Valor" → Seleccionar atributo → Ingresar valor
5. **Crear Artículo:** Click en "Agregar Artículo" → Seleccionar categoría y atributos
6. **Ver en tiempo real:** La tabla se actualiza automáticamente al agregar datos

**Ejemplo de estructura:**
- **Categoría:** Camisetas
  - **Atributo:** Color → Valores: Rojo, Azul, Verde
  - **Atributo:** Talla → Valores: S, M, L, XL
- **Artículo:** Camiseta Premium
  - Color: Rojo
  - Talla: L
  - Stock: 150

### ⏱️ Usando el Módulo de Asistencias

1. **Acceder (Admin):** Dashboard Admin → Asistencias
2. **Acceder (Empleado):** Dashboard Empleado → Asistencias
3. **Registrar Asistencia:** Click en "Marcar Asistencia" → Sistema registra entrada/salida
4. **Ver Historial:** Visualizar registro de asistencias anteriores
5. **Generar Reportes:** Tab "Reportes" → Seleccionar tipo → Generar
6. **Configurar Horarios:** Admin → Configuración → Establecer horarios predeterminados

**Tipos de Reportes:**
- Asistencias por mes
- Tardanzas
- Ausencias
- Estadísticas por empleado

### 💰 Usando el Módulo de Pagos

1. **Acceder:** Dashboard Admin → Pagos
2. **Crear Pago:** Click en "Nuevo Pago" → Seleccionar empleado y mes
3. **Ingresar Monto:** Registrar el salario/monto a pagar
4. **Marcar Estado:** Cambiar estado a "Pagado" cuando se complete
5. **Exportar Comprobante:** Generar PDF del comprobante de pago

**Información de Pago:**
- Mes y año
- Empleado
- Monto
- Concepto
- Estado (Pagado/Pendiente)
- Fecha de pago

### 📊 Usando el Módulo de Reportes

1. **Acceder:** Dashboard Admin → Reportes
2. **Seleccionar Tipo:** Elegir entre asistencias, tardanzas o ausencias
3. **Filtrar:** Por empleado y período de tiempo
4. **Visualizar:** Se muestra en formato tabla y gráfico
5. **Exportar:** Opción PDF o Excel del reporte generado

---

## Flujo de Datos de Ejemplo: Crear un Nuevo Empleado

1. **Presentación (UI):**
   - Usuario abre `pages/admin/rrhh.html`
   - Click en botón "Agregar Usuario"
   - Se abre modal con formulario
   - Completa datos: nombre, email, documento, rol, etc.

2. **Control (JS):**
   - `js/rrhh.js` captura el evento click
   - Valida que documentoEmail no existan (checkDocumentExists, checkEmailExists)
   - Llama a función `handleSaveClient()`

3. **Lógica de Negocio:**
   - Verifica datos obligatorios
   - Encripta contraseña (recomendado)
   - Prepara objeto de usuario

4. **Persistencia (Firestore):**
   - Escribe en colección `usuario`
   - Firebase asigna UID automático
   - Actualiza timestamp

5. **Respuesta:**
   - Se muestra notificación de éxito
   - Modal se cierra automáticamente
   - Tabla se actualiza mostrando el nuevo empleado

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR DEL USUARIO                  │
├─────────────────────────────────────────────────────────────┤
│ HTML (rrhh.html) → Modal → Formulario                       │
│        ↓                                                      │
│ JavaScript (rrhh.js) → handleSaveClient()                   │
│        ↓                                                      │
│ Validación → checkDocumentExists() / checkEmailExists()     │
│        ↓                                                      │
└────────┼──────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   FIREBASE EN LA NUBE                        │
├─────────────────────────────────────────────────────────────┤
│ addDoc(collection(db, "usuario"), usuarioData)              │
│        ↓                                                      │
│ Firestore genera UID y crea documento                        │
│        ↓                                                      │
│ Listeners (onSnapshot) notifican cambios                    │
│        ↓                                                      │
└────────┼──────────────────────────────────────────────────────┘
         │
         ↓
         ┌────────────────────────────┐
         │ Tabla se actualiza en UI   │
         │ Usuario ve nuevo empleado  │
         └────────────────────────────┘
```

---

## Preguntas Frecuentes (FAQ)

**P: ¿Cuáles son las credenciales de prueba?**
A: Actualmente, debes crear usuarios a través del módulo de RRHH o Firebase Console.

**P: ¿Cómo cambio la contraseña de un usuario?**
A: El admin puede cambiar la contraseña desde el módulo RRHH al editar un empleado.

**P: ¿Se puede usar offline?**
A: No en la versión actual, pero es una mejora planeada.

**P: ¿Qué pasa si se pierde la conexión a Internet?**
A: Los datos no guardados se pierden. Se recomienda usar Firestore local sync en versiones futuras.

**P: ¿Cómo hago backup de los datos?**
A: Usa Firebase Console → Firestore → Exportar colecciones (requiere plan Blaze).

**P: ¿Puedo integrar mi propio backend?**
A: Sí, modifica los servicios en `src/modules/*/services/` para conectar a tu API.

**P: ¿Cuál es el máximo número de empleados soportado?**
A: Firestore soporta millones de registros. El límite dependerá del plan de Firebase.

**P: ¿Cómo agrego un nuevo módulo?**
A: Crea una carpeta en `src/modules/`, sigue la estructura (pages, services, utils), crea el HTML en `pages/`, el CSS en `css/modules/` y registra en la navegación.

---

## Debugging y Troubleshooting

### Problema: Página en blanco después del login
**Solución:** 
1. Abre la consola del navegador (F12)
2. Busca errores de Firebase
3. Verifica que Firebase esté inicializado correctamente
4. Comprueba que el archivo `public/src/config/firebase.js` tenga las credenciales correctas

### Problema: No se pueden crear empleados
**Solución:**
1. Verifica permisos en Firestore Rules
2. Asegúrate de tener permiso de escritura en colección `usuario`
3. Comprueba el estado de Firebase en Firebase Console

### Problema: Las tablas no se actualizan
**Solución:**
1. Verifica que los listeners de Firestore estén activos
2. Revisa la consola para errores de `onSnapshot`
3. Recarga la página (F5) para sincronizar datos

### Problema: Exportación a PDF no funciona
**Solución:**
1. Verifica que jsPDF esté incluido en el HTML
2. Comprueba que haya datos en la tabla
3. Revisa la consola para errores JavaScript

---



---

## Estado Actual y Posibles Mejoras

### ✅ Completado

- Autenticación con Firebase Authentication
- Gestión de roles (Admin y Empleado)
- Módulo RRHH con CRUD de empleados
- Módulo de Inventario con categorías y atributos
- Módulo de Asistencias con registro y reportes
- Módulo de Pagos con cálculo de nómina
- Módulo de Reportes con gráficos
- Módulo de Configuración de horarios
- Exportación a PDF y Excel
- Interfaz responsiva con scroll horizontal
- Componente sidebar reutilizable

### 🔄 En Progreso

- Migración a arquitectura modular completada parcialmente
- Integración de servicios en la carpeta `src/modules/`
- Optimización de Firestore con listeners

### 🚀 Mejoras Recomendadas para Futuras Versiones

#### 1. Refactorización a Arquitectura Completamente Modular
- **Actualidad:** Los módulos mezclan lógica de UI, negocio y datos
- **Mejora:** Separar completamente en capas (Presentación → Controlador → Servicio → Datos)
- **Beneficio:** Código más mantenible, testeable y escalable

#### 2. Sistema de Logging Centralizado
- **Implementar:** Logger unificado para todo el sistema
- **Ubicación:** `public/src/utils/logger.js` (ya existe estructura base)
- **Beneficio:** Debugging más fácil y auditoría de operaciones

#### 3. Validaciones Exhaustivas
- **Mejorar:** Sistema de validación de formularios con reglas reutilizables
- **Estructura:** `public/src/utils/validators.js`
- **Beneficio:** Reducción de errores de datos y mejor UX

#### 4. Optimización de Firestore
- **Problema:** Posibles N+1 queries en algunos módulos
- **Solución:** Desnormalizar datos (guardar nombres junto con IDs)
- **Beneficio:** Reducción de lecturas y costos de Firestore

#### 5. Implementar Transacciones
- **Usar:** Transacciones de Firestore para operaciones atómicas
- **Ubicación:** Servicios de módulos críticos (RRHH, Pagos, Inventario)
- **Beneficio:** Garantizar consistencia de datos

#### 6. Testing Automatizado
- **Implementar:** Tests unitarios para servicios
- **Framework:** Jest o Vitest
- **Cobertura:** Mínimo 80% para lógica de negocio
- **Beneficio:** Detección temprana de bugs y confianza en cambios

#### 7. Gestión de Errores Mejorada
- **Implementar:** Sistema de notificaciones de error consistente
- **Ubicación:** `public/src/store/notificationStore.js`
- **Beneficio:** Mejor feedback al usuario

#### 8. Internacionalización (i18n)
- **Soportar:** Múltiples idiomas (español, inglés, etc.)
- **Framework:** i18next o similar
- **Beneficio:** Alcance global de la aplicación

#### 9. Modo Offline
- **Implementar:** Service Workers y sincronización automática
- **Beneficio:** Acceso a datos cuando no hay conexión

#### 10. Módulos Adicionales Planeados
- **Ventas:** Gestión de pedidos y clientes
- **Producción:** Órdenes de producción y seguimiento
- **Compras:** Gestión de proveedores y compras
- **Reportes Avanzados:** Análisis predictivo y dashboards inteligentes

---

## Tecnologías y Stack

| Tecnología | Propósito | Versión |
|------------|-----------|---------|
| **HTML5** | Estructura semántica | ES5+ |
| **CSS3** | Diseño y estilos responsivos | Moderno |
| **JavaScript ES6+** | Lógica de la aplicación | ES2020+ |
| **Firebase** | Backend como servicio (BaaS) | v10.13.1+ |
| **Firebase Auth** | Autenticación y gestión de usuarios | Integrado |
| **Firestore** | Base de datos NoSQL en tiempo real | Integrado |
| **Firebase Storage** | Almacenamiento de archivos | Integrado |
| **jsPDF** | Exportación de reportes a PDF | v2.5.1+ |
| **SheetJS** | Exportación de datos a Excel | Integrado |
| **Chart.js** | Gráficos interactivos | v3.9.1+ |
| **Font Awesome** | Iconografía | v6.0.0+ |

## Requisitos Previos

Para ejecutar este proyecto necesitas:
- **Node.js** v14 o superior
- **npm** o **yarn** para gestión de paquetes
- **Firebase CLI** para desarrollo local
- Un **navegador moderno** (Chrome, Firefox, Safari, Edge)
- Acceso a **Firebase Console** para configurar el proyecto

## Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Danuord/SISE_proyectoERMTextil.git
cd SISE_proyectoERMTextil
```

### 2. Instalar Firebase CLI (si no está instalado)
```bash
npm install -g firebase-tools
```

### 3. Configurar Firebase
```bash
# Inicializar Firebase en el proyecto
firebase init

# Seleccionar los servicios necesarios:
# - Authentication
# - Firestore Database
# - Firebase Storage
# - Hosting
```

### 4. Crear Archivo de Configuración
Crear un archivo `public/src/config/firebase.js` con las credenciales de tu proyecto:
```javascript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/...';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "xxx",
  appId: "1:xxx:web:xxx"
};

export const app = initializeApp(firebaseConfig);
```

### 5. Iniciar el Servidor Local
```bash
# Opción 1: Usar Firebase Emulators (recomendado para desarrollo)
firebase emulators:start

# Opción 2: Usar servidor local simple
python -m http.server 8000

# La aplicación estará disponible en:
# - Firebase: http://localhost:5000
# - Python: http://localhost:8000
```

### 6. Acceder a la Aplicación
- **URL:** `http://localhost:5000` (o `http://localhost:8000`)
- **Usuario Admin:** admin@example.com / password
- **Usuario Empleado:** employee@example.com / password
- *(Estos datos están en el archivo de inicialización de Firestore)*

## Estructura de Datos en Firestore

### Colecciones Principales

#### `usuario` - Gestión de usuarios
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  tipoDocumento: string,
  numeroDocumento: string,
  nombre: string,
  apellido: string,
  telefono: string,
  direccion: string,
  rol: "admin" | "employee",
  estado: "activo" | "inactivo",
  fechaCreacion: timestamp,
  fotoPerfil: string (URL de Storage)
}
```

#### `asistencia` - Registros de asistencias
```javascript
{
  id: string,
  userId: string,
  fecha: string (YYYY-MM-DD),
  horaEntrada: string (HH:MM),
  horaSalida: string (HH:MM),
  estado: "presente" | "ausente" | "permiso",
  tardanza: number (minutos),
  timestamp: timestamp
}
```

#### `articulo` - Inventario
```javascript
{
  id: string,
  nombre: string,
  descripcion: string,
  categoriaId: string,
  stock: number,
  precio: number,
  atributos: {
    atributoId: string, // valor del atributo
    ...
  },
  fechaCreacion: timestamp
}
```

#### `pago` - Registros de pagos
```javascript
{
  id: string,
  userId: string,
  mes: string (YYYY-MM),
  monto: number,
  concepto: string,
  estado: "pagado" | "pendiente",
  fechaPago: timestamp
}
```

---

## Cómo Contribuir

Si deseas contribuir al proyecto, sigue estos pasos:

1. **Fork** el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios y haz commit (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Código

- Usa nombres descriptivos en inglés para funciones y variables
- Comentarios en español para explicaciones complejas
- Sigue la estructura modular propuesta
- Escribe funciones pequeñas y reutilizables
- Documenta las funciones principales con comentarios JSDoc

## Equipo de Desarrollo

| Nombre | Rol | Email |
|--------|-----|-------|
| **Daniel Eduardo Olarte Ordaya** | Frontend Lead & Project Manager | daniel.olarte@example.com |
| **Karina Arancel Castro** | UI/UX Designer & Frontend Developer | karina.arancel@example.com |
| **Homero Percy Quispe Coaquira** | Backend Developer & DevOps | homero.quispe@example.com |
| **Leonardo David Evangelista Macedo** | QA & Deployment Specialist | leonardo.evangelista@example.com |

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## Soporte

Para soporte, contacta con:
- **Issues en GitHub:** https://github.com/Danuord/SISE_proyectoERMTextil/issues
- **Email:** support@textileflow.com
- **Documentación:** Ver `ESTRUCTURA_PROYECTO.md` y `ARQUITECTURA.md`

## Roadmap Futuro

### v1.1.0 (Q1 2026)
- [ ] Módulo de Ventas
- [ ] Sistema de notificaciones por email
- [ ] Mejora de reportes con más filtros
- [ ] Soporte para múltiples almacenes

### v1.2.0 (Q2 2026)
- [ ] Módulo de Producción
- [ ] Integración con APIs externas
- [ ] Sistema de respaldos automáticos
- [ ] Análisis predictivo básico

### v2.0.0 (Q4 2026)
- [ ] Aplicación móvil (React Native/Flutter)
- [ ] Dashboard avanzado con BI
- [ ] Sistema de automatización de procesos
- [ ] Integración con sistemas externos (contabilidad, etc.)

## Reconocimientos

Este proyecto fue desarrollado como parte del proyecto de titulación en **SISE** con el objetivo de proporcionar una solución ERP accesible para microempresas textiles.

---

<div align="center">

### 🚀 TextileFlow ERP v1.0.0

**Hecho con ❤️ por el equipo de TextileFlow**

Transformando la gestión textil con tecnología en la nube

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Status](https://img.shields.io/badge/Status-Stable-green)
![License](https://img.shields.io/badge/License-MIT-green)
![Firebase](https://img.shields.io/badge/Firebase-10.13.1-orange)

[⬆ Ir al inicio](#textileflow-erp)

</div>
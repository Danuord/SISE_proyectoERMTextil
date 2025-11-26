# TextileFlow ERP

## Sistema Web para la Gestión Administrativa y Comercial de Microempresas Textiles

<div align="center">

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellow)
![License](https://img.shields.io/badge/License-MIT-green)
![Firebase](https://img.shields.io/badge/Firebase-10.13.1-orange)

[Características](#características) • [Instalación](#instalación) • [Tecnologías](#tecnologías) • [Equipo](#-equipo) 

</div>

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características](#características)
- [Alcance del Proyecto](#alcance-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Instalación](#instalación)
- [Cómo Usar](#cómo-usar)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Equipo](#equipo)

---

## Descripción General

**TextileFlow ERP** es una solución propuesta que consiste en el desarrollo de un sistema web, basado en tecnologías modernas y de bajo costo que permitan una implementación rápida y sostenible. El sistema integrará módulos para la gestión de personal, inventario y ventas, así como un mecanismo de notificaciones automáticas mediante WhatsApp o correo electrónico. La plataforma será responsiva, permitiendo su uso desde computadoras y dispositivos móviles, lo cual facilita la accesibilidad para los administradores y operarios de la microempresa. Además, se incorporarán funciones de exportación de reportes en formatos como Excel y PDF, garantizando compatibilidad con herramientas ya utilizadas en el entorno empresarial peruano. 

### Objetivo Principal

Centralizar y automatizar los procesos empresariales clave del sector textil, permitiendo:
- ✅ Optimización de inventario de materias primas y productos terminados
- ✅ Planificación y control de producción
- ✅ Gestión eficiente de compras y proveedores
- ✅ Seguimiento de ventas y análisis de ingresos
- ✅ Administración de recursos humanos integrada
- ✅ Toma de decisiones basada en datos y reportes analíticos

---

## Características

### Autenticación y Seguridad

- **Sistema de Autenticación Robusto**
  - Registro de usuarios con validación de datos
  - Login con email/contraseña
  - Recuperación de contraseña
  - Autenticación con Google (futura integración)
  - Sesiones persistentes con localStorage
  - Protección de rutas con AuthGuard

- **Control de Acceso Basado en Roles (RBAC)**
  - 5 roles predefinidos: Admin, Manager, Supervisor, Employee, Viewer
  - Permisos granulares por rol
  - Restricción de acceso a módulos y funcionalidades

### Dashboard Interactivo

- **Panel de Control Principal**
  - 4 tarjetas de estadísticas en tiempo real
  - 3 gráficos interactivos con análisis visual
  - 2 tablas de datos con información crítica
  - Feed de actividad reciente
  - Filtros por período (Hoy, Semana, Mes, Año)
  - Funciones de actualizar y exportar

- **KPIs Monitoreados**
  - Stock total de SKUs
  - Materiales con baja existencia
  - Órdenes en producción
  - Ingresos del día

### Módulo de Inventario

- Gestión completa de SKUs
- Búsqueda y filtrado avanzado
- Categorización de productos
- Alertas automáticas de bajo stock
- Importar/Exportar en Excel
- Historial de cambios y trazabilidad

### Módulo de Producción

- Gestión de órdenes de producción
- Asignación de recursos
- Seguimiento del progreso
- Estados de producción
- Reportes de eficiencia

### Módulo de Compras

- Órdenes de compra inteligentes
- Gestión de proveedores
- Seguimiento de entregas
- Análisis de costos
- Historial de transacciones

### Módulo de Ventas

- Gestión de órdenes de venta
- Seguimiento de clientes
- Reportes de ventas y análisis
- Control de ingresos
- Análisis de tendencias

### Módulo de Materia Prima

- Control centralizado de inventario
- Alertas automáticas de reorden
- Historial de consumo
- Trazabilidad completa
- Gestión de proveedores

### Módulo de RRHH

- Gestión integral de empleados
- Control de asistencia
- Administración de nómina
- Evaluaciones de desempeño
- Beneficios y capacitación

### Interfaz Responsiva

- Diseño adaptativo para todos los dispositivos
- Soporte para Desktop, Tablet y Mobile
- Experiencia de usuario optimizada
- Navegación intuitiva con sidebar colapsible

---

## Alcance del Proyecto

### Fase 1: Frontend 

#### Implementado
- ✅ Sistema de autenticación completo (Login/Registro)
- ✅ Dashboard interactivo con datos mock
- ✅ Componentes reutilizables
- ✅ Validación de formularios
- ✅ Diseño responsivo
- ✅ Integración con Firebase Authentication
- ✅ Gestión de estado con patrón Observer
- ✅ Sistema de logging persistente
- ✅ 3,500+ líneas de código (HTML, CSS, JavaScript)
- ✅ Documentación completa

#### Estadísticas
| Aspecto | Cantidad |
|---------|----------|
| Páginas | 3 (Login, Registro, Dashboard) |
| Componentes | 6 (Navbar, Sidebar, StatCard, DataTable, Chart, ActivityList) |
| Líneas CSS | 1,650+ |
| Líneas JavaScript | 1,320+ |
| Líneas HTML | 530+ |
| **Total Código** | **3,500+** |

### Fase 2: Módulos Adicionales
- [ ] Implementar módulo de Inventario
- [ ] Implementar módulo de Producción
- [ ] Implementar módulo de Compras
- [ ] Implementar módulo de Ventas
- [ ] Implementar módulo de Materia Prima
- [ ] Implementar módulo de RRHH

### Fase 3: Integración con Firestore Real
- [ ] Reemplazar datos mock con queries reales
- [ ] Implementar CRUD completo en Firestore
- [ ] Validación en servidor
- [ ] Optimización de queries

### Fase 4: Funcionalidades Avanzadas 
- [ ] Reportes en PDF
- [ ] Gráficos avanzados (Chart.js)
- [ ] Sincronización en tiempo real
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Búsqueda avanzada
- [ ] Análisis predictivo
- [ ] Integraciones externas (APIs)

---
## Tecnologías

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **HTML5** | - | Estructura semántica |
| **CSS3** | - | Diseño responsivo y animaciones |
| **JavaScript ES6+** | - | Lógica de aplicación |
| **Font Awesome** | 6.0.0 | Iconografía |

### Backend & Servicios

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **Firebase** | 10.13.1 | Plataforma backend |
| **Firebase Auth** | - | Autenticación de usuarios |
| **Firestore** | - | Base de datos NoSQL |
| **Firebase Storage** | - | Almacenamiento de archivos |
| **Firebase Analytics** | - | Analítica de eventos |

### Desarrollo & Herramientas

| Herramienta | Propósito |
|------------|----------|
| **Firebase Emulator Suite** | Desarrollo local sin internet |
| **Git** | Control de versiones |
| **VS Code** | Editor de código |
| **Browser DevTools** | Debugging y testing |

### Patrones Arquitectónicos

| Patrón | Descripción |
|--------|------------|
| **SPA** | Single Page Application - Carga dinámica |
| **Component Pattern** | Componentes reutilizables |
| **Service Layer** | Separación de lógica de negocio |
| **Observer Pattern** | Gestión reactiva de estado |
| **Guard Pattern** | Protección de rutas |

---

## Instalación

### 1. Clonar el Repositorio

```bash
# Clona el repositorio
git clone https://github.com/Danuord/SISE_proyectoERMTextil.git

# Navega a la carpeta del proyecto
cd SISE_proyectoERMTextil
```

### 2. Instalar Dependencias

```bash
# Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Verificar instalación
firebase --version
```

### 3. Configurar Firebase (Opcional)

El proyecto ya viene configurado, pero si necesitas reconfigurar:

```bash
# Login en Firebase
firebase login

# Inicializar Firebase
firebase init
```

### 4. Iniciar Firebase Emulators

```bash
# Inicia los emuladores locales (Auth, Firestore, Hosting)
firebase emulators:start

# Salida esperada:
# ✔ Hub started at http://localhost:4400
# ✔ Auth emulator started at http://localhost:9099
# ✔ Firestore emulator started at http://localhost:8080
# ✔ Hosting emulator started at http://localhost:5000
```

### 5. Acceder a la Aplicación

Abre tu navegador y accede a:

```
http://localhost:5000
```

---

## Cómo Usar

### Primer Acceso

#### Crear Cuenta Nueva

```bash
1. Ir a http://localhost:5000/pages/register.html
2. Llenar formulario con datos válidos
3. Aceptar términos y condiciones
4. Hacer clic en "Crear Cuenta"
5. Serás redirigido al dashboard
```

### Navegación Principal

```
┌─────────────────────────────────────────────┐
│ Dashboard (Inicio)                          │
├─────────────────────────────────────────────┤
│ Sidebar Menu:                               │
│ • 📊 Inicio (Dashboard)                     │
│ • 📦 Inventario (Próximamente)              │
│ • 🏭 Producción (Próximamente)              │
│ • 🛒 Compras (Próximamente)                 │
│ • 💰 Ventas (Próximamente)                  │
│ • 📦 Materia Prima (Próximamente)           │
│ • 👥 RRHH (Próximamente)                    │
│ • ⚙️ Configuración (Próximamente)           │
└─────────────────────────────────────────────┘
```

### Funcionalidades Principales

#### En el Dashboard

```javascript
- Tarjetas con KPIs principales
- Gráficos de tendencias
- Tablas de datos recientes

- Selector de período (Hoy, Semana, Mes, Año)
- Botón "Actualizar" para recargar datos
- Búsqueda en tablas

- Botón "Exportar" descarga CSV
- Formato compatible con Excel

- Ver información en sidebar
- Actualizar datos de sesión
- Logout seguro
```
---

## Estructura del Proyecto

### Jerarquía de Carpetas

```
SISE_proyectoERMTextil/
│
├── 📄 README.md (Este archivo)
├── 📄 firebase.json              # Configuración Firebase
├── 📄 firestore.rules            # Reglas de seguridad Firestore
├── 📄 firestore.indexes.json     # Índices Firestore
│
├── 📁 public/                    # Archivos del navegador
│   ├── 📄 index.html             # Página inicial
│   ├── 📄 init.html              # Inicializador (crear cuentas)
│   ├── 📄 404.html               # Página error
│   │
│   ├── 📁 pages/                 # Páginas principales
│   │   ├── login.html            # Login
│   │   ├── register.html         # Registro
│   │   └── dashboard.html        # Dashboard
│   │
│   ├── 📁 css/                   # Estilos
│   │   ├── dashboard.css
│   │   ├── auth/
│   │   │   ├── login.css
│   │   │   └── register.css
│   │   └── common/
│   │       ├── navbar.css
│   │       └── sidebar.css
│   │
│   ├── 📁 src/                   # Código JavaScript
│   │   ├── app.js                # Punto de entrada
│   │   │
│   │   ├── 📁 auth/              # Autenticación
│   │   │   ├── login/login.js
│   │   │   ├── register/register.js
│   │   │   ├── guards/authGuard.js
│   │   │   └── services/authService.js
│   │   │
│   │   ├── 📁 common/            # Componentes compartidos
│   │   │   ├── navbar/navbar.js
│   │   │   └── sidebar/sidebar.js
│   │   │
│   │   ├── 📁 modules/           # Módulos ERP
│   │   │   ├── dashboard/
│   │   │   ├── inventario/
│   │   │   ├── produccion/
│   │   │   ├── compras/
│   │   │   ├── ventas/
│   │   │   ├── materiaprima/
│   │   │   └── rrhh/
│   │   │
│   │   ├── 📁 config/            # Configuración
│   │   │   ├── firebase.js
│   │   │   ├── constants.js
│   │   │   └── environment.js
│   │   │
│   │   ├── 📁 store/             # Estado global
│   │   │   └── authStore.js
│   │   │
│   │   └── 📁 utils/             # Utilidades
│   │       ├── router.js
│   │       ├── logger.js
│   │       └── persistentLogger.js
│   │
│   ├── 📁 assets/                # Recursos
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   └── 📁 js/
│       └── app.js
│
└── 📁 Documentation/             # Documentación adicional
    ├── ARQUITECTURA.md
    ├── ESTRUCTURA_PROYECTO.md
    ├── GUIA_RAPIDA_FRONTEND.md
    ├── INDICE_MAESTRO.md
    └── ... (más archivos)
```

---

## Arquitectura

### Diagrama General

```
┌─────────────────────────────────────────────┐
│         NAVEGADOR (Frontend)                │
│  ┌───────────────────────────────────────┐  │
│  │   HTML (Estructura)                   │  │
│  │   CSS (Diseño)                        │  │
│  │   JavaScript (Lógica)                 │  │
│  └───────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
    ┌─────────┐         ┌──────────────┐
    │Firebase │         │localStorage  │
    │Services │         │(Sesiones)    │
    │         │         │              │
    │• Auth   │         │• User data   │
    │• Firestore          │• Tokens    │
    │• Storage│         │• Preferences│
    └─────────┘         └──────────────┘
```

### Flujo de Datos

```
Usuario
  ↓
Formulario
  ↓
Validación
  ↓
Service (AuthService)
  ↓
Firebase
  ↓
Store (authStore)
  ↓
Componentes (re-render)
  ↓
Página actualizada
```

### Capas de Arquitectura

```
┌──────────────────────────────────┐
│   PRESENTATION LAYER (UI)        │  HTML + CSS + JS
├──────────────────────────────────┤
│   COMPONENT LAYER                │  Navbar, Dashboard, etc.
├──────────────────────────────────┤
│   BUSINESS LOGIC LAYER           │  Services, Guards
├──────────────────────────────────┤
│   STATE MANAGEMENT LAYER         │  authStore, Observable
├──────────────────────────────────┤
│   DATA ACCESS LAYER              │  Firebase SDK
├──────────────────────────────────┤
│   EXTERNAL SERVICES              │  Firebase, Google
└──────────────────────────────────┘
```

### Roles y Permisos

```javascript
ADMIN (Total Access)
├── create ✓
├── read ✓
├── update ✓
├── delete ✓
├── export ✓
└── admin access ✓

MANAGER (Supervisión)
├── create ✓
├── read ✓
├── update ✓
├── export ✓
└── delete ✗

SUPERVISOR (Operativo)
├── read ✓
├── update ✓
├── export ✓
├── create ✗
└── delete ✗

EMPLOYEE (Básico)
├── read ✓
├── create ✓
├── update ✗
├── delete ✗
└── export ✗

VIEWER (Solo lectura)
├── read ✓
└── todo else ✗
```

## Desarrollo

### Estructura de Código

Cada módulo sigue este patrón:

```
modules/
└── nombre-modulo/
    ├── pages/
    │   └── nombrePage.js      # Lógica principal
    ├── components/
    │   ├── component1.js      # Componentes reutilizables
    │   └── component2.js
    └── services/
        └── nombreService.js    # Lógica de negocio
```

### Cómo Agregar un Nuevo Módulo

```bash
# 1. Crear estructura de carpetas
mkdir -p public/src/modules/mi-modulo/{pages,components,services}

# 2. Crear archivos
touch public/pages/mi-modulo.html
touch public/css/modules/mi-modulo.css
touch public/src/modules/mi-modulo/pages/miModuloPage.js

# 3. Registrar en router
# Editar: public/src/utils/router.js
```

## Próximas Mejoras

### Corto Plazo
- [ ] Completar módulos adicionales
- [ ] Integración Firestore real
- [ ] Más validaciones
- [ ] Tests unitarios

### Mediano Plazo
- [ ] Reportes en PDF
- [ ] Gráficos avanzados
- [ ] Búsqueda avanzada
- [ ] Modo offline

### Largo Plazo
- [ ] Análisis predictivo
- [ ] Integraciones externas
- [ ] API REST
- [ ] App móvil nativa

## Equipo

### Desarrolladores del Proyecto

| Nombre | Rol | Responsabilidades |
|--------|-----|-------------------|
| **Daniel Eduardo Olarte Ordaya** | Frontend Lead | Arquitectura, componentes principales |
| **Karina Arancel Castro** | UI/UX Developer | Diseño responsivo, estilos |
| **Homero Percy Quispe Coaquira** | Backend Developer | Firebase, base de datos |
| **Leonardo David Evangelista Macedo** | Integración, deployment |

<div align="center">

### Hecho con ❤️ por el equipo de TextileFlow

**TextileFlow ERP v1.0.0** | Noviembre 2025

[⬆ Ir al inicio](#-textileflow-erp)

</div>

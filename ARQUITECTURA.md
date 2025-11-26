# Arquitectura - TextileFlow ERP

## Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (FRONTEND)                             │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      PUBLIC/INDEX.HTML                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │ │
│  │  │   NAVBAR        │  │    SIDEBAR      │  │    HEADER       │  │ │
│  │  │                 │  │                 │  │                 │  │ │
│  │  │ - Menú User     │  │ - Nav Links     │  │ - Breadcrumb    │  │ │
│  │  │ - Notificaciones│  │ - Módulos       │  │ - Info Usuario  │  │ │
│  │  │ - Logout        │  │ - Colapsar      │  │                 │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │                    CONTENT AREA                               │ │ │
│  │  │                                                               │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │ │
│  │  │  │ Dashboard    │  │ Inventario   │  │ Producción   │ ...  │ │ │
│  │  │  │              │  │              │  │              │      │ │ │
│  │  │  │ - Cards      │  │ - Tabla SKU  │  │ - Órdenes    │      │ │ │
│  │  │  │ - Gráficos   │  │ - Filtros    │  │ - Formulario │      │ │ │
│  │  │  │ - KPIs       │  │ - Crear/Edit │  │ - Estado     │      │ │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │ │
│  │  │                                                               │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │                       FOOTER                                 │ │ │
│  │  │  Versión 1.0.0 © 2025 TextileFlow                           │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                     ↓
                    ┌────────────────────────────────┐
                    │    APPLICATION LAYER           │
                    │                                │
                    │  SRC/APP.JS                    │
                    │  - Router                      │
                    │  - Componentes                 │
                    │  - Estado                      │
                    └────────────────────────────────┘
                                     ↓
        ┌────────────────────────────────────────────────────────┐
        │            CORE SERVICES & STATE MANAGEMENT            │
        │                                                         │
        │  ┌──────────────────┐  ┌──────────────────────────┐   │
        │  │  AUTH SERVICE    │  │   STORE (STATE)          │   │
        │  │                  │  │                          │   │
        │  │ - Login          │  │ - AuthStore              │   │
        │  │ - Register       │  │ - UserStore              │   │
        │  │ - Logout         │  │ - NotificationStore      │   │
        │  │ - ResetPassword  │  │                          │   │
        │  │ - Session Mgmt   │  │ Observer Pattern         │   │
        │  └──────────────────┘  └──────────────────────────┘   │
        │                                                         │
        │  ┌──────────────────┐  ┌──────────────────────────┐   │
        │  │  AUTH GUARD      │  │  MODULE SERVICES         │   │
        │  │                  │  │                          │   │
        │  │ - canActivate()  │  │ - InventarioService      │   │
        │  │ - hasRole()      │  │ - ComprasService         │   │
        │  │ - hasPermission()│  │ - VentasService          │   │
        │  │                  │  │ - ProduccionService      │   │
        │  └──────────────────┘  └──────────────────────────┘   │
        │                                                         │
        └────────────────────────────────────────────────────────┘
                                     ↓
                    ┌────────────────────────────────┐
                    │    UTILITIES & CONFIG          │
                    │                                │
                    │ - Router (SPA)                 │
                    │ - Logger                       │
                    │ - Validators                   │
                    │ - Formatters                   │
                    │ - Constants                    │
                    │ - Environment                  │
                    └────────────────────────────────┘
                                     ↓
        ┌────────────────────────────────────────────────────────┐
        │         FIREBASE SERVICES (Backend)                    │
        │                                                         │
        │  ┌──────────────┐  ┌──────────────────────────────┐   │
        │  │ FIREBASE AUTH│  │     FIRESTORE DATABASE      │   │
        │  │              │  │                              │   │
        │  │ - Authn.     │  │ Collections:                │   │
        │  │ - JWT        │  │ - users                     │   │
        │  │ - Sessions   │  │ - inventory                 │   │
        │  │              │  │ - purchases                 │   │
        │  │              │  │ - sales                     │   │
        │  │              │  │ - productionOrders          │   │
        │  └──────────────┘  └──────────────────────────────┘   │
        │                                                         │
        │  ┌──────────────┐  ┌──────────────────────────────┐   │
        │  │ FIREBASE     │  │  FIREBASE STORAGE           │   │
        │  │ ANALYTICS    │  │                              │   │
        │  │              │  │ - Documentos                │   │
        │  │ - Eventos    │  │ - Imágenes                  │   │
        │  │ - Tracking   │  │ - Reportes                  │   │
        │  └──────────────┘  └──────────────────────────────┘   │
        │                                                         │
        └────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### 1. Autenticación
```
┌─────────────┐
│   LOGIN     │
│   FORM      │
└──────┬──────┘
       │
       ↓
┌────────────────────┐
│  AuthService.login │  → ValidationService
│                    │
└──────┬─────────────┘
       │
       ↓
┌────────────────────────────────┐
│  Firebase.signInWithEmail()     │
│                                │
└──────┬─────────────────────────┘
       │
       ↓ Success
┌────────────────────────────────┐
│  Firestore.users/{uid}         │
│  - Role                        │
│  - Permissions                 │
└──────┬─────────────────────────┘
       │
       ↓
┌────────────────────────────────┐
│  AuthStore.setUser()           │
│  - CurrentUser                 │
│  - UserRole                    │
│  - Permissions                 │
└──────┬─────────────────────────┘
       │
       ↓
┌────────────────────────────────┐
│  localStorage.saveSession()    │
│  - Token                       │
│  - User Data                   │
└──────┬─────────────────────────┘
       │
       ↓
┌─────────────────────────┐
│  router.navigate()      │
│  → /dashboard           │
└─────────────────────────┘
```

### 2. Acceso a Módulo
```
┌──────────────────┐
│ Click Link       │
│ /inventario      │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ AuthGuard.canActivate()
│                  │
│ - Autenticado?   │
│ - Rol correcto?  │
│ - Permiso OK?    │
└────────┬─────────┘
         │
    ┌────┴────┐
    │          │
    ↓          ↓
  ALLOW      DENY
    │          │
    ↓          ↓
 Cargar    Redirect
 Módulo    /dashboard
    │
    ↓
┌────────────────────────────┐
│ InventarioService.getData()│
│                            │
└────────┬───────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Firestore.inventory.query()  │
│                              │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Component.render(data)       │
│ - Tabla                      │
│ - Filtros                    │
│ - Acciones                   │
└──────────────────────────────┘
```

---

## Estructura de Componentes

### Jerarquía de Componentes
```
App
├── Navbar
│   ├── Logo
│   ├── NavMenu
│   ├── NotificationsIcon
│   └── UserMenu
│       └── UserDropdown
│
├── Sidebar
│   ├── SidebarToggle
│   ├── NavSection (multiple)
│   │   └── NavLink (multiple)
│   └── UserInfo
│
├── Header
│   ├── PageTitle
│   ├── Breadcrumb
│   └── Actions
│
├── ContentArea
│   ├── Dashboard (si path = /dashboard)
│   │   ├── StatsCard (multiple)
│   │   ├── Chart
│   │   └── RecentActivity
│   │
│   ├── Inventario (si path = /inventario)
│   │   ├── FilterBar
│   │   ├── Table
│   │   └── Pagination
│   │
│   ├── [Otros módulos...]
│
└── Footer
    ├── Copyright
    ├── Links
    └── Version
```

---

## Flujo de Permisos

```
┌─────────────────────────────────────────────────────────┐
│                     USUARIO ADMIN                        │
│                                                          │
│ Permisos: [create, read, update, delete, export]       │
│                                                          │
│ ├─ Puede crear registros                               │
│ ├─ Puede leer/ver registros                            │
│ ├─ Puede actualizar registros                          │
│ ├─ Puede eliminar registros                            │
│ ├─ Puede exportar datos                                │
│ └─ Acceso a Configuración del Sistema                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   USUARIO MANAGER                        │
│                                                          │
│ Permisos: [create, read, update, export]               │
│                                                          │
│ ├─ Puede crear registros                               │
│ ├─ Puede leer/ver registros                            │
│ ├─ Puede actualizar registros                          │
│ ├─ Puede exportar datos                                │
│ └─ NO puede eliminar ni acceder configuración          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  USUARIO EMPLOYEE                        │
│                                                          │
│ Permisos: [read, create]                               │
│                                                          │
│ ├─ Puede leer/ver registros                            │
│ ├─ Puede crear registros                               │
│ └─ NO puede actualizar, eliminar ni exportar           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   USUARIO VIEWER                         │
│                                                          │
│ Permisos: [read]                                        │
│                                                          │
│ ├─ Acceso solo a Dashboard                             │
│ ├─ Puede leer/ver registros                            │
│ └─ NO puede crear, actualizar, eliminar ni exportar    │
└─────────────────────────────────────────────────────────┘
```

---

## Ciclo de Vida de Componentes

```
┌──────────────────────────────────────────────────────┐
│        CICLO DE VIDA DE COMPONENTE                   │
│                                                      │
│  1. CONSTRUCTOR                                     │
│     └─ Inicializar propiedades                     │
│                                                      │
│  2. MOUNT/RENDER                                    │
│     ├─ Generar HTML                               │
│     ├─ Inserta en DOM                             │
│     └─ Browser pinta componente                    │
│                                                      │
│  3. ATTACH LISTENERS                               │
│     ├─ Click handlers                             │
│     ├─ Submit handlers                            │
│     ├─ Input handlers                             │
│     └─ Delegación de eventos                      │
│                                                      │
│  4. INTERACCIÓN                                     │
│     ├─ Usuario interactúa                         │
│     ├─ Dispara handlers                           │
│     ├─ Actualiza estado                           │
│     └─ Store notifica listeners                   │
│                                                      │
│  5. UPDATE                                          │
│     ├─ Re-render si necesario                     │
│     ├─ Actualiza DOM                              │
│     └─ Mantiene state                             │
│                                                      │
│  6. DESTROY                                         │
│     ├─ Limpiar event listeners                    │
│     ├─ Remover observadores                       │
│     └─ Liberar memoria                            │
└──────────────────────────────────────────────────────┘
```

---

## Capas de Arquitectura

```
┌────────────────────────────────────────────────────────┐
│         PRESENTATION LAYER (UI)                        │
│  - HTML templates                                     │
│  - CSS styles                                        │
│  - User interactions                                 │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│       COMPONENT LAYER                                  │
│  - Navbar, Sidebar, Dashboard                        │
│  - Tables, Forms, Cards                              │
│  - Modals, Notifications                             │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│       BUSINESS LOGIC LAYER                            │
│  - Services (Auth, Inventario, etc)                  │
│  - Guards (AuthGuard)                                │
│  - Validations                                       │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│       STATE MANAGEMENT LAYER                          │
│  - AuthStore                                         │
│  - UserStore                                         │
│  - NotificationStore                                 │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│       DATA ACCESS LAYER                               │
│  - Firebase SDK                                      │
│  - HTTP Client                                       │
│  - LocalStorage                                      │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│       EXTERNAL SERVICES                               │
│  - Firebase Auth                                     │
│  - Firestore Database                                │
│  - Firebase Storage                                  │
│  - Analytics                                         │
└────────────────────────────────────────────────────────┘
```

---

## Patrón de Comunicación

```
COMPONENTE A
     │
     │ Emite evento
     ↓
EVENT HANDLER
     │
     │ Ejecuta lógica
     ↓
SERVICE
     │
     │ Modifica estado
     ↓
STORE (AuthStore, etc)
     │
     │ Notifica cambios
     ↓
LISTENERS (Componentes suscritos)
     │
     │ Re-render si necesario
     ↓
COMPONENTE B, C, D... (Actualizados)
```

---
**Versión de Arquitectura**: 1.0.0

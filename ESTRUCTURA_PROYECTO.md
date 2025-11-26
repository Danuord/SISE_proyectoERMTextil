# TextileFlow ERP - Estructura del Proyecto

## Estructura de Carpetas Completa

```
SISE_proyectoERMTextil/
│
├── public/
│   ├── index.html                 # Página principal (ahora con nueva estructura)
│   ├── login.html                 # Página de login
│   ├── 404.html                   # Página de error 404
│   │
│   ├── src/                       # Código fuente principal
│   │   ├── auth/                  # Módulo de Autenticación
│   │   │   ├── login/
│   │   │   │   ├── login.js       # Componente de login
│   │   │   │   └── login.html     # Vista de login
│   │   │   ├── register/
│   │   │   │   ├── register.js    # Componente de registro
│   │   │   │   └── register.html  # Vista de registro
│   │   │   ├── guards/
│   │   │   │   └── authGuard.js   # Guardia de autenticación
│   │   │   └── services/
│   │   │       └── authService.js # Servicio de autenticación
│   │   │
│   │   ├── common/                # Componentes Compartidos
│   │   │   ├── navbar/
│   │   │   │   ├── navbar.js      # Componente navbar
│   │   │   │   └── navbar.html    # Vista navbar
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.js     # Componente sidebar
│   │   │   │   └── sidebar.html   # Vista sidebar
│   │   │   ├── header/
│   │   │   │   ├── header.js      # Componente header
│   │   │   │   └── header.html    # Vista header
│   │   │   └── footer/
│   │   │       ├── footer.js      # Componente footer
│   │   │       └── footer.html    # Vista footer
│   │   │
│   │   ├── modules/               # Módulos ERP
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/
│   │   │   │   │   └── dashboardPage.js
│   │   │   │   └── components/
│   │   │   │       ├── statsCard.js
│   │   │   │       ├── chart.js
│   │   │   │       └── recentActivity.js
│   │   │   │
│   │   │   ├── inventario/
│   │   │   │   ├── pages/
│   │   │   │   │   └── inventarioPage.js
│   │   │   │   ├── components/
│   │   │   │   │   ├── skuTable.js
│   │   │   │   │   ├── filterBar.js
│   │   │   │   │   └── skuForm.js
│   │   │   │   └── services/
│   │   │   │       └── inventarioService.js
│   │   │   │
│   │   │   ├── materiaprima/
│   │   │   │   ├── pages/
│   │   │   │   │   └── materiaPrimaPage.js
│   │   │   │   ├── components/
│   │   │   │   │   ├── materialTable.js
│   │   │   │   │   └── materialForm.js
│   │   │   │   └── services/
│   │   │   │       └── materiaPrimaService.js
│   │   │   │
│   │   │   ├── produccion/
│   │   │   │   ├── pages/
│   │   │   │   │   └── produccionPage.js
│   │   │   │   ├── components/
│   │   │   │   │   ├── orderTable.js
│   │   │   │   │   └── orderForm.js
│   │   │   │   └── services/
│   │   │   │       └── produccionService.js
│   │   │   │
│   │   │   ├── compras/
│   │   │   │   ├── pages/
│   │   │   │   │   └── comprasPage.js
│   │   │   │   ├── components/
│   │   │   │   │   ├── purchaseTable.js
│   │   │   │   │   └── purchaseForm.js
│   │   │   │   └── services/
│   │   │   │       └── comprasService.js
│   │   │   │
│   │   │   ├── ventas/
│   │   │   │   ├── pages/
│   │   │   │   │   └── ventasPage.js
│   │   │   │   ├── components/
│   │   │   │   │   ├── saleTable.js
│   │   │   │   │   └── saleForm.js
│   │   │   │   └── services/
│   │   │   │       └── ventasService.js
│   │   │   │
│   │   │   └── rrhh/
│   │   │       ├── pages/
│   │   │       │   └── rrhh.js
│   │   │       ├── components/
│   │   │       │   ├── employeeTable.js
│   │   │       │   └── employeeForm.js
│   │   │       └── services/
│   │   │           └── rrhhService.js
│   │   │
│   │   ├── config/                # Configuración
│   │   │   ├── firebase.js        # Inicialización de Firebase
│   │   │   ├── constants.js       # Constantes globales
│   │   │   └── environment.js     # Variables de entorno
│   │   │
│   │   ├── store/                 # Estado Global
│   │   │   ├── authStore.js       # Store de autenticación
│   │   │   ├── userStore.js       # Store de usuario
│   │   │   └── notificationStore.js # Store de notificaciones
│   │   │
│   │   └── utils/                 # Utilidades
│   │       ├── router.js          # Router personalizado
│   │       ├── logger.js          # Sistema de logging
│   │       ├── validators.js      # Validadores
│   │       ├── formatters.js      # Formateadores
│   │       └── helpers.js         # Funciones auxiliares
│   │
│   ├── css/                       # Estilos CSS
│   │   ├── dashboard.css          # Estilos principales
│   │   ├── common/
│   │   │   ├── navbar.css         # Estilos navbar
│   │   │   ├── sidebar.css        # Estilos sidebar
│   │   │   ├── header.css         # Estilos header
│   │   │   └── footer.css         # Estilos footer
│   │   ├── auth/
│   │   │   ├── login.css          # Estilos login
│   │   │   └── register.css       # Estilos registro
│   │   └── modules/
│   │       ├── inventario.css
│   │       ├── produccion.css
│   │       ├── compras.css
│   │       ├── ventas.css
│   │       └── rrhh.css
│   │
│   ├── js/
│   │   └── app.js                 # Punto de entrada (ahora con nuevas referencias)
│   │
│   └── assets/                    # Recursos estáticos
│       ├── images/                # Imágenes
│       ├── icons/                 # Iconos
│       └── fonts/                 # Fuentes
│
├── firebase.json                  # Configuración de Firebase
├── firestore.rules                # Reglas de Firestore
├── firestore.indexes.json         # Índices de Firestore
├── .firebaserc                    # Configuración de proyecto
└── README.md                      # Este archivo

```

## Descripción de Carpetas

### `/src/auth` - Autenticación
- **login**: Componente y lógica de inicio de sesión
- **register**: Componente y lógica de registro
- **guards**: Protección de rutas con `AuthGuard`
- **services**: Servicio centralizado `AuthService` para operaciones de autenticación

### `/src/common` - Componentes Compartidos
- **navbar**: Barra de navegación principal con menú de usuario
- **sidebar**: Barra lateral con navegación a módulos
- **header**: Encabezado de página
- **footer**: Pie de página

### `/src/modules` - Módulos ERP
Cada módulo sigue la estructura:
- **pages**: Páginas principales del módulo
- **components**: Componentes reutilizables
- **services**: Servicios para comunicación con Backend/Firestore

Módulos disponibles:
-  **inventario**: Gestión de SKUs
-  **materiaprima**: Control de materia prima
-  **produccion**: Órdenes de producción
-  **compras**: Gestión de compras
-  **ventas**: Gestión de ventas
-  **rrhh**: Recursos Humanos

### `/src/config` - Configuración
- **firebase.js**: Inicialización y exportación de servicios Firebase
- **constants.js**: Constantes globales (rutas, roles, permisos, etc.)
- **environment.js**: Variables por entorno

### `/src/store` - Estado Global
Gestión centralizada de estado usando patrón Observer:
- **authStore**: Estado de autenticación
- **userStore**: Datos del usuario
- **notificationStore**: Sistema de notificaciones

### `/src/utils` - Utilidades
- **router.js**: Router personalizado para SPA
- **logger.js**: Sistema de logging centralizado
- **validators.js**: Validadores de formularios
- **formatters.js**: Formateadores de datos
- **helpers.js**: Funciones auxiliares

### `/css` - Estilos
Organización por sección:
- **common/**: Estilos de componentes compartidos
- **auth/**: Estilos de autenticación
- **modules/**: Estilos específicos de módulos

### `/assets` - Recursos Estáticos
- **images/**: Imágenes del proyecto
- **icons/**: Iconografía adicional
- **fonts/**: Fuentes personalizadas

##  Sistema de Autenticación

### Roles Disponibles
```javascript
USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer'
}
```
### Permisos por Rol
```javascript
ROLE_PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'export'],
  manager: ['create', 'read', 'update', 'export'],
  supervisor: ['read', 'update', 'export'],
  employee: ['read', 'create'],
  viewer: ['read']
}
```

##  Estructura de Datos Firestore

### Colecciones Principales
- **users**: Usuarios del sistema
- **products**: Productos/SKUs
- **inventory**: Stock de inventario
- **rawMaterials**: Materia prima
- **productionOrders**: Órdenes de producción
- **purchases**: Órdenes de compra
- **sales**: Órdenes de venta
- **employees**: Datos de empleados


##  Flujo de Autenticación

1. Usuario accede a `/login`
2. Ingresa credenciales
3. `AuthService` valida con Firebase
4. Si es exitoso:
   - Obtiene datos de usuario desde Firestore
   - Actualiza `authStore`
   - Guarda sesión en localStorage
   - Redirige a `/dashboard`
5. `AuthGuard` protege rutas posteriores

##  Dependencias Externas

- **Firebase SDK 10.13.1**: Autenticación, Firestore, Storage
- **Font Awesome 6.0**: Iconografía
- **CSS Grid & Flexbox**: Responsive design


export const APP_NAME = 'TextileFlow';
export const APP_VERSION = '1.0.0';

export const BASE_URL = '/';
export const API_URL = process.env.API_URL || '/api';

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  
  // Modulos
  INVENTARIO: '/inventario',
  MATERIA_PRIMA: '/materia-prima',
  PRODUCCION: '/produccion',
  COMPRAS: '/compras',
  VENTAS: '/ventas',
  RRHH: '/rrhh',
  
  // Configuración
  SETTINGS: '/settings',
  PROFILE: '/profile'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer'
};

export const ROLE_PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'export'],
  manager: ['create', 'read', 'update', 'export'],
  supervisor: ['read', 'update', 'export'],
  employee: ['read', 'create'],
  viewer: ['read']
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  RAW_MATERIALS: 'rawMaterials',
  PRODUCTION_ORDERS: 'productionOrders',
  PURCHASES: 'purchases',
  SALES: 'sales',
  EMPLOYEES: 'employees'
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

import { Navbar } from '../src/common/navbar/navbar.js';
import { Sidebar } from '../src/common/sidebar/sidebar.js';
import { authService } from '../src/auth/services/authService.js';
import { router } from '../src/utils/router.js';
import AuthGuard from '../src/auth/guards/authGuard.js';
import { logger } from '../src/utils/logger.js';
import { authStore } from '../src/store/authStore.js';

class App {
  constructor() {
    this.currentUser = null;
    this.navbar = null;
    this.sidebar = null;
  }

  async init() {
    logger.info('Iniciando aplicación TextileFlow');

    try {
      const savedSession = authService.getSession();
      if (savedSession) {
        this.currentUser = savedSession;
        authStore.setUser(
          { displayName: savedSession.displayName, email: savedSession.email },
          savedSession.role,
          savedSession.permissions
        );
      }

      this.initializeComponents();

      this.setupRoutes();

      router.init();

      authService.onAuthStateChanged((user) => {
        this.currentUser = user;
        if (user) {
          logger.info('Usuario autenticado:', user.email);
          this.renderApp();
        } else {
          logger.info('Usuario desautenticado');
          if (window.location.pathname !== '/login') {
            window.location.href = './login.html';
          }
        }
      });

      logger.info('Aplicación inicializada correctamente');
    } catch (error) {
      logger.error('Error al inicializar aplicación', error);
    }
  }

  initializeComponents() {
    const navbarContainer = document.getElementById('navbar');
    if (navbarContainer) {
      this.navbar = new Navbar(navbarContainer);
      this.navbar.render(this.currentUser);
    }

    const sidebarContainer = document.getElementById('sidebar');
    if (sidebarContainer) {
      this.sidebar = new Sidebar(sidebarContainer);
      this.sidebar.render();
    }
  }

  renderApp() {
    if (this.navbar && this.currentUser) {
      this.navbar.render(this.currentUser);
    }
    if (this.sidebar) {
      this.sidebar.setActiveLink(window.location.pathname);
    }
  }

  setupRoutes() {
    router.route('/login', (params) => {
      this.handleLoginPage();
    });

    router.route('/register', (params) => {
      this.handleRegisterPage();
    });

    router.route('/dashboard', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleDashboard();
    }, { requireAuth: true });

    router.route('/inventario', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleInventario();
    }, { 
      requireAuth: true,
      permissions: ['read']
    });

    router.route('/materia-prima', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleMateriaPrima();
    }, { requireAuth: true });

    router.route('/produccion', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleProduccion();
    }, { requireAuth: true });

    router.route('/compras', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleCompras();
    }, { requireAuth: true });

    router.route('/ventas', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleVentas();
    }, { requireAuth: true });

    router.route('/rrhh', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      this.handleRRHH();
    }, { requireAuth: true });

    router.route('/settings', (params) => {
      if (AuthGuard.redirectToLoginIfNotAuth()) return;
      if (!AuthGuard.hasRole('admin')) {
        window.location.href = './dashboard.html';
        return;
      }
      this.handleSettings();
    }, { 
      requireAuth: true,
      roles: ['admin']
    });

    router.setNotFoundHandler(() => {
      window.location.href = './dashboard.html';
    });
  }

  handleLoginPage() {
    logger.info('Cargando página de login');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="loading">Cargando login...</div>';
    }
  }

  handleRegisterPage() {
    logger.info('Cargando página de registro');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="loading">Cargando registro...</div>';
    }
  }

  handleDashboard() {
    logger.info('Cargando dashboard');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `
        <div class="page-header">
          <h1>Dashboard</h1>
          <p>Bienvenido, ${this.currentUser?.displayName || 'Usuario'}</p>
        </div>
        <div class="dashboard-content">
          <!-- Contenido del dashboard -->
        </div>
      `;
    }
  }

  handleInventario() {
    logger.info('Cargando inventario');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Gestión de Inventario SKU</div>';
    }
  }

  handleMateriaPrima() {
    logger.info('Cargando materia prima');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Gestión de Materia Prima</div>';
    }
  }

  handleProduccion() {
    logger.info('Cargando producción');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Gestión de Producción</div>';
    }
  }

  handleCompras() {
    logger.info('Cargando compras');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Gestión de Compras</div>';
    }
  }

  handleVentas() {
    logger.info('Cargando ventas');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Gestión de Ventas</div>';
    }
  }

  handleRRHH() {
    logger.info('Cargando RRHH');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Gestión de Recursos Humanos</div>';
    }
  }

  handleSettings() {
    logger.info('Cargando configuración');
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="module-content">Configuración del Sistema</div>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

export default App;

export class Navbar {
  constructor(container) {
    this.container = container;
    this.user = null;
    this.notifications = [];
  }

  render(user = null) {
    this.user = user;
    const navHTML = `
      <nav class="navbar">
        <div class="navbar-container">
          <!-- Logo/Brand -->
          <div class="navbar-brand">
            <a href="../dashboard.html" class="logo">
              <i class="fas fa-shirt"></i>
              <span class="brand-name">TextileFlow</span>
            </a>
          </div>

          <!-- Menu Toggle (Mobile) -->
          <button class="navbar-toggle" id="navbarToggle">
            <i class="fas fa-bars"></i>
          </button>

          <!-- Navigation Links -->
          <div class="navbar-menu" id="navbarMenu">
            <div class="navbar-nav">
              <a href="../dashboard.html" class="nav-link">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
              </a>
              <div class="nav-divider"></div>
              
              <div class="nav-section">
                <span class="nav-section-title">Módulos</span>
                <a href="../inventario.html" class="nav-link">
                  <i class="fas fa-boxes"></i>
                  <span>Inventario</span>
                </a>
                <a href="../materiaprima.html" class="nav-link">
                  <i class="fas fa-tape"></i>
                  <span>Materia Prima</span>
                </a>
                <a href="../produccion.html" class="nav-link">
                  <i class="fas fa-cut"></i>
                  <span>Producción</span>
                </a>
                <a href="../compras.html" class="nav-link">
                  <i class="fas fa-shopping-cart"></i>
                  <span>Compras</span>
                </a>
                <a href="../ventas.html" class="nav-link">
                  <i class="fas fa-chart-line"></i>
                  <span>Ventas</span>
                </a>
                <a href="../rrhh.html" class="nav-link">
                  <i class="fas fa-users"></i>
                  <span>RR.HH.</span>
                </a>
              </div>
            </div>
          </div>

          <!-- User Section -->
          <div class="navbar-user">
            <div class="notifications-icon" id="notificationsBtn">
              <i class="fas fa-bell"></i>
              <span class="notification-badge" id="notificationCount">0</span>
            </div>

            <div class="user-menu">
              <button class="user-menu-toggle" id="userMenuBtn">
                <img src="${user?.photoURL || '/assets/images/default-avatar.png'}" alt="Avatar" class="user-avatar">
                <span class="user-name">${user?.displayName || 'Usuario'}</span>
                <i class="fas fa-chevron-down"></i>
              </button>

              <div class="user-dropdown" id="userDropdown">
                <a href="../profile.html" class="dropdown-item">
                  <i class="fas fa-user"></i>
                  <span>Mi Perfil</span>
                </a>
                <a href="../settings.html" class="dropdown-item">
                  <i class="fas fa-cog"></i>
                  <span>Configuración</span>
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" id="logoutBtn" class="dropdown-item">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Cerrar Sesión</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;

    this.container.innerHTML = navHTML;
    this.attachEventListeners();
  }

  attachEventListeners() {
    const toggle = document.getElementById('navbarToggle');
    const menu = document.getElementById('navbarMenu');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (toggle) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
      });
    }

    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', () => {
        userDropdown.classList.toggle('active');
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu')) {
        userDropdown?.classList.remove('active');
      }
      if (!e.target.closest('.navbar-toggle') && !e.target.closest('.navbar-menu')) {
        menu?.classList.remove('active');
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  async handleLogout() {
    const { authService } = await import('../../auth/services/authService.js');
    const result = await authService.logout();
    if (result.success) {
      window.location.href = './login.html';
    }
  }

  updateNotifications(count) {
    const badge = document.getElementById('notificationCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }

  setActiveRoute(path) {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === path) {
        link.classList.add('active');
      }
    });
  }
}

export default Navbar;

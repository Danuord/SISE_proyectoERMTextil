export class Sidebar {
  constructor(container) {
    this.container = container;
    this.isCollapsed = false;
  }

  render() {
    const sidebarHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <button class="sidebar-toggle" id="sidebarToggle">
            <i class="fas fa-bars"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <h3 class="section-title">Principal</h3>
            <a href="../dashboard.html" class="sidebar-link">
              <i class="fas fa-chart-line"></i>
              <span>Dashboard</span>
            </a>
          </div>

          <div class="nav-section">
            <h3 class="section-title">Gestión</h3>
            <a href="../inventario.html" class="sidebar-link">
              <i class="fas fa-boxes"></i>
              <span>Inventario SKU</span>
            </a>
            <a href="../materiaprima.html" class="sidebar-link">
              <i class="fas fa-tape"></i>
              <span>Materia Prima</span>
            </a>
            <a href="../produccion.html" class="sidebar-link">
              <i class="fas fa-cut"></i>
              <span>Producción</span>
            </a>
          </div>

          <div class="nav-section">
            <h3 class="section-title">Comercial</h3>
            <a href="../compras.html" class="sidebar-link">
              <i class="fas fa-shopping-cart"></i>
              <span>Compras</span>
            </a>
            <a href="../ventas.html" class="sidebar-link">
              <i class="fas fa-chart-line"></i>
              <span>Ventas</span>
            </a>
          </div>

          <div class="nav-section">
            <h3 class="section-title">Recursos</h3>
            <a href="../rrhh.html" class="sidebar-link">
              <i class="fas fa-users"></i>
              <span>RR.HH.</span>
            </a>
          </div>

          <div class="nav-section">
            <h3 class="section-title">Sistema</h3>
            <a href="../settings.html" class="sidebar-link">
              <i class="fas fa-cog"></i>
              <span>Configuración</span>
            </a>
            <a href="../audit.html" class="sidebar-link">
              <i class="fas fa-history"></i>
              <span>Auditoría</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar"></div>
            <div class="user-details">
              <p class="user-name">Admin</p>
              <p class="user-role">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
    `;

    this.container.innerHTML = sidebarHTML;
    this.attachEventListeners();
  }

  attachEventListeners() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (toggle) {
      toggle.addEventListener('click', () => {
        this.toggleSidebar(sidebar);
      });
    }

    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  toggleSidebar(sidebar) {
    this.isCollapsed = !this.isCollapsed;
    sidebar.classList.toggle('collapsed');
  }


  setActiveLink(path) {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === path) {
        link.classList.add('active');
      }
    });
  }
}

export default Sidebar;

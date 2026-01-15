import { getCurrentUser, isAdmin, logout } from './auth-guard.js';

class Sidebar {
    constructor() {
        this.user = getCurrentUser();
        this.isAdminUser = isAdmin();
        this.currentPage = window.location.pathname;
    }

    render(containerId = 'sidebar-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        const sidebarHTML = this.isAdminUser ? this.getAdminSidebar() : this.getEmployeeSidebar();
        container.innerHTML = sidebarHTML;

        this.attachEventListeners();
        this.setActivePage();
    }

    getAdminSidebar() {
        return `
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-header">
                    <h1><i class="fas fa-shirt"></i> TextileFlow</h1>
                    <p>ERP Textil</p>
                    <button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Cerrar sidebar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <ul class="sidebar-menu">
                    <li><a href="./dashboard.html" class="sidebar-link" data-page="admin-dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
                    <li><a href="./rrhh.html" class="sidebar-link" data-page="admin-rrhh"><i class="fas fa-users"></i> RRHH</a></li>
                    <li><a href="./asistencia.html" class="sidebar-link" data-page="admin-asistencia"><i class="fas fa-calendar-check"></i> Asistencias</a></li>
                    <li><a href="./pagos.html" class="sidebar-link" data-page="admin-pagos"><i class="fas fa-money-bill-wave"></i> Registro de pagos</a></li>
                    <li><a href="./inventario.html" class="sidebar-link" data-page="admin-inventario"><i class="fas fa-boxes"></i> Inventario</a></li>
                    <li><a href="./reportes.html" class="sidebar-link" data-page="admin-reportes"><i class="fas fa-chart-bar"></i> Reportes</a></li>
                    <li><a href="./ventas.html" class="sidebar-link" data-page="ventas"><i class="fa-brands fa-sellsy"></i>Control de ventas</a></li>
                    <li><a href="./configuracion.html" class="sidebar-link" data-page="admin-configuracion"><i class="fas fa-cog"></i> Configuración</a></li>
                </ul>

                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name" id="userNameDisplay">${this.getUserDisplayName()}</div>
                            <div class="user-role" id="userRoleDisplay">${this.getUserRole()}</div>
                        </div>
                    </div>
                    <button class="logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>
        `;
    }

    getEmployeeSidebar() {
        return `
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-header">
                    <h1><i class="fas fa-shirt"></i> TextileFlow</h1>
                    <p>Portal Empleado</p>
                    <button class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Cerrar sidebar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <ul class="sidebar-menu">
                    <li><a href="./dashboard.html" class="sidebar-link" data-page="employee-dashboard"><i class="fas fa-home"></i> Mi Dashboard</a></li>
                    <li><a href="./asistencias.html" class="sidebar-link" data-page="employee-asistencias"><i class="fas fa-clock"></i> Mis Asistencias</a></li>
                    <li><a href="./payments.html" class="sidebar-link" data-page="employee-payments"><i class="fas fa-money-bill-wave"></i> Mis Pagos</a></li>
                    <li><a href="./profile.html" class="sidebar-link" data-page="employee-profile"><i class="fas fa-user-circle"></i> Mi Perfil</a></li>
                </ul>

                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name" id="userNameDisplay">${this.getUserDisplayName()}</div>
                            <div class="user-role" id="userRoleDisplay">${this.getUserRole()}</div>
                        </div>
                    </div>
                    <button class="logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>
        `;
    }

    getUserDisplayName() {
        if (!this.user) return 'Usuario';

        return this.user.displayName ||
            `${this.user.nombre || ''} ${this.user.apellido || ''}`.trim() ||
            this.user.email ||
            'Usuario';
    }

    getUserRole() {
        if (!this.user) return 'Rol';
        return this.user.rol || this.user.role || 'Usuario';
    }

    setActivePage() {
        const links = document.querySelectorAll('.sidebar-menu a');
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop(); 

        links.forEach(link => {
            const href = link.getAttribute('href');

            // Remover active de todos primero
            link.classList.remove('active');
            link.parentElement.classList.remove('active');

            if (href && (href === `./${currentFile}` || href === currentFile)) {
                link.classList.add('active');
                link.parentElement.classList.add('active');
            }
        });
    }

    attachEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.addEventListener('click', () => {
                window.location.href = './profile.html';
            });
        }

        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Botón de cierre (X)
        const closeBtn = document.getElementById('sidebarCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                sidebar.classList.remove('active');
            });
        }

        // Cerrar sidebar al hacer clic en un enlace de menú
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                // En móvil, cerrar después de navegar
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        sidebar.classList.remove('active');
                    }, 100);
                }
            });
        });

        // Cerrar sidebar al hacer clic fuera (solo en móvil)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const toggleBtn = document.querySelector('.toggle-menu-btn');
                const isClickInSidebar = sidebar.contains(e.target);
                const isClickOnToggle = toggleBtn && toggleBtn.contains(e.target);
                
                if (!isClickInSidebar && !isClickOnToggle && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        }, true); // Usar captura para que se ejecute primero
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = new Sidebar();
    sidebar.render();
});
export default Sidebar;

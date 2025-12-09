// ===================== SIDEBAR COMPONENT =====================
// Componente reutilizable que se adapta según el rol del usuario

import { getCurrentUser, isAdmin, logout } from './auth-guard.js';

class Sidebar {
    constructor() {
        this.user = getCurrentUser();
        this.isAdminUser = isAdmin();
        this.currentPage = window.location.pathname;
    }

    /**
     * Renderiza el sidebar en el contenedor especificado
     */
    render(containerId = 'sidebar-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Contenedor ${containerId} no encontrado`);
            return;
        }

        const sidebarHTML = this.isAdminUser ? this.getAdminSidebar() : this.getEmployeeSidebar();
        container.innerHTML = sidebarHTML;

        this.attachEventListeners();
        this.setActivePage();

        console.log(`✅ Sidebar renderizado (${this.isAdminUser ? 'Admin' : 'Empleado'})`);
    }

    /**
     * Genera el HTML del sidebar para administradores
     */
    getAdminSidebar() {
        return `
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-header">
                    <h1><i class="fas fa-shirt"></i> TextileFlow</h1>
                    <p>ERP Textil</p>
                </div>

                <ul class="sidebar-menu">
                    <li><a href="./dashboard.html" data-page="dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
                    <li><a href="./rrhh.html" data-page="rrhh"><i class="fas fa-users"></i> RR HH</a></li>
                    <li><a href="./asistencia.html" data-page="asistencia"><i class="fas fa-clock"></i> Asistencias</a></li>
                    <li><a href="./inventario.html" data-page="inventario"><i class="fas fa-boxes"></i> Inventario</a></li>
                    <li><a href="./pagos.html" data-page="pagos"><i class="fa-solid fa-cash-register"></i> Pagos</a></li>
                    <li><a href="#" data-page="ventas"><i class="fa-brands fa-sellsy"></i> Ventas</a></li>
                    <li><a href="#" data-page="reportes"><i class="fas fa-chart-bar"></i> Reportes</a></li>
                    <li><a href="#" data-page="configuracion"><i class="fas fa-cog"></i> Configuración</a></li>
                </ul>

                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-name" id="userNameDisplay">${this.getUserDisplayName()}</div>
                        <div class="user-role" id="userRoleDisplay">${this.getUserRole()}</div>
                    </div>
                    <button class="logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>
        `;
    }

    /**
     * Genera el HTML del sidebar para empleados
     */
    getEmployeeSidebar() {
        return `
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-header">
                    <h1><i class="fas fa-shirt"></i> TextileFlow</h1>
                    <p>Portal Empleado</p>
                </div>

                <ul class="sidebar-menu">
                    <li><a href="./dashboard.html" data-page="employee-dashboard"><i class="fas fa-home"></i> Mi Dashboard</a></li>
                    <li><a href="./asistencias.html" data-page="employee-asistencias"><i class="fas fa-clock"></i> Mis Asistencias</a></li>
                    <li><a href="./payments.html" data-page="employee-payments"><i class="fas fa-money-bill-wave"></i> Mis Pagos</a></li>
                    <li><a href="./profile.html" data-page="employee-profile"><i class="fas fa-user-circle"></i> Mi Perfil</a></li>
                </ul>

                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-name" id="userNameDisplay">${this.getUserDisplayName()}</div>
                        <div class="user-role" id="userRoleDisplay">${this.getUserRole()}</div>
                    </div>
                    <button class="logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </aside>
        `;
    }

    /**
     * Obtiene el nombre para mostrar del usuario
     */
    getUserDisplayName() {
        if (!this.user) return 'Usuario';

        return this.user.displayName ||
            `${this.user.nombre || ''} ${this.user.apellido || ''}`.trim() ||
            this.user.email ||
            'Usuario';
    }

    /**
     * Obtiene el rol del usuario
     */
    getUserRole() {
        if (!this.user) return 'Rol';
        return this.user.rol || this.user.role || 'Usuario';
    }

    /**
     * Marca la página activa en el menú
     */
    setActivePage() {
        const links = document.querySelectorAll('.sidebar-menu a');
        const currentPath = window.location.pathname;

        links.forEach(link => {
            const href = link.getAttribute('href');

            // Comparar rutas
            if (href && (currentPath.endsWith(href) || currentPath.includes(href.replace('./', '')))) {
                link.parentElement.classList.add('active');
            }
        });
    }

    /**
     * Adjunta event listeners
     */
    attachEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // Toggle menu en móvil
        const toggleBtn = document.querySelector('.toggle-menu-btn');
        const sidebar = document.getElementById('sidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }
}

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = new Sidebar();
    sidebar.render();
});

// Exportar para uso manual si es necesario
export default Sidebar;

console.log("✅ Sidebar Component cargado");

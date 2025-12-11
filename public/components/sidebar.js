// ===================== SIDEBAR COMPONENT =====================
// Componente reutilizable que se adapta según el rol del usuario

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
            console.error(`❌ Contenedor ${containerId} no encontrado`);
            return;
        }

        const sidebarHTML = this.isAdminUser ? this.getAdminSidebar() : this.getEmployeeSidebar();
        container.innerHTML = sidebarHTML;

        this.attachEventListeners();
        this.setActivePage();

        console.log(`✅ Sidebar renderizado (${this.isAdminUser ? 'Admin' : 'Empleado'})`);
        console.log(`👤 Usuario:`, this.user);
        console.log(`📝 Display Name:`, this.getUserDisplayName());
        console.log(`🎭 Role:`, this.getUserRole());
    }

    getAdminSidebar() {
        return `
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-header">
                    <h1><i class="fas fa-shirt"></i> TextileFlow</h1>
                    <p>ERP Textil</p>
                </div>

                <ul class="sidebar-menu">
                    <li><a href="/pages/admin/dashboard.html" data-page="dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
                    <li><a href="/pages/admin/rrhh.html" data-page="rrhh"><i class="fas fa-users"></i>Gestion de usuarios</a></li>
                    <li><a href="/pages/admin/asistencia.html" data-page="asistencia"><i class="fas fa-clock"></i>Control de asistencias</a></li>
                    <li><a href="/pages/admin/inventario.html" data-page="inventario"><i class="fas fa-boxes"></i>Control de inventario</a></li>
                    <li><a href="/pages/admin/pagos.html" data-page="pagos"><i class="fa-solid fa-cash-register"></i>Pagos Empleados</a></li>
                    <li><a href="#" data-page="ventas"><i class="fa-brands fa-sellsy"></i>Control de ventas</a></li>
                    <li><a href="#" data-page="reportes"><i class="fas fa-chart-bar"></i>Reportes</a></li>
                    <li><a href="#" data-page="configuracion"><i class="fas fa-cog"></i>Configuración</a></li>
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

        links.forEach(link => {
            const href = link.getAttribute('href');

            if (href && (currentPath.endsWith(href) || currentPath.includes(href.replace('./', '')))) {
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

        const toggleBtn = document.querySelector('.toggle-menu-btn');
        const sidebar = document.getElementById('sidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = new Sidebar();
    sidebar.render();
});
export default Sidebar;

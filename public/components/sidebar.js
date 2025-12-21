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
        const currentFile = currentPath.split('/').pop(); // Obtener solo el nombre del archivo

        console.log('🔍 Detectando página activa:', currentFile);

        links.forEach(link => {
            const href = link.getAttribute('href');

            // Remover active de todos primero
            link.classList.remove('active');
            link.parentElement.classList.remove('active');

            // Verificar si el href coincide con la página actual
            if (href && (href === `./${currentFile}` || href === currentFile)) {
                link.classList.add('active');
                link.parentElement.classList.add('active');
                console.log('✅ Página activa encontrada:', href);
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

        // Agregar click en user-info para ir al perfil
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.addEventListener('click', () => {
                window.location.href = './profile.html';
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

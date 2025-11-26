import { Navbar } from '../../../common/navbar/navbar.js';
import { Sidebar } from '../../../common/sidebar/sidebar.js';
import { StatCard, DataTable, SimpleChart, ActivityList } from '../components/dashboardComponents.js';
import { logger } from '../../../utils/logger.js';
import authService from '../../../auth/services/authService.js';
import AuthGuard from '../../../auth/guards/authGuard.js';

class DashboardPage {
    constructor() {
        this.currentUser = null;
        this.navbar = null;
        this.sidebar = null;
        this.data = null;
    }

    async init() {
        logger.info('Inicializando Dashboard');

        try {
            console.log('Dashboard init - Verificando sesión...');
            const session = authService.getSession();
            console.log('Sesión encontrada:', session);
            
            const isAuthenticated = session && authService.isAuthenticated();
            console.log(' ¿Autenticado?', isAuthenticated);
            
            if (!isAuthenticated) {
                console.log('No autenticado, redirigiendo a login');
                logger.warn('Usuario no autenticado, redirigiendo a login');
                window.location.href = './login.html';
                return;
            }

            console.log('Usuario autenticado, continuando...');
            this.currentUser = authService.getCurrentUser();
            console.log('Usuario actual:', this.currentUser);

            console.log('Inicializando componentes...');
            this.initializeComponents();

            console.log('Cargando datos...');
            await this.loadData();

            console.log('Renderizando...');
            this.render();

            console.log('Adjuntando eventos...');
            this.attachEventListeners();

            console.log('Dashboard cargado exitosamente');

        } catch (error) {
            console.error('Error en dashboard:', error);
            logger.error('Error en dashboard', error);
            this.showToast('Error al cargar el dashboard', 'error');
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
            this.sidebar.setActiveLink('/dashboard');
        }
    }

    async loadData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data = {
                    stats: [
                        {
                            title: 'Stock Total SKUs',
                            value: '15,730',
                            unit: 'unidades',
                            color: 'primary',
                            change: 12,
                            period: 'vs. la semana pasada'
                        },
                        {
                            title: 'Materia Prima Baja',
                            value: '82',
                            unit: 'rollos/kilos',
                            color: 'warning',
                            change: -8,
                            period: 'requieren reorden'
                        },
                        {
                            title: 'Órdenes Producción',
                            value: '12',
                            unit: 'en proceso',
                            color: 'info',
                            change: 5,
                            period: 'completadas hoy'
                        },
                        {
                            title: 'Ingresos Hoy',
                            value: '$45,230',
                            unit: 'ventas',
                            color: 'success',
                            change: 18,
                            period: 'vs. ayer'
                        }
                    ],
                    productionData: [
                        { label: 'Lunes', value: 520 },
                        { label: 'Martes', value: 580 },
                        { label: 'Miércoles', value: 490 },
                        { label: 'Jueves', value: 610 },
                        { label: 'Viernes', value: 720 },
                        { label: 'Sábado', value: 550 },
                        { label: 'Domingo', value: 380 }
                    ],
                    stockData: [
                        { label: 'Algodón', value: 4500 },
                        { label: 'Poliéster', value: 3200 },
                        { label: 'Lana', value: 2100 },
                        { label: 'Seda', value: 1800 },
                        { label: 'Lino', value: 900 }
                    ],
                    recentOrders: [
                        {
                            id: 'ORD-2025-001',
                            product: 'Camiseta Premium',
                            quantity: '500',
                            status: 'En Proceso',
                            date: '2025-11-22'
                        },
                        {
                            id: 'ORD-2025-002',
                            product: 'Pantalón Deportivo',
                            quantity: '300',
                            status: 'Completado',
                            date: '2025-11-21'
                        },
                        {
                            id: 'ORD-2025-003',
                            product: 'Vestido Casual',
                            quantity: '150',
                            status: 'Pendiente',
                            date: '2025-11-22'
                        }
                    ],
                    lowStock: [
                        {
                            material: 'Algodón Premium',
                            current: '120 kg',
                            minimum: '500 kg',
                            supplier: 'Textiles SA'
                        },
                        {
                            material: 'Hilo Negro',
                            current: '45 rollos',
                            minimum: '200 rollos',
                            supplier: 'HilosXL'
                        },
                        {
                            material: 'Botones',
                            current: '320 pcs',
                            minimum: '1000 pcs',
                            supplier: 'Accesorios Plus'
                        }
                    ],
                    activities: [
                        {
                            title: 'Orden Completada',
                            description: 'ORD-2025-002 fue marcada como completada',
                            type: 'success',
                            icon: 'fas fa-check-circle',
                            time: 'Hace 2 horas'
                        },
                        {
                            title: 'Material Reordenado',
                            description: 'Se reordenaron 500 kg de algodón premium',
                            type: 'info',
                            icon: 'fas fa-shopping-cart',
                            time: 'Hace 4 horas'
                        },
                        {
                            title: 'Alerta de Stock',
                            description: 'Algodón Premium está por debajo del mínimo',
                            type: 'warning',
                            icon: 'fas fa-exclamation-triangle',
                            time: 'Hace 6 horas'
                        },
                        {
                            title: 'Nueva Orden',
                            description: 'Nueva orden ORD-2025-003 ha sido creada',
                            type: 'info',
                            icon: 'fas fa-plus-circle',
                            time: 'Hace 8 horas'
                        }
                    ]
                };
                resolve();
            }, 500);
        });
    }

    render() {
        this.renderStats();
        this.renderCharts();
        this.renderTables();
        this.renderActivity();
    }

    renderStats() {
        const container = document.getElementById('statsContainer');
        const html = this.data.stats
            .map(stat => new StatCard(stat).render())
            .join('');
        container.innerHTML = html;
    }

    renderCharts() {
        const productionChart = new SimpleChart(this.data.productionData);
        document.getElementById('productionChartContainer').innerHTML = productionChart.render();

        const stockChart = new SimpleChart(this.data.stockData);
        document.getElementById('stockChartContainer').innerHTML = stockChart.render();

        const ordersChart = new SimpleChart([
            { label: 'Completadas', value: 45 },
            { label: 'En Proceso', value: 12 },
            { label: 'Pendientes', value: 8 }
        ]);
        document.getElementById('ordersChartContainer').innerHTML = ordersChart.render();
    }

    renderTables() {
        const ordersTable = new DataTable(
            this.data.recentOrders,
            [
                { key: 'id', label: 'ID Orden' },
                { key: 'product', label: 'Producto' },
                { key: 'quantity', label: 'Cantidad' },
                { key: 'status', label: 'Estado' },
                { key: 'date', label: 'Fecha' }
            ]
        );
        document.getElementById('recentOrdersContainer').innerHTML = ordersTable.render();

        const stockTable = new DataTable(
            this.data.lowStock,
            [
                { key: 'material', label: 'Material' },
                { key: 'current', label: 'Stock Actual' },
                { key: 'minimum', label: 'Mínimo' },
                { key: 'supplier', label: 'Proveedor' }
            ]
        );
        document.getElementById('lowStockContainer').innerHTML = stockTable.render();
    }

    renderActivity() {
        const activity = new ActivityList(this.data.activities);
        document.getElementById('activityContainer').innerHTML = activity.render();
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => this.filterByPeriod(e.target.value));
        }
    }

    async refresh() {
        const btn = document.getElementById('refreshBtn');
        btn.disabled = true;
        btn.querySelector('i').classList.add('spinning');

        try {
            await this.loadData();
            this.render();
            this.showToast('Dashboard actualizado', 'success');
        } catch (error) {
            this.showToast('Error al actualizar', 'error');
        } finally {
            btn.disabled = false;
            btn.querySelector('i').classList.remove('spinning');
        }
    }

    exportData() {
        const csv = 'Material,Stock Actual,Mínimo,Proveedor\n';
        const rows = this.data.lowStock
            .map(item => `${item.material},${item.current},${item.minimum},${item.supplier}`)
            .join('\n');

        const fullCSV = csv + rows;
        const blob = new Blob([fullCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'textileflow_export.csv';
        link.click();

        this.showToast('Datos exportados correctamente', 'success');
    }

    filterByPeriod(period) {
        logger.info('Filtrando por período:', period);
        this.showToast(`Filtrando por: ${period}`, 'info');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardPage();
    dashboard.init();
});

export default DashboardPage;

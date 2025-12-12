// ===================== DASHBOARD - ADMIN =====================
// Modern dashboard with Chart.js visualizations

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("✅ DASHBOARD.JS CARGADO");

// ===================== CONFIG FIREBASE =====================
const firebaseConfig = {
    apiKey: "AIzaSyDRTKsoZ9Zzh1oo-DQtlxnZ4Pw6RWBv08c",
    authDomain: "textileflow-test.firebaseapp.com",
    projectId: "textileflow-test",
    storageBucket: "textileflow-test.firebasestorage.app",
    messagingSenderId: "227349652064",
    appId: "1:227349652064:web:d32994273a529a07e25905",
    measurementId: "G-XE4Z2S0LRB"
};

const app = initializeApp(firebaseConfig, 'dashboard-app');
const db = getFirestore(app);
console.log('✅ Firebase inicializado para dashboard');

// ===================== CONSTANTES =====================
const HORA_INICIO_LABORAL = { hora: 8, minuto: 30 };

// Chart instances
let attendanceChart, employeeChart, stockChart;

// ===================== UTILIDADES =====================
function updateKPI(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function updateKPITrend(kpiCardElement, percentage, isPositive) {
    const trendElement = kpiCardElement.querySelector('.kpi-trend');
    if (!trendElement) return;

    // Limpiar clases anteriores
    trendElement.classList.remove('up', 'down', 'neutral');

    if (percentage === 0) {
        trendElement.classList.add('neutral');
        trendElement.innerHTML = '<i class="fas fa-minus"></i><span>0%</span>';
    } else if (isPositive) {
        trendElement.classList.add('up');
        trendElement.innerHTML = `<i class="fas fa-arrow-up"></i><span>+${Math.abs(percentage).toFixed(1)}%</span>`;
    } else {
        trendElement.classList.add('down');
        trendElement.innerHTML = `<i class="fas fa-arrow-down"></i><span>${percentage.toFixed(1)}%</span>`;
    }
}

function esTardanza(horaString) {
    if (!horaString) return false;
    const [h, m] = horaString.split(':').map(Number);
    return h > HORA_INICIO_LABORAL.hora ||
        (h === HORA_INICIO_LABORAL.hora && m > HORA_INICIO_LABORAL.minuto);
}

function getPreviousMonthRange() {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayPrevMonth = new Date(firstDayThisMonth - 1);
    const firstDayPrevMonth = new Date(lastDayPrevMonth.getFullYear(), lastDayPrevMonth.getMonth(), 1);

    return {
        start: firstDayPrevMonth.toISOString().split('T')[0],
        end: lastDayPrevMonth.toISOString().split('T')[0]
    };
}

// ===================== CARGA DE KPIs =====================
async function loadDashboardKPIs() {
    if (!db) return;

    try {
        console.log('📊 Cargando KPIs del dashboard...');

        await Promise.all([
            loadEmpleadosKPI(),
            loadAsistenciaKPIs(),
            loadInventarioKPI()
        ]);

        console.log('✅ KPIs cargados');
    } catch (error) {
        console.error('❌ Error al cargar KPIs:', error);
    }
}

async function loadEmpleadosKPI() {
    try {
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const empleadosActuales = usuariosSnapshot.size;
        updateKPI('kpiEmpleados', empleadosActuales);

        // Calcular tendencia (comparar con mes anterior)
        // Por simplicidad, asumimos que todos los usuarios activos son del mes actual
        // En un sistema real, filtrarías por fecha de creación
        const prevMonth = getPreviousMonthRange();
        const usuariosPrevQuery = query(
            collection(db, "usuario"),
            where("fecha_creacion", "<=", prevMonth.end)
        );

        try {
            const usuariosPrevSnapshot = await getDocs(usuariosPrevQuery);
            const empleadosPrevios = usuariosPrevSnapshot.size;

            if (empleadosPrevios > 0) {
                const cambio = ((empleadosActuales - empleadosPrevios) / empleadosPrevios) * 100;
                const kpiCard = document.querySelector('.kpi-card:nth-child(1)');
                updateKPITrend(kpiCard, cambio, cambio >= 0);
            }
        } catch (err) {
            // Si no hay campo fecha_creacion, mostrar tendencia neutral
            console.log('ℹ️ No se pudo calcular tendencia de empleados');
        }
    } catch (error) {
        console.error('❌ Error al cargar empleados:', error);
        updateKPI('kpiEmpleados', 'Error');
    }
}

async function loadAsistenciaKPIs() {
    try {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];

        const asistenciasQuery = query(
            collection(db, "asistencias"),
            where("fecha", ">=", primerDiaMes)
        );
        const asistenciasSnapshot = await getDocs(asistenciasQuery);

        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const totalEmpleados = usuariosSnapshot.size;
        const diasMes = hoy.getDate();
        const asistenciasEsperadas = totalEmpleados * diasMes;
        const asistenciasReales = asistenciasSnapshot.size / 2;
        const tasaAsistencia = asistenciasEsperadas > 0
            ? ((asistenciasReales / asistenciasEsperadas) * 100).toFixed(1)
            : 0;

        updateKPI('kpiAsistencia', `${tasaAsistencia}%`);

        // Calcular tardanzas del mes actual
        let tardanzas = 0;
        asistenciasSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tipo === "entrada" && esTardanza(data.hora)) {
                tardanzas++;
            }
        });

        updateKPI('kpiTardanzas', tardanzas);

        // Calcular tendencias comparando con mes anterior
        const prevMonth = getPreviousMonthRange();
        const asistenciasPrevQuery = query(
            collection(db, "asistencias"),
            where("fecha", ">=", prevMonth.start),
            where("fecha", "<=", prevMonth.end)
        );

        const asistenciasPrevSnapshot = await getDocs(asistenciasPrevQuery);
        const diasMesPrev = new Date(prevMonth.end).getDate();
        const asistenciasEsperadasPrev = totalEmpleados * diasMesPrev;
        const asistenciasRealesPrev = asistenciasPrevSnapshot.size / 2;
        const tasaAsistenciaPrev = asistenciasEsperadasPrev > 0
            ? ((asistenciasRealesPrev / asistenciasEsperadasPrev) * 100)
            : 0;

        // Tendencia de asistencia (diferencia de tasas)
        const cambioAsistencia = parseFloat(tasaAsistencia) - tasaAsistenciaPrev;
        const kpiAsistenciaCard = document.querySelector('.kpi-card:nth-child(2)');
        updateKPITrend(kpiAsistenciaCard, cambioAsistencia, cambioAsistencia >= 0);

        // Calcular tardanzas del mes anterior
        let tardanzasPrev = 0;
        asistenciasPrevSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tipo === "entrada" && esTardanza(data.hora)) {
                tardanzasPrev++;
            }
        });

        // Tendencia de tardanzas (reducción es positivo)
        if (tardanzasPrev > 0) {
            const cambioTardanzas = ((tardanzas - tardanzasPrev) / tardanzasPrev) * 100;
            const kpiTardanzasCard = document.querySelector('.kpi-card:nth-child(3)');
            // Invertir lógica: menos tardanzas es mejor (verde)
            updateKPITrend(kpiTardanzasCard, cambioTardanzas, cambioTardanzas <= 0);
        }

    } catch (error) {
        console.error('❌ Error al cargar asistencias:', error);
        updateKPI('kpiAsistencia', 'Error');
        updateKPI('kpiTardanzas', 'Error');
    }
}

async function loadInventarioKPI() {
    try {
        const productosQuery = query(
            collection(db, "producto"),
            where("stock", "<", 10)
        );
        const productosSnapshot = await getDocs(productosQuery);
        const stockBajoActual = productosSnapshot.size;
        updateKPI('kpiStockBajo', stockBajoActual);

        // Para calcular tendencia, necesitaríamos histórico de stock
        // Por ahora, simulamos comparando con un valor guardado en localStorage
        const stockBajoPrevio = parseInt(localStorage.getItem('stockBajoPrevMonth') || stockBajoActual);

        if (stockBajoPrevio > 0 && stockBajoPrevio !== stockBajoActual) {
            const cambioStock = ((stockBajoActual - stockBajoPrevio) / stockBajoPrevio) * 100;
            const kpiStockCard = document.querySelector('.kpi-card:nth-child(4)');
            // Invertir lógica: menos productos con stock bajo es mejor (verde)
            updateKPITrend(kpiStockCard, cambioStock, cambioStock <= 0);
        }

        // Guardar valor actual para próxima comparación (esto se haría mejor con una colección de históricos)
        const hoy = new Date();
        if (hoy.getDate() === 1) {
            // Primer día del mes, guardar el valor del mes anterior
            localStorage.setItem('stockBajoPrevMonth', stockBajoActual);
        }
    } catch (error) {
        console.error('❌ Error al cargar inventario:', error);
        updateKPI('kpiStockBajo', 'Error');
    }
}

// ===================== GRÁFICOS =====================
async function loadCharts() {
    if (!db) return;

    try {
        console.log('📈 Cargando gráficos...');

        await Promise.all([
            loadAttendanceChart(),
            loadEmployeeChart(),
            loadStockChart()
        ]);

        console.log('✅ Gráficos cargados');
    } catch (error) {
        console.error('❌ Error al cargar gráficos:', error);
    }
}

async function loadAttendanceChart() {
    try {
        const hoy = new Date();
        const labels = [];
        const data = [];

        // Últimos 7 días
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() - i);
            const fechaStr = fecha.toISOString().split('T')[0];

            labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));

            const asistenciasQuery = query(
                collection(db, "asistencias"),
                where("fecha", "==", fechaStr),
                where("tipo", "==", "entrada")
            );
            const snapshot = await getDocs(asistenciasQuery);
            data.push(snapshot.size);
        }

        const ctx = document.getElementById('attendanceChart');
        if (ctx) {
            attendanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Asistencias',
                        data: data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Error en gráfico de asistencia:', error);
    }
}

async function loadEmployeeChart() {
    try {
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const roles = {};

        usuariosSnapshot.forEach(doc => {
            const user = doc.data();
            const rol = (user.rol || 'Sin rol').toLowerCase();
            const rolCapitalizado = rol.charAt(0).toUpperCase() + rol.slice(1);
            roles[rolCapitalizado] = (roles[rolCapitalizado] || 0) + 1;
        });

        const ctx = document.getElementById('employeeChart');
        if (ctx) {
            employeeChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(roles),
                    datasets: [{
                        data: Object.values(roles),
                        backgroundColor: [
                            '#667eea',
                            '#f093fb',
                            '#fa709a',
                            '#ffecd2',
                            '#30cfd0'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Error en gráfico de empleados:', error);
    }
}

async function loadStockChart() {
    try {
        const categoriasSnapshot = await getDocs(collection(db, "categoria"));
        const stockSnapshot = await getDocs(collection(db, "stock_inventario"));
        const articulosSnapshot = await getDocs(collection(db, "articulos"));

        // Mapear categorías
        const categoriasMap = {};
        categoriasSnapshot.forEach(doc => {
            const cat = doc.data();
            categoriasMap[cat.id_categoria] = cat.nombre;
        });

        // Calcular stock por categoría
        const stockPorCategoria = {};
        const articulosPorCategoria = {};

        articulosSnapshot.forEach(doc => {
            const articulo = doc.data();
            const catNombre = categoriasMap[articulo.id_categoria] || 'Sin categoría';
            articulosPorCategoria[articulo.id_articulo] = catNombre;
        });

        stockSnapshot.forEach(doc => {
            const stock = doc.data();
            const catNombre = articulosPorCategoria[stock.id_articulo] || 'Sin categoría';
            stockPorCategoria[catNombre] = (stockPorCategoria[catNombre] || 0) + parseInt(stock.stock || 0);
        });

        const ctx = document.getElementById('stockChart');
        if (ctx) {
            stockChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(stockPorCategoria),
                    datasets: [{
                        label: 'Stock Total',
                        data: Object.values(stockPorCategoria),
                        backgroundColor: [
                            '#667eea',
                            '#f093fb',
                            '#fa709a',
                            '#ffecd2',
                            '#30cfd0'
                        ],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Error en gráfico de stock:', error);
    }
}

// ===================== INICIALIZACIÓN =====================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando dashboard admin...");

    setTimeout(async () => {
        await loadDashboardKPIs();
        await loadCharts();
        console.log("✅ Dashboard admin listo");
    }, 100);
});

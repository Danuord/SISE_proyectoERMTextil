// ===================== REPORTES - LÓGICA PRINCIPAL =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("✅ REPORTES.JS CARGADO");

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = null;
const session = localStorage.getItem('textileflow_session');
if (session) {
    currentUser = JSON.parse(session);
}

let currentReportType = null;
let currentReportData = null;

// ===================== INICIALIZACIÓN =====================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando panel de reportes...");

    setupTabs();
    await loadEmployeeFilter();
    console.log("📊 Módulo de Reportes cargado");

    // Inicializar tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remover active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activar el seleccionado
            btn.classList.add('active');
            const targetContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            console.log(`📑 Tab activado: ${tabName}`);
        });
    });

    // ===== EVENT LISTENERS PARA FILTROS DE RRHH =====
    const hrFilterRole = document.getElementById('hrFilterRole');
    const hrFilterStatus = document.getElementById('hrFilterStatus');

    if (hrFilterRole) {
        hrFilterRole.addEventListener('change', () => {
            if (currentHRReportType) {
                console.log('🔄 Filtro de rol cambiado, regenerando reporte RRHH');
                generateHRReport();
            }
        });
    }

    if (hrFilterStatus) {
        hrFilterStatus.addEventListener('change', () => {
            if (currentHRReportType) {
                console.log('🔄 Filtro de estado cambiado, regenerando reporte RRHH');
                generateHRReport();
            }
        });
    }

    // ===== EVENT LISTENERS PARA FILTROS DE INVENTARIO =====
    const invFilterCategory = document.getElementById('invFilterCategory');
    const invFilterStock = document.getElementById('invFilterStock');

    if (invFilterCategory) {
        invFilterCategory.addEventListener('change', () => {
            if (currentInventoryReportType) {
                console.log('🔄 Filtro de categoría cambiado, regenerando reporte Inventario');
                generateInventoryReport();
            }
        });
    }

    if (invFilterStock) {
        invFilterStock.addEventListener('change', () => {
            if (currentInventoryReportType) {
                console.log('🔄 Filtro de stock cambiado, regenerando reporte Inventario');
                generateInventoryReport();
            }
        });
    }

    // Activar el primer tab por defecto
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    console.log("✅ Reportes inicializados");
});

// ===================== SETUP TABS =====================
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active to selected
            btn.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');

            console.log(`📊 Tab cambiado a: ${tabName}`);
        });
    });
}

// ===================== GRÁFICOS DEL DASHBOARD =====================
async function loadDashboardCharts() {
    // Gráfico de Asistencia (últimos 7 días)
    const labels = [];
    const dataCompletos = [];
    const dataIncompletos = [];

    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));

        const q = query(
            collection(db, "asistencias"),
            where("fecha", "==", fechaStr)
        );
        const snapshot = await getDocs(q);

        const porEmpleado = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!porEmpleado[data.userId]) {
                porEmpleado[data.userId] = { entrada: false, salida: false };
            }
            if (data.tipo === "entrada") porEmpleado[data.userId].entrada = true;
            if (data.tipo === "salida") porEmpleado[data.userId].salida = true;
        });

        let completos = 0, incompletos = 0;
        Object.values(porEmpleado).forEach(emp => {
            if (emp.entrada && emp.salida) completos++;
            else if (emp.entrada) incompletos++;
        });

        dataCompletos.push(completos);
        dataIncompletos.push(incompletos);
    }

    const ctxAttendance = document.getElementById('dashboardAttendanceChart');
    if (ctxAttendance) {
        new Chart(ctxAttendance, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Completos',
                        data: dataCompletos,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Incompletos',
                        data: dataIncompletos,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    // Gráfico de Nómina (últimos 6 meses)
    const mesesLabels = [];
    const nominaData = [];

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
        mesesLabels.push(mes);

        const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().split('T')[0];

        const q = query(
            collection(db, "pagos"),
            where("fecha", ">=", primerDia),
            where("fecha", "<=", ultimoDia)
        );
        const snapshot = await getDocs(q);

        let total = 0;
        snapshot.forEach(doc => {
            total += doc.data().monto || 0;
        });
        nominaData.push(total);
    }

    const ctxPayroll = document.getElementById('dashboardPayrollChart');
    if (ctxPayroll) {
        new Chart(ctxPayroll, {
            type: 'line',
            data: {
                labels: mesesLabels,
                datasets: [{
                    label: 'Nómina Mensual',
                    data: nominaData,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// ===================== CARGAR FILTRO DE EMPLEADOS =====================
async function loadEmployeeFilter() {
    const select = document.getElementById('filterEmployee');
    if (!select) return;

    try {
        const snapshot = await getDocs(collection(db, "usuario"));
        select.innerHTML = '<option value="">Todos los empleados</option>';

        snapshot.forEach(doc => {
            const user = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error al cargar empleados:", error);
    }
}

// ===================== SELECCIONAR REPORTE =====================
window.selectReport = function (reportType) {
    currentReportType = reportType;

    const reportArea = document.getElementById('reportArea');
    const reportTitle = document.getElementById('reportTitle');
    const filterMonth = document.getElementById('filterMonth');

    if (reportArea && reportTitle) {
        reportArea.style.display = 'block';

        const titles = {
            'asistencia-mensual': 'Reporte Mensual de Asistencias',
            'tardanzas': 'Reporte de Tardanzas',
            'ausencias': 'Reporte de Ausencias'
        };

        reportTitle.textContent = titles[reportType] || 'Reporte';

        // Establecer mes actual por defecto
        if (filterMonth && !filterMonth.value) {
            const hoy = new Date();
            const mesActual = hoy.toISOString().substring(0, 7); // YYYY-MM
            filterMonth.value = mesActual;
        }

        // Limpiar resultados anteriores
        document.getElementById('reportResults').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-info-circle" style="font-size: 3rem; color: #667eea; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #374151;">Configura los filtros y genera el reporte</h3>
                <p style="margin: 0;">Selecciona el mes y opcionalmente un empleado específico, luego haz clic en "Generar Reporte"</p>
            </div>
        `;
        document.getElementById('exportButtons').style.display = 'none';

        // Scroll to report area
        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log(`📊 Reporte seleccionado: ${reportType}`);
    }
};

// ===================== GENERAR REPORTE =====================
window.generateReport = async function () {
    const month = document.getElementById('filterMonth').value;
    const employeeId = document.getElementById('filterEmployee').value;

    if (!month) {
        alert('⚠️ Por favor selecciona un mes');
        document.getElementById('filterMonth').focus();
        return;
    }

    if (!currentReportType) {
        alert('⚠️ Por favor selecciona un tipo de reporte primero');
        return;
    }

    const resultsDiv = document.getElementById('reportResults');
    const exportButtons = document.getElementById('exportButtons');

    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea; margin-bottom: 15px;"></i>
            <h3 style="margin: 0; color: #374151;">Generando reporte...</h3>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Consultando datos de Firestore</p>
        </div>
    `;

    try {
        console.log(`🔄 Generando reporte: ${currentReportType}, Mes: ${month}, Empleado: ${employeeId || 'Todos'}`);

        switch (currentReportType) {
            case 'asistencia-mensual':
                await generateMonthlyAttendanceReport(month, employeeId);
                break;
            case 'tardanzas':
                await generateLatenessReport(month, employeeId);
                break;
            case 'ausencias':
                await generateAbsencesReport(month, employeeId);
                break;
            default:
                resultsDiv.innerHTML = '<p style="text-align:center; color: #ef4444;">Tipo de reporte no implementado</p>';
                return;
        }

        exportButtons.style.display = 'flex';
        console.log('✅ Reporte generado exitosamente');
    } catch (error) {
        console.error("❌ Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
                <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 0.9rem;">Revisa la consola para más detalles</p>
            </div>
        `;
    }
};

// ===================== REPORTE MENSUAL DE ASISTENCIAS =====================
async function generateMonthlyAttendanceReport(month, employeeId) {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;

    let q = query(
        collection(db, "asistencias"),
        where("fecha", ">=", startDate),
        where("fecha", "<=", endDate)
    );

    const snapshot = await getDocs(q);
    const usuariosSnapshot = await getDocs(collection(db, "usuario"));

    // Crear mapa de usuarios
    const usuariosMap = {};
    usuariosSnapshot.forEach(doc => {
        const user = doc.data();
        usuariosMap[doc.id] = {
            displayName: user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email,
            totalDias: 0,
            diasCompletos: 0,
            tardanzas: 0,
            totalHoras: 0
        };
    });

    // Agrupar por empleado y fecha
    const porEmpleadoFecha = {};

    snapshot.forEach(doc => {
        const data = doc.data();

        // Filtrar por empleado si se especificó
        if (employeeId && data.userId !== employeeId) return;

        if (!porEmpleadoFecha[data.userId]) {
            porEmpleadoFecha[data.userId] = {};
        }
        if (!porEmpleadoFecha[data.userId][data.fecha]) {
            porEmpleadoFecha[data.userId][data.fecha] = { entrada: null, salida: null };
        }

        if (data.tipo === "entrada") {
            porEmpleadoFecha[data.userId][data.fecha].entrada = data.hora;
        }
        if (data.tipo === "salida") {
            porEmpleadoFecha[data.userId][data.fecha].salida = data.hora;
        }
    });

    // Calcular estadísticas
    Object.entries(porEmpleadoFecha).forEach(([userId, fechas]) => {
        if (!usuariosMap[userId]) return;

        Object.values(fechas).forEach(dia => {
            if (dia.entrada) {
                usuariosMap[userId].totalDias++;

                if (dia.salida) {
                    usuariosMap[userId].diasCompletos++;

                    const [hE, mE] = dia.entrada.split(':').map(Number);
                    const [hS, mS] = dia.salida.split(':').map(Number);
                    const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
                    usuariosMap[userId].totalHoras += minutosTotal / 60;
                }

                const [h, m] = dia.entrada.split(':').map(Number);
                if (h > 8 || (h === 8 && m > 30)) {
                    usuariosMap[userId].tardanzas++;
                }
            }
        });
    });

    // Renderizar tabla
    const resultsDiv = document.getElementById('reportResults');
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Empleado</th>
                    <th>Total Días</th>
                    <th>Días Completos</th>
                    <th>Tardanzas</th>
                    <th>Total Horas</th>
                    <th>Prom. Horas/Día</th>
                    <th>% Asistencia</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(usuariosMap)
        .filter(([_, stats]) => stats.totalDias > 0)
        .sort((a, b) => b[1].totalDias - a[1].totalDias)
        .forEach(([userId, stats]) => {
            const promHoras = stats.diasCompletos > 0 ? (stats.totalHoras / stats.diasCompletos).toFixed(2) : "0.00";
            const asistencia = stats.totalDias > 0 ? ((stats.diasCompletos / stats.totalDias) * 100).toFixed(0) : "0";

            html += `
                <tr>
                    <td>${stats.displayName}</td>
                    <td>${stats.totalDias}</td>
                    <td>${stats.diasCompletos}</td>
                    <td>${stats.tardanzas}</td>
                    <td>${stats.totalHoras.toFixed(2)}h</td>
                    <td>${promHoras}h</td>
                    <td><span class="status-badge ${asistencia >= 90 ? 'status-complete' : asistencia >= 70 ? 'status-incomplete' : 'status-absent'}">${asistencia}%</span></td>
                </tr>
            `;
        });

    // Verificar si hay datos
    const hasData = Object.values(usuariosMap).some(stats => stats.totalDias > 0);
    if (!hasData) {
        html += '<tr><td colspan="7" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron registros de asistencia para este período</td></tr>';
    }

    html += '</tbody></table>';
    resultsDiv.innerHTML = html;

    // Guardar datos para exportación
    currentReportData = {
        type: 'asistencia-mensual',
        month,
        data: usuariosMap
    };

    console.log(`✅ Reporte mensual generado: ${hasData ? Object.keys(usuariosMap).length + ' empleados' : 'Sin datos'}`);
}

// ===================== REPORTE DE TARDANZAS =====================
async function generateLatenessReport(month, employeeId) {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;

    const q = query(
        collection(db, "asistencias"),
        where("fecha", ">=", startDate),
        where("fecha", "<=", endDate),
        where("tipo", "==", "entrada")
    );

    const snapshot = await getDocs(q);
    const tardanzas = [];

    snapshot.forEach(doc => {
        const data = doc.data();

        if (employeeId && data.userId !== employeeId) return;

        if (data.hora) {
            const [h, m] = data.hora.split(':').map(Number);
            if (h > 8 || (h === 8 && m > 30)) {
                const minutosTarde = (h - 8) * 60 + (m - 30);
                tardanzas.push({
                    displayName: data.displayName || 'Desconocido',
                    fecha: data.fecha,
                    hora: data.hora,
                    minutosTarde
                });
            }
        }
    });

    const resultsDiv = document.getElementById('reportResults');
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Empleado</th>
                    <th>Fecha</th>
                    <th>Hora Entrada</th>
                    <th>Minutos Tarde</th>
                </tr>
            </thead>
            <tbody>
    `;

    tardanzas
        .sort((a, b) => b.minutosTarde - a.minutosTarde)
        .forEach(t => {
            html += `
                <tr>
                    <td>${t.displayName}</td>
                    <td>${new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</td>
                    <td>${t.hora}</td>
                    <td><span class="status-badge status-late">${t.minutosTarde} min</span></td>
                </tr>
            `;
        });

    if (tardanzas.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center;">No se encontraron tardanzas</td></tr>';
    }

    html += '</tbody></table>';
    resultsDiv.innerHTML = html;

    currentReportData = {
        type: 'tardanzas',
        month,
        data: tardanzas
    };
}

// ===================== REPORTE DE AUSENCIAS =====================
async function generateAbsencesReport(month, employeeId) {
    const resultsDiv = document.getElementById('reportResults');
    resultsDiv.innerHTML = '<p style="text-align:center; padding:40px;">Reporte de ausencias en desarrollo...</p>';
}

// ===================== EXPORTAR A PDF =====================
window.exportToPDF = function () {
    if (!currentReportData) {
        alert('No hay datos para exportar');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('TextileFlow ERP - Reporte', 14, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

    // Aquí se agregaría la lógica específica según el tipo de reporte
    // Por ahora, guardamos el PDF básico
    doc.save(`reporte_${currentReportData.type}_${currentReportData.month}.pdf`);

    console.log('✅ PDF exportado');
};

// ===================== EXPORTAR A EXCEL =====================
window.exportToExcel = function () {
    if (!currentReportData) {
        alert('⚠️ No hay datos para exportar. Por favor genera un reporte primero.');
        return;
    }

    try {
        // Crear workbook
        const wb = XLSX.utils.book_new();

        // Preparar datos según el tipo de reporte
        let data = [];
        let sheetName = 'Reporte';

        if (currentReportData.type === 'asistencia-mensual') {
            sheetName = 'Resumen Mensual';
            data.push(['Empleado', 'Total Días', 'Días Completos', 'Tardanzas', 'Total Horas', 'Prom. Horas/Día', '% Asistencia']);

            Object.values(currentReportData.data)
                .filter(stats => stats.totalDias > 0)
                .forEach(stats => {
                    const promHoras = stats.diasCompletos > 0 ? (stats.totalHoras / stats.diasCompletos).toFixed(2) : "0.00";
                    const asistencia = stats.totalDias > 0 ? ((stats.diasCompletos / stats.totalDias) * 100).toFixed(0) : "0";

                    data.push([
                        stats.displayName,
                        stats.totalDias,
                        stats.diasCompletos,
                        stats.tardanzas,
                        stats.totalHoras.toFixed(2),
                        promHoras,
                        asistencia + '%'
                    ]);
                });
        } else if (currentReportData.type === 'tardanzas') {
            sheetName = 'Tardanzas';
            data.push(['Empleado', 'Fecha', 'Hora Entrada', 'Minutos Tarde']);

            currentReportData.data.forEach(t => {
                data.push([
                    t.displayName,
                    new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-ES'),
                    t.hora,
                    t.minutosTarde
                ]);
            });
        } else {
            alert('📊 Tipo de reporte no soportado para exportación a Excel aún.');
            return;
        }

        // Crear worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generar archivo
        const fileName = `reporte_${currentReportData.type}_${currentReportData.month || new Date().toISOString().slice(0, 7)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('✅ Excel exportado:', fileName);
    } catch (error) {
        console.error('❌ Error al exportar Excel:', error);
        alert('Error al exportar a Excel. Verifica que la librería XLSX esté cargada.');
    }
};

// ===================== IMPRIMIR REPORTE =====================
window.printReport = function () {
    const printableArea = document.getElementById('printableArea');

    if (!printableArea) {
        alert('⚠️ No hay contenido para imprimir. Por favor genera un reporte primero.');
        return;
    }

    window.print();
};


// ===================== NÓMINA REPORTS =====================
let currentPayrollReportType = null;

window.selectPayrollReport = function (reportType) {
    currentPayrollReportType = reportType;
    const reportArea = document.getElementById('payrollReportArea');
    const reportTitle = document.getElementById('payrollReportTitle');
    const filterMonth = document.getElementById('payrollFilterMonth');

    if (reportArea && reportTitle) {
        reportArea.style.display = 'block';

        const titles = {
            'resumen-mensual': 'Resumen Mensual de Nómina',
            'por-empleado': 'Nómina por Empleado',
            'comparativo': 'Comparativo Mensual de Nómina'
        };

        reportTitle.textContent = titles[reportType] || 'Reporte';

        if (filterMonth && !filterMonth.value) {
            const hoy = new Date();
            filterMonth.value = hoy.toISOString().substring(0, 7);
        }

        document.getElementById('payrollResults').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-info-circle" style="font-size: 2.5rem; color: #667eea; margin-bottom: 15px;"></i>
                <p style="margin: 0;">Configura los filtros y haz clic en "Generar Reporte"</p>
            </div>
        `;
        document.getElementById('payrollExportButtons').style.display = 'none';
        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log(`💰 Reporte de nómina seleccionado: ${reportType}`);
    }
};

window.generatePayrollReport = async function () {
    const month = document.getElementById('payrollFilterMonth').value;
    const employeeId = document.getElementById('payrollFilterEmployee').value;
    const reportType = currentPayrollReportType;

    if (!month) {
        alert('⚠️ Por favor selecciona un mes');
        return;
    }

    if (!reportType) {
        alert('⚠️ Por favor selecciona un tipo de reporte primero');
        return;
    }

    const resultsDiv = document.getElementById('payrollResults');
    const exportButtons = document.getElementById('payrollExportButtons');

    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea; margin-bottom: 15px;"></i>
            <h3 style="margin: 0; color: #374151;">Generando reporte...</h3>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Consultando datos de Firestore</p>
        </div>
    `;

    try {
        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;
        const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;

        // Obtener pagos del período
        const q = query(
            collection(db, "pagos"),
            where("fecha", ">=", startDate),
            where("fecha", "<=", endDate)
        );
        const pagosSnapshot = await getDocs(q);

        // Obtener usuarios
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const usuariosMap = {};
        usuariosSnapshot.forEach(doc => {
            const user = doc.data();
            usuariosMap[doc.id] = {
                displayName: user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email,
                email: user.email,
                rol: user.rol || 'Empleado'
            };
        });

        // Agrupar pagos por empleado
        const pagosPorEmpleado = {};
        pagosSnapshot.forEach(doc => {
            const pago = doc.data();
            if (!employeeId || pago.userId === employeeId) {
                if (!pagosPorEmpleado[pago.userId]) {
                    pagosPorEmpleado[pago.userId] = {
                        ...usuariosMap[pago.userId],
                        totalPagos: 0,
                        montoPagado: 0,
                        pagos: []
                    };
                }
                pagosPorEmpleado[pago.userId].totalPagos++;
                pagosPorEmpleado[pago.userId].montoPagado += parseFloat(pago.monto || 0);
                pagosPorEmpleado[pago.userId].pagos.push(pago);
            }
        });

        // Renderizar según tipo de reporte
        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de Nómina - ${new Date(year, monthNum - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Empleado</th>
                            <th>Rol</th>
                            <th>Total Pagos</th>
                            <th>Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.values(pagosPorEmpleado)
            .sort((a, b) => b.montoPagado - a.montoPagado)
            .forEach(emp => {
                html += `
                    <tr>
                        <td><strong>${emp.displayName}</strong><br><small style="color: #9ca3af;">${emp.email}</small></td>
                        <td>${emp.rol}</td>
                        <td>${emp.totalPagos}</td>
                        <td><span class="status-badge status-complete">$${emp.montoPagado.toFixed(2)}</span></td>
                    </tr>
                `;
            });

        if (Object.keys(pagosPorEmpleado).length === 0) {
            html += '<tr><td colspan="4" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron pagos para este período</td></tr>';
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        // Guardar datos para exportación
        currentReportData = {
            type: 'nomina-mensual',
            month,
            data: pagosPorEmpleado
        };

        exportButtons.style.display = 'flex';
        console.log('✅ Reporte de nómina generado');
    } catch (error) {
        console.error("❌ Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
            </div>
        `;
    }
};

// ===================== RRHH REPORTS =====================
let currentHRReportType = null;

window.selectHRReport = function (reportType) {
    currentHRReportType = reportType;
    const reportArea = document.getElementById('hrReportArea');
    const reportTitle = document.getElementById('hrReportTitle');

    if (reportArea && reportTitle) {
        reportArea.style.display = 'block';

        const titles = {
            'empleados-activos': 'Empleados Activos',
            'rotacion': 'Reporte de Rotación'
        };

        reportTitle.textContent = titles[reportType] || 'Reporte';

        document.getElementById('hrResults').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-info-circle" style="font-size: 2.5rem; color: #667eea; margin-bottom: 15px;"></i>
                <p style="margin: 0;">Configura los filtros y haz clic en "Generar Reporte"</p>
            </div>
        `;
        document.getElementById('hrExportButtons').style.display = 'none';
        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log(`👥 Reporte de RRHH seleccionado: ${reportType}`);
    }
};

window.generateHRReport = async function () {
    const reportType = currentHRReportType;
    const filterRole = document.getElementById('hrFilterRole')?.value || '';
    const filterStatus = document.getElementById('hrFilterStatus')?.value || '';

    if (!reportType) {
        alert('⚠️ Por favor selecciona un tipo de reporte primero');
        return;
    }

    const resultsDiv = document.getElementById('hrResults');
    const exportButtons = document.getElementById('hrExportButtons');

    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea; margin-bottom: 15px;"></i>
            <h3 style="margin: 0; color: #374151;">Generando reporte...</h3>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Consultando datos de Firestore</p>
        </div>
    `;

    try {
        // Obtener todos los usuarios
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const empleados = [];

        usuariosSnapshot.forEach(doc => {
            const user = doc.data();
            empleados.push({
                id: doc.id,
                displayName: user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email,
                email: user.email,
                rol: user.rol || 'N/A',
                tipo_documento: user.tipo_documento || 'N/A',
                numero_documento: user.documento || 'N/A',
                telefono: user.telefono || 'N/A',
                direccion: user.direccion || 'N/A',
                departamento: user.departamento || 'N/A',
                fechaIngreso: user.fechaIngreso || 'N/A',
                fechaSalida: user.fechaSalida || '-',
                estado: user.estado || 'activo'
            });
        });

        // Aplicar filtros
        let empleadosFiltrados = empleados;

        console.log('🔍 Filtros aplicados:', { reportType, filterRole, filterStatus });
        console.log('📊 Total empleados antes de filtrar:', empleados.length);

        // Filtrar por tipo de reporte
        // NOTA: Por defecto muestra TODOS los usuarios (activos e inactivos)
        // El filtro de estado se aplica solo si el usuario selecciona un estado específico
        console.log('📋 Mostrando todos los usuarios (activos e inactivos)');
        // Si es 'rotacion', muestra TODOS (activos e inactivos)

        // Filtrar por rol (solo si el usuario seleccionó un rol específico)
        if (filterRole) {
            console.log('🎭 Filtrando por rol:', filterRole);
            empleadosFiltrados = empleadosFiltrados.filter(emp => {
                const empRol = (emp.rol || '').toLowerCase();
                const filtroRol = filterRole.toLowerCase();
                console.log(`  Comparando: "${empRol}" === "${filtroRol}"`, empRol === filtroRol);
                return empRol === filtroRol;
            });
            console.log('✅ Después de filtrar por rol:', empleadosFiltrados.length);
        }

        // Filtrar por estado (solo si el usuario seleccionó un estado específico)
        if (filterStatus) {
            console.log('📌 Filtrando por estado:', filterStatus);
            empleadosFiltrados = empleadosFiltrados.filter(emp => {
                const empEstado = (emp.estado || '').toLowerCase();
                const filtroEstado = filterStatus.toLowerCase();
                console.log(`  Comparando: "${empEstado}" === "${filtroEstado}"`, empEstado === filtroEstado);
                return empEstado === filtroEstado;
            });
            console.log('✅ Después de filtrar por estado:', empleadosFiltrados.length);
        }

        console.log(`📊 RRHH Report - Total empleados: ${empleados.length}, Filtrados: ${empleadosFiltrados.length}, Tipo: ${reportType}`);

        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de RRHH - ${reportType === 'empleados-activos' ? 'Empleados Activos' : 'Rotación'}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Total de empleados: ${empleadosFiltrados.length}</p>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
                </div>
                <table>
                    <thead>
                        <tr>
        `;

        // Columnas diferentes según tipo de reporte
        if (reportType === 'empleados-activos') {
            html += `
                            <th>Nombre</th>
                            <th>Rol</th>
                            <th>Tipo Doc.</th>
                            <th>Nro. Doc.</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>Email</th>
                            <th>Estado</th>
            `;
        } else {
            // Rotación
            html += `
                            <th>Empleado</th>
                            <th>Rol</th>
                            <th>Fecha Ingreso</th>
                            <th>Fecha Salida</th>
                            <th>Estado</th>
            `;
        }

        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        empleadosFiltrados
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .forEach(emp => {
                const estadoBadge = emp.estado === 'activo' ? 'status-complete' : 'status-absent';
                const rolDisplay = emp.rol ? emp.rol.charAt(0).toUpperCase() + emp.rol.slice(1) : 'Empleado';

                if (reportType === 'empleados-activos') {
                    // Tabla de Empleados Activos
                    html += `
                        <tr>
                            <td><strong>${emp.displayName}</strong></td>
                            <td>${rolDisplay}</td>
                            <td>${emp.tipo_documento}</td>
                            <td>${emp.numero_documento}</td>
                            <td>${emp.telefono}</td>
                            <td>${emp.direccion}</td>
                            <td><small style="color: #6b7280;">${emp.email}</small></td>
                            <td><span class="status-badge ${estadoBadge}">${emp.estado}</span></td>
                        </tr>
                    `;
                } else {
                    // Tabla de Rotación
                    html += `
                        <tr>
                            <td><strong>${emp.displayName}</strong><br><small style="color: #9ca3af;">${emp.email}</small></td>
                            <td>${rolDisplay}</td>
                            <td>${emp.fechaIngreso}</td>
                            <td>${emp.fechaSalida}</td>
                            <td><span class="status-badge ${estadoBadge}">${emp.estado}</span></td>
                        </tr>
                    `;
                }
            });

        if (empleadosFiltrados.length === 0) {
            const colspan = reportType === 'empleados-activos' ? 8 : 5;
            html += `<tr><td colspan="${colspan}" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron empleados con los filtros seleccionados</td></tr>`;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        // Guardar datos para exportación
        currentReportData = {
            type: 'rrhh-empleados',
            data: empleadosFiltrados
        };

        exportButtons.style.display = 'flex';
        console.log('✅ Reporte de RRHH generado');
    } catch (error) {
        console.error("❌ Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
            </div>
        `;
    }
};

// ===================== INVENTARIO REPORTS =====================
let currentInventoryReportType = null;

window.selectInventoryReport = function (reportType) {
    currentInventoryReportType = reportType;
    const reportArea = document.getElementById('inventoryReportArea');
    const reportTitle = document.getElementById('inventoryReportTitle');

    if (reportArea && reportTitle) {
        reportArea.style.display = 'block';

        const titles = {
            'stock-actual': 'Stock Actual',
            'stock-bajo': 'Productos con Stock Bajo',
            'valorizacion': 'Valorización de Inventario'
        };

        reportTitle.textContent = titles[reportType] || 'Reporte';

        document.getElementById('inventoryResults').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-info-circle" style="font-size: 2.5rem; color: #667eea; margin-bottom: 15px;"></i>
                <p style="margin: 0;">Configura los filtros y haz clic en "Generar Reporte"</p>
            </div>
        `;
        document.getElementById('inventoryExportButtons').style.display = 'none';

        // Cargar categorías en el filtro
        loadInventoryCategories();

        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log(`📦 Reporte de inventario seleccionado: ${reportType}`);
    }
};

// Cargar categorías desde la base de datos
async function loadInventoryCategories() {
    try {
        const categorySelect = document.getElementById('inventoryFilterCategory');
        if (!categorySelect) return;

        // Limpiar opciones existentes excepto la primera
        categorySelect.innerHTML = '<option value="">Todas las categorías</option>';

        // Obtener categorías de Firestore
        const categoriasSnapshot = await getDocs(collection(db, "categoria"));

        categoriasSnapshot.forEach(doc => {
            const categoria = doc.data();
            const option = document.createElement('option');
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre;
            categorySelect.appendChild(option);
        });

        console.log(`✅ ${categoriasSnapshot.size} categorías cargadas en el filtro`);
    } catch (error) {
        console.error("❌ Error al cargar categorías:", error);
    }
}

window.generateInventoryReport = async function () {
    const reportType = currentInventoryReportType;

    if (!reportType) {
        alert('⚠️ Por favor selecciona un tipo de reporte primero');
        return;
    }

    const resultsDiv = document.getElementById('inventoryResults');
    const exportButtons = document.getElementById('inventoryExportButtons');

    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea; margin-bottom: 15px;"></i>
            <h3 style="margin: 0; color: #374151;">Generando reporte...</h3>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Consultando datos de Firestore</p>
        </div>
    `;

    try {
        // Obtener artículos (la colección se llama "articulos" no "productos")
        const articulosSnapshot = await getDocs(collection(db, "articulos"));
        const productos = [];

        articulosSnapshot.forEach(doc => {
            const articulo = doc.data();
            productos.push({
                id: doc.id,
                id_articulo: articulo.id_articulo, // ID correlativo para match con stock
                nombre: articulo.nombre || 'Sin nombre',
                categoria: articulo.id_categoria || 'Sin categoría',
                stock: 0, // Se calculará del stock_inventario
                stockMinimo: parseInt(articulo.stock_minimo || 10),
                precio: parseFloat(articulo.precio_base || 0),
                valorTotal: 0 // Se calculará después
            });
        });

        // Obtener stock real de la colección stock_inventario
        const stockSnapshot = await getDocs(collection(db, "stock_inventario"));
        const stockPorArticulo = {};

        stockSnapshot.forEach(doc => {
            const stockData = doc.data();
            const idArticulo = stockData.id_articulo;
            if (!stockPorArticulo[idArticulo]) {
                stockPorArticulo[idArticulo] = 0;
            }
            stockPorArticulo[idArticulo] += parseInt(stockData.stock || 0);
        });

        console.log('📦 Stock por artículo:', stockPorArticulo);
        console.log('📦 Productos:', productos.map(p => ({ id_articulo: p.id_articulo, nombre: p.nombre })));

        // Actualizar stock y calcular valor total
        productos.forEach(prod => {
            const idArticulo = prod.id_articulo; // Usar id_articulo correlativo, no el ID del documento
            prod.stock = stockPorArticulo[idArticulo] || 0;
            prod.valorTotal = prod.stock * prod.precio;
        });

        // Filtrar según tipo de reporte
        let productosFiltrados = productos;
        if (reportType === 'stock-bajo') {
            productosFiltrados = productos.filter(p => p.stock <= p.stockMinimo);
        }

        // Obtener nombres de categorías
        const categoriasSnapshot = await getDocs(collection(db, "categoria"));
        const categoriasMap = {};
        categoriasSnapshot.forEach(doc => {
            const cat = doc.data();
            categoriasMap[cat.id_categoria] = cat.nombre;
        });

        // Actualizar nombres de categorías en productos
        productosFiltrados.forEach(prod => {
            prod.categoriaNombre = categoriasMap[prod.categoria] || 'Sin categoría';
        });

        // Aplicar filtro de categoría
        const filterCategory = document.getElementById('inventoryFilterCategory')?.value || '';
        if (filterCategory) {
            productosFiltrados = productosFiltrados.filter(p => p.categoria == filterCategory);
            console.log(`🔍 Filtrado por categoría ${filterCategory}:`, productosFiltrados.length);
        }

        // Obtener opción de ordenamiento
        const sortOption = document.getElementById('inventoryFilterSort')?.value || 'nombre';
        console.log(`📊 Ordenando por: ${sortOption}`);

        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const totalValor = productosFiltrados.reduce((sum, p) => sum + p.valorTotal, 0);

        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de Inventario - ${reportType === 'stock-actual' ? 'Stock Actual' : reportType === 'stock-bajo' ? 'Stock Bajo' : 'Valorización'}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Total de productos: ${productosFiltrados.length}</p>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock Actual</th>
        `;

        // Columnas condicionales según tipo de reporte
        if (reportType === 'stock-bajo' || reportType === 'stock-actual') {
            html += '<th>Stock Mínimo</th>';
        }

        html += '<th>Precio Unit.</th>';

        if (reportType === 'valorizacion') {
            html += '<th>Valor Total</th>';
        }

        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Ordenar productos según la opción seleccionada
        productosFiltrados.sort((a, b) => {
            switch (sortOption) {
                case 'stock':
                    return a.stock - b.stock; // Ascendente
                case 'precio':
                    return b.precio - a.precio; // Descendente
                case 'nombre':
                default:
                    return a.nombre.localeCompare(b.nombre); // Alfabético
            }
        });

        productosFiltrados
            .forEach(prod => {
                const stockBadge = prod.stock <= prod.stockMinimo ? 'status-absent' : prod.stock <= prod.stockMinimo * 1.5 ? 'status-incomplete' : 'status-complete';
                html += `
                    <tr>
                        <td>${prod.id_articulo || '-'}</td>
                        <td><strong>${prod.nombre}</strong></td>
                        <td>${prod.categoriaNombre}</td>
                        <td><span class="status-badge ${stockBadge}">${prod.stock}</span></td>
                `;

                // Columnas condicionales
                if (reportType === 'stock-bajo' || reportType === 'stock-actual') {
                    html += `<td>${prod.stockMinimo}</td>`;
                }

                html += `<td>$${prod.precio.toFixed(2)}</td>`;

                if (reportType === 'valorizacion') {
                    html += `<td>$${prod.valorTotal.toFixed(2)}</td>`;
                }

                html += `</tr>`;
            });

        if (productosFiltrados.length === 0) {
            const colspan = reportType === 'valorizacion' ? 6 : 7;
            html += `<tr><td colspan="${colspan}" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron productos</td></tr>`;
        }

        // Agregar fila de total solo en valorización
        if (reportType === 'valorizacion' && productosFiltrados.length > 0) {
            html += `
                <tr style="background: #f3f4f6; font-weight: 600; border-top: 2px solid #667eea;">
                    <td colspan="5" style="text-align: right; padding: 1rem;">VALOR TOTAL:</td>
                    <td style="color: #667eea; font-size: 1.1rem;">$${totalValor.toFixed(2)}</td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        // Guardar datos para exportación
        currentReportData = {
            type: 'inventario-' + reportType,
            data: productosFiltrados
        };

        exportButtons.style.display = 'flex';
        console.log('✅ Reporte de inventario generado');
    } catch (error) {
        console.error("❌ Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
            </div>
        `;
    }
};

console.log("✅ Reportes.js completamente cargado");

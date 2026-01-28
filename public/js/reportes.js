import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", async () => {

    setupTabs();
    await loadEmployeeFilter();

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

        });
    });

    // ===== EVENT LISTENERS PARA FILTROS DE RRHH =====
    const hrFilterRole = document.getElementById('hrFilterRole');
    const hrFilterStatus = document.getElementById('hrFilterStatus');

    if (hrFilterRole) {
        hrFilterRole.addEventListener('change', () => {
            if (currentHRReportType) {
                generateHRReport();
            }
        });
    }

    if (hrFilterStatus) {
        hrFilterStatus.addEventListener('change', () => {
            if (currentHRReportType) {
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

    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

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
    const payrollSelect = document.getElementById('payrollFilterEmployee');

    if (!select && !payrollSelect) return;

    try {
        const snapshot = await getDocs(collection(db, "usuario"));
        const options = '<option value="">Todos los empleados</option>';
        let optionsHtml = '';

        snapshot.forEach(doc => {
            const user = doc.data();
            const optionHtml = `<option value="${doc.id}">${user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email}</option>`;
            optionsHtml += optionHtml;
        });

        if (select) {
            select.innerHTML = options + optionsHtml;
        }

        if (payrollSelect) {
            payrollSelect.innerHTML = options + optionsHtml;
        }

    } catch (error) {
        console.error("Error al cargar empleados:", error);
    }
}

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
            const mesActual = hoy.toISOString().substring(0, 7);
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

        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    }
};

// ===================== GENERAR REPORTE =====================
window.generateReport = async function () {
    const month = document.getElementById('filterMonth').value;
    const employeeId = document.getElementById('filterEmployee').value;

    if (!month) {
        alert('Por favor selecciona un mes');
        document.getElementById('filterMonth').focus();
        return;
    }

    if (!currentReportType) {
        alert('Por favor selecciona un tipo de reporte primero');
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
        console.log(`Generando reporte: ${currentReportType}, Mes: ${month}, Empleado: ${employeeId || 'Todos'}`);

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
        console.log('Reporte generado exitosamente');
    } catch (error) {
        console.error("Error al generar reporte:", error);
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

    // Creando mapa de usuarios
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

    console.log(`Reporte mensual generado: ${hasData ? Object.keys(usuariosMap).length + ' empleados' : 'Sin datos'}`);
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

    doc.save(`reporte_${currentReportData.type}_${currentReportData.month}.pdf`);

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
        } else if (currentReportData.type === 'nomina-mensual') {
            sheetName = 'Nómina Mensual';
            data.push(['Empleado', 'Rol', 'Email', 'Salario Base', 'Bonos', 'Deducciones', 'Salario Neto']);

            Object.values(currentReportData.data)
                .sort((a, b) => b.montoPagado - a.montoPagado)
                .forEach(emp => {
                    data.push([
                        emp.displayName,
                        emp.rol,
                        emp.email,
                        emp.salarioTotal.toFixed(2),
                        emp.bonoTotal.toFixed(2),
                        emp.deduccionTotal.toFixed(2),
                        emp.montoPagado.toFixed(2)
                    ]);
                });

            // Agregar totales
            if (currentReportData.totales) {
                data.push([]);
                data.push(['TOTALES', '', '',
                    currentReportData.totales.salarios.toFixed(2),
                    currentReportData.totales.bonos.toFixed(2),
                    currentReportData.totales.deducciones.toFixed(2),
                    currentReportData.totales.neto.toFixed(2)
                ]);
            }
        } else if (currentReportData.type === 'por-empleado') {
            sheetName = 'Historial Empleado';
            data.push(['Período', 'Salario', 'Bonos', 'Deducciones', 'Total Neto', 'Detalle']);

            currentReportData.data.forEach(pago => {
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const [año, mes] = pago.periodo_pago.split('-');
                const periodoFormato = `${meses[parseInt(mes) - 1]} ${año}`;

                data.push([
                    periodoFormato,
                    parseFloat(pago.salario || 0).toFixed(2),
                    parseFloat(pago.bono || 0).toFixed(2),
                    parseFloat(pago.deduccion || 0).toFixed(2),
                    parseFloat(pago.pago_total || 0).toFixed(2),
                    pago.detalle || ''
                ]);
            });

            if (currentReportData.totales) {
                data.push([]);
                data.push(['TOTALES',
                    currentReportData.totales.salarios.toFixed(2),
                    currentReportData.totales.bonos.toFixed(2),
                    currentReportData.totales.deducciones.toFixed(2),
                    currentReportData.totales.neto.toFixed(2),
                    ''
                ]);
            }
        } else if (currentReportData.type === 'comparativo') {
            sheetName = 'Comparativo';
            data.push(['Período', 'Cantidad Pagos', 'Total Salarios', 'Total Bonos', 'Total Deduc.', 'Total Neto']);

            currentReportData.meses.forEach(mes => {
                const datos = currentReportData.data[mes];
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const [año, mesNum] = mes.split('-');
                const mesFormato = `${meses[parseInt(mesNum) - 1]} ${año}`;

                data.push([
                    mesFormato,
                    datos.cantidad,
                    datos.salario.toFixed(2),
                    datos.bono.toFixed(2),
                    datos.deduccion.toFixed(2),
                    datos.total.toFixed(2)
                ]);
            });

            if (currentReportData.totales) {
                data.push([]);
                data.push(['TOTALES',
                    currentReportData.totales.cantidad,
                    currentReportData.totales.salarios.toFixed(2),
                    currentReportData.totales.bonos.toFixed(2),
                    currentReportData.totales.deducciones.toFixed(2),
                    currentReportData.totales.neto.toFixed(2)
                ]);
            }
        } else {
            alert('Tipo de reporte no soportado para exportación a Excel aún.');
            return;
        }

        // Crear worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generar archivo
        const fileName = `reporte_${currentReportData.type}_${currentReportData.month || new Date().toISOString().slice(0, 7)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('Excel exportado:', fileName);
    } catch (error) {
        console.error('Error al exportar Excel:', error);
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

    // Ocultar todos los filtros
    const filterResumen = document.getElementById('filterResumenMensual');
    const filterPorEmpleado = document.getElementById('filterPorEmpleado');
    const filterComparativo = document.getElementById('filterComparativo');

    if (filterResumen) filterResumen.style.display = 'none';
    if (filterPorEmpleado) filterPorEmpleado.style.display = 'none';
    if (filterComparativo) filterComparativo.style.display = 'none';

    if (reportArea && reportTitle) {
        reportArea.style.display = 'block';

        const titles = {
            'resumen-mensual': 'Resumen Mensual de Nómina',
            'por-empleado': 'Nómina por Empleado',
            'comparativo': 'Comparativo Mensual de Nómina'
        };

        reportTitle.textContent = titles[reportType] || 'Reporte';

        // Mostrar filtros según tipo de reporte
        if (reportType === 'resumen-mensual' && filterResumen) {
            filterResumen.style.display = 'block';
            const filterMonth = document.getElementById('payrollFilterMonth');
            if (filterMonth && !filterMonth.value) {
                const hoy = new Date();
                filterMonth.value = hoy.toISOString().substring(0, 7);
            }
        } else if (reportType === 'por-empleado' && filterPorEmpleado) {
            filterPorEmpleado.style.display = 'block';
            const filterMonth = document.getElementById('employeeFilterMonth');
            if (filterMonth && !filterMonth.value) {
                const hoy = new Date();
                filterMonth.value = hoy.toISOString().substring(0, 7);
            }
            // Cargar empleados en el selector
            loadEmployeesForReport('employeeFilterEmployeeSelect');
        } else if (reportType === 'comparativo' && filterComparativo) {
            filterComparativo.style.display = 'block';
            const hoy = new Date();
            const mesActual = hoy.toISOString().substring(0, 7);

            // Establecer meses por defecto
            const mes1 = document.getElementById('comparativeMonth1');
            const mes2 = document.getElementById('comparativeMonth2');
            if (mes1 && !mes1.value) {
                const hace2Meses = new Date(hoy);
                hace2Meses.setMonth(hace2Meses.getMonth() - 2);
                mes1.value = hace2Meses.toISOString().substring(0, 7);
            }
            if (mes2 && !mes2.value) {
                const hace1Mes = new Date(hoy);
                hace1Mes.setMonth(hace1Mes.getMonth() - 1);
                mes2.value = hace1Mes.toISOString().substring(0, 7);
            }
            // Cargar empleados en el selector
            loadEmployeesForReport('comparativeFilterEmployee');
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

// ===================== FUNCIONES DE TOGGLE FILTROS =====================
window.toggleEmployeeFilters = function () {
    const monthGroup = document.getElementById('employeeMonthGroup');
    const rangeStartGroup = document.getElementById('employeeRangeStartGroup');
    const rangeEndGroup = document.getElementById('employeeRangeEndGroup');

    const selectedOption = document.querySelector('input[name="periodRangeEmployee"]:checked').value;

    monthGroup.style.display = 'none';
    rangeStartGroup.style.display = 'none';
    rangeEndGroup.style.display = 'none';

    if (selectedOption === 'specific') {
        monthGroup.style.display = 'block';
    } else if (selectedOption === 'range') {
        rangeStartGroup.style.display = 'block';
        rangeEndGroup.style.display = 'block';
    }
};

window.toggleComparativeFilters = function () {
    const monthsGroup = document.getElementById('comparativeMonthsGroup');
    const rangeGroup = document.getElementById('comparativeRangeGroup');
    const yearlyGroup = document.getElementById('comparativeYearlyGroup');

    const selectedOption = document.querySelector('input[name="comparativeType"]:checked').value;

    monthsGroup.style.display = 'none';
    rangeGroup.style.display = 'none';
    yearlyGroup.style.display = 'none';

    if (selectedOption === 'months') {
        monthsGroup.style.display = 'block';
    } else if (selectedOption === 'range') {
        rangeGroup.style.display = 'block';
    } else if (selectedOption === 'yearly') {
        yearlyGroup.style.display = 'block';
    }
};

// ===================== CARGAR EMPLEADOS PARA REPORTES =====================
async function loadEmployeesForReport(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const snapshot = await getDocs(collection(db, "usuario"));
        const options = '<option value="">Todos los empleados</option>';
        let optionsHtml = '';

        snapshot.forEach(doc => {
            const user = doc.data();
            const displayName = user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;
            const optionHtml = `<option value="${doc.id}">${displayName}</option>`;
            optionsHtml += optionHtml;
        });

        select.innerHTML = options + optionsHtml;
    } catch (error) {
        console.error("Error al cargar empleados:", error);
    }
}

window.generatePayrollReport = async function () {
    const month = document.getElementById('payrollFilterMonth').value;
    const employeeId = document.getElementById('payrollFilterEmployee').value;
    const reportType = currentPayrollReportType;

    if (!month) {
        alert('Por favor selecciona un mes');
        return;
    }

    if (!reportType) {
        alert('Por favor selecciona un tipo de reporte primero');
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
        const periodoPago = `${year}-${monthNum}`;

        // Obtener pagos de la colección pagos_empleados
        const q = query(
            collection(db, "pagos_empleados"),
            where("periodo_pago", "==", periodoPago)
        );
        const pagosSnapshot = await getDocs(q);

        // Obtener usuarios
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const usuariosMap = {};
        usuariosSnapshot.forEach(doc => {
            const user = doc.data();
            usuariosMap[doc.id] = {
                displayName: `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email,
                email: user.email,
                rol: user.rol || 'Empleado'
            };
        });

        // Agrupar pagos por empleado
        const pagosPorEmpleado = {};
        pagosSnapshot.forEach(doc => {
            const pago = doc.data();
            if (!employeeId || pago.uid === employeeId) {
                if (!pagosPorEmpleado[pago.uid]) {
                    pagosPorEmpleado[pago.uid] = {
                        ...usuariosMap[pago.uid],
                        totalPagos: 0,
                        montoPagado: 0,
                        salarioTotal: 0,
                        bonoTotal: 0,
                        deduccionTotal: 0,
                        pagos: []
                    };
                }
                pagosPorEmpleado[pago.uid].totalPagos++;
                pagosPorEmpleado[pago.uid].montoPagado += parseFloat(pago.pago_total || 0);
                pagosPorEmpleado[pago.uid].salarioTotal += parseFloat(pago.salario || 0);
                pagosPorEmpleado[pago.uid].bonoTotal += parseFloat(pago.bono || 0);
                pagosPorEmpleado[pago.uid].deduccionTotal += parseFloat(pago.deduccion || 0);
                pagosPorEmpleado[pago.uid].pagos.push(pago);
            }
        });

        // Renderizar según tipo de reporte
        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const nombreMes = new Date(year, monthNum - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de Nómina - ${nombreMes}</h3>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Empleado</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Rol</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Salario</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Bonos</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Deducciones</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total Neto</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let totalSalarios = 0;
        let totalBonos = 0;
        let totalDeducciones = 0;
        let totalNeto = 0;

        Object.values(pagosPorEmpleado)
            .sort((a, b) => b.montoPagado - a.montoPagado)
            .forEach(emp => {
                totalSalarios += emp.salarioTotal;
                totalBonos += emp.bonoTotal;
                totalDeducciones += emp.deduccionTotal;
                totalNeto += emp.montoPagado;

                html += `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px; text-align: left;"><strong>${emp.displayName}</strong><br><small style="color: #9ca3af; font-size: 0.85rem;">${emp.email}</small></td>
                        <td style="padding: 12px; text-align: left; color: #6b7280;">${emp.rol}</td>
                        <td style="padding: 12px; text-align: right; color: #374151;">S/ ${emp.salarioTotal.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right; color: #10b981;">+ S/ ${emp.bonoTotal.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right; color: #ef4444;">- S/ ${emp.deduccionTotal.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;"><span class="status-badge status-complete"><strong>S/ ${emp.montoPagado.toFixed(2)}</strong></span></td>
                    </tr>
                `;
            });

        if (Object.keys(pagosPorEmpleado).length === 0) {
            html += '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron pagos para este período</td></tr>';
        } else {
            html += `
                    <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 2px solid #d1d5db;">
                        <td colspan="2" style="padding: 12px; text-align: right; color: #374151;">TOTALES:</td>
                        <td style="padding: 12px; text-align: right; color: #374151;">S/ ${totalSalarios.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right; color: #10b981;">S/ ${totalBonos.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right; color: #ef4444;">S/ ${totalDeducciones.toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right; color: #667eea;">S/ ${totalNeto.toFixed(2)}</td>
                    </tr>
            `;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        // Guardar datos para exportación
        currentReportData = {
            type: 'nomina-mensual',
            month,
            data: pagosPorEmpleado,
            totales: {
                salarios: totalSalarios,
                bonos: totalBonos,
                deducciones: totalDeducciones,
                neto: totalNeto
            }
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
            </div>
        `;
    }
};

// ===================== FUNCIONES AUXILIARES DE PAGOS =====================
async function obtenerPagosEmpleado(empleadoId, mes) {
    try {
        const periodoPago = mes;
        const q = query(
            collection(db, "pagos_empleados"),
            where("uid", "==", empleadoId),
            where("periodo_pago", "==", periodoPago)
        );
        const snapshot = await getDocs(q);
        const pagos = [];
        snapshot.forEach(doc => {
            pagos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return pagos;
    } catch (error) {
        console.error("Error obteniendo pagos del empleado:", error);
        return [];
    }
}

async function obtenerPagosRango(mesInicio, mesFin) {
    try {
        const q = query(
            collection(db, "pagos_empleados"),
            where("periodo_pago", ">=", mesInicio),
            where("periodo_pago", "<=", mesFin)
        );
        const snapshot = await getDocs(q);
        const pagos = [];
        snapshot.forEach(doc => {
            pagos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return pagos;
    } catch (error) {
        console.error("Error obteniendo pagos del rango:", error);
        return [];
    }
}

// ===================== GENERAR REPORTE POR EMPLEADO =====================
window.generatePayrollByEmployee = async function () {
    const reportType = currentPayrollReportType;
    const empleadoId = document.getElementById('employeeFilterEmployeeSelect').value;

    if (!empleadoId) {
        alert('Por favor selecciona un empleado');
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
        const selectedRange = document.querySelector('input[name="periodRangeEmployee"]:checked').value;
        let pagos = [];

        // Obtener empleado info
        const usuarioRef = doc(db, "usuario", empleadoId);
        const usuarioSnap = await getDoc(usuarioRef);
        const empleadoInfo = usuarioSnap.exists() ? usuarioSnap.data() : {};
        const empleadoNombre = `${empleadoInfo.nombre || ''} ${empleadoInfo.apellido || ''}`.trim();

        if (selectedRange === 'specific') {
            const mes = document.getElementById('employeeFilterMonth').value;
            if (!mes) {
                alert('Por favor selecciona un mes');
                return;
            }
            pagos = await obtenerPagosEmpleado(empleadoId, mes);
        } else if (selectedRange === 'all') {
            // Obtener todos los pagos del empleado
            const q = query(
                collection(db, "pagos_empleados"),
                where("uid", "==", empleadoId)
            );
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                pagos.push({ id: doc.id, ...doc.data() });
            });
        } else if (selectedRange === 'range') {
            const mesInicio = document.getElementById('employeeFilterStartMonth').value;
            const mesFin = document.getElementById('employeeFilterEndMonth').value;

            if (!mesInicio || !mesFin) {
                alert('Por favor selecciona rango de meses');
                return;
            }

            const q = query(
                collection(db, "pagos_empleados"),
                where("uid", "==", empleadoId),
                where("periodo_pago", ">=", mesInicio),
                where("periodo_pago", "<=", mesFin)
            );
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                pagos.push({ id: doc.id, ...doc.data() });
            });
        }

        // Ordenar pagos por periodo
        pagos.sort((a, b) => a.periodo_pago.localeCompare(b.periodo_pago));

        // Renderizar tabla
        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Historial de Pagos - ${empleadoNombre}</h3>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Período</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Salario</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Bonos</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Deducciones</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total Neto</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let totalSalario = 0, totalBono = 0, totalDeduccion = 0, totalNeto = 0;

        pagos.forEach(pago => {
            totalSalario += parseFloat(pago.salario || 0);
            totalBono += parseFloat(pago.bono || 0);
            totalDeduccion += parseFloat(pago.deduccion || 0);
            totalNeto += parseFloat(pago.pago_total || 0);

            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const [año, mes] = pago.periodo_pago.split('-');
            const periodoFormato = `${meses[parseInt(mes) - 1]} ${año}`;

            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; text-align: left; font-weight: 500;">${periodoFormato}</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">S/ ${parseFloat(pago.salario || 0).toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #10b981;">+ S/ ${parseFloat(pago.bono || 0).toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #ef4444;">- S/ ${parseFloat(pago.deduccion || 0).toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right;"><strong style="color: #667eea;">S/ ${parseFloat(pago.pago_total || 0).toFixed(2)}</strong></td>
                    <td style="padding: 12px; text-align: left; font-size: 0.9rem; color: #6b7280;">${pago.detalle || '-'}</td>
                </tr>
            `;
        });

        if (pagos.length === 0) {
            html += '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron pagos para este rango</td></tr>';
        } else {
            html += `
                <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 2px solid #d1d5db;">
                    <td style="padding: 12px; text-align: left; color: #374151;">TOTALES:</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">S/ ${totalSalario.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #10b981;">S/ ${totalBono.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #ef4444;">S/ ${totalDeduccion.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #667eea;">S/ ${totalNeto.toFixed(2)}</td>
                    <td style="padding: 12px;"></td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        currentReportData = {
            type: 'por-empleado',
            empleado: empleadoNombre,
            data: pagos,
            totales: {
                salarios: totalSalario,
                bonos: totalBono,
                deducciones: totalDeduccion,
                neto: totalNeto
            }
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
            </div>
        `;
    }
};

// ===================== GENERAR REPORTE COMPARATIVO =====================
window.generatePayrollComparative = async function () {
    const reportType = currentPayrollReportType;
    const comparationType = document.querySelector('input[name="comparativeType"]:checked').value;
    const empleadoId = document.getElementById('comparativeFilterEmployee').value;

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
        let mesesAComparar = [];

        if (comparationType === 'months') {
            const m1 = document.getElementById('comparativeMonth1').value;
            const m2 = document.getElementById('comparativeMonth2').value;
            const m3 = document.getElementById('comparativeMonth3').value;

            if (!m1 || !m2) {
                alert('Por favor selecciona al menos 2 meses');
                return;
            }

            mesesAComparar = [m1, m2];
            if (m3) mesesAComparar.push(m3);
        } else if (comparationType === 'range') {
            const mesInicio = document.getElementById('comparativeStartMonth').value;
            const mesFin = document.getElementById('comparativeEndMonth').value;

            if (!mesInicio || !mesFin) {
                alert('Por favor selecciona rango de meses');
                return;
            }

            // Generar lista de meses entre dos fechas
            const [año1, mes1] = mesInicio.split('-').map(Number);
            const [año2, mes2] = mesFin.split('-').map(Number);

            let fechaActual = new Date(año1, mes1 - 1);
            const fechaFin = new Date(año2, mes2 - 1);

            while (fechaActual <= fechaFin) {
                const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
                const año = fechaActual.getFullYear();
                mesesAComparar.push(`${año}-${mes}`);
                fechaActual.setMonth(fechaActual.getMonth() + 1);
            }
        } else if (comparationType === 'yearly') {
            const año1 = parseInt(document.getElementById('comparativeYear1').value);
            const año2 = parseInt(document.getElementById('comparativeYear2').value);

            if (!año1 || !año2) {
                alert('Por favor selecciona 2 años');
                return;
            }

            // Crear meses para comparación anual
            for (let mes = 1; mes <= 12; mes++) {
                const mesFormato = String(mes).padStart(2, '0');
                mesesAComparar.push(`${año1}-${mesFormato}`);
                mesesAComparar.push(`${año2}-${mesFormato}`);
            }
        }

        // Obtener datos para comparación
        const datosComparacion = {};

        for (const mes of mesesAComparar) {
            let q;
            if (empleadoId) {
                q = query(
                    collection(db, "pagos_empleados"),
                    where("periodo_pago", "==", mes),
                    where("uid", "==", empleadoId)
                );
            } else {
                q = query(
                    collection(db, "pagos_empleados"),
                    where("periodo_pago", "==", mes)
                );
            }

            const snapshot = await getDocs(q);
            let totalMes = 0, totalSalario = 0, totalBono = 0, totalDeduccion = 0, cantidadPagos = 0;

            snapshot.forEach(doc => {
                const pago = doc.data();
                totalMes += parseFloat(pago.pago_total || 0);
                totalSalario += parseFloat(pago.salario || 0);
                totalBono += parseFloat(pago.bono || 0);
                totalDeduccion += parseFloat(pago.deduccion || 0);
                cantidadPagos++;
            });

            datosComparacion[mes] = {
                total: totalMes,
                salario: totalSalario,
                bono: totalBono,
                deduccion: totalDeduccion,
                cantidad: cantidadPagos
            };
        }

        // Renderizar tabla comparativa
        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte Comparativo de Nómina</h3>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem;">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Período</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Cantidad Pagos</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total Salarios</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total Bonos</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total Deduc.</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total Neto</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let totalGralMes = 0, totalGralSalario = 0, totalGralBono = 0, totalGralDeduccion = 0, totalGralCantidad = 0;

        mesesAComparar.forEach(mes => {
            const datos = datosComparacion[mes];
            totalGralMes += datos.total;
            totalGralSalario += datos.salario;
            totalGralBono += datos.bono;
            totalGralDeduccion += datos.deduccion;
            totalGralCantidad += datos.cantidad;

            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const [año, mesNum] = mes.split('-');
            const mesFormato = `${meses[parseInt(mesNum) - 1]} ${año}`;

            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; text-align: left; font-weight: 500;">${mesFormato}</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">${datos.cantidad}</td>
                    <td style="padding: 12px; text-align: right; color: #374151;">S/ ${datos.salario.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #10b981;">S/ ${datos.bono.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: #ef4444;">S/ ${datos.deduccion.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right;"><strong style="color: #667eea;">S/ ${datos.total.toFixed(2)}</strong></td>
                </tr>
            `;
        });

        html += `
            <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 2px solid #d1d5db;">
                <td style="padding: 12px; text-align: left; color: #374151;">TOTALES:</td>
                <td style="padding: 12px; text-align: right; color: #374151;">${totalGralCantidad}</td>
                <td style="padding: 12px; text-align: right; color: #374151;">S/ ${totalGralSalario.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; color: #10b981;">S/ ${totalGralBono.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; color: #ef4444;">S/ ${totalGralDeduccion.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; color: #667eea;">S/ ${totalGralMes.toFixed(2)}</td>
            </tr>
        `;

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        currentReportData = {
            type: 'comparativo',
            comparationType: comparationType,
            data: datosComparacion,
            meses: mesesAComparar,
            totales: {
                cantidad: totalGralCantidad,
                salarios: totalGralSalario,
                bonos: totalGralBono,
                deducciones: totalGralDeduccion,
                neto: totalGralMes
            }
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error al generar reporte:", error);
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
    }
};

window.generateHRReport = async function () {
    const reportType = currentHRReportType;
    const filterRole = document.getElementById('hrFilterRole')?.value || '';
    const filterStatus = document.getElementById('hrFilterStatus')?.value || '';

    if (!reportType) {
        alert('Por favor selecciona un tipo de reporte primero');
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
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const adminSnapshot = await getDocs(collection(db, "usuario_admin"));
        const adminDataMap = new Map();
        adminSnapshot.forEach(doc => {
            adminDataMap.set(doc.id, doc.data());
        });

        const empleados = [];

        usuariosSnapshot.forEach(doc => {
            const user = doc.data();
            const adminData = adminDataMap.get(doc.id) || {};

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
                fechaIngreso: adminData.fechaIngreso || user.fechaIngreso || '-',
                fechaSalida: adminData.fechaSalida || user.fechaSalida || '-',
                estado: user.estado || 'activo'
            });
        });

        let empleadosFiltrados = empleados;

        if (filterRole) {
            empleadosFiltrados = empleadosFiltrados.filter(emp => {
                const empRol = (emp.rol || '').toLowerCase();
                const filtroRol = filterRole.toLowerCase();
                return empRol === filtroRol;
            });
        }

        if (filterStatus) {
            empleadosFiltrados = empleadosFiltrados.filter(emp => {
                const empEstado = (emp.estado || '').toLowerCase();
                const filtroEstado = filterStatus.toLowerCase();
                return empEstado === filtroEstado;
            });
        }

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

        currentReportData = {
            type: 'rrhh-empleados',
            data: empleadosFiltrados
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error al generar reporte:", error);
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

    } catch (error) {
        console.error(" Error al cargar categorías:", error);
    }
}

window.generateInventoryReport = async function () {
    const reportType = currentInventoryReportType;

    if (!reportType) {
        alert('Por favor selecciona un tipo de reporte primero');
        return;
    }

    const resultsDiv = document.getElementById('inventoryResults');
    const exportButtons = document.getElementById('inventoryExportButtons');

    // Toggle de tipo de cambio
    window.toggleExchangeRate = function () {
        const currency = document.getElementById('inventoryCurrency').value;
        const rateGroup = document.getElementById('exchangeRateGroup');
        if (rateGroup) {
            rateGroup.style.display = currency === 'USD' ? 'block' : 'none';
        }
    };

    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea; margin-bottom: 15px;"></i>
            <h3 style="margin: 0; color: #374151;">Generando reporte...</h3>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Consultando datos de Firestore</p>
        </div>
    `;

    try {
        // Obtener artículos
        const articulosSnapshot = await getDocs(collection(db, "articulos"));
        const productos = [];

        articulosSnapshot.forEach(doc => {
            const articulo = doc.data();
            productos.push({
                id: doc.id,
                nombre: articulo.nombre || 'Sin nombre',
                categoria: articulo.id_categoria || articulo.categoria || 'Sin categoría',
                stock: 0,
                stockMinimo: parseInt(articulo.stock_minimo || articulo.stock_minimo || 10),
                precio: parseFloat(articulo.precio_base || articulo.precio || 0),
                valorTotal: 0
            });
        });

        // Obtener stock real de la colección stock_inventario
        const stockSnapshot = await getDocs(collection(db, "stock_inventario"));
        const stockPorArticulo = {};

        stockSnapshot.forEach(doc => {
            const stockData = doc.data();
            const idArticulo = stockData.id_articulo || doc.id;

            if (!stockPorArticulo[idArticulo]) {
                stockPorArticulo[idArticulo] = 0;
            }
            stockPorArticulo[idArticulo] += parseInt(stockData.stock || 0);
        });

        // Actualizar stock y calcular valor total
        productos.forEach(prod => {
            // Intentar matchear primero por ID del documento, luego por id_articulo
            prod.stock = stockPorArticulo[prod.id] || 0;
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
            // Matchear por ID del documento o por id_categoria
            categoriasMap[doc.id] = cat.nombre;
            if (cat.id_categoria) {
                categoriasMap[cat.id_categoria] = cat.nombre;
            }
        });

        productosFiltrados.forEach(prod => {
            prod.categoriaNombre = categoriasMap[prod.categoria] || 'Sin categoría';
        });

        // Aplicar filtro de categoría
        const filterCategory = document.getElementById('inventoryFilterCategory')?.value || '';
        if (filterCategory) {
            productosFiltrados = productosFiltrados.filter(p => p.categoria == filterCategory);

        }

        // Obtener opción de ordenamiento
        const sortOption = document.getElementById('inventoryFilterSort')?.value || 'nombre';

        // Obtener configuración de moneda
        const currency = document.getElementById('inventoryCurrency')?.value || 'PEN';
        const exchangeRate = parseFloat(document.getElementById('inventoryExchangeRate')?.value || 3.75);
        const currencySymbol = currency === 'USD' ? '$' : 'S/';

        const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        // Calcular totales con conversión si es necesario
        let totalValor = 0;

        // Aplicar conversión a los productos filtrados para visualización
        // Clonamos para no afectar los datos originales si se regenera
        const productosVisualizar = productosFiltrados.map(p => {
            const precioDisplay = currency === 'USD' ? (p.precio / exchangeRate) : p.precio;
            const valorDisplay = currency === 'USD' ? (p.valorTotal / exchangeRate) : p.valorTotal;
            return {
                ...p,
                precioDisplay,
                valorDisplay
            };
        });

        totalValor = productosVisualizar.reduce((sum, p) => sum + p.valorDisplay, 0);

        let html = `
            <div id="printableArea">
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de Inventario - ${reportType === 'stock-actual' ? 'Stock Actual' : reportType === 'stock-bajo' ? 'Stock Bajo' : 'Valorización'}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Total de productos: ${productosFiltrados.length} | Moneda: ${currency} ${currency === 'USD' ? '(T.C. ' + exchangeRate + ')' : ''}</p>
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
                    return a.stock - b.stock;
                case 'precio':
                    return b.precio - a.precio;
                case 'nombre':
                default:
                    return a.nombre.localeCompare(b.nombre);
            }
        });

        productosVisualizar
            .forEach(prod => {
                const stockBadge = prod.stock <= prod.stockMinimo ? 'status-absent' : prod.stock <= prod.stockMinimo * 1.5 ? 'status-incomplete' : 'status-complete';
                html += `
                    <tr>
                        <td>${prod.id || '-'}</td>
                        <td><strong>${prod.nombre}</strong></td>
                        <td>${prod.categoriaNombre}</td>
                        <td><span class="status-badge ${stockBadge}">${prod.stock}</span></td>
                `;

                // Columnas condicionales
                if (reportType === 'stock-bajo' || reportType === 'stock-actual') {
                    html += `<td>${prod.stockMinimo}</td>`;
                }

                html += `<td>${currencySymbol}${prod.precioDisplay.toFixed(2)}</td>`;

                if (reportType === 'valorizacion') {
                    html += `<td>${currencySymbol}${prod.valorDisplay.toFixed(2)}</td>`;
                }

                html += `</tr>`;
            });

        if (productosVisualizar.length === 0) {
            const colspan = reportType === 'valorizacion' ? 6 : 7;
            html += `<tr><td colspan="${colspan}" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron productos</td></tr>`;
        }

        // Agregar fila de total solo en valorización
        if (reportType === 'valorizacion' && productosFiltrados.length > 0) {
            html += `
                <tr style="background: #f3f4f6; font-weight: 600; border-top: 2px solid #667eea;">
                    <td colspan="5" style="text-align: right; padding: 1rem;">VALOR TOTAL:</td>
                    <td style="color: #667eea; font-size: 1.1rem;">${currencySymbol}${totalValor.toFixed(2)}</td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;

        currentReportData = {
            type: 'inventario-' + reportType,
            data: productosFiltrados
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error al generar reporte:", error);
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Error al generar reporte</h3>
                <p style="color: #6b7280; margin: 0;">${error.message}</p>
            </div>
        `;
    }
};

// ===================== REPORTES DE VENTAS =====================

let currentSalesReportType = null;
let currentSalesData = null;

// Seleccionar tipo de reporte de ventas
window.selectSalesReport = async function (reportType) {
    currentSalesReportType = reportType;

    const filterVentasPeriodo = document.getElementById('filterVentasPeriodo');
    const filterProductosVendidos = document.getElementById('filterProductosVendidos');
    const filterVentasCliente = document.getElementById('filterVentasCliente');
    const salesReportArea = document.getElementById('salesReportArea');
    const salesReportResults = document.getElementById('salesReportResults');

    // Ocultar todos los filtros primero
    if (filterVentasPeriodo) filterVentasPeriodo.style.display = 'none';
    if (filterProductosVendidos) filterProductosVendidos.style.display = 'none';
    if (filterVentasCliente) filterVentasCliente.style.display = 'none';
    if (salesReportArea) salesReportArea.style.display = 'none';

    // Mostrar filtro apropiado
    switch (reportType) {
        case 'ventas-periodo':
            if (filterVentasPeriodo) {
                filterVentasPeriodo.style.display = 'block';
            }
            setDefaultDates('filterVentasDesde', 'filterVentasHasta');
            break;
        case 'productos-vendidos':
            if (filterProductosVendidos) {
                filterProductosVendidos.style.display = 'block';
            }
            setDefaultDates('filterProductosFechaDesde', 'filterProductosFechaHasta');
            break;
        case 'ventas-cliente':
            if (filterVentasCliente) {
                filterVentasCliente.style.display = 'block';
            }
            setDefaultDates('filterClienteFechaDesde', 'filterClienteFechaHasta');
            await loadClientsForSalesReport();
            break;
    }

};

// Establecer fechas por defecto
function setDefaultDates(desdeId, hastaId) {
    const hoje = new Date();
    const ultimoMes = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

    const desde = document.getElementById(desdeId);
    const hasta = document.getElementById(hastaId);

    if (desde) desde.valueAsDate = ultimoMes;
    if (hasta) hasta.valueAsDate = hoje;
}

// Cargar clientes
async function loadClientsForSalesReport() {
    const clienteSel = document.getElementById('filterVentasClienteSel');
    if (!clienteSel) return;

    clienteSel.innerHTML = '<option value="">⏳ Cargando clientes...</option>';

    try {
        const q = query(
            collection(db, "usuario"),
            where("rol", "==", "Cliente")
        );

        const snapshot = await getDocs(q);
        const clientes = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            clientes.push({
                id: doc.id,
                nombre: `${data.nombre} ${data.apellido || ''}`.trim()
            });
        });

        clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));

        // Limpiar y cargar opciones
        clienteSel.innerHTML = '<option value="">-- Selecciona un cliente --</option>';

        // AGREGAR OPCIÓN DE CLIENTE EXTERNO
        const optionExterno = document.createElement('option');
        optionExterno.value = "EXTERNO";
        optionExterno.textContent = "🏢 Cliente Externo / Manual";
        optionExterno.style.fontWeight = "bold";
        clienteSel.appendChild(optionExterno);


        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            clienteSel.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando clientes:", error);
        clienteSel.innerHTML = '<option value="">Error al cargar clientes</option>';
        alert(`Error al cargar clientes: ${error.message}`);
    }
}

// Generar reporte de ventas por período
window.generateSalesReport = async function () {
    const desde = document.getElementById('filterVentasDesde')?.value;
    const hasta = document.getElementById('filterVentasHasta')?.value;

    if (!desde || !hasta) {
        alert('Selecciona rango de fechas');
        return;
    }

    const resultsDiv = document.getElementById('salesReportResults');
    const salesReportArea = document.getElementById('salesReportArea');
    const exportButtons = document.getElementById('salesExportButtons');

    resultsDiv.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea;"></i><p>Generando reporte...</p></div>';
    salesReportArea.style.display = 'block';
    exportButtons.style.display = 'none';

    try {
        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, "ventas"),
            where("fecha_registro", ">=", desdeDate),
            where("fecha_registro", "<=", hastaDate)
        );

        const snapshot = await getDocs(q);
        const ventas = [];
        let totalGeneral = 0;

        snapshot.forEach(doc => {
            const v = doc.data();
            ventas.push({
                id: doc.id,
                cliente: v.cliente_nombre || '-',
                fecha: v.fecha_registro?.toDate?.() || new Date(),
                cantidad: v.cantidad_items || 0,
                total: v.total_general || 0
            });
            totalGeneral += v.total_general || 0;
        });

        ventas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">Resumen de Ventas</h3>
                <p style="margin: 0; color: #6b7280;">Del ${desde} al ${hasta}</p>
                <p style="margin: 5px 0 0 0; color: #667eea; font-weight: bold;">
                    Total de ventas: ${ventas.length} | Monto total: S/ ${totalGeneral.toFixed(2)}
                </p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Cantidad de artículos</th>
                        <th>Monto total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (ventas.length === 0) {
            html += '<tr><td colspan="4" style="text-align:center; padding: 40px; color: #6b7280;">No hay ventas en este período</td></tr>';
        } else {
            ventas.forEach(v => {
                html += `
                    <tr>
                        <td>${v.fecha.toLocaleDateString('es-PE')}</td>
                        <td>${v.cliente}</td>
                        <td>${v.cantidad}</td>
                        <td>S/ ${v.total.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        html += '</tbody></table>';
        resultsDiv.innerHTML = html;

        currentSalesData = {
            type: 'ventas-periodo',
            data: ventas,
            totalGeneral: totalGeneral,
            desde: desde,
            hasta: hasta
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error:", error);
        resultsDiv.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i><p>${error.message}</p></div>`;
    }
};

// Generar reporte de productos más vendidos
window.generateTopProductsReport = async function () {
    const desde = document.getElementById('filterProductosFechaDesde')?.value;
    const hasta = document.getElementById('filterProductosFechaHasta')?.value;
    const limit = parseInt(document.getElementById('filterProductosLimit')?.value || 10);

    if (!desde || !hasta) {
        alert('Selecciona rango de fechas');
        return;
    }

    const resultsDiv = document.getElementById('salesReportResults');
    const salesReportArea = document.getElementById('salesReportArea');
    const exportButtons = document.getElementById('salesExportButtons');

    resultsDiv.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea;"></i><p>Generando reporte...</p></div>';
    salesReportArea.style.display = 'block';
    exportButtons.style.display = 'none';

    try {
        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);

        // Obtener detalles de venta en el período
        const q = query(
            collection(db, "detalle_venta")
        );

        const snapshot = await getDocs(q);
        const ventasMap = new Map();
        const ventaIds = new Set();

        // Primero, obtener IDs de ventas en el rango de fechas
        const ventasQ = query(
            collection(db, "ventas"),
            where("fecha_registro", ">=", desdeDate),
            where("fecha_registro", "<=", hastaDate)
        );
        const ventasSnap = await getDocs(ventasQ);
        ventasSnap.forEach(doc => ventaIds.add(doc.id));

        // Procesar detalles
        snapshot.forEach(doc => {
            const detalle = doc.data();
            if (ventaIds.has(detalle.id_venta)) {
                let key = detalle.id_articulo;
                if (key === 'SERVICIO') {
                    key = `SERVICIO_${detalle.nombre.trim().toUpperCase()}`;
                }

                const existing = ventasMap.get(key) || {
                    id_articulo: detalle.id_articulo,
                    nombre: detalle.nombre,
                    cantidad_total: 0,
                    veces_vendida: 0,
                    monto_total: 0
                };
                existing.cantidad_total += detalle.cantidad || 0;
                existing.veces_vendida += 1;
                existing.monto_total += detalle.subtotal || 0;
                ventasMap.set(key, existing);
            }
        });

        // Ordenar por cantidad vendida
        const productos = Array.from(ventasMap.values())
            .sort((a, b) => b.cantidad_total - a.cantidad_total)
            .slice(0, limit);

        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">Productos Más Vendidos</h3>
                <p style="margin: 0; color: #6b7280;">Del ${desde} al ${hasta}</p>
                <p style="margin: 5px 0 0 0; color: #667eea;">Top ${limit} productos</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Cantidad Total</th>
                        <th>Veces Vendida</th>
                        <th>Monto Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (productos.length === 0) {
            html += '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #6b7280;">No hay ventas en este período</td></tr>';
        } else {
            productos.forEach((p, i) => {
                html += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${p.nombre}</td>
                        <td>${p.cantidad_total}</td>
                        <td>${p.veces_vendida}</td>
                        <td>S/ ${p.monto_total.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        html += '</tbody></table>';
        resultsDiv.innerHTML = html;

        currentSalesData = {
            type: 'productos-vendidos',
            data: productos,
            desde: desde,
            hasta: hasta
        };

        exportButtons.style.display = 'flex';
    } catch (error) {
        console.error("Error:", error);
        resultsDiv.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i><p>${error.message}</p></div>`;
    }
};

// Generar reporte de ventas por cliente
window.generateSalesByClientReport = async function () {
    const clienteId = document.getElementById('filterVentasClienteSel')?.value;
    const desde = document.getElementById('filterClienteFechaDesde')?.value;
    const hasta = document.getElementById('filterClienteFechaHasta')?.value;

    if (!clienteId || !desde || !hasta) {
        alert('Completa todos los filtros');
        return;
    }

    const resultsDiv = document.getElementById('salesReportResults');
    const salesReportArea = document.getElementById('salesReportArea');
    const exportButtons = document.getElementById('salesExportButtons');

    resultsDiv.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea;"></i><p>Generando reporte...</p></div>';
    salesReportArea.style.display = 'block';
    exportButtons.style.display = 'none';

    try {
        let clienteNombre = '-';
        if (clienteId === 'EXTERNO') {
            clienteNombre = 'Cliente Externo / Manual';
        } else {
            const clienteDoc = await getDoc(doc(db, "usuario", clienteId));
            clienteNombre = clienteDoc.exists() ? `${clienteDoc.data().nombre} ${clienteDoc.data().apellido || ''}`.trim() : '-';
        }

        const desdeDate = new Date(desde);
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, "ventas"),
            where("fecha_registro", ">=", desdeDate),
            where("fecha_registro", "<=", hastaDate)
        );

        const snapshot = await getDocs(q);
        const ventas = [];
        let totalGeneral = 0;

        snapshot.forEach(doc => {
            const v = doc.data();
            // Filtrado en memoria para evitar requerir índice compuesto en Firestore
            if (v.cliente_id === clienteId) {
                ventas.push({
                    id: doc.id,
                    fecha: v.fecha_registro?.toDate?.() || new Date(),
                    cantidad: v.cantidad_items || 0,
                    total: v.total_general || 0
                });
                totalGeneral += v.total_general || 0;
            }
        });

        ventas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">Ventas - ${clienteNombre}</h3>
                <p style="margin: 0; color: #6b7280;">Del ${desde} al ${hasta}</p>
                <p style="margin: 5px 0 0 0; color: #667eea; font-weight: bold;">
                    Total de ventas: ${ventas.length} | Monto total: S/ ${totalGeneral.toFixed(2)}
                </p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Cantidad de artículos</th>
                        <th>Monto total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (ventas.length === 0) {
            html += '<tr><td colspan="3" style="text-align:center; padding: 40px; color: #6b7280;">No hay ventas para este cliente en el período seleccionado</td></tr>';
        } else {
            ventas.forEach(v => {
                html += `
                    <tr>
                        <td>${v.fecha.toLocaleDateString('es-PE')}</td>
                        <td>${v.cantidad}</td>
                        <td>S/ ${v.total.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        html += '</tbody></table>';
        resultsDiv.innerHTML = html;

        currentSalesData = {
            type: 'ventas-cliente',
            data: ventas,
            clienteNombre: clienteNombre,
            totalGeneral: totalGeneral,
            desde: desde,
            hasta: hasta
        };

        exportButtons.style.display = 'flex';
        console.log('Reporte de ventas por cliente generado');
    } catch (error) {
        console.error("Error:", error);
        resultsDiv.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i><p>${error.message}</p></div>`;
    }
};

// Exportar reporte de ventas
window.exportSalesReport = function (format) {
    if (!currentSalesData) {
        alert('No hay reporte para exportar');
        return;
    }

    if (format === 'xlsx') {
        exportSalesExcel();
    } else if (format === 'pdf') {
        exportSalesPDF();
    }
};

function exportSalesExcel() {
    try {
        const { type, data, totalGeneral, clienteNombre, desde, hasta } = currentSalesData;

        let ws_data = [];

        if (type === 'ventas-periodo') {
            ws_data = [
                ['REPORTE DE VENTAS POR PERÍODO'],
                [`Período: ${desde} al ${hasta}`],
                [],
                ['Fecha', 'Cliente', 'Cantidad', 'Monto Total'],
                ...data.map(v => [
                    v.fecha.toLocaleDateString('es-PE'),
                    v.cliente,
                    v.cantidad,
                    `S/ ${v.total.toFixed(2)}`
                ]),
                [],
                ['TOTAL', '', '', `S/ ${totalGeneral.toFixed(2)}`]
            ];
        } else if (type === 'productos-vendidos') {
            ws_data = [
                ['REPORTE DE PRODUCTOS MÁS VENDIDOS'],
                [`Período: ${desde} al ${hasta}`],
                [],
                ['#', 'Producto', 'Cantidad Total', 'Veces Vendida', 'Monto Total'],
                ...data.map((p, i) => [
                    i + 1,
                    p.nombre,
                    p.cantidad_total,
                    p.veces_vendida,
                    `S/ ${p.monto_total.toFixed(2)}`
                ])
            ];
        } else if (type === 'ventas-cliente') {
            ws_data = [
                ['REPORTE DE VENTAS POR CLIENTE'],
                [`Cliente: ${clienteNombre}`],
                [`Período: ${desde} al ${hasta}`],
                [],
                ['Fecha', 'Cantidad de artículos', 'Monto Total'],
                ...data.map(v => [
                    v.fecha.toLocaleDateString('es-PE'),
                    v.cantidad,
                    `S/ ${v.total.toFixed(2)}`
                ]),
                [],
                ['TOTAL', '', `S/ ${totalGeneral.toFixed(2)}`]
            ];
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas");

        const fecha = new Date().toLocaleDateString('es-PE').replaceAll('/', '-');
        XLSX.writeFile(wb, `reporte_ventas_${fecha}.xlsx`);

    } catch (error) {
        console.error("Error exportando Excel:", error);
        alert('Error al exportar Excel');
    }
}

function exportSalesPDF() {
    try {
        const { type, data, totalGeneral, clienteNombre, desde, hasta } = currentSalesData;
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF();
        let y = 20;

        pdf.setFontSize(16);
        pdf.text("REPORTE DE VENTAS", 105, y, { align: "center" });
        y += 15;

        pdf.setFontSize(11);
        if (type === 'ventas-periodo') {
            pdf.text(`Período: ${desde} al ${hasta}`, 20, y);
        } else if (type === 'ventas-cliente') {
            pdf.text(`Cliente: ${clienteNombre}`, 20, y); y += 7;
            pdf.text(`Período: ${desde} al ${hasta}`, 20, y);
        } else {
            pdf.text(`Período: ${desde} al ${hasta}`, 20, y);
        }
        y += 15;

        pdf.setFontSize(10);
        const headers = type === 'productos-vendidos'
            ? ['#', 'Producto', 'Cantidad', 'Veces', 'Monto']
            : type === 'ventas-cliente'
                ? ['Fecha', 'Cantidad', 'Monto']
                : ['Fecha', 'Cliente', 'Cantidad', 'Monto'];

        const rows = type === 'productos-vendidos'
            ? data.map((p, i) => [i + 1, p.nombre, p.cantidad_total, p.veces_vendida, `S/ ${p.monto_total.toFixed(2)}`])
            : type === 'ventas-cliente'
                ? data.map(v => [v.fecha.toLocaleDateString('es-PE'), v.cantidad, `S/ ${v.total.toFixed(2)}`])
                : data.map(v => [v.fecha.toLocaleDateString('es-PE'), v.cliente, v.cantidad, `S/ ${v.total.toFixed(2)}`]);

        pdf.autoTable({
            head: [headers],
            body: rows,
            startY: y,
            theme: 'grid',
            styles: { fontSize: 9 }
        });

        pdf.setFontSize(11);
        pdf.text(`TOTAL: S/ ${totalGeneral.toFixed(2)}`, 20, pdf.lastAutoTable.finalY + 10);

        const fecha = new Date().toLocaleDateString('es-PE').replaceAll('/', '-');
        pdf.save(`reporte_ventas_${fecha}.pdf`);

    } catch (error) {
        console.error("Error exportando PDF:", error);
        alert('Error al exportar PDF. Verifica que autoTable está disponible.');
    }
}


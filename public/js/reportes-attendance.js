// ===================== FIREBASE IMPORTS =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

let currentReportData = null;

// ===================== SELECCIONAR REPORTE DE ASISTENCIAS =====================
let currentAttendanceReportType = null;

window.selectAttendanceReport = function (reportType) {
    currentAttendanceReportType = reportType;

    const reportArea = document.getElementById('attendanceReportArea');
    const reportTitle = document.getElementById('attendanceReportTitle');
    const filterMonth = document.getElementById('filterMonth');
    const contentSection = document.querySelector('.tab-content.active .content-section');

    if (reportArea && reportTitle) {
        // Mover el área de reporte al principio (después del header)
        const sectionHeader = contentSection.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
            contentSection.insertBefore(reportArea, sectionHeader.nextSibling);
        }

        reportArea.style.display = 'block';

        const titles = {
            'lista-empleados': 'Lista de Empleados',
            'asistencia-mensual': 'Resumen Mensual de Asistencias',
            'tardanzas': 'Reporte de Tardanzas',
            'ausencias': 'Reporte de Ausencias'
        };

        reportTitle.textContent = titles[reportType] || 'Reporte';

        // Establecer mes actual por defecto si no está establecido
        if (filterMonth && !filterMonth.value) {
            const hoy = new Date();
            const mesActual = hoy.toISOString().substring(0, 7);
            filterMonth.value = mesActual;
        }

        // Limpiar resultados anteriores
        document.getElementById('reportResults').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-info-circle" style="font-size: 2.5rem; color: #667eea; margin-bottom: 15px;"></i>
                <p style="margin: 0;">Configura los filtros y haz clic en "Generar Reporte"</p>
            </div>
        `;
        document.getElementById('exportButtons').style.display = 'none';

        // Scroll suave al área de filtros
        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log(`📊 Reporte seleccionado: ${reportType}`);
    }
};

// ===================== GENERAR REPORTE DE ASISTENCIAS (ACTUALIZADO) =====================
window.generateAttendanceReport = async function () {
    const month = document.getElementById('filterMonth').value;
    const employeeId = document.getElementById('filterEmployee').value;
    const reportType = currentAttendanceReportType;

    if (!month) {
        alert('⚠️ Por favor selecciona un mes');
        document.getElementById('filterMonth').focus();
        return;
    }

    if (!reportType) {
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
        console.log(`🔄 Generando reporte: ${reportType}, Mes: ${month}, Empleado: ${employeeId || 'Todos'}`);

        switch (reportType) {
            case 'lista-empleados':
                await generateEmployeeListReport(month, employeeId);
                break;
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
                resultsDiv.innerHTML = '<p style="text-align:center; color: #ef4444;">Tipo de reporte no válido</p>';
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

// ===================== REPORTE: LISTA DE EMPLEADOS =====================
async function generateEmployeeListReport(month, employeeId) {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;

    // Obtener todos los empleados
    const usuariosSnapshot = await getDocs(collection(db, "usuario"));
    const empleados = [];

    usuariosSnapshot.forEach(doc => {
        const user = doc.data();
        if (!employeeId || doc.id === employeeId) {
            empleados.push({
                id: doc.id,
                displayName: user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email,
                email: user.email,
                rol: user.rol || 'Empleado'
            });
        }
    });

    // Obtener asistencias del período
    const q = query(
        collection(db, "asistencias"),
        where("fecha", ">=", startDate),
        where("fecha", "<=", endDate)
    );
    const asistenciasSnapshot = await getDocs(q);

    // Calcular estadísticas por empleado
    const estadisticas = {};
    empleados.forEach(emp => {
        estadisticas[emp.id] = {
            ...emp,
            diasAsistidos: 0,
            diasCompletos: 0,
            tardanzas: 0,
            totalHoras: 0
        };
    });

    // Agrupar asistencias por empleado y fecha
    const porEmpleadoFecha = {};
    asistenciasSnapshot.forEach(doc => {
        const data = doc.data();
        if (!estadisticas[data.userId]) return;

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
        if (!estadisticas[userId]) return;

        Object.values(fechas).forEach(dia => {
            if (dia.entrada) {
                estadisticas[userId].diasAsistidos++;

                if (dia.salida) {
                    estadisticas[userId].diasCompletos++;

                    const [hE, mE] = dia.entrada.split(':').map(Number);
                    const [hS, mS] = dia.salida.split(':').map(Number);
                    const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
                    estadisticas[userId].totalHoras += minutosTotal / 60;
                }

                const [h, m] = dia.entrada.split(':').map(Number);
                if (h > 8 || (h === 8 && m > 30)) {
                    estadisticas[userId].tardanzas++;
                }
            }
        });
    });

    // Renderizar tabla
    const resultsDiv = document.getElementById('reportResults');
    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <div id="printableArea">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0; color: #374151;">Lista de Empleados - ${new Date(year, monthNum - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Total de empleados: ${empleados.length}</p>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Rol</th>
                        <th>Días Asistidos</th>
                        <th>Días Completos</th>
                        <th>Tardanzas</th>
                        <th>Total Horas</th>
                        <th>% Asistencia</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.values(estadisticas)
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .forEach(emp => {
            const promAsistencia = emp.diasAsistidos > 0 ? ((emp.diasCompletos / emp.diasAsistidos) * 100).toFixed(0) : "0";

            html += `
                <tr>
                    <td><strong>${emp.displayName}</strong><br><small style="color: #9ca3af;">${emp.email}</small></td>
                    <td>${emp.rol}</td>
                    <td>${emp.diasAsistidos}</td>
                    <td>${emp.diasCompletos}</td>
                    <td>${emp.tardanzas}</td>
                    <td>${emp.totalHoras.toFixed(2)}h</td>
                    <td><span class="status-badge ${promAsistencia >= 90 ? 'status-complete' : promAsistencia >= 70 ? 'status-incomplete' : 'status-absent'}">${promAsistencia}%</span></td>
                </tr>
            `;
        });

    if (empleados.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron empleados</td></tr>';
    }

    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;

    // Guardar datos para exportación
    currentReportData = {
        type: 'lista-empleados',
        month,
        data: estadisticas
    };

    console.log(`✅ Lista de empleados generada: ${empleados.length} empleados`);
}

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
    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <div id="printableArea">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0; color: #374151;">Resumen Mensual de Asistencias - ${new Date(year, monthNum - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
            </div>
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

    html += '</tbody></table></div>';
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

// ===================== FUNCIONES DE EXPORTACIÓN E IMPRESIÓN =====================
window.exportToPDF = function () {
    if (!currentReportData) {
        alert('⚠️ No hay datos para exportar. Por favor genera un reporte primero.');
        return;
    }

    alert('📄 Exportación a PDF en desarrollo. Por ahora usa la opción de Imprimir y guarda como PDF desde el navegador.');
};

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

        if (currentReportData.type === 'lista-empleados') {
            sheetName = 'Lista Empleados';
            data.push(['Empleado', 'Email', 'Rol', 'Días Asistidos', 'Días Completos', 'Tardanzas', 'Total Horas', '% Asistencia']);

            Object.values(currentReportData.data).forEach(emp => {
                const promAsistencia = emp.diasAsistidos > 0 ? ((emp.diasCompletos / emp.diasAsistidos) * 100).toFixed(0) : "0";
                data.push([
                    emp.displayName,
                    emp.email,
                    emp.rol,
                    emp.diasAsistidos,
                    emp.diasCompletos,
                    emp.tardanzas,
                    emp.totalHoras.toFixed(2),
                    promAsistencia + '%'
                ]);
            });
        } else if (currentReportData.type === 'asistencia-mensual') {
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

// Sobrescribir la función de imprimir para solo imprimir el área del reporte
window.printReport = function () {
    const printableArea = document.getElementById('printableArea');

    if (!printableArea) {
        alert('⚠️ No hay contenido para imprimir. Por favor genera un reporte primero.');
        return;
    }

    window.print();
};

console.log("✅ reportes-attendance.js cargado correctamente");

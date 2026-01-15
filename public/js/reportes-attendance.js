import { getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDRTKsoZ9Zzh1oo-DQtlxnZ4Pw6RWBv08c",
    authDomain: "textileflow-test.firebaseapp.com",
    projectId: "textileflow-test",
    storageBucket: "textileflow-test.firebasestorage.app",
    messagingSenderId: "227349652064",
    appId: "1:227349652064:web:d32994273a529a07e25905"
};

// Intentar obtener la instancia existente o crear una nueva
let app;
try {
    app = getApp();
} catch (error) {
    app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);


let currentReportData = null;

// ===================== FUNCIÓN PARA ALTERNAR FILTROS DE FECHA =====================
window.toggleDateFilter = function () {
    const filterType = document.querySelector('input[name="dateFilterType"]:checked').value;
    const monthGroup = document.getElementById('monthFilterGroup');
    const rangeGroup = document.getElementById('rangeFilterGroup');
    const rangeGroup2 = document.getElementById('rangeFilterGroup2');

    if (filterType === 'month') {
        monthGroup.style.display = 'block';
        rangeGroup.style.display = 'none';
        rangeGroup2.style.display = 'none';
    } else {
        monthGroup.style.display = 'none';
        rangeGroup.style.display = 'block';
        rangeGroup2.style.display = 'block';
    }
};

// ===================== SELECCIONAR REPORTE DE ASISTENCIAS =====================
let currentAttendanceReportType = null;

window.selectAttendanceReport = function (reportType) {
    currentAttendanceReportType = reportType;

    const reportArea = document.getElementById('attendanceReportArea');
    const reportTitle = document.getElementById('attendanceReportTitle');
    const filterMonth = document.getElementById('filterMonth');
    const contentSection = document.querySelector('.tab-content.active .content-section');

    if (reportArea && reportTitle) {
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

        reportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    }
};

// ===================== GENERAR REPORTE DE ASISTENCIAS (ACTUALIZADO) =====================
window.generateAttendanceReport = async function () {
    const filterType = document.querySelector('input[name="dateFilterType"]:checked').value;
    const employeeId = document.getElementById('filterEmployee').value;
    const reportType = currentAttendanceReportType;

    // Obtener rango de fechas según el tipo de filtro
    let startDate, endDate, displayPeriod;

    if (filterType === 'month') {
        const month = document.getElementById('filterMonth').value;
        if (!month) {
            alert('Por favor selecciona un mes');
            document.getElementById('filterMonth').focus();
            return;
        }
        const [year, monthNum] = month.split('-');
        startDate = `${year}-${monthNum}-01`;
        endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;
        displayPeriod = new Date(year, monthNum - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else {
        startDate = document.getElementById('filterStartDate').value;
        endDate = document.getElementById('filterEndDate').value;

        if (!startDate || !endDate) {
            alert('Por favor selecciona ambas fechas (desde y hasta)');
            return;
        }

        if (startDate > endDate) {
            alert('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        displayPeriod = `${new Date(startDate).toLocaleDateString('es-ES')} - ${new Date(endDate).toLocaleDateString('es-ES')}`;
    }

    if (!reportType) {
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
        switch (reportType) {
            case 'asistencia-mensual':
                await generateMonthlyAttendanceReport(startDate, endDate, displayPeriod, employeeId);
                break;
            case 'tardanzas':
                await generateLatenessReport(startDate, endDate, displayPeriod, employeeId);
                break;
            case 'ausencias':
                await generateAbsencesReport(startDate, endDate, displayPeriod, employeeId);
                break;
            default:
                resultsDiv.innerHTML = '<p style="text-align:center; color: #ef4444;">Tipo de reporte no válido</p>';
                return;
        }

        exportButtons.style.display = 'flex';
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
async function generateMonthlyAttendanceReport(startDate, endDate, displayPeriod, employeeId) {

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
            diasPuntuales: 0,
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
                } else {
                    usuariosMap[userId].diasPuntuales++;
                }
            }
        });
    });

    // Calcular días laborales del período
    let diasLaborales = 0;
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
        const diaSemana = currentDate.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasLaborales++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Renderizar tabla
    const resultsDiv = document.getElementById('reportResults');
    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <div id="printableArea">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0; color: #374151;">Resumen Mensual de Asistencias - ${displayPeriod}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Días laborales del período: ${diasLaborales}</p>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Días Laborales</th>
                        <th>Días Asistidos</th>
                        <th>Días Completos</th>
                        <th>Tardanzas</th>
                        <th>Total Horas</th>
                        <th>% Asistencia</th>
                        <th>% Puntualidad</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.entries(usuariosMap)
        .filter(([_, stats]) => stats.totalDias > 0)
        .sort((a, b) => b[1].totalDias - a[1].totalDias)
        .forEach(([userId, stats]) => {
            const asistencia = diasLaborales > 0 ? ((stats.totalDias / diasLaborales) * 100).toFixed(0) : "0";
            const puntualidad = stats.totalDias > 0 ? ((stats.diasPuntuales / stats.totalDias) * 100).toFixed(0) : "0";

            // Convertir horas decimales a HH:MM
            const totalMinutos = Math.round(stats.totalHoras * 60);
            const horas = Math.floor(totalMinutos / 60);
            const minutos = totalMinutos % 60;
            const horasFormato = `${horas}:${minutos.toString().padStart(2, '0')}`;

            html += `
                <tr>
                    <td>${stats.displayName}</td>
                    <td>${diasLaborales}</td>
                    <td>${stats.totalDias}</td>
                    <td>${stats.diasCompletos}</td>
                    <td>${stats.tardanzas}</td>
                    <td>${horasFormato}h</td>
                    <td><span class="status-badge ${asistencia >= 90 ? 'status-complete' : asistencia >= 70 ? 'status-incomplete' : 'status-absent'}">${asistencia}%</span></td>
                    <td><span class="status-badge ${puntualidad >= 90 ? 'status-complete' : puntualidad >= 70 ? 'status-incomplete' : 'status-absent'}">${puntualidad}%</span></td>
                </tr>
            `;
        });

    // Verificar si hay datos
    const hasData = Object.values(usuariosMap).some(stats => stats.totalDias > 0);
    if (!hasData) {
        html += '<tr><td colspan="9" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-inbox"></i> No se encontraron registros de asistencia para este período</td></tr>';
    }

    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;

    // Guardar datos para exportación
    currentReportData = {
        type: 'asistencia-mensual',
        period: displayPeriod,
        data: usuariosMap
    };
    
}

// ===================== FUNCIONES DE EXPORTACIÓN E IMPRESIÓN =====================
window.exportToPDF = function () {
    if (!currentReportData) {
        alert('No hay datos para exportar. Por favor genera un reporte primero.');
        return;
    }

    alert('Exportación a PDF en desarrollo. Por ahora usa la opción de Imprimir y guarda como PDF desde el navegador.');
};

window.exportToExcel = function () {
    if (!currentReportData) {
        alert('No hay datos para exportar. Por favor genera un reporte primero.');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();

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

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generar archivo
        const fileName = `reporte_${currentReportData.type}_${currentReportData.month || new Date().toISOString().slice(0, 7)}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (error) {
        console.error('Error al exportar Excel:', error);
        alert('Error al exportar a Excel. Verifica que la librería XLSX esté cargada.');
    }
}

// ===================== REPORTE DE TARDANZAS =====================
async function generateLatenessReport(startDate, endDate, displayPeriod, employeeId) {

    // Obtener asistencias del período
    const q = query(
        collection(db, "asistencias"),
        where("fecha", ">=", startDate),
        where("fecha", "<=", endDate)
    );
    const asistenciasSnapshot = await getDocs(q);

    // Obtener usuarios
    const usuariosSnapshot = await getDocs(collection(db, "usuario"));
    const usuarios = {};
    usuariosSnapshot.forEach(doc => {
        usuarios[doc.id] = {
            displayName: doc.data().displayName || `${doc.data().nombre || ''} ${doc.data().apellido || ''}`.trim() || doc.data().email,
            email: doc.data().email,
            rol: doc.data().rol || 'Empleado'
        };
    });
    const tardanzas = [];
    asistenciasSnapshot.forEach(doc => {
        const data = doc.data();
        // Filtrar solo entradas
        if (data.tipo !== "entrada") return;
        if (employeeId && data.userId !== employeeId) return;
        if (!usuarios[data.userId]) return;

        const [h, m] = data.hora.split(':').map(Number);
        if (h > 8 || (h === 8 && m > 30)) {
            const minutosRetraso = (h * 60 + m) - (8 * 60 + 30);
            tardanzas.push({
                ...data,
                ...usuarios[data.userId],
                minutosRetraso,
                horaLlegada: data.hora
            });
        }
    });

    const resultsDiv = document.getElementById('reportResults');
    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <div id="printableArea">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de Tardanzas - ${displayPeriod}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Total de tardanzas: ${tardanzas.length}</p>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Empleado</th>
                        <th>Rol</th>
                        <th>Hora Llegada</th>
                        <th>Retraso</th>
                    </tr>
                </thead>
                <tbody>
    `;

    tardanzas
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .forEach(t => {
            const fechaFormateada = new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            html += `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td><strong>${t.displayName}</strong><br><small style="color: #9ca3af;">${t.email}</small></td>
                    <td>${t.rol}</td>
                    <td>${t.horaLlegada}</td>
                    <td><span class="status-badge status-incomplete">${t.minutosRetraso} min</span></td>
                </tr>
            `;
        });

    if (tardanzas.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-check-circle"></i> No se registraron tardanzas en este período</td></tr>';
    }

    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;

    currentReportData = {
        type: 'tardanzas',
        period: displayPeriod,
        data: tardanzas
    };

}

// ===================== REPORTE DE AUSENCIAS =====================
async function generateAbsencesReport(startDate, endDate, displayPeriod, employeeId) {
    // Calcular días en el período
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diasEnPeriodo = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

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

    const q = query(
        collection(db, "asistencias"),
        where("fecha", ">=", startDate),
        where("fecha", "<=", endDate)
    );
    const asistenciasSnapshot = await getDocs(q);

    const diasAsistidos = {};
    asistenciasSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.tipo !== "entrada") return;
        if (!diasAsistidos[data.userId]) {
            diasAsistidos[data.userId] = new Set();
        }
        diasAsistidos[data.userId].add(data.fecha);
    });

    const ausencias = [];
    empleados.forEach(emp => {
        const diasPresentes = diasAsistidos[emp.id] ? diasAsistidos[emp.id].size : 0;

        // Calcular días laborales aproximados (excluyendo fines de semana)
        let diasLaborales = 0;
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);

        while (currentDate <= endDateObj) {
            const diaSemana = currentDate.getDay();
            if (diaSemana !== 0 && diaSemana !== 6) {
                diasLaborales++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const diasAusentes = diasLaborales - diasPresentes;

        if (diasAusentes > 0) {
            ausencias.push({
                ...emp,
                diasLaborales,
                diasPresentes,
                diasAusentes,
                porcentajeAsistencia: ((diasPresentes / diasLaborales) * 100).toFixed(1)
            });
        }
    });

    const resultsDiv = document.getElementById('reportResults');
    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <div id="printableArea">
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0; color: #374151;">Reporte de Ausencias - ${displayPeriod}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Empleados con ausencias: ${ausencias.length}</p>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 0.85rem;">Fecha de generación: ${fechaReporte}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Rol</th>
                        <th>Días Laborales</th>
                        <th>Días Presentes</th>
                        <th>Días Ausentes</th>
                        <th>% Asistencia</th>
                    </tr>
                </thead>
                <tbody>
    `;

    ausencias
        .sort((a, b) => b.diasAusentes - a.diasAusentes)
        .forEach(a => {
            const badgeClass = a.porcentajeAsistencia >= 90 ? 'status-complete' :
                a.porcentajeAsistencia >= 70 ? 'status-incomplete' : 'status-absent';
            html += `
                <tr>
                    <td><strong>${a.displayName}</strong><br><small style="color: #9ca3af;">${a.email}</small></td>
                    <td>${a.rol}</td>
                    <td>${a.diasLaborales}</td>
                    <td>${a.diasPresentes}</td>
                    <td><span class="status-badge status-absent">${a.diasAusentes}</span></td>
                    <td><span class="status-badge ${badgeClass}">${a.porcentajeAsistencia}%</span></td>
                </tr>
            `;
        });

    if (ausencias.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #6b7280;"><i class="fas fa-check-circle"></i> No se registraron ausencias en este período</td></tr>';
    }

    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;

    currentReportData = {
        type: 'ausencias',
        period: displayPeriod,
        data: ausencias
    };
    
}

window.printReport = function () {
    const printableArea = document.getElementById('printableArea');

    if (!printableArea) {
        alert('⚠️ No hay contenido para imprimir. Por favor genera un reporte primero.');
        return;
    }

    window.print();
};


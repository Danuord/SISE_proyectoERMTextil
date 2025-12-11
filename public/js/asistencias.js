// ===================== IMPORTS DE FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, Timestamp, collection, onSnapshot, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("✅ ASISTENCIA.JS CARGADO");

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
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase inicializado");

// ===================== OBTENER USUARIO ACTUAL =====================
let currentUser = null;
let isAdmin = false;

const session = localStorage.getItem('textileflow_session');
if (session) {
    currentUser = JSON.parse(session);
    isAdmin = currentUser.rol === 'Administrador' || currentUser.rol === 'admin';
    console.log("👤 Usuario:", currentUser.displayName || currentUser.email);
    console.log("🔑 Rol:", currentUser.rol, "| Admin:", isAdmin);
}

// ===================== CARGAR EMPLEADOS EN SELECT (TIEMPO REAL) =====================
document.addEventListener("DOMContentLoaded", () => {
    const manualEmployeeSelect = document.getElementById("manualEmployeeSelect");

    if (manualEmployeeSelect) {
        console.log("📋 Configurando listener para empleados...");

        onSnapshot(collection(db, "usuario"), (snapshot) => {
            console.log(`📥 Empleados recibidos: ${snapshot.size}`);

            manualEmployeeSelect.innerHTML = '<option value="">-- Seleccionar --</option>';

            snapshot.forEach((doc) => {
                const empleado = doc.data();
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = empleado.displayName || `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || empleado.email;
                option.dataset.name = option.textContent;
                manualEmployeeSelect.appendChild(option);
            });

            console.log("✅ Select de empleados poblado");
        }, (error) => {
            console.error("❌ Error al cargar empleados:", error);
        });
    }
});

// ===================== ACTUALIZAR ESTADO DE HOY (EMPLEADO) =====================
async function actualizarEstadoHoy() {
    if (!currentUser) return;

    const hoy = new Date().toISOString().split('T')[0];

    try {
        const q = query(
            collection(db, "asistencias"),
            where("userId", "==", currentUser.uid),
            where("fecha", "==", hoy)
        );

        const querySnapshot = await getDocs(q);

        let entrada = null;
        let salida = null;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tipo === "entrada") entrada = data.hora;
            if (data.tipo === "salida") salida = data.hora;
        });

        const btnCheckIn = document.getElementById("btnCheckIn");
        const btnCheckOut = document.getElementById("btnCheckOut");
        const statusDiv = document.getElementById("employeeTodayStatus");

        if (entrada && salida) {
            if (btnCheckIn) btnCheckIn.disabled = true;
            if (btnCheckOut) btnCheckOut.disabled = true;
            if (statusDiv) statusDiv.innerHTML = `<p>✅ Entrada: ${entrada} | Salida: ${salida}</p>`;
        } else if (entrada) {
            if (btnCheckIn) btnCheckIn.disabled = true;
            if (btnCheckOut) btnCheckOut.disabled = false;
            if (statusDiv) statusDiv.innerHTML = `<p>✅ Entrada registrada: ${entrada}</p>`;
        } else {
            if (btnCheckIn) btnCheckIn.disabled = false;
            if (btnCheckOut) btnCheckOut.disabled = true;
            if (statusDiv) statusDiv.innerHTML = `<p>⏳ Sin registro hoy</p>`;
        }
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
    }
}

// ===================== MARCAR ASISTENCIA (EMPLEADO) =====================
async function marcarAsistencia(tipo) {
    if (!currentUser) {
        showToast("❌ No hay usuario autenticado", "error");
        return;
    }

    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0, 5);

    try {
        const docId = `${currentUser.uid}_${hoy}_${tipo}`;

        await setDoc(doc(db, "asistencias", docId), {
            userId: currentUser.uid,
            displayName: currentUser.displayName || `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim(),
            fecha: hoy,
            hora: hora,
            tipo: tipo,
            timestamp: Timestamp.fromDate(ahora),
            source: "self",
            createdAt: serverTimestamp()
        });

        showToast(`✅ ${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada: ${hora}`, "success");
        actualizarEstadoHoy();

    } catch (error) {
        console.error("❌ Error al marcar asistencia:", error);
        showToast(`❌ Error: ${error.message}`, "error");
    }
}

window.markCheckIn = () => marcarAsistencia("entrada");
window.markCheckOut = () => marcarAsistencia("salida");

// ===================== REGISTRO MANUAL (ADMINISTRADOR) =====================
const manualRegisterForm = document.getElementById("manualRegisterForm");
if (manualRegisterForm) {
    manualRegisterForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const employeeId = document.getElementById("manualEmployeeSelect").value;
        const employeeName = document.getElementById("manualEmployeeSelect").selectedOptions[0]?.dataset.name;
        const fecha = document.getElementById("manualDate").value;
        const tipo = document.getElementById("manualType").value;
        const hora = document.getElementById("manualTime").value;

        if (!employeeId || !fecha || !tipo || !hora) {
            showToast("❌ Completa todos los campos", "error");
            return;
        }

        try {
            const docId = `${employeeId}_${fecha}_${tipo}`;

            await setDoc(doc(db, "asistencias", docId), {
                userId: employeeId,
                displayName: employeeName,
                fecha: fecha,
                hora: hora,
                tipo: tipo,
                timestamp: Timestamp.fromDate(new Date(`${fecha}T${hora}:00`)),
                source: "manual",
                registeredBy: currentUser.uid,
                createdAt: serverTimestamp()
            });

            showToast(`✅ Asistencia registrada para ${employeeName}`, "success");
            closeManualRegisterModal();
            manualRegisterForm.reset();
            cargarAsistenciasHoy();

        } catch (error) {
            console.error("❌ Error al registrar asistencia manual:", error);
            showToast(`❌ Error: ${error.message}`, "error");
        }
    });
}

// ===================== CARGAR ASISTENCIAS DE HOY (ADMINISTRADOR) =====================
async function cargarAsistenciasHoy() {
    const tbody = document.getElementById("todayAttendanceBody");
    if (!tbody) return;

    const hoy = new Date().toISOString().split('T')[0];

    try {
        const q = query(
            collection(db, "asistencias"),
            where("fecha", "==", hoy)
        );

        const querySnapshot = await getDocs(q);
        tbody.innerHTML = "";

        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        const totalEmpleados = usuariosSnapshot.size;

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay registros hoy</td></tr>';
            actualizarEstadisticas(totalEmpleados, 0, 0, totalEmpleados);
            return;
        }

        const porEmpleado = {};

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (!porEmpleado[data.userId]) {
                porEmpleado[data.userId] = {
                    userId: data.userId,
                    nombre: data.displayName,
                    entrada: null,
                    salida: null,
                    horaEntrada: null
                };
            }

            if (data.tipo === "entrada") {
                porEmpleado[data.userId].entrada = data.hora;
                porEmpleado[data.userId].horaEntrada = data.hora;
            } else if (data.tipo === "salida") {
                porEmpleado[data.userId].salida = data.hora;
            }
        });

        let presentes = 0;
        let tardanzas = 0;
        let ausentes = totalEmpleados - Object.keys(porEmpleado).length;

        Object.values(porEmpleado).forEach(emp => {
            const tr = document.createElement("tr");
            const entrada = emp.entrada || "--:--";
            const salida = emp.salida || "--:--";

            let horas = "--";
            if (emp.entrada && emp.salida) {
                const [hE, mE] = emp.entrada.split(':').map(Number);
                const [hS, mS] = emp.salida.split(':').map(Number);
                const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
                horas = (minutosTotal / 60).toFixed(2);
            }

            let estado = "Ausente";
            let statusClass = "absent";
            let esTarde = false;

            if (emp.entrada && emp.salida) {
                estado = "Completo";
                statusClass = "complete";
                presentes++;
            } else if (emp.entrada) {
                estado = "Incompleto";
                statusClass = "incomplete";
                presentes++;
            }

            if (emp.horaEntrada) {
                const [h, m] = emp.horaEntrada.split(':').map(Number);
                if (h > 8 || (h === 8 && m > 30)) {
                    esTarde = true;
                    tardanzas++;
                    statusClass = "late";
                }
            }

            tr.innerHTML = `
                <td>${emp.nombre}</td>
                <td>08:00</td>
                <td>${entrada}</td>
                <td>17:00</td>
                <td>${salida}</td>
                <td>${horas !== "--" ? horas + "h" : "--"}</td>
                <td><span class="status-badge status-${statusClass}">${esTarde ? "Tarde" : estado}</span></td>
                <td>
                    <button class="btn-icon" onclick="openEditModal('${emp.userId}', '${entrada}', '${salida}')" title="Editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        console.log(`✅ Asistencias de hoy cargadas: ${Object.keys(porEmpleado).length} empleados`);
        actualizarEstadisticas(totalEmpleados, presentes, tardanzas, ausentes);

    } catch (error) {
        console.error("❌ Error al cargar asistencias:", error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Error al cargar datos</td></tr>';
    }
}

// ===================== FILTRAR ASISTENCIAS DE HOY =====================
function filterTodayAttendance() {
    const filterValue = document.getElementById('todayStatusFilter')?.value || '';
    const tbody = document.getElementById('todayAttendanceBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        if (!filterValue) {
            // Mostrar todas las filas si no hay filtro
            row.style.display = '';
            return;
        }

        // Obtener el estado de la fila
        const statusCell = row.cells[6]; // Columna de "Estado"
        if (!statusCell) return;

        const statusBadge = statusCell.querySelector('.status-badge');
        if (!statusBadge) return;

        const statusText = statusBadge.textContent.toLowerCase();

        // Aplicar filtro
        let shouldShow = false;

        switch (filterValue) {
            case 'complete':
                shouldShow = statusText.includes('completo');
                break;
            case 'incomplete':
                shouldShow = statusText.includes('incompleto');
                break;
            case 'late':
                // Buscar badge de tardanza en la columna de entrada
                const entryCell = row.cells[2]; // Columna "Entrada Real"
                shouldShow = entryCell && entryCell.querySelector('.status-late');
                break;
            default:
                shouldShow = true;
        }

        row.style.display = shouldShow ? '' : 'none';
    });

    console.log(`✅ Filtro aplicado: ${filterValue || 'todos'}`);
}

// ===================== ACTUALIZAR ESTADÍSTICAS =====================
function actualizarEstadisticas(total, presentes, tardanzas, ausentes) {
    const statTotal = document.getElementById("statTotal");
    const statPresent = document.getElementById("statPresent");
    const statLate = document.getElementById("statLate");
    const statAbsent = document.getElementById("statAbsent");
    const statDate = document.getElementById("statDate");

    if (statTotal) statTotal.textContent = total;
    if (statPresent) statPresent.textContent = presentes;
    if (statLate) statLate.textContent = tardanzas;
    if (statAbsent) statAbsent.textContent = ausentes;

    if (statDate) {
        const hoy = new Date();
        const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
        statDate.textContent = fechaFormateada;
    }

    console.log(`📊 Estadísticas: Total=${total}, Presentes=${presentes}, Tardanzas=${tardanzas}, Ausentes=${ausentes}`);
}

// ===================== UTILIDADES =====================
function showToast(message, type = "info") {
    const toast = document.getElementById("statusMessage");
    if (!toast) {
        console.log(message);
        return;
    }

    toast.className = `status-message show ${type}`;
    toast.textContent = message;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// ===================== MODALES =====================
window.openManualRegisterModal = function () {
    const modal = document.getElementById("manualRegisterModal");
    if (modal) modal.classList.add("active");
};

window.closeManualRegisterModal = function () {
    const modal = document.getElementById("manualRegisterModal");
    if (modal) modal.classList.remove("active");
};

window.openEditModal = function (userId, entryTime, exitTime) {
    const modal = document.getElementById("editAttendanceModal");
    if (modal) {
        modal.classList.add("active");
        document.getElementById("editUserId").value = userId;
        document.getElementById("editEntryTime").value = entryTime !== "--:--" ? entryTime : "";
        document.getElementById("editExitTime").value = exitTime !== "--:--" ? exitTime : "";
        document.getElementById("editNotes").value = "";
        console.log("📝 Abriendo modal de edición:", { userId, entryTime, exitTime });
    }
};

window.closeEditModal = function () {
    const modal = document.getElementById("editAttendanceModal");
    if (modal) modal.classList.remove("active");
};

window.openScheduleModal = function () {
    const modal = document.getElementById("scheduleModal");
    if (modal) modal.classList.add("active");
};

window.closeScheduleModal = function () {
    const modal = document.getElementById("scheduleModal");
    if (modal) modal.classList.remove("active");
};

// ===================== FORMULARIO DE EDICIÓN =====================
const editForm = document.getElementById("editAttendanceForm");
if (editForm) {
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userId = document.getElementById("editUserId").value;
        const entryTime = document.getElementById("editEntryTime").value;
        const exitTime = document.getElementById("editExitTime").value;
        const hoy = new Date().toISOString().split('T')[0];

        console.log("💾 Guardando edición:", { userId, entryTime, exitTime, hoy });

        try {
            if (entryTime) {
                const entryDocId = `${userId}_${hoy}_entrada`;
                await setDoc(doc(db, "asistencias", entryDocId), {
                    userId: userId,
                    fecha: hoy,
                    hora: entryTime,
                    tipo: "entrada",
                    timestamp: Timestamp.fromDate(new Date(`${hoy}T${entryTime}:00`)),
                    source: "manual_edit",
                    editedBy: currentUser.uid,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                console.log("✅ Entrada actualizada");
            }

            if (exitTime) {
                const exitDocId = `${userId}_${hoy}_salida`;
                await setDoc(doc(db, "asistencias", exitDocId), {
                    userId: userId,
                    fecha: hoy,
                    hora: exitTime,
                    tipo: "salida",
                    timestamp: Timestamp.fromDate(new Date(`${hoy}T${exitTime}:00`)),
                    source: "manual_edit",
                    editedBy: currentUser.uid,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                console.log("✅ Salida actualizada");
            }

            showToast("✅ Asistencia actualizada correctamente", "success");
            closeEditModal();
            cargarAsistenciasHoy();

        } catch (error) {
            console.error("❌ Error al actualizar asistencia:", error);
            showToast(`❌ Error: ${error.message}`, "error");
        }
    });
}

// ===================== HISTORIAL GENERAL (ADMINISTRADOR) =====================
let allHistoryData = []; // Almacenar todos los datos para filtrado

async function cargarHistorialGeneral(days = 7, employeeFilter = '', statusFilter = '') {
    const container = document.getElementById("historyContainer");
    if (!container) return;

    try {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - days);
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

        const q = query(
            collection(db, "asistencias"),
            where("fecha", ">=", fechaInicioStr)
        );

        const querySnapshot = await getDocs(q);
        const usuariosSnapshot = await getDocs(collection(db, "usuario"));

        // Crear mapa de usuarios
        const usuariosMap = {};
        usuariosSnapshot.forEach(doc => {
            const user = doc.data();
            usuariosMap[doc.id] = user.displayName || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;
        });

        // Agrupar por fecha y empleado
        const porFecha = {};
        allHistoryData = []; // Reset

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (!porFecha[data.fecha]) {
                porFecha[data.fecha] = {};
            }
            if (!porFecha[data.fecha][data.userId]) {
                porFecha[data.fecha][data.userId] = {
                    entrada: null,
                    salida: null,
                    displayName: data.displayName || usuariosMap[data.userId] || 'Desconocido',
                    userId: data.userId
                };
            }

            if (data.tipo === "entrada") porFecha[data.fecha][data.userId].entrada = data.hora;
            if (data.tipo === "salida") porFecha[data.fecha][data.userId].salida = data.hora;
        });

        // Convertir a array plano para filtrado
        Object.entries(porFecha).forEach(([fecha, empleados]) => {
            Object.entries(empleados).forEach(([userId, data]) => {
                allHistoryData.push({
                    fecha,
                    userId,
                    displayName: data.displayName,
                    entrada: data.entrada,
                    salida: data.salida
                });
            });
        });

        // Aplicar filtros y renderizar
        renderFilteredHistory(employeeFilter, statusFilter);

        console.log(`✅ Historial general cargado: ${allHistoryData.length} registros`);

    } catch (error) {
        console.error("❌ Error al cargar historial general:", error);
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#e74c3c;">Error al cargar historial</p>';
    }
}

// ===================== RENDERIZAR HISTORIAL FILTRADO =====================
function renderFilteredHistory(employeeFilter = '', statusFilter = '') {
    const container = document.getElementById("historyContainer");
    if (!container) return;

    // Filtrar datos
    let filteredData = [...allHistoryData];

    if (employeeFilter) {
        filteredData = filteredData.filter(record => record.userId === employeeFilter);
    }

    if (statusFilter) {
        filteredData = filteredData.filter(record => {
            const hasEntrada = record.entrada !== null;
            const hasSalida = record.salida !== null;

            switch (statusFilter) {
                case 'complete':
                    return hasEntrada && hasSalida;
                case 'incomplete':
                    return hasEntrada && !hasSalida;
                case 'absent':
                    return !hasEntrada;
                default:
                    return true;
            }
        });
    }

    // Si hay filtros activos, mostrar tabla simple
    if (employeeFilter || statusFilter) {
        renderSimpleHistoryTable(filteredData, employeeFilter);
    } else {
        // Sin filtros, mostrar vista agrupada por fecha
        renderGroupedHistory(filteredData);
    }
}

// ===================== RENDERIZAR TABLA SIMPLE (PARA IMPRIMIR) =====================
function renderSimpleHistoryTable(data, employeeFilter) {
    const container = document.getElementById("historyContainer");

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">No hay registros que coincidan con los filtros</p>';
        return;
    }

    // Ordenar por fecha descendente
    data.sort((a, b) => b.fecha.localeCompare(a.fecha));

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'simple-history-table';
    tableWrapper.id = 'printableHistoryTable';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';

    const title = document.createElement('h3');
    title.textContent = employeeFilter ? `Historial de ${data[0].displayName}` : 'Historial de Asistencias';
    title.style.margin = '0';

    const printBtn = document.createElement('button');
    printBtn.className = 'btn-secondary';
    printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
    printBtn.onclick = () => printHistoryTable();
    printBtn.style.cssText = 'display: inline-flex; align-items: center; gap: 8px;';

    header.appendChild(title);
    header.appendChild(printBtn);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                ${!employeeFilter ? '<th>Empleado</th>' : ''}
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(record => {
        const entrada = record.entrada || "--:--";
        const salida = record.salida || "--:--";

        let horas = "--";
        if (record.entrada && record.salida) {
            const [hE, mE] = record.entrada.split(':').map(Number);
            const [hS, mS] = record.salida.split(':').map(Number);
            const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
            horas = (minutosTotal / 60).toFixed(2);
        }

        const estado = record.entrada && record.salida ? "Completo" : record.entrada ? "Incompleto" : "Ausente";
        const statusClass = record.entrada && record.salida ? "complete" : record.entrada ? "incomplete" : "absent";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(record.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
            ${!employeeFilter ? `<td>${record.displayName}</td>` : ''}
            <td>${entrada}</td>
            <td>${salida}</td>
            <td>${horas !== "--" ? horas + "h" : "--"}</td>
            <td><span class="status-badge status-${statusClass}">${estado}</span></td>
        `;
        tbody.appendChild(tr);
    });

    tableWrapper.appendChild(header);
    tableWrapper.appendChild(table);
    container.innerHTML = '';
    container.appendChild(tableWrapper);
}

// ===================== RENDERIZAR VISTA AGRUPADA =====================
function renderGroupedHistory(data) {
    const container = document.getElementById("historyContainer");

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">No hay registros en este período</p>';
        return;
    }

    // Agrupar por fecha
    const porFecha = {};
    data.forEach(record => {
        if (!porFecha[record.fecha]) {
            porFecha[record.fecha] = [];
        }
        porFecha[record.fecha].push(record);
    });

    container.innerHTML = "";

    // Renderizar por fecha (más reciente primero)
    Object.keys(porFecha).sort().reverse().forEach(fecha => {
        const empleados = porFecha[fecha];
        const dateGroup = document.createElement('div');
        dateGroup.className = 'history-date-group';

        const header = document.createElement('div');
        header.className = 'history-date-header';

        const completos = empleados.filter(e => e.entrada && e.salida).length;

        header.innerHTML = `
            <h4>${new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
            <div class="history-date-summary">${completos}/${empleados.length} completos</div>
        `;

        const content = document.createElement('div');
        content.className = 'history-date-content';

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Empleado</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Horas</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        empleados.forEach(record => {
            const entrada = record.entrada || "--:--";
            const salida = record.salida || "--:--";

            let horas = "--";
            if (record.entrada && record.salida) {
                const [hE, mE] = record.entrada.split(':').map(Number);
                const [hS, mS] = record.salida.split(':').map(Number);
                const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
                horas = (minutosTotal / 60).toFixed(2);
            }

            const estado = record.entrada && record.salida ? "Completo" : record.entrada ? "Incompleto" : "Ausente";
            const statusClass = record.entrada && record.salida ? "complete" : record.entrada ? "incomplete" : "absent";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.displayName}</td>
                <td>${entrada}</td>
                <td>${salida}</td>
                <td>${horas !== "--" ? horas + "h" : "--"}</td>
                <td><span class="status-badge status-${statusClass}">${estado}</span></td>
            `;
            tbody.appendChild(tr);
        });

        content.appendChild(table);
        dateGroup.appendChild(header);
        dateGroup.appendChild(content);

        // Toggle expand/collapse
        header.addEventListener('click', () => {
            content.classList.toggle('expanded');
        });

        container.appendChild(dateGroup);
    });
}

// ===================== IMPRIMIR TABLA DE HISTORIAL =====================
window.printHistoryTable = function () {
    const printWindow = window.open('', '', 'height=600,width=800');

    printWindow.document.write('<html><head><title>Historial de Asistencias</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h3 { color: #667eea; margin-bottom: 20px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }');
    printWindow.document.write('th { background-color: #f8f9fa; font-weight: 600; }');
    printWindow.document.write('.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }');
    printWindow.document.write('.status-complete { background: #d1fae5; color: #065f46; }');
    printWindow.document.write('.status-incomplete { background: #fef3c7; color: #92400e; }');
    printWindow.document.write('.status-absent { background: #fee2e2; color: #991b1b; }');
    printWindow.document.write('@media print { button { display: none; } }');
    printWindow.document.write('</style></head><body>');

    const tableContent = document.getElementById('printableHistoryTable');
    if (tableContent) {
        const clone = tableContent.cloneNode(true);
        // Remover botón de imprimir del clon
        const printBtn = clone.querySelector('button');
        if (printBtn) printBtn.remove();

        printWindow.document.write(clone.innerHTML);
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
    }, 250);
};

// ===================== ESTADÍSTICAS GENERALES (ADMINISTRADOR) =====================
async function cargarEstadisticasGenerales(days = 7) {
    const statsTable = document.getElementById("statsTable");
    try {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - days);
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

        const q = query(
            collection(db, "asistencias"),
            where("fecha", ">=", fechaInicioStr)
        );

        const querySnapshot = await getDocs(q);
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

        querySnapshot.forEach(doc => {
            const data = doc.data();
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

        // Calcular estadísticas por empleado
        Object.entries(porEmpleadoFecha).forEach(([userId, fechas]) => {
            if (!usuariosMap[userId]) return;

            Object.values(fechas).forEach(dia => {
                if (dia.entrada) {
                    usuariosMap[userId].totalDias++;

                    if (dia.salida) {
                        usuariosMap[userId].diasCompletos++;

                        // Calcular horas
                        const [hE, mE] = dia.entrada.split(':').map(Number);
                        const [hS, mS] = dia.salida.split(':').map(Number);
                        const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
                        usuariosMap[userId].totalHoras += minutosTotal / 60;
                    }

                    // Detectar tardanza (después de 08:30)
                    const [h, m] = dia.entrada.split(':').map(Number);
                    if (h > 8 || (h === 8 && m > 30)) {
                        usuariosMap[userId].tardanzas++;
                    }
                }
            });
        });

        // Renderizar tabla
        const tbody = statsTable.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = "";

        Object.entries(usuariosMap)
            .filter(([_, stats]) => stats.totalDias > 0)
            .sort((a, b) => b[1].totalDias - a[1].totalDias)
            .forEach(([userId, stats]) => {
                const tr = document.createElement('tr');
                const promHoras = stats.diasCompletos > 0 ? (stats.totalHoras / stats.diasCompletos).toFixed(2) : "0.00";
                const asistencia = stats.totalDias > 0 ? ((stats.diasCompletos / stats.totalDias) * 100).toFixed(0) : "0";

                tr.innerHTML = `
                    <td>${stats.displayName}</td>
                    <td>${stats.totalDias}</td>
                    <td>${stats.diasCompletos}</td>
                    <td>${stats.tardanzas}</td>
                    <td>${stats.totalHoras.toFixed(2)}h</td>
                    <td>${promHoras}h</td>
                    <td><span class="status-badge ${asistencia >= 90 ? 'status-complete' : asistencia >= 70 ? 'status-incomplete' : 'status-absent'}">${asistencia}%</span></td>
                `;
                tbody.appendChild(tr);
            });

        console.log(`✅ Estadísticas generales cargadas`);

        // Renderizar gráficos
        renderWeeklyChart(porEmpleadoFecha, days);
        renderLatenessChart(usuariosMap);

    } catch (error) {
        console.error("❌ Error al cargar estadísticas:", error);
        const tbody = statsTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Error al cargar estadísticas</td></tr>';
        }
    }
}

// ===================== RENDERIZAR GRÁFICO SEMANAL =====================
let weeklyChartInstance = null;

function renderWeeklyChart(porEmpleadoFecha, days) {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;

    try {
        // Destruir gráfico anterior si existe
        if (weeklyChartInstance) {
            weeklyChartInstance.destroy();
        }

        // Generar últimos N días
        const labels = [];
        const fechaFin = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const fecha = new Date(fechaFin);
            fecha.setDate(fecha.getDate() - i);
            labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }));
        }

        // Contar asistencias por día
        const asistenciasPorDia = {};
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - days);

        for (let i = 0; i < days; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fecha.getDate() + i);
            const fechaStr = fecha.toISOString().split('T')[0];
            asistenciasPorDia[fechaStr] = { completos: 0, incompletos: 0 };
        }

        // Contar por cada empleado/fecha
        Object.values(porEmpleadoFecha).forEach(fechas => {
            Object.entries(fechas).forEach(([fecha, dia]) => {
                if (asistenciasPorDia[fecha]) {
                    if (dia.entrada && dia.salida) {
                        asistenciasPorDia[fecha].completos++;
                    } else if (dia.entrada) {
                        asistenciasPorDia[fecha].incompletos++;
                    }
                }
            });
        });

        // Preparar datos para el gráfico
        const dataCompletos = [];
        const dataIncompletos = [];

        Object.keys(asistenciasPorDia).sort().forEach(fecha => {
            dataCompletos.push(asistenciasPorDia[fecha].completos);
            dataIncompletos.push(asistenciasPorDia[fecha].incompletos);
        });

        const ctx = canvas.getContext('2d');
        weeklyChartInstance = new Chart(ctx, {
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
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                }
            }
        });

        console.log('✅ Gráfico semanal renderizado');

    } catch (error) {
        console.error('❌ Error al renderizar gráfico semanal:', error);
    }
}

// ===================== RENDERIZAR GRÁFICO DE TARDANZAS =====================
let latenessChartInstance = null;

function renderLatenessChart(usuariosMap) {
    const canvas = document.getElementById('latenessChart');
    if (!canvas) return;

    try {
        // Destruir gráfico anterior si existe
        if (latenessChartInstance) {
            latenessChartInstance.destroy();
        }

        // Obtener top 10 empleados con más tardanzas
        const empleadosConTardanzas = Object.entries(usuariosMap)
            .filter(([_, stats]) => stats.tardanzas > 0)
            .sort((a, b) => b[1].tardanzas - a[1].tardanzas)
            .slice(0, 10);

        if (empleadosConTardanzas.length === 0) {
            // Mostrar mensaje si no hay tardanzas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('No hay tardanzas registradas', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = empleadosConTardanzas.map(([_, stats]) => stats.displayName);
        const data = empleadosConTardanzas.map(([_, stats]) => stats.tardanzas);

        const ctx = canvas.getContext('2d');
        latenessChartInstance = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tardanzas',
                    data: data,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                }
            }
        });

        console.log('✅ Gráfico de tardanzas renderizado');

    } catch (error) {
        console.error('❌ Error al renderizar gráfico de tardanzas:', error);
    }
}

// ===================== ASISTENCIAS POR EMPLEADO (ADMINISTRADOR) =====================
async function cargarAsistenciasPorEmpleado(employeeId = null) {
    // Esta función se puede expandir más adelante si hay un tab específico
    console.log("Cargando asistencias por empleado:", employeeId);
}

// ===================== TABS =====================
function switchTab(tabName) {
    console.log("Cambiando a tab:", tabName);

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));

    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        console.log("✅ Botón activado:", tabName);
    }

    const selectedContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
    if (selectedContent) {
        selectedContent.classList.add('active');
        console.log("✅ Contenido activado:", tabName);
    }

    // Cargar datos según el tab
    switch (tabName) {
        case 'today':
            cargarAsistenciasHoy();
            break;
        case 'history':
            const historyRange = document.getElementById('historyRange');
            const days = historyRange ? parseInt(historyRange.value) : 7;
            cargarHistorialGeneral(days);
            break;
        case 'stats':
            const statsPeriod = document.getElementById('statsPeriod');
            const period = statsPeriod ? parseInt(statsPeriod.value) : 7;
            cargarEstadisticasGenerales(period);
            break;
        default:
            console.log("Tab sin función de carga:", tabName);
    }
}

// ===================== HISTORIAL EMPLEADO =====================
async function loadEmployeeHistory(days = 7) {
    if (!currentUser) return;

    const tbody = document.getElementById("employeeHistoryBody");
    if (!tbody) return;

    try {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - days);
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

        const q = query(
            collection(db, "asistencias"),
            where("userId", "==", currentUser.uid),
            where("fecha", ">=", fechaInicioStr)
        );

        const querySnapshot = await getDocs(q);
        tbody.innerHTML = "";

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros</td></tr>';
            return;
        }

        const porFecha = {};

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (!porFecha[data.fecha]) {
                porFecha[data.fecha] = { entrada: null, salida: null };
            }

            if (data.tipo === "entrada") porFecha[data.fecha].entrada = data.hora;
            if (data.tipo === "salida") porFecha[data.fecha].salida = data.hora;
        });

        Object.keys(porFecha).sort().reverse().forEach(fecha => {
            const dia = porFecha[fecha];
            const tr = document.createElement("tr");
            const entrada = dia.entrada || "--:--";
            const salida = dia.salida || "--:--";

            let horas = "--";
            if (dia.entrada && dia.salida) {
                const [hE, mE] = dia.entrada.split(':').map(Number);
                const [hS, mS] = dia.salida.split(':').map(Number);
                const minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);
                horas = (minutosTotal / 60).toFixed(2);
            }

            const estado = dia.entrada && dia.salida ? "Completo" : dia.entrada ? "Incompleto" : "Ausente";
            const statusClass = dia.entrada && dia.salida ? "complete" : dia.entrada ? "incomplete" : "absent";

            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${entrada}</td>
                <td>${salida}</td>
                <td>${horas !== "--" ? horas + "h" : "--"}</td>
                <td><span class="status-badge status-${statusClass}">${estado}</span></td>
            `;

            tbody.appendChild(tr);
        });

        console.log(`✅ Historial cargado: ${Object.keys(porFecha).length} días`);

    } catch (error) {
        console.error("❌ Error al cargar historial:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar historial</td></tr>';
    }
}

// ===================== SETUP EVENT LISTENERS =====================
function setupEventListeners() {
    console.log("🎯 Configurando event listeners...");

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    const employeeHistoryRange = document.getElementById('employeeHistoryRange');
    if (employeeHistoryRange) {
        employeeHistoryRange.addEventListener('change', (e) => {
            loadEmployeeHistory(parseInt(e.target.value));
        });
    }

    // Event listeners para admin
    if (isAdmin) {
        // Filtro de estado en tab "Hoy"
        const todayStatusFilter = document.getElementById('todayStatusFilter');
        if (todayStatusFilter) {
            todayStatusFilter.addEventListener('change', () => {
                filterTodayAttendance();
            });
        }

        // Filtro de rango en historial
        const historyRange = document.getElementById('historyRange');
        if (historyRange) {
            historyRange.addEventListener('change', (e) => {
                const value = e.target.value;
                const customDateRange = document.getElementById('customDateRange');

                if (value === 'custom') {
                    if (customDateRange) customDateRange.style.display = 'flex';
                } else {
                    if (customDateRange) customDateRange.style.display = 'none';
                    cargarHistorialGeneral(parseInt(value));
                }
            });
        }

        // Filtro de período en estadísticas
        const statsPeriod = document.getElementById('statsPeriod');
        if (statsPeriod) {
            statsPeriod.addEventListener('change', (e) => {
                cargarEstadisticasGenerales(parseInt(e.target.value));
            });
        }

        // Filtro de empleado en historial
        const historyEmployeeFilter = document.getElementById('historyEmployeeFilter');
        if (historyEmployeeFilter) {
            // Poblar select con empleados
            onSnapshot(collection(db, "usuario"), (snapshot) => {
                historyEmployeeFilter.innerHTML = '<option value="">Todos los empleados</option>';
                snapshot.forEach((doc) => {
                    const empleado = doc.data();
                    const option = document.createElement("option");
                    option.value = doc.id;
                    option.textContent = empleado.displayName || `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || empleado.email;
                    historyEmployeeFilter.appendChild(option);
                });
            });

            // Event listener para cambio de empleado
            historyEmployeeFilter.addEventListener('change', () => {
                const employeeFilter = historyEmployeeFilter.value;
                const statusFilter = document.getElementById('historyStatusFilter')?.value || '';
                renderFilteredHistory(employeeFilter, statusFilter);
            });
        }

        // Filtro de estado en historial
        const historyStatusFilter = document.getElementById('historyStatusFilter');
        if (historyStatusFilter) {
            historyStatusFilter.addEventListener('change', () => {
                const employeeFilter = document.getElementById('historyEmployeeFilter')?.value || '';
                const statusFilter = historyStatusFilter.value;
                renderFilteredHistory(employeeFilter, statusFilter);
            });
        }
    }

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    console.log("✅ Event listeners configurados");
}

// Función para aplicar rango personalizado
window.applyCustomRange = function () {
    const startDate = document.getElementById('historyStartDate').value;
    const endDate = document.getElementById('historyEndDate').value;

    if (!startDate || !endDate) {
        showToast("❌ Selecciona ambas fechas", "error");
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    cargarHistorialGeneral(diffDays);
};

// ===================== INICIALIZACIÓN =====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando módulo de asistencias...");

    mostrarPanelSegunRol();
    setupEventListeners();

    if (isAdmin) {
        const firstTab = document.querySelector('.tab-btn[data-tab="today"]');
        if (firstTab) firstTab.classList.add('active');

        const firstTabContent = document.querySelector('.tab-content[data-tab="today"]');
        if (firstTabContent) firstTabContent.classList.add('active');

        cargarAsistenciasHoy();
    }

    if (currentUser && !isAdmin) {
        actualizarEstadoHoy();
        loadEmployeeHistory(7);
    }

    console.log("✅ Módulo de asistencias listo");
});

// ===================== MOSTRAR PANEL SEGÚN ROL =====================
function mostrarPanelSegunRol() {
    const employeeView = document.getElementById("employeeView");
    const adminView = document.getElementById("adminView");

    console.log("🎨 Mostrando panel para:", isAdmin ? "Administrador" : "Empleado");

    if (isAdmin) {
        if (employeeView) employeeView.style.display = "none";
        if (adminView) adminView.style.display = "block";
        console.log("✅ Panel de administrador visible");
    } else {
        if (employeeView) employeeView.style.display = "block";
        if (adminView) adminView.style.display = "none";
        console.log("✅ Panel de empleado visible");
    }

    cargarInfoUsuario();
}

// ===================== CARGAR INFO USUARIO EN SIDEBAR =====================
function cargarInfoUsuario() {
    const userNameElement = document.getElementById("userNameDisplay");
    const userRoleElement = document.getElementById("userRoleDisplay");

    console.log("📝 Cargando info de usuario en sidebar...");

    if (currentUser) {
        const displayName = currentUser.displayName || `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim() || currentUser.email;
        const role = currentUser.rol || currentUser.role || 'Usuario';

        if (userNameElement) {
            userNameElement.textContent = displayName;
            console.log("✅ Nombre actualizado:", displayName);
        }

        if (userRoleElement) {
            userRoleElement.textContent = role;
            console.log("✅ Rol actualizado:", role);
        }
    }
}

// ===================== SIDEBAR Y LOGOUT =====================
window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

window.logout = function () {
    localStorage.removeItem('textileflow_session');
    window.location.href = './login.html';
};

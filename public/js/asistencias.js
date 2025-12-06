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

    if (tabName === 'today') {
        cargarAsistenciasHoy();
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

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    console.log("✅ Event listeners configurados");
}

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

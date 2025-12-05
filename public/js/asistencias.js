// ===================== IMPORTS DE FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
    collection,
    onSnapshot,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("✅ ASISTENCIAS.JS CARGADO");

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

// Inicializar Firebase
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
const manualEmployeeSelect = document.getElementById("manualEmployeeSelect");

if (manualEmployeeSelect) {
    console.log("📋 Configurando listener para empleados...");

    onSnapshot(collection(db, "usuario"), (snapshot) => {
        console.log("📨 Empleados actualizados - Total:", snapshot.size);

        manualEmployeeSelect.innerHTML = `<option value="">-- Seleccionar Empleado --</option>`;

        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = `${data.nombre} ${data.apellido}`;
            option.dataset.email = data.email;
            option.dataset.nombre = data.nombre;
            option.dataset.apellido = data.apellido;
            option.dataset.rol = data.rol;
            manualEmployeeSelect.appendChild(option);
        });

        console.log("✅ Select de empleados poblado");
    });
}

// ===================== BOTONES DE MARCAR ASISTENCIA (EMPLEADO) =====================
const btnCheckIn = document.getElementById("btnCheckIn");
const btnCheckOut = document.getElementById("btnCheckOut");

if (btnCheckIn) {
    btnCheckIn.addEventListener("click", async () => {
        console.log("🔵 Marcando ENTRADA...");
        await marcarAsistencia("entrada");
    });
}

if (btnCheckOut) {
    btnCheckOut.addEventListener("click", async () => {
        console.log("🔴 Marcando SALIDA...");
        await marcarAsistencia("salida");
    });
}

// ===================== FUNCIÓN MARCAR ASISTENCIA =====================
async function marcarAsistencia(tipo) {
    if (!currentUser) {
        showToast("❌ No hay sesión activa", "error");
        return;
    }

    try {
        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
        const hora = ahora.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        // Verificar si ya marcó este tipo hoy
        const q = query(
            collection(db, "asistencias"),
            where("userId", "==", currentUser.uid),
            where("fecha", "==", fecha),
            where("tipo", "==", tipo)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            showToast(`❌ Ya marcaste ${tipo} hoy`, "error");
            return;
        }

        // Crear ID único para el documento
        const docId = `${currentUser.uid}_${fecha}_${tipo}`;

        // Guardar en Firestore
        await setDoc(doc(db, "asistencias", docId), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            displayName: currentUser.displayName || `${currentUser.nombre} ${currentUser.apellido}`,
            rol: currentUser.rol || currentUser.role,
            fecha: fecha,
            hora: hora,
            timestamp: Timestamp.fromDate(ahora),
            tipo: tipo,
            createdAt: serverTimestamp()
        });

        console.log(`✅ ${tipo.toUpperCase()} guardada en Firestore`);
        showToast(`✅ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada: ${hora}`, "success");

        // Actualizar UI
        actualizarEstadoHoy();

    } catch (error) {
        console.error("❌ Error al marcar asistencia:", error);
        showToast(`❌ Error: ${error.message}`, "error");
    }
}

// ===================== ACTUALIZAR ESTADO DEL DÍA =====================
async function actualizarEstadoHoy() {
    if (!currentUser) return;

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];

    try {
        // Buscar entrada y salida de hoy
        const q = query(
            collection(db, "asistencias"),
            where("userId", "==", currentUser.uid),
            where("fecha", "==", fecha)
        );

        const querySnapshot = await getDocs(q);

        let entrada = null;
        let salida = null;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tipo === "entrada") entrada = data;
            if (data.tipo === "salida") salida = data;
        });

        // Actualizar botones
        if (btnCheckIn) {
            btnCheckIn.disabled = !!entrada;
        }

        if (btnCheckOut) {
            btnCheckOut.disabled = !!salida || !entrada;
        }

        // Actualizar display de estado
        const statusDiv = document.getElementById("employeeTodayStatus");
        if (statusDiv) {
            let html = '<div class="status-item">';

            if (entrada) {
                html += `<span class="status-label">Entrada:</span><span class="status-value">${entrada.hora}</span>`;
            } else {
                html += `<span class="status-label">Entrada:</span><span class="status-value">No registrada</span>`;
            }

            html += '</div><div class="status-item">';

            if (salida) {
                html += `<span class="status-label">Salida:</span><span class="status-value">${salida.hora}</span>`;
            } else {
                html += `<span class="status-label">Salida:</span><span class="status-value">No registrada</span>`;
            }

            html += '</div>';
            statusDiv.innerHTML = html;
        }

        console.log("✅ Estado actualizado - Entrada:", entrada?.hora || "No", "| Salida:", salida?.hora || "No");

    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
    }
}

// ===================== REGISTRO MANUAL (ADMINISTRADOR) =====================
const manualRegisterForm = document.getElementById("manualRegisterForm");

if (manualRegisterForm) {
    manualRegisterForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const employeeId = document.getElementById("manualEmployeeSelect").value;
        const fecha = document.getElementById("manualDate").value;
        const tipo = document.getElementById("manualType").value;
        const hora = document.getElementById("manualTime").value;

        if (!employeeId || !fecha || !tipo || !hora) {
            showToast("❌ Completa todos los campos", "error");
            return;
        }

        try {
            // Obtener datos del empleado seleccionado
            const selectedOption = manualEmployeeSelect.options[manualEmployeeSelect.selectedIndex];
            const employeeEmail = selectedOption.dataset.email;
            const employeeName = `${selectedOption.dataset.nombre} ${selectedOption.dataset.apellido}`;
            const employeeRol = selectedOption.dataset.rol;

            // Crear ID único
            const docId = `${employeeId}_${fecha}_${tipo}`;

            // Crear timestamp desde fecha y hora
            const fechaHora = new Date(`${fecha}T${hora}:00`);

            // Guardar en Firestore
            await setDoc(doc(db, "asistencias", docId), {
                userId: employeeId,
                userEmail: employeeEmail,
                displayName: employeeName,
                rol: employeeRol,
                fecha: fecha,
                hora: hora,
                timestamp: Timestamp.fromDate(fechaHora),
                tipo: tipo,
                source: "manual",
                registeredBy: currentUser.uid,
                createdAt: serverTimestamp()
            });

            console.log(`✅ Asistencia manual guardada: ${employeeName} - ${tipo} - ${fecha} ${hora}`);
            showToast(`✅ Asistencia registrada para ${employeeName}`, "success");

            // Cerrar modal y resetear form
            const modal = document.getElementById("manualRegisterModal");
            if (modal) modal.classList.remove("active");
            manualRegisterForm.reset();

            // Recargar lista de asistencias
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

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros hoy</td></tr>';
            return;
        }

        // Agrupar por empleado
        const porEmpleado = {};

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (!porEmpleado[data.userId]) {
                porEmpleado[data.userId] = {
                    nombre: data.displayName,
                    entrada: null,
                    salida: null
                };
            }

            if (data.tipo === "entrada") {
                porEmpleado[data.userId].entrada = data.hora;
            } else if (data.tipo === "salida") {
                porEmpleado[data.userId].salida = data.hora;
            }
        });

        // Crear filas
        Object.values(porEmpleado).forEach(emp => {
            const tr = document.createElement("tr");

            const entrada = emp.entrada || "--:--";
            const salida = emp.salida || "--:--";
            const estado = emp.entrada && emp.salida ? "Completo" : emp.entrada ? "Incompleto" : "Ausente";
            const statusClass = emp.entrada && emp.salida ? "complete" : emp.entrada ? "incomplete" : "absent";

            tr.innerHTML = `
                <td>${emp.nombre}</td>
                <td>${entrada}</td>
                <td>${salida}</td>
                <td><span class="status-badge status-${statusClass}">${estado}</span></td>
            `;

            tbody.appendChild(tr);
        });

        console.log(`✅ Asistencias de hoy cargadas: ${Object.keys(porEmpleado).length} empleados`);

    } catch (error) {
        console.error("❌ Error al cargar asistencias:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar datos</td></tr>';
    }
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

// ===================== INICIALIZACIÓN =====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando módulo de asistencias...");

    // Actualizar estado si es empleado
    if (currentUser && !isAdmin) {
        actualizarEstadoHoy();
    }

    // Cargar asistencias si es admin
    if (isAdmin) {
        cargarAsistenciasHoy();
    }

    console.log("✅ Módulo de asistencias listo");
});

// Sidebar y logout
window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

window.logout = function () {
    localStorage.removeItem('textileflow_session');
    window.location.href = './login.html';
};

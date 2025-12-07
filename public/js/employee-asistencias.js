// ===================== EMPLOYEE ATTENDANCE =====================
import { requireAuth, getCurrentUser } from '../../components/auth-guard.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

requireAuth();
const currentUser = getCurrentUser();

const firebaseConfig = {
    apiKey: "AIzaSyDRTKsoZ9Zzh1oo-DQtlxnZ4Pw6RWBv08c",
    authDomain: "textileflow-test.firebaseapp.com",
    projectId: "textileflow-test",
    storageBucket: "textileflow-test.firebasestorage.app",
    messagingSenderId: "227349652064",
    appId: "1:227349652064:web:d32994273a529a07e25905"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== MARCAR ENTRADA/SALIDA =====================
async function marcarAsistencia(tipo) {
    if (!currentUser) return;

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

    try {
        const docId = `${currentUser.uid}_${fecha}_${tipo}`;
        await setDoc(doc(db, "asistencias", docId), {
            userId: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email,
            fecha: fecha,
            hora: hora,
            tipo: tipo,
            timestamp: serverTimestamp(),
            source: "self"
        });

        console.log(`✅ ${tipo} marcada: ${hora}`);
        alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} marcada exitosamente a las ${hora}`);

        actualizarEstadoHoy();
        loadEmployeeHistory();
    } catch (error) {
        console.error(`Error al marcar ${tipo}:`, error);
        alert(`Error al marcar ${tipo}`);
    }
}

// ===================== ACTUALIZAR ESTADO DE HOY =====================
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
        let entradaManual = false;
        let salidaManual = false;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tipo === "entrada") {
                entrada = data.hora;
                entradaManual = data.source === "manual";
            }
            if (data.tipo === "salida") {
                salida = data.hora;
                salidaManual = data.source === "manual";
            }
        });

        // Elementos del DOM
        const todayStatus = document.getElementById('todayStatus');
        const statusEntry = document.getElementById('statusEntry');
        const statusExit = document.getElementById('statusExit');
        const btnCheckIn = document.getElementById('btnCheckIn');
        const btnCheckOut = document.getElementById('btnCheckOut');

        // Mostrar/ocultar sección de estado
        if (todayStatus) {
            if (entrada) {
                todayStatus.style.display = 'block';
            } else {
                todayStatus.style.display = 'none';
            }
        }

        // Actualizar valores de entrada/salida
        if (statusEntry) {
            statusEntry.textContent = entrada ? entrada + (entradaManual ? " (Admin)" : "") : "--:--";
            statusEntry.style.color = entrada ? '#fff' : '#ddd';
        }
        if (statusExit) {
            statusExit.textContent = salida ? salida + (salidaManual ? " (Admin)" : "") : "--:--";
            statusExit.style.color = salida ? '#fff' : '#ddd';
        }

        // Lógica de botones
        if (btnCheckIn) {
            btnCheckIn.disabled = !!entrada;
            if (entrada) {
                btnCheckIn.innerHTML = '<i class="fas fa-check-circle"></i><span>Entrada Marcada</span>';
            } else {
                btnCheckIn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Marcar Entrada</span>';
            }
        }

        if (btnCheckOut) {
            btnCheckOut.disabled = !entrada || !!salida;
            if (salida) {
                btnCheckOut.innerHTML = '<i class="fas fa-check-circle"></i><span>Salida Marcada</span>';
            } else if (!entrada) {
                btnCheckOut.innerHTML = '<i class="fas fa-lock"></i><span>Marca Entrada Primero</span>';
            } else {
                btnCheckOut.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Marcar Salida</span>';
            }
        }

    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

// ===================== CARGAR HORARIO DE HOY =====================
function cargarHorarioHoy() {
    const scheduleEntry = document.getElementById('scheduleEntry');
    const scheduleExit = document.getElementById('scheduleExit');

    if (scheduleEntry) scheduleEntry.textContent = "08:00 AM";
    if (scheduleExit) scheduleExit.textContent = "05:00 PM";
}

// ===================== CARGAR HISTORIAL =====================
async function loadEmployeeHistory() {
    if (!currentUser) return;

    const tbody = document.getElementById('employeeHistoryBody');
    const rangeSelect = document.getElementById('employeeHistoryRange');

    if (!tbody) {
        console.error("Tabla de historial no encontrada");
        return;
    }

    const days = parseInt(rangeSelect?.value || 30);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - days);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    try {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

        // Query simplificada - solo por userId (no requiere índice compuesto)
        const q = query(
            collection(db, "asistencias"),
            where("userId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        const porFecha = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Filtrar por fecha en JavaScript
            if (data.fecha >= fechaLimiteStr) {
                if (!porFecha[data.fecha]) {
                    porFecha[data.fecha] = { entrada: null, salida: null };
                }
                if (data.tipo === "entrada") porFecha[data.fecha].entrada = data.hora;
                if (data.tipo === "salida") porFecha[data.fecha].salida = data.hora;
            }
        });

        tbody.innerHTML = "";

        const fechas = Object.keys(porFecha).sort().reverse();

        if (fechas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros en este período</td></tr>';
            return;
        }

        fechas.forEach(fecha => {
            const { entrada, salida } = porFecha[fecha];

            let horas = "--";
            if (entrada && salida) {
                const [hE, mE] = entrada.split(':').map(Number);
                const [hS, mS] = salida.split(':').map(Number);
                const minutos = (hS * 60 + mS) - (hE * 60 + mE);
                horas = (minutos / 60).toFixed(1);
            }

            let estado = "Presente";
            let estadoClass = "presente";
            if (entrada) {
                const [h, m] = entrada.split(':').map(Number);
                if (h > 8 || (h === 8 && m > 30)) {
                    estado = "Tarde";
                    estadoClass = "tarde";
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${entrada || "--:--"}</td>
                <td>${salida || "--:--"}</td>
                <td>${horas !== "--" ? horas + "h" : "--"}</td>
                <td><span class="status-badge status-${estadoClass}">${estado}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar historial:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Error al cargar historial. Por favor, intenta de nuevo.</td></tr>';
    }
}

// ===================== EVENT LISTENERS =====================
document.addEventListener('DOMContentLoaded', () => {
    const btnCheckIn = document.getElementById('btnCheckIn');
    const btnCheckOut = document.getElementById('btnCheckOut');
    const rangeSelect = document.getElementById('employeeHistoryRange');

    if (btnCheckIn) {
        btnCheckIn.addEventListener('click', () => marcarAsistencia('entrada'));
    }

    if (btnCheckOut) {
        btnCheckOut.addEventListener('click', () => marcarAsistencia('salida'));
    }

    if (rangeSelect) {
        rangeSelect.addEventListener('change', loadEmployeeHistory);
    }

    // Cargar datos iniciales
    cargarHorarioHoy();
    actualizarEstadoHoy();
    loadEmployeeHistory();
});

window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

console.log("✅ Employee Asistencias cargado");

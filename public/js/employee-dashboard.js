// ===================== EMPLOYEE DASHBOARD =====================
import { requireAuth, getCurrentUser } from '../../components/auth-guard.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Verificar autenticación
requireAuth();

const currentUser = getCurrentUser();

// Firebase config
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

// ===================== CARGAR ESTADÍSTICAS DE ASISTENCIA =====================
async function loadAttendanceStats() {
    if (!currentUser) return;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

    try {
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
            if (data.fecha >= firstDayStr) {
                if (!porFecha[data.fecha]) {
                    porFecha[data.fecha] = { entrada: null, salida: null };
                }
                if (data.tipo === "entrada") porFecha[data.fecha].entrada = data.hora;
                if (data.tipo === "salida") porFecha[data.fecha].salida = data.hora;
            }
        });

        let daysPresent = 0;
        let daysLate = 0;
        let totalMinutes = 0;

        Object.values(porFecha).forEach(day => {
            if (day.entrada) {
                daysPresent++;

                // Verificar tardanza (después de 8:30)
                const [h, m] = day.entrada.split(':').map(Number);
                if (h > 8 || (h === 8 && m > 30)) {
                    daysLate++;
                }

                // Calcular horas trabajadas
                if (day.salida) {
                    const [hE, mE] = day.entrada.split(':').map(Number);
                    const [hS, mS] = day.salida.split(':').map(Number);
                    totalMinutes += (hS * 60 + mS) - (hE * 60 + mE);
                }
            }
        });

        const totalHours = (totalMinutes / 60).toFixed(1);

        document.getElementById('statDaysPresent').textContent = daysPresent;
        document.getElementById('statDaysLate').textContent = daysLate;
        document.getElementById('statTotalHours').textContent = totalHours + 'h';

    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}

// ===================== CARGAR ÚLTIMOS PAGOS =====================
async function loadRecentPayments() {
    if (!currentUser) return;

    const tbody = document.getElementById('recentPaymentsBody');

    try {
        const q = query(
            collection(db, "pagos"),
            where("empleadoId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        tbody.innerHTML = "";

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay pagos registrados</td></tr>';
            return;
        }

        const pagos = [];
        querySnapshot.forEach(doc => {
            pagos.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar por fecha descendente y tomar los últimos 5
        pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const recentPayments = pagos.slice(0, 5);

        recentPayments.forEach(pago => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pago.fecha}</td>
                <td>${pago.concepto || 'Salario'}</td>
                <td>S/ ${parseFloat(pago.monto || 0).toFixed(2)}</td>
                <td><span class="status-badge status-complete">Pagado</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar pagos:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error al cargar pagos</td></tr>';
    }
}

// Toggle menu
window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadAttendanceStats();
    loadRecentPayments();
});

console.log("✅ Employee Dashboard cargado");

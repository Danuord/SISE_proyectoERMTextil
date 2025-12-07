// ===================== EMPLOYEE PAYMENTS =====================
import { requireAuth, getCurrentUser } from '../../components/auth-guard.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

let allPayments = [];

// ===================== CARGAR PAGOS =====================
async function loadPayments() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "pagos"),
            where("empleadoId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        allPayments = [];

        querySnapshot.forEach(doc => {
            allPayments.push({ id: doc.id, ...doc.data() });
        });

        allPayments.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        renderPayments(allPayments);
        updateSummary(allPayments);

    } catch (error) {
        console.error("Error al cargar pagos:", error);
        const tbody = document.getElementById('paymentsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar pagos</p></td></tr>';
        }
    }
}

// ===================== RENDERIZAR PAGOS =====================
function renderPayments(payments) {
    const tbody = document.getElementById('paymentsBody');

    if (!tbody) {
        console.error("Elemento paymentsBody no encontrado");
        return;
    }

    tbody.innerHTML = "";

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><p>No hay pagos registrados</p></td></tr>';
        return;
    }

    payments.forEach(pago => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pago.fecha}</td>
            <td>${pago.concepto || 'Salario'}</td>
            <td class="amount-cell">S/ ${parseFloat(pago.monto || 0).toFixed(2)}</td>
            <td>${pago.metodoPago || 'Transferencia'}</td>
            <td><span class="status-badge status-complete"><i class="fas fa-check-circle"></i> Pagado</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ===================== ACTUALIZAR RESUMEN =====================
function updateSummary(payments) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Total este mes
    const thisMonthTotal = payments
        .filter(p => {
            const date = new Date(p.fecha);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

    // Total este año
    const thisYearTotal = payments
        .filter(p => new Date(p.fecha).getFullYear() === currentYear)
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

    // Último pago
    const lastPay = payments.length > 0 ? payments[0] : null;

    const totalThisMonth = document.getElementById('totalThisMonth');
    const totalThisYear = document.getElementById('totalThisYear');
    const lastPayment = document.getElementById('lastPayment');
    const lastPaymentDate = document.getElementById('lastPaymentDate');

    if (totalThisMonth) totalThisMonth.textContent = `S/ ${thisMonthTotal.toFixed(2)}`;
    if (totalThisYear) totalThisYear.textContent = `S/ ${thisYearTotal.toFixed(2)}`;
    if (lastPayment && lastPay) lastPayment.textContent = `S/ ${parseFloat(lastPay.monto || 0).toFixed(2)}`;
    if (lastPaymentDate && lastPay) lastPaymentDate.textContent = lastPay.fecha;
}

// ===================== FILTROS =====================
window.applyFilters = function () {
    const startDate = document.getElementById('filterStartDate')?.value;
    const endDate = document.getElementById('filterEndDate')?.value;
    const status = document.getElementById('filterStatus')?.value;

    let filtered = [...allPayments];

    if (startDate) {
        filtered = filtered.filter(p => p.fecha >= startDate);
    }

    if (endDate) {
        filtered = filtered.filter(p => p.fecha <= endDate);
    }

    renderPayments(filtered);
};

// ===================== EXPORTAR =====================
window.exportToPDF = function () {
    alert('Función de exportar a PDF en desarrollo');
};

window.exportToExcel = function () {
    alert('Función de exportar a Excel en desarrollo');
};

// ===================== TOGGLE MENU =====================
window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

// ===================== INICIALIZACIÓN =====================
document.addEventListener('DOMContentLoaded', loadPayments);

console.log("✅ Employee Payments cargado");

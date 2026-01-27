// ===================== EMPLOYEE PAYMENTS =====================
import { requireAuth, getCurrentUser } from '../../components/auth-guard.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Initialize Firebase
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

// Global state
let allPayments = [];
const currentUser = getCurrentUser();

// Auth Check
requireAuth();

// ===================== UTILS =====================
function formatMonthName(YYYYMM) {
    if (!YYYYMM) return "-";
    const [year, month] = YYYYMM.split('-');
    // Crear fecha con zona horaria local o simplemente dia 1
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase();
}

function formatearSoles(amount) {
    return 'S/ ' + Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===================== CARGAR PAGOS =====================
async function loadPayments() {
    if (!currentUser) return;

    try {
        // Query a la colección correcta: pagos_empleados
        const q = query(
            collection(db, "pagos_empleados"),
            where("uid", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        allPayments = [];

        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Filtrar anulados SOLO si se requiere estricto, pero el usuario pidió "historial de pagado"
            // Vamos a excluir anulados del array principal para que no salgan en la tabla por defecto
            if (data.estado !== "anulado") {
                allPayments.push({ id: doc.id, ...data });
            }
        });

        // Ordenar por periodo (más reciente primero)
        allPayments.sort((a, b) => {
            return b.periodo_pago.localeCompare(a.periodo_pago);
        });

        renderPayments(allPayments);
        updateSummary(allPayments);

    } catch (error) {
        console.error("Error al cargar pagos:", error);
        const tbody = document.getElementById('paymentsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar historial</p></td></tr>';
        }
    }
}

// ===================== RENDERIZAR TABLA =====================
function renderPayments(payments) {
    const tbody = document.getElementById('paymentsBody');
    if (!tbody) return;

    tbody.innerHTML = "";

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><p>No hay pagos registrados</p></td></tr>';
        return;
    }

    payments.forEach(pago => {
        const isAnulado = pago.estado === "anulado";
        const monto = parseFloat(pago.pago_total || 0);

        const badgeIcon = isAnulado ? "fa-ban" : "fa-check-circle";
        const badgeText = isAnulado ? "ANULADO" : "PAGADO";

        const tr = document.createElement('tr');
        if (isAnulado) tr.classList.add("row-anulado");

        // Estilo de badge
        const badgeStyle = isAnulado
            ? "background:#ffebee; color:#c62828; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid #ef5350;"
            : "background:#e8f5e9; color:#2e7d32; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem; border:1px solid #a5d6a7;";

        tr.innerHTML = `
            <td>${formatMonthName(pago.periodo_pago)}</td>
            <td>${pago.detalle || 'Pago de Planilla'} <br><small style="color:#888">${pago.fecha_registro ? new Date(pago.fecha_registro.seconds * 1000).toLocaleDateString() : ''}</small></td>
            <td class="amount-cell" style="font-weight:bold; color:${isAnulado ? '#999' : '#333'}">${formatearSoles(monto)}</td>
            <td>
                 <button class="btn-pdf" data-id="${pago.id}" style="border:none; background:transparent; color:#E74C3C; cursor:pointer; font-size:1.2rem;" title="Ver Boleta Oficial">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
            <td><span style="${badgeStyle}"><i class="fas ${badgeIcon}"></i> ${badgeText}</span></td>
        `;

        // Add event listener to button
        const btn = tr.querySelector('.btn-pdf');
        if (btn) btn.addEventListener('click', () => generarComprobantePago(pago.id));

        tbody.appendChild(tr);
    });
}

// ===================== ACTUALIZAR RESUMEN =====================
function updateSummary(payments) {
    // Filtrar solo los activos para sumas
    const activePayments = payments.filter(p => p.estado !== "anulado");

    const now = new Date(); // Usar hora local o server
    // Para simplificar, usamos periodo string
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Total este mes (Coincidencia exacta de periodo_pago)
    const thisMonthTotal = activePayments
        .filter(p => p.periodo_pago === currentMonthStr)
        .reduce((sum, p) => sum + parseFloat(p.pago_total || 0), 0);

    // Último pago
    const lastPay = activePayments.length > 0 ? activePayments[0] : null;

    const totalThisMonthEl = document.getElementById('totalThisMonth');
    const lastPaymentEl = document.getElementById('lastPayment');
    const lastPaymentDateEl = document.getElementById('lastPaymentDate');

    if (totalThisMonthEl) animateValue(totalThisMonthEl, 0, thisMonthTotal);

    if (lastPaymentEl && lastPay) {
        lastPaymentEl.textContent = formatearSoles(lastPay.pago_total || 0);
    } else if (lastPaymentEl) {
        lastPaymentEl.textContent = "S/ 0.00";
    }

    if (lastPaymentDateEl && lastPay) {
        lastPaymentDateEl.textContent = formatMonthName(lastPay.periodo_pago);
    } else if (lastPaymentDateEl) {
        lastPaymentDateEl.textContent = "-";
    }
}

// Animación simple de números
function animateValue(obj, start, end, duration = 1000) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        obj.innerHTML = formatearSoles(value);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ===================== GENERAR BOLETA PDF =====================
async function generarComprobantePago(pagoId) {
    try {
        // Obtener Pago
        const pago = allPayments.find(p => p.id === pagoId);
        if (!pago) return alert("Pago no encontrado en memoria");

        // Obtener datos COMPLETO del usuario
        const userDocRef = doc(db, "usuario", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        let userData = {
            nombre: currentUser.displayName || "Usuario",
            apellido: "",
            documento: "",
            rol: "Colaborador",
            tipo_documento: "DNI"
        };

        if (userSnap.exists()) {
            userData = { ...userData, ...userSnap.data() };
        }

        // ====== CREAR PDF (Misma lógica que Admin) ======
        const { jsPDF } = window.jspdf;
        const docPdf = new jsPDF();

        const primaryColor = [41, 128, 185];
        const darkColor = [44, 62, 80];
        const grayColor = [127, 140, 141];

        // Header
        docPdf.setFillColor(...primaryColor);
        docPdf.rect(0, 0, 210, 40, "F");
        docPdf.setTextColor(255, 255, 255);
        docPdf.setFontSize(22);
        docPdf.setFont("helvetica", "bold");
        docPdf.text("JOAR'S S.A.C.", 20, 20);

        docPdf.setFontSize(14);
        docPdf.setFont("helvetica", "normal");
        docPdf.text("BOLETA DE PAGO ELECTRÓNICA", 20, 30);
        docPdf.setFontSize(10);
        docPdf.text(`RUC: 20123456789`, 150, 20);
        docPdf.text(`Fecha Emisión: ${new Date().toLocaleDateString("es-PE")}`, 150, 28);

        // Body
        let y = 55;
        docPdf.setTextColor(...darkColor);
        docPdf.setDrawColor(200, 200, 200);
        docPdf.setFillColor(245, 247, 250);
        docPdf.roundedRect(15, y, 180, 35, 3, 3, "FD");

        docPdf.setFontSize(11);
        docPdf.setFont("helvetica", "bold");
        docPdf.text("DATOS DEL COLABORADOR", 20, y + 8);
        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(10);
        y += 16;

        docPdf.text(`Nombre: ${userData.nombre} ${userData.apellido}`, 20, y);
        docPdf.text(`Documento: ${userData.tipo_documento || 'DNI'} ${userData.documento || '-'}`, 20, y + 7);
        docPdf.text(`Cargo: ${userData.rol}`, 110, y);
        docPdf.text(`Periodo Pago: ${formatMonthName(pago.periodo_pago)}`, 110, y + 7);

        y += 30;

        // Table Header
        docPdf.setFillColor(...primaryColor);
        docPdf.setTextColor(255, 255, 255);
        docPdf.rect(15, y, 180, 10, "F");
        docPdf.setFont("helvetica", "bold");
        docPdf.text("CONCEPTO", 20, y + 7);
        docPdf.text("TIPO", 110, y + 7);
        docPdf.text("IMPORTE", 170, y + 7);

        y += 10;
        docPdf.setTextColor(...darkColor);
        docPdf.setFont("helvetica", "normal");

        function addRow(concepto, tipo, monto) {
            docPdf.setDrawColor(230, 230, 230);
            docPdf.line(15, y + 8, 195, y + 8);
            docPdf.text(concepto, 20, y + 6);
            docPdf.text(tipo, 110, y + 6);
            const montoStr = formatearSoles(monto);
            const textWidth = docPdf.getTextWidth(montoStr);
            docPdf.text(montoStr, 190 - textWidth, y + 6);
            y += 10;
        }

        if (Number(pago.salario) > 0) addRow("Salario Básico", "Ingreso", Number(pago.salario));
        if (Number(pago.bono) > 0) addRow("Bonificaciones / Extras", "Ingreso", Number(pago.bono));
        if (Number(pago.deduccion) > 0) addRow("Deducciones / Dsctos.", "Egreso", Number(pago.deduccion));

        y += 5;
        docPdf.setFillColor(240, 240, 240);
        docPdf.rect(110, y, 85, 12, "F");
        docPdf.setFontSize(12);
        docPdf.setFont("helvetica", "bold");
        docPdf.text("NETO A PAGAR:", 115, y + 8);
        const totalStr = formatearSoles(pago.pago_total);
        const totalWidth = docPdf.getTextWidth(totalStr);
        docPdf.setTextColor(...primaryColor);
        docPdf.text(totalStr, 190 - totalWidth, y + 8);

        y += 30;
        docPdf.setTextColor(...grayColor);
        docPdf.setFontSize(9);
        docPdf.setFont("helvetica", "normal");
        docPdf.setDrawColor(150, 150, 150);
        docPdf.line(70, y, 140, y);
        docPdf.text("Recibí Conforme", 105, y + 5, { align: "center" });

        docPdf.save(`Boleta_${userData.documento || 'Pago'}_${pago.periodo_pago}.pdf`);

    } catch (error) {
        console.error("PDF Error:", error);
        alert("Error generando boleta.");
    }
}

// ===================== FILTROS =====================
window.applyFilters = function () {
    const startDate = document.getElementById('filterStartDate')?.value;
    const endDate = document.getElementById('filterEndDate')?.value;
    const status = document.getElementById('filterStatus')?.value;

    let filtered = [...allPayments];

    if (startDate) {
        filtered = filtered.filter(p => {
            if (!p.fecha_registro) return false;
            const pDate = new Date(p.fecha_registro.seconds * 1000).toISOString().split('T')[0];
            return pDate >= startDate;
        });
    }

    if (endDate) {
        filtered = filtered.filter(p => {
            if (!p.fecha_registro) return false;
            const pDate = new Date(p.fecha_registro.seconds * 1000).toISOString().split('T')[0];
            return pDate <= endDate;
        });
    }

    if (status) {
        if (status === "pagado") filtered = filtered.filter(p => p.estado !== "anulado");
        else if (status === "anulado") filtered = filtered.filter(p => p.estado === "anulado");
    }

    renderPayments(filtered);
};


// Init
document.addEventListener('DOMContentLoaded', loadPayments);

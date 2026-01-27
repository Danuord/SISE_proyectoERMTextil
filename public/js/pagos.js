import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, collection, onSnapshot, getDocs, getDoc, addDoc, query, where }
    from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDRTKsoZ9Zzh1oo-DQtlxnZ4Pw6RWBv08c",
    authDomain: "textileflow-test.firebaseapp.com",
    projectId: "textileflow-test",
    storageBucket: "textileflow-test.firebasestorage.app",
    messagingSenderId: "227349652064",
    appId: "1:227349652064:web:d32994273a529a07e25905",
    measurementId: "G-XE4Z2S0LRB"
};

const { jsPDF } = window.jspdf;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================== VARIABLES GENERALES =====================
const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const anioActual = new Date().getFullYear();
const hoy = new Date();

function getTodayLima() {
    const now = new Date();
    const limaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    return limaTime.toISOString().split('T')[0];
}

function getMesAnterior(mesYao) {
    const [year, month] = mesYao.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
    }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

function formatMonthName(mesYao) {
    const [year, month] = mesYao.split('-').map(Number);
    return `${meses[month - 1]} ${year}`;
}

const todayLima = getTodayLima();
const mesActual = todayLima.substring(0, 7);
const mesPasado = getMesAnterior(mesActual);

const q = query(
    collection(db, "usuario"),
    where("estado", "==", "activo")
)

// ===================== MODALES GENERALES =====================
const closeButtons = document.querySelectorAll('.close-btn');

function cerrarModal(idModal, claseBoton) {
    const modal = document.getElementById(idModal);
    const btn = modal.querySelector("." + claseBoton);

    if (!modal || !btn) {
        console.error("No se encontró el modal o el botón para cerrar:", idModal, claseBoton);
        return;
    }

    btn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

cerrarModal("addSalaryModal", "regresar-btn");
cerrarModal("editUserPlanillaModal", "regresar-btn");
cerrarModal("anularPagoModal", "regresar-btn");
cerrarModal("anularPagoModal", "close-modal-btn");


const statusMessage = document.getElementById("statusMessage");
function showStatus(message, type = "info") {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;

    setTimeout(() => {
        statusMessage.className = "status-message";
        statusMessage.textContent = "";
    }, 4000);
}

// ===================== MODAL AGREGAR SALARIO =====================
const addSalaryBtn = document.getElementById("addSalaryBtn");
const addSalaryModal = document.getElementById("addSalaryModal");
const employeeSelect = document.getElementById("employeeSelect");
const salaryInput = document.getElementById("salaryInput");
const periodoPago = document.getElementById("periodo_pago");
const btnRegistrarPago = document.getElementById("btnRegistrarPago");
const selectPeriodo = document.getElementById("periodo_pago");

addSalaryBtn.addEventListener("click", () => {
    addSalaryModal.style.display = "block";
});
onSnapshot(q, (snapshot) => {
    employeeSelect.innerHTML = `<option value="">Seleccione empleado</option>`;

    snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = `${data.nombre} ${data.apellido}`;
        employeeSelect.appendChild(option);
    });
});

// Mostrar salario del empleado seleccionado
employeeSelect.addEventListener("change", async () => {
    const uid = employeeSelect.value;
    if (!uid) { salaryInput.value = ""; return; }

    const docRef = doc(db, "usuario_admin", uid);
    const docSnap = await getDoc(docRef);
    salaryInput.value = docSnap.exists() ? docSnap.data().salario ?? "" : "";
});

// Filtrar empleados ya pagados en el periodo seleccionado
async function actualizarListaEmpleados(periodo) {
    if (!periodo) return;

    // Obtener empleados activos
    const usuariosActivosSnap = await getDocs(q);

    // Obtener pagos del periodo
    const pagosSnap = await getDocs(query(collection(db, "pagos_empleados"), where("periodo_pago", "==", periodo)));
    const empleadosPagados = new Set();
    pagosSnap.forEach(doc => empleadosPagados.add(doc.data().uid));

    // Actualizar select
    employeeSelect.innerHTML = `<option value="">Seleccione empleado</option>`;
    usuariosActivosSnap.forEach(doc => {
        if (!empleadosPagados.has(doc.id)) {
            const data = doc.data();
            const rol = (data.rol || "").toLowerCase();
            if (rol === "empleado" || rol === "administrador") {
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = `${data.nombre} ${data.apellido} (${data.rol})`;
                employeeSelect.appendChild(option);
            }
        }
    });
}

periodoPago.addEventListener("change", () => {
    actualizarListaEmpleados(periodoPago.value);
});

// Al abrir el modal, actualizamos con el periodo que esté seleccionado o el actual
addSalaryBtn.addEventListener("click", () => {
    addSalaryModal.style.display = "block";
    // Seleccionar por defecto el mes del filtro principal si está en las opciones, sino el actual
    const currentFilter = monthFilterSelect.value;
    actualizarListaEmpleados(periodoPago.value);
});


// ===================== INICIALIZACIÓN DEL FILTRO MES =====================
const monthFilterSelect = document.getElementById("monthFilter");
function populateMonthFilter() {
    if (!monthFilterSelect) return;

    const options = [];
    const date = new Date(getTodayLima());
    date.setDate(1);

    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const value = `${year}-${month}`;
        const label = formatMonthName(value);
        options.push({ value, label });
        date.setMonth(date.getMonth() - 1);
    }

    monthFilterSelect.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    monthFilterSelect.value = mesActual;
}
populateMonthFilter();

// ===================== SELECT PERIODO=====================
function updateModalPeriodoOptions() {
    if (!selectPeriodo) return;
    selectPeriodo.innerHTML = "";

    // Mostramos los últimos 3 meses en el modal de registro
    const date = new Date(getTodayLima());
    date.setDate(1);

    for (let i = 0; i < 3; i++) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const value = `${year}-${month}`;
        const label = formatMonthName(value);
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        selectPeriodo.appendChild(option);
        date.setMonth(date.getMonth() - 1);
    }
}
updateModalPeriodoOptions();


// ===================== FUNCIONES DE FECHA =====================
function obtenerPeriodoFirebase(mesTexto) {
    const mesIndex = meses.indexOf(mesTexto);
    if (mesIndex === -1) { console.error("Mes inválido:", mesTexto); return null; }

    let año = new Date().getFullYear();
    const mesActualIndex = new Date().getMonth();
    if (mesIndex === 11 && mesActualIndex === 0) año--;

    return `${año}-${String(mesIndex + 1).padStart(2, "0")}`;
}

function obtenerUltimosTresMeses() {
    const hoy = new Date();
    hoy.setDate(1);
    let mesesArr = [];
    for (let i = 1; i <= 3; i++) {
        const fecha = new Date(hoy);
        fecha.setMonth(hoy.getMonth() - i);
        mesesArr.push(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`);
    }
    return mesesArr;
}

async function obtenerTotalesPorMes(mesesArr) {
    const resultados = {};
    const querySnapshot = await getDocs(collection(db, "pagos_empleados"));
    mesesArr.forEach(m => resultados[m] = 0);
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (mesesArr.includes(data.periodo_pago)) resultados[data.periodo_pago] += Number(data.pago_total || 0);
    });
    return resultados;
}

async function renderGrafico() {
    const mesesArr = obtenerUltimosTresMeses();
    const totales = await obtenerTotalesPorMes(mesesArr);
    const ctx = document.getElementById("graficoSalarios").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: mesesArr,
            datasets: [{
                data: mesesArr.map(m => totales[m]),
                borderColor: "rgba(0, 0, 0, 0.69)",
                borderWidth: 1.5,
                tension: 0.25,
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: "rgba(0,0,0,0.4)", font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.07)" }, ticks: { color: "rgba(0,0,0,0.4)", font: { size: 10 } } }
            },
            elements: { line: { borderJoinStyle: "round", borderCapStyle: "round" } }
        }
    });
}
renderGrafico();

// ===================== GUARDAR PAGO EMPLEADO =====================
const addSalaryForm = document.getElementById("addSalaryForm");
addSalaryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validar usando la función que da feedback
    if (!validarFormularioPago()) return;

    // Obtener valores (ya validados visualmente, pero requerimos variables)
    const uidEmpleado = employeeSelect.value;
    const salario = Number(salaryInput.value) || 0;
    const bono = Number(document.getElementById("bonusInput").value) || 0;
    const deduccion = Number(document.getElementById("deductionsInput").value) || 0;
    const periodo = periodoPago.value;
    const comentario = document.getElementById("commentInput").value;

    const dataPago = { uid: uidEmpleado, salario, bono, deduccion, pago_total: salario + bono - deduccion, periodo_pago: periodo, detalle: comentario, estado: "pagado", fecha_registro: new Date() };

    try {
        await addDoc(collection(db, "pagos_empleados"), dataPago);
        showStatus("Pago registrado correctamente ✔️", "success");
        addSalaryForm.reset();
        addSalaryModal.style.display = "none";
    } catch (e) { console.error(e); showStatus("Hubo un error al registrar el pago.", "error"); }
});

// ===================== VALIDAR FORMULARIO =====================
function validarFormularioPago() {
    const salario = parseFloat(salaryInput.value || 0);
    const periodo = periodoPago.value.trim();
    const empleado = employeeSelect.value;

    if (!empleado) {
        showStatus("Seleccione un empleado.", "error");
        return false;
    }
    if (!periodo) {
        showStatus("Seleccione un periodo de pago.", "error");
        return false;
    }
    if (salario <= 0) {
        showStatus("El salario base debe ser mayor a 0. Verifique la información del empleado.", "error");
        return false;
    }
    return true;
}

btnRegistrarPago.disabled = false;

// ===================== MODAL EDITAR PLANILLA =====================
const editUserPlanillaBtn = document.getElementById("editUserPlanilla");
const editUserPlanillaModal = document.getElementById("editUserPlanillaModal");
const editPlanillaForm = document.getElementById("editPlanillaForm");
const salaryInputPlanilla = document.getElementById("salaryInputPlanilla");
const employeeSelectPlanilla = document.getElementById("employeeSelectPlanilla");
const employeeSelectDate = document.getElementById("employeeSelectDate");
const editSalaryBtn = document.getElementById("editSalary");

editUserPlanillaBtn.addEventListener("click", () => editUserPlanillaModal.style.display = "block");

// Cargar empleados para editar planilla
onSnapshot(
    query(collection(db, "usuario"), where("estado", "==", "activo")),
    snapshot => {
        employeeSelectPlanilla.innerHTML = `<option value="">Seleccione empleado</option>`;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.rol === "Empleado" || data.rol === "Administrador") {
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = `${data.nombre} ${data.apellido} (${data.rol})`;
                employeeSelectPlanilla.appendChild(option);
            }
        });
    }
);



employeeSelectPlanilla.addEventListener("change", async () => {
    const uid = employeeSelectPlanilla.value;

    // Si no hay selección, limpiar campos
    if (!uid) {
        salaryInputPlanilla.value = "";
        employeeSelectDate.value = "";
        return;
    }

    try {
        const docRef = doc(db, "usuario_admin", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            salaryInputPlanilla.value = data.salario ?? "";
            employeeSelectDate.value = data.fechaIngreso ?? "";
        } else {
            salaryInputPlanilla.value = "";
            employeeSelectDate.value = "";
        }
    } catch (error) {
        console.error("Error al cargar datos de planilla:", error);
        salaryInputPlanilla.value = "";
        employeeSelectDate.value = "";
    }
});


editSalaryBtn.addEventListener("click", () => {
    salaryInputPlanilla.disabled = false;
    salaryInputPlanilla.focus();
});

editPlanillaForm.addEventListener("submit", async e => {
    e.preventDefault();
    const uid = employeeSelectPlanilla.value;
    const salario = Number(salaryInputPlanilla.value);
    const fechaIngreso = employeeSelectDate.value;
    if (!uid || salario <= 0 || !fechaIngreso) return showStatus("Seleccione un empleado y coloque salario válido", "error");

    try {
        await setDoc(doc(db, "usuario_admin", uid), { uid, salario, fechaIngreso: fechaIngreso, horas_trabajadas: 0, bonificaciones: 0, descuentos: 0 });
        showStatus("Datos de planilla actualizados correctamente", "success");
        editPlanillaForm.reset();
        editUserPlanillaModal.style.display = "none";
    } catch (err) { console.error(err); showStatus(`Error: ${err.message}`, "error"); }
});

// ===================== TABLA DE PAGOS EN TIEMPO REAL =====================
const salaryTableBody = document.getElementById("salaryTable").querySelector("tbody");
const showAnulledSwitch = document.getElementById("showAnulledSwitch");
let paymentsUnsubscribe = null;

async function cargarPagosMes(mesSeleccionado) {
    if (paymentsUnsubscribe) paymentsUnsubscribe();

    const qPagos = query(
        collection(db, "pagos_empleados"),
        where("periodo_pago", "==", mesSeleccionado)
    );

    paymentsUnsubscribe = onSnapshot(qPagos, async snapshot => {
        salaryTableBody.innerHTML = "";
        let totalMes = 0;

        const mostrarAnulados = showAnulledSwitch.checked;
        const pagosFiltrados = [];

        if (snapshot.empty) {
            salaryTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay registros para este mes</td></tr>';
        } else {
            for (const pagoDoc of snapshot.docs) {
                const pago = { id: pagoDoc.id, ...pagoDoc.data() };
                const esAnulado = pago.estado === "anulado";

                // Filtro visual: si no mostrar anulados y es anulado, saltar
                if (!mostrarAnulados && esAnulado) continue;

                pagosFiltrados.push(pago);
            }

            if (pagosFiltrados.length === 0) {
                salaryTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay pagos activos (o visibles) para este mes</td></tr>';
            }

            for (const pago of pagosFiltrados) {
                const usuarioSnap = await getDoc(doc(db, "usuario", pago.uid));
                const nombre = usuarioSnap.exists() ? `${usuarioSnap.data().nombre} ${usuarioSnap.data().apellido}` : "Desconocido";
                const cargo = usuarioSnap.exists() ? usuarioSnap.data().rol : "—";
                const esAnulado = pago.estado === "anulado";

                // Solo sumar al total si NO es anulado
                if (!esAnulado) {
                    totalMes += Number(pago.pago_total || 0);
                }

                const tr = document.createElement("tr");
                if (esAnulado) tr.classList.add("row-anulado");

                const accionBtn = esAnulado
                    ? `<span class="badge-anulado">ANULADO</span>`
                    : `<button class="btnDelete" data-id="${pago.id}" title="Anular Pago"><i class="fas fa-ban"></i></button>`;

                tr.innerHTML =
                    `<td>${nombre}</td>
                <td>${cargo}</td>
                <td>${formatearSoles(pago.salario)}</td>
                <td>${formatearSoles(pago.bono)}</td>
                <td>${formatearSoles(pago.deduccion)}</td>
                <td><strong>${formatearSoles(pago.pago_total)}</strong></td>
                <td>${formatMonthName(pago.periodo_pago)}</td>
                <td class="detalle-col hidden-col">
                    ${pago.detalle || ''}
                    ${esAnulado && pago.motivo_anulacion ? `<br><small class="text-danger">Motivo: ${pago.motivo_anulacion}</small>` : ''}
                </td>
                <td>
                    <button class="btnReporte" data-id="${pago.id}">Ver</button>
                    ${accionBtn}
                </td>`;
                salaryTableBody.appendChild(tr);
            }
        }

        actualizarCardSalarioMes(totalMes, "Actual");
        actualizarCardPendiente(totalMes);

        updateColumnVisibility();
    });
}

showAnulledSwitch.addEventListener("change", () => {
    cargarPagosMes(monthFilterSelect.value);
});

function actualizarCardSalarioMes(total, tipo) {
    const el = document.getElementById("cardSalarioProyectado");
    const label = document.getElementById("labelMesActual");

    if (el) animateValue(el, 0, total);
    if (label) label.textContent = formatMonthName(monthFilterSelect.value);
}

async function actualizarCardPendiente(totalPagado) {
    const el = document.getElementById("cardSalarioPendiente");
    const label = document.getElementById("labelMesPendiente");

    // Obtener empleados activos y sus salarios base
    const usuariosActivosSnap = await getDocs(query(collection(db, "usuario"), where("estado", "==", "activo")));
    const usuariosActivos = [];
    usuariosActivosSnap.forEach(doc => usuariosActivos.push(doc.id));

    const adminSnap = await getDocs(collection(db, "usuario_admin"));
    let totalPlanillaBase = 0;
    const salariosBase = {};

    adminSnap.forEach(doc => {
        if (usuariosActivos.includes(doc.id) && doc.data().salario) {
            const sal = Number(doc.data().salario);
            salariosBase[doc.id] = sal;
            totalPlanillaBase += sal;
        }
    });

    // Ver quiénes han sido pagados en este mes
    const mesSeleccionado = monthFilterSelect.value;
    const pagosSnap = await getDocs(query(collection(db, "pagos_empleados"), where("periodo_pago", "==", mesSeleccionado)));

    let totalBasePagado = 0;
    pagosSnap.forEach(doc => {
        const data = doc.data();
        if (data.estado !== "anulado") {
            const uid = data.uid;
            if (salariosBase[uid]) {
                totalBasePagado += salariosBase[uid];
            }
        }
    });

    const pendiente = totalPlanillaBase - totalBasePagado;
    const pendienteFinal = pendiente > 0 ? pendiente : 0;


    if (el) animateValue(el, 0, pendienteFinal);
    if (label) label.textContent = formatMonthName(mesSeleccionado);
}

monthFilterSelect.addEventListener("change", () => {
    cargarPagosMes(monthFilterSelect.value);
});
cargarPagosMes(mesActual);


// ===================== ANIMACIONES DE TARJETAS =====================
function formatearSoles(valor) { return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(valor); }
function animateValue(el, start, end, duration = 550) {
    let startTS = null;
    const step = timestamp => {
        if (!startTS) startTS = timestamp;
        const progress = Math.min((timestamp - startTS) / duration, 1);
        el.textContent = formatearSoles(Math.floor(progress * (end - start) + start));
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

//primera tarjeta
// Obtener total de planillas activas (Suma de salarios base)
async function obtenerTotalPlanillaActiva() {
    let total = 0;

    // Obtener usuarios activos
    const usuariosActivosSnap = await getDocs(
        query(collection(db, "usuario"), where("estado", "==", "activo"))
    );

    // Guardar IDs activos
    const usuariosActivosIds = new Set();
    usuariosActivosSnap.forEach(doc => usuariosActivosIds.add(doc.id));

    // Leer salarios solo de usuarios activos
    const adminSnap = await getDocs(collection(db, "usuario_admin"));

    adminSnap.forEach(doc => {
        if (usuariosActivosIds.has(doc.id)) {
            const data = doc.data();
            if (data.salario) {
                total += Number(data.salario);
            }
        }
    });
    return total;
}
// ===================== SELECTOR DE COLUMNAS =====================
const columnSelectorBtn = document.getElementById("columnSelectorBtn");
const columnSelectorMenu = document.getElementById("columnSelectorMenu");
const checkboxes = columnSelectorMenu.querySelectorAll("input[type='checkbox']");

columnSelectorBtn.addEventListener("click", () => columnSelectorMenu.classList.toggle("hidden"));
function updateColumnVisibility() {
    const table = document.getElementById("salaryTable");
    checkboxes.forEach(chk => {
        const colIndex = Number(chk.dataset.col);
        const visible = chk.checked;
        table.querySelectorAll(`thead th:nth-child(${colIndex + 1})`).forEach(th => th.classList.toggle("hidden-col", !visible));
        table.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`).forEach(td => td.classList.toggle("hidden-col", !visible));
    });
}
window.addEventListener("DOMContentLoaded", updateColumnVisibility);
checkboxes.forEach(chk => chk.addEventListener("change", updateColumnVisibility));

// ===================== ORDENAR TABLA =====================
const table = document.getElementById("salaryTable");
const headers = table.querySelectorAll("th.sortable");
headers.forEach((th, index) => {
    th.addEventListener("click", () => {
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const isAsc = th.classList.contains("asc");
        headers.forEach(h => h.classList.remove("asc", "desc"));
        th.classList.toggle("asc", !isAsc);
        th.classList.toggle("desc", isAsc);
        const multiplier = isAsc ? -1 : 1;
        rows.sort((a, b) => {
            const A = a.children[index].innerText.trim();
            const B = b.children[index].innerText.trim();
            const numA = parseFloat(A.replace(/[^0-9.-]+/g, ""));
            const numB = parseFloat(B.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(numA) && !isNaN(numB)) return (numA - numB) * multiplier;
            return A.localeCompare(B) * multiplier;
        });
        rows.forEach(row => tbody.appendChild(row));
    });
});

// ===================== ANULAR PAGO =====================
const anularPagoModal = document.getElementById("anularPagoModal");
const anularPagoForm = document.getElementById("anularPagoForm");
const anularPagoIdInput = document.getElementById("anularPagoId");
const motivoAnulacionInput = document.getElementById("motivoAnulacion");

// Delegación de eventos para botón de anular en tabla
document.getElementById("salaryTable").addEventListener("click", e => {
    const btn = e.target.closest(".btnDelete");
    if (btn) {
        const id = btn.dataset.id;
        abrirModalAnulacion(id);
    }
});

function abrirModalAnulacion(id) {
    if (!id) return;
    anularPagoIdInput.value = id;
    motivoAnulacionInput.value = "";
    anularPagoModal.style.display = "block";
    motivoAnulacionInput.focus();
}

anularPagoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = anularPagoIdInput.value;
    const motivo = motivoAnulacionInput.value.trim();

    if (!id || !motivo) {
        showStatus("Por favor ingrese un motivo válido.", "error");
        return;
    }

    try {
        const docRef = doc(db, "pagos_empleados", id);

        await setDoc(docRef, {
            estado: "anulado",
            motivo_anulacion: motivo,
            fecha_anulacion: new Date()
        }, { merge: true });

        showStatus("Pago anulado correctamente 🗑️", "success");
        anularPagoModal.style.display = "none";

        // Recargar si es necesario (el listener onSnapshot debería encargarse)
    } catch (error) {
        console.error("Error al anular pago:", error);
        showStatus("Error al anular el pago.", "error");
    }
});
// ===================== EXPORTAR EXCEL =====================
document.getElementById("reportBtn").addEventListener("click", exportarExcel);
function exportarExcel() {
    const table = document.getElementById("salaryTable");
    const clonedTable = table.cloneNode(true);
    const hiddenIndexes = [];
    clonedTable.querySelectorAll("th").forEach((th, index) => { if (th.classList.contains("hidden-col")) hiddenIndexes.push(index); });
    clonedTable.querySelectorAll("tr").forEach(tr => hiddenIndexes.slice().reverse().forEach(i => { if (tr.children[i]) tr.removeChild(tr.children[i]); }));
    const tableHTML = clonedTable.outerHTML.replace(/ /g, '%20');
    const nombreArchivo = `registro_pagos_${new Date().toLocaleDateString("es-PE")}.xls`;
    const link = document.createElement("a");
    link.href = 'data:application/vnd.ms-excel,' + tableHTML;
    link.download = nombreArchivo;
    link.click();
}

// ===================== FILTRO DE TABLA =====================
document.getElementById("filterBtn").addEventListener("click", () => document.getElementById("filterPanel").classList.toggle("show"));

function cargarColumnasParaFiltro() {
    const columnasPermitidas = ["Nombre", "Cargo", "Mes"];
    const table = document.getElementById("salaryTable");
    const headerCells = table.querySelectorAll("th");
    const select = document.getElementById("filterColumn");
    select.innerHTML = "";
    headerCells.forEach((th, index) => { if (columnasPermitidas.includes(th.textContent.trim())) { const opt = document.createElement("option"); opt.value = index; opt.textContent = th.textContent; select.appendChild(opt); } });
}
cargarColumnasParaFiltro();

document.getElementById("applyFilterBtn").addEventListener("click", () => {
    const colIndex = parseInt(document.getElementById("filterColumn").value);
    const filterText = document.getElementById("filterText").value.toLowerCase();
    document.querySelectorAll("#salaryTable tbody tr").forEach(row => {
        const cellValue = row.children[colIndex]?.textContent.toLowerCase() || "";
        row.style.display = cellValue.includes(filterText) ? "" : "none";
    });
});

document.getElementById("clearFilterBtn").addEventListener("click", () => {
    document.getElementById("filterText").value = "";
    document.querySelectorAll("#salaryTable tbody tr").forEach(row => row.style.display = "");
});



// ===================== PDF COMPROBANTE =====================

async function generarComprobantePago(pagoId) {
    try {
        // Obtener Datos
        const pagoRef = doc(db, "pagos_empleados", pagoId);
        const pagoSnap = await getDoc(pagoRef);
        if (!pagoSnap.exists()) return showStatus("Pago no encontrado", "error");

        const pago = pagoSnap.data();
        const usuarioRef = doc(db, "usuario", pago.uid);
        const usuarioSnap = await getDoc(usuarioRef);
        if (!usuarioSnap.exists()) return showStatus("Empleado no encontrado", "error");

        const usuario = usuarioSnap.data();

        // Configuración PDF
        const { jsPDF } = window.jspdf;
        const docPdf = new jsPDF();

        // Colores y Fuentes
        const primaryColor = [41, 128, 185];
        const darkColor = [44, 62, 80];
        const grayColor = [127, 140, 141];

        // --- ENCABEZADO ---
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


        // --- INFO DEL EMPLEADO Y PERIODO ---
        let y = 55;
        docPdf.setTextColor(...darkColor);

        // Caja de Info
        docPdf.setDrawColor(200, 200, 200);
        docPdf.setFillColor(245, 247, 250);
        docPdf.roundedRect(15, y, 180, 35, 3, 3, "FD");

        docPdf.setFontSize(11);
        docPdf.setFont("helvetica", "bold");
        docPdf.text("DATOS DEL COLABORADOR", 20, y + 8);

        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(10);
        y += 16;

        docPdf.text(`Nombre: ${usuario.nombre} ${usuario.apellido}`, 20, y);
        docPdf.text(`Documento: ${usuario.tipo_documento || 'DNI'} ${usuario.documento || '-'}`, 20, y + 7);

        docPdf.text(`Cargo: ${usuario.rol}`, 110, y);
        docPdf.text(`Periodo Pago: ${formatMonthName(pago.periodo_pago)}`, 110, y + 7);

        y += 30;

        // --- DETALLE DE IMPORTES ---
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
        docPdf.text("Firma del Empleador / RRHH", 105, y + 5, { align: "center" });
        y += 15;
        docPdf.setFontSize(8);
        docPdf.text("Este documento es un comprobante interno generado por el sistema JOAR'S.", 105, y, { align: "center" });

        const blob = docPdf.output("blob");
        const url = URL.createObjectURL(blob);
        const modal = document.getElementById("pdfViewerModal");
        const iframe = document.getElementById("pdfViewerFrame");
        iframe.src = url;
        modal.classList.remove("hidden");

    } catch (error) {
        console.error("Error generando PDF:", error);
        showStatus("Error al generar el comprobante.", "error");
    }
}

function mostrarPDFEnModal(pdfDoc) {
    const blob = pdfDoc.output("blob");
    const url = URL.createObjectURL(blob);

    const modal = document.getElementById("pdfViewerModal");
    const iframe = document.getElementById("pdfViewerFrame");

    iframe.src = url;
    modal.classList.remove("hidden");
}

document.addEventListener("click", e => {
    if (e.target.classList.contains("btnReporte")) {
        const pagoId = e.target.dataset.id;
        generarComprobantePago(pagoId);
    }
});

document.getElementById("closePdfModal").addEventListener("click", () => {
    const modal = document.getElementById("pdfViewerModal");
    const iframe = document.getElementById("pdfViewerFrame");

    iframe.src = "";
    modal.classList.add("hidden");
});
// ===================== IMPORTS FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, collection, onSnapshot, getDocs, getDoc, addDoc } 
    from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("ARCHIVO JS CARGADO ✔️");

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

// ===================== VARIABLES GENERALES =====================
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const anioActual = new Date().getFullYear();
const hoy = new Date();
const mesActual = meses[hoy.getMonth()];
const mesPasado = meses[(hoy.getMonth() - 1 + 12) % 12];

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

// Cerrar modales
cerrarModal("addSalaryModal", "regresar-btn");
cerrarModal("editUserPlanillaModal", "regresar-btn");

// ===================== MENSAJES =====================
const statusMessage = document.getElementById("statusMessage");
function showStatus(message, type="info") {
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

// Abrir modal
addSalaryBtn.addEventListener("click", () => {
    addSalaryModal.style.display = "block";
});

// Cargar empleados en tiempo real
onSnapshot(collection(db, "usuario"), (snapshot) => {
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

// ===================== SELECT PERIODO =====================
meses.forEach((mes, index) => {
    const value = `${anioActual}-${String(index + 1).padStart(2, "0")}`;
    const texto = `${mes} ${anioActual}`;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = texto;
    selectPeriodo.appendChild(option);
});

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
        mesesArr.push(`${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}`);
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

// ===================== GRAFICO =====================
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

    const uidEmpleado = employeeSelect.value;
    const salario = Number(salaryInput.value) || 0;
    const bono = Number(document.getElementById("bonusInput").value) || 0;
    const deduccion = Number(document.getElementById("deductionsInput").value) || 0;
    const periodo = periodoPago.value;
    const comentario = document.getElementById("commentInput").value;

    if (!uidEmpleado) return showStatus("Selecciona un empleado.", "error");
    if (!periodo) return showStatus("Selecciona un periodo de pago.", "error");

    const dataPago = { uid: uidEmpleado, salario, bono, deduccion, pago_total: salario+bono-deduccion, periodo_pago: periodo, detalle: comentario, estado:"pagado", fecha_registro: new Date() };

    try {
        await addDoc(collection(db, "pagos_empleados"), dataPago);
        showStatus("Pago registrado correctamente ✔️", "success");
        addSalaryForm.reset();
        addSalaryModal.style.display = "none";
    } catch(e) { console.error(e); showStatus("Hubo un error al registrar el pago.", "error"); }
});

// ===================== VALIDAR FORMULARIO =====================
function validarFormularioPago() {
    const salarioValido = salaryInput.value.trim() !== "" && salaryInput.value.trim() !== "0";
    const periodoValido = periodoPago.value.trim() !== "";
    btnRegistrarPago.disabled = !(salarioValido && periodoValido);
}
periodoPago.addEventListener("change", validarFormularioPago);
const salaryObserver = new MutationObserver(validarFormularioPago);
salaryObserver.observe(salaryInput, { attributes: true, attributeFilter: ["value"] });
validarFormularioPago();

// ===================== MODAL EDITAR PLANILLA =====================
const editUserPlanillaBtn = document.getElementById("editUserPlanilla");
const editUserPlanillaModal = document.getElementById("editUserPlanillaModal");
const editPlanillaForm = document.getElementById("editPlanillaForm");
const salaryInputPlanilla = document.getElementById("salaryInputPlanilla");
const employeeSelectPlanilla = document.getElementById("employeeSelectPlanilla");

editUserPlanillaBtn.addEventListener("click", () => editUserPlanillaModal.style.display = "block");

onSnapshot(collection(db, "usuario"), snapshot => {
    employeeSelectPlanilla.innerHTML = `<option value="">Seleccione empleado</option>`;
    snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = `${data.nombre} ${data.apellido}`;
        employeeSelectPlanilla.appendChild(option);
    });
});

editPlanillaForm.addEventListener("submit", async e => {
    e.preventDefault();
    const uid = employeeSelectPlanilla.value;
    const salario = Number(salaryInputPlanilla.value);
    if (!uid || salario <= 0) return showStatus("Seleccione un empleado y coloque salario válido", "error");

    try {
        await setDoc(doc(db,"usuario_admin",uid), { uid, salario, horas_trabajadas:0, bonificaciones:0, descuentos:0 });
        showStatus("Datos de planilla actualizados correctamente", "success");
        editPlanillaForm.reset();
        editUserPlanillaModal.style.display = "none";
    } catch(err) { console.error(err); showStatus(`Error: ${err.message}`, "error"); }
});

// ===================== TABLA DE PAGOS EN TIEMPO REAL =====================
const salaryTableBody = document.getElementById("salaryTable").querySelector("tbody");
onSnapshot(collection(db,"pagos_empleados"), async snapshot => {
    salaryTableBody.innerHTML = "";
    for (const pagoDoc of snapshot.docs) {
        const pago = { id: pagoDoc.id, ...pagoDoc.data() };
        const usuarioSnap = await getDoc(doc(db,"usuario",pago.uid));
        const nombre = usuarioSnap.exists() ? `${usuarioSnap.data().nombre} ${usuarioSnap.data().apellido}` : "Desconocido";
        const cargo = usuarioSnap.exists() ? usuarioSnap.data().rol : "—";
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${nombre}</td><td>${cargo}</td><td>${pago.salario}</td><td>${pago.bono}</td><td>${pago.deduccion}</td><td>${pago.pago_total}</td><td>${pago.periodo_pago}</td><td class="detalle-col hidden-col">${pago.detalle}</td>`;
        salaryTableBody.appendChild(tr);
    }
    updateColumnVisibility();
});

// ===================== ANIMACIONES DE TARJETAS =====================
function formatearSoles(valor){ return new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"}).format(valor); }
function animateValue(el,start,end,duration=550){
    let startTS=null;
    const step=timestamp=>{
        if(!startTS) startTS=timestamp;
        const progress=Math.min((timestamp-startTS)/duration,1);
        el.textContent=formatearSoles(Math.floor(progress*(end-start)+start));
        if(progress<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

async function sumarSalariosBasicos(){
    let total=0;
    (await getDocs(collection(db,"usuario_admin"))).forEach(doc=>{if(doc.data().salario) total+=Number(doc.data().salario);});
    animateValue(document.querySelector(".card:nth-child(1) .value"),0,total);
}

async function sumarSalariosNetos(){
    const mesTarjeta=document.querySelector(".card:nth-child(2) .unit").textContent.trim();
    const periodoFirebase=obtenerPeriodoFirebase(mesTarjeta);
    let total=0;
    (await getDocs(collection(db,"pagos_empleados"))).forEach(doc=>{if(doc.data().periodo_pago===periodoFirebase) total+=Number(doc.data().pago_total||0);});
    animateValue(document.querySelector(".card:nth-child(2) .value"),0,total);
}

document.querySelector(".card:nth-child(2) .unit").textContent=mesPasado;
sumarSalariosNetos();
sumarSalariosBasicos();

// ===================== SELECTOR DE COLUMNAS =====================
const columnSelectorBtn=document.getElementById("columnSelectorBtn");
const columnSelectorMenu=document.getElementById("columnSelectorMenu");
const checkboxes=columnSelectorMenu.querySelectorAll("input[type='checkbox']");

columnSelectorBtn.addEventListener("click",()=>columnSelectorMenu.classList.toggle("hidden"));
function updateColumnVisibility(){
    const table=document.getElementById("salaryTable");
    checkboxes.forEach(chk=>{
        const colIndex=Number(chk.dataset.col);
        const visible=chk.checked;
        table.querySelectorAll(`thead th:nth-child(${colIndex+1})`).forEach(th=>th.classList.toggle("hidden-col",!visible));
        table.querySelectorAll(`tbody tr td:nth-child(${colIndex+1})`).forEach(td=>td.classList.toggle("hidden-col",!visible));
    });
}
window.addEventListener("DOMContentLoaded",updateColumnVisibility);
checkboxes.forEach(chk=>chk.addEventListener("change",updateColumnVisibility));

// ===================== ORDENAR TABLA =====================
const table=document.getElementById("salaryTable");
const headers=table.querySelectorAll("th.sortable");
headers.forEach((th,index)=>{
    th.addEventListener("click",()=>{
        const tbody=table.querySelector("tbody");
        const rows=Array.from(tbody.querySelectorAll("tr"));
        const isAsc=th.classList.contains("asc");
        headers.forEach(h=>h.classList.remove("asc","desc"));
        th.classList.toggle("asc",!isAsc);
        th.classList.toggle("desc",isAsc);
        const multiplier=isAsc?-1:1;
        rows.sort((a,b)=>{
            const A=a.children[index].innerText.trim();
            const B=b.children[index].innerText.trim();
            const numA=parseFloat(A.replace(/[^0-9.-]+/g,""));
            const numB=parseFloat(B.replace(/[^0-9.-]+/g,""));
            if(!isNaN(numA)&&!isNaN(numB)) return (numA-numB)*multiplier;
            return A.localeCompare(B)*multiplier;
        });
        rows.forEach(row=>tbody.appendChild(row));
    });
});

// ===================== EXPORTAR EXCEL =====================
document.getElementById("reportBtn").addEventListener("click",exportarExcel);
function exportarExcel(){
    const table=document.getElementById("salaryTable");
    const clonedTable=table.cloneNode(true);
    const hiddenIndexes=[];
    clonedTable.querySelectorAll("th").forEach((th,index)=>{if(th.classList.contains("hidden-col")) hiddenIndexes.push(index);});
    clonedTable.querySelectorAll("tr").forEach(tr=>hiddenIndexes.slice().reverse().forEach(i=>{if(tr.children[i]) tr.removeChild(tr.children[i]);}));
    const tableHTML=clonedTable.outerHTML.replace(/ /g,'%20');
    const nombreArchivo=`registro_pagos_${new Date().toLocaleDateString("es-PE")}.xls`;
    const link=document.createElement("a");
    link.href='data:application/vnd.ms-excel,'+tableHTML;
    link.download=nombreArchivo;
    link.click();
}

// ===================== FILTRO DE TABLA =====================
document.getElementById("filterBtn").addEventListener("click",()=>document.getElementById("filterPanel").classList.toggle("show"));

function cargarColumnasParaFiltro(){
    const columnasPermitidas=["Nombre","Cargo","Mes"];
    const table=document.getElementById("salaryTable");
    const headerCells=table.querySelectorAll("th");
    const select=document.getElementById("filterColumn");
    select.innerHTML="";
    headerCells.forEach((th,index)=>{if(columnasPermitidas.includes(th.textContent.trim())){const opt=document.createElement("option");opt.value=index;opt.textContent=th.textContent;select.appendChild(opt);}});
}
cargarColumnasParaFiltro();

document.getElementById("applyFilterBtn").addEventListener("click",()=>{
    const colIndex=parseInt(document.getElementById("filterColumn").value);
    const filterText=document.getElementById("filterText").value.toLowerCase();
    document.querySelectorAll("#salaryTable tbody tr").forEach(row=>{
        const cellValue=row.children[colIndex]?.textContent.toLowerCase()||"";
        row.style.display=cellValue.includes(filterText)?"":"none";
    });
});

document.getElementById("clearFilterBtn").addEventListener("click",()=>{
    document.getElementById("filterText").value="";
    document.querySelectorAll("#salaryTable tbody tr").forEach(row=>row.style.display="");
});

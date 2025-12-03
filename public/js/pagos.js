// ===================== IMPORTS DE FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { 
    collection, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================== MODALES GENERALES =====================
const closeButtons = document.querySelectorAll('.close-btn');

// ===================== MODAL USUARIOS =====================
const addUserBtn = document.getElementById('addUserBtn');
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');

addUserBtn.addEventListener('click', () => {
    addUserModal.style.display = "block";
});

// Cerrar modal usuario
closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        modal.style.display = "none";

        if (modal === addUserModal) {
            addUserForm.reset();
        }
    });
});

// Cerrar si clickea afuera
window.addEventListener('click', (e) => {
    if (e.target === addUserModal) {
        addUserModal.style.display = "none";
        addUserForm.reset();
    }
});

// ===================== REGISTRAR USUARIO =====================
addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener datos del formulario
    const firstName = document.getElementById('firstNameInput').value.trim();
    const lastName = document.getElementById('lastNameInput').value.trim();
    const documentUser = document.getElementById('documentInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const role = document.getElementById('roleSelect').value;
    const phone = document.getElementById('phoneInput').value.trim();

    try {
        // Crear usuario en Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Guardar documento en Firestore
        await setDoc(doc(db, "usuario", uid), {
            nombre: firstName,
            apellido: lastName,
            documento: documentUser,
            email: email,
            estado: "activo",
            fecha_ingreso: serverTimestamp(),
            rol: role,
            sexo: 0,
            telefono: phone || ""
        });

        showStatus(`Usuario ${firstName} registrado correctamente`, "success");
        addUserForm.reset();
        addUserModal.style.display = "none";

    } catch (err) {
        console.error(err);
        showStatus(`Error: ${err.message}`, "error");
    }
});

// ===================== MODAL AGREGAR SALARIO =====================
const addSalaryBtn = document.getElementById("addSalaryBtn");
const addSalaryModal = document.getElementById("addSalaryModal");

addSalaryBtn.addEventListener("click", () => {
    addSalaryModal.style.display = "block";
});

const employeeSelect = document.getElementById("employeeSelect");

// LISTENER EN TIEMPO REAL (onSnapshot)
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

import { getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
employeeSelect.addEventListener("change", async () => {
    const uid = employeeSelect.value;

    if (!uid) {
        salaryInput.value = "";
        return;
    }

    // Buscar salario en usuario_admin
    const docRef = doc(db, "usuario_admin", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        salaryInput.value = data.salario ?? "";
    } else {
        salaryInput.value = ""; // No tiene salario aún
    }
});

const selectPeriodo = document.getElementById("periodo_pago");

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const anioActual = new Date().getFullYear();

meses.forEach((mes, index) => {
  const value = `${anioActual}-${String(index + 1).padStart(2, "0")}`; // ejemplo: 2025-01
  const texto = `${mes} ${anioActual}`;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = texto;
  selectPeriodo.appendChild(option);
});



// ===================== GUARDAR PAGO DEL EMPLEADO =====================
import { addDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const addSalaryForm = document.getElementById("addSalaryForm");

addSalaryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const uidEmpleado = document.getElementById("employeeSelect").value;
    const salario = Number(document.getElementById("salaryInput").value) || 0;
    const bono = Number(document.getElementById("bonusInput").value) || 0;
    const deduccion = Number(document.getElementById("deductionsInput").value) || 0;
    const periodoPago = document.getElementById("periodo_pago").value;
    const comentario = document.getElementById("commentInput").value;

    if (!uidEmpleado) {
        showStatus("Selecciona un empleado.", "error");
        return;
    }

    if (!periodoPago) {
        showStatus("Selecciona un periodo de pago.", "error");
        return;
    }

    const pago_total = salario + bono - deduccion;

    const dataPago = {
        uid: uidEmpleado,
        periodo_pago: periodoPago,
        salario: salario,
        bono: bono,
        deduccion: deduccion,
        pago_total: pago_total,
        estado: "pagado",
        detalle: comentario,
        fecha_registro: new Date()
    };

    try {
        await addDoc(collection(db, "pagos_empleados"), dataPago);

        showStatus("Pago registrado correctamente ✔️", "success");

        addSalaryForm.reset();
        addSalaryModal.style.display = "none";

    } catch (error) {
        console.error("Error al guardar pago:", error);
        showStatus("Hubo un error al registrar el pago.", "error");
    }
});





// ===================== MODAL EDITAR PLANILLA =====================
const editUserPlanillaBtn = document.getElementById("editUserPlanilla");
const editUserPlanillaModal = document.getElementById("editUserPlanillaModal");
const editPlanillaForm = document.getElementById("editPlanillaForm");
const salaryInputPlanilla = document.getElementById("salaryInputPlanilla");
const employeeSelectPlanilla = document.getElementById("employeeSelectPlanilla");

// Abrir modal Editar Planilla
editUserPlanillaBtn.addEventListener("click", () => {
    editUserPlanillaModal.style.display = "block";
});

// ===================== CARGAR EMPLEADOS =====================
onSnapshot(collection(db, "usuario"), (snapshot) => {
    employeeSelectPlanilla.innerHTML = `<option value="">Seleccione empleado</option>`;

    snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = `${data.nombre} ${data.apellido}`;
        employeeSelectPlanilla.appendChild(option);
    });
});

// ===================== GUARDAR PLANILLA =====================
editPlanillaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const uid = employeeSelectPlanilla.value;
    const salario = Number(salaryInputPlanilla.value);

    if (!uid || salario <= 0) {
        showStatus("Seleccione un empleado y coloque salario válido", "error");
        return;
    }

    try {
        await setDoc(doc(db, "usuario_admin", uid), {
            uid: uid,
            salario: salario,
            horas_trabajadas: 0,
            bonificaciones: 0,
            descuentos: 0
        });

        showStatus("Datos de planilla actualizados correctamente", "success");
        editPlanillaForm.reset();
        editUserPlanillaModal.style.display = "none";

    } catch (err) {
        console.error(err);
        showStatus(`Error: ${err.message}`, "error");
    }
});
 

// Cerrar si clickea afuera
window.addEventListener('click', (e) => {
    if (e.target === addUserModal) {
        addUserModal.style.display = "none";
        addUserForm.reset();
    }
});



// ===================== TABLA DE PAGOS (EN TIEMPO REAL) =====================



const salaryTableBody = document
    .getElementById("salaryTable")
    .querySelector("tbody");

// Escuchar los documentos en pagos_empleados
onSnapshot(collection(db, "pagos_empleados"), async (snapshot) => {
    console.log("SNAPSHOT PAGOS:", snapshot.size);
    salaryTableBody.innerHTML = ""; // limpiar tabla

    const pagos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    for (const pago of pagos) {
        const usuarioRef = doc(db, "usuario", pago.uid);
        const usuarioSnap = await getDoc(usuarioRef);

        let nombre = "Desconocido";
        let cargo = "—";

        if (usuarioSnap.exists()) {
            const u = usuarioSnap.data();
            nombre = `${u.nombre} ${u.apellido}`;
            cargo = u.rol;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nombre}</td>
            <td>${cargo}</td>
            <td>${pago.salario}</td>
            <td>${pago.bono}</td>
            <td>${pago.deduccion}</td>
            <td>${pago.pago_total}</td>
            <td>${pago.periodo_pago}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${pago.id}">Editar</button>
                <button class="action-btn delete-btn" data-id="${pago.id}">Eliminar</button>
                <button class="action-btn info-btn"
                data-id="${pago.id}">Info</button>
            </td>
        `;

        salaryTableBody.appendChild(tr);
    }
});



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


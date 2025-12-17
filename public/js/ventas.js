// ===================== IMPORTS FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, serverTimestamp, Timestamp, collection, onSnapshot, query, where, getDocs, getDoc, updateDoc } 
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


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

console.log("ARCHIVO JS CARGADO ✔️");

// ==========================
// Modal Registro JS
// ==========================

// Selección de elementos
const modalBack = document.getElementById('modalBack');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnAddItem = document.getElementById('btnAddItem');
const btnClear = document.getElementById('btnClear');
const btnSaveSale = document.getElementById('btnSaveSale');
const btnOpenModal = document.getElementById('btnOpen'); // botón "+ Vender"

// Función para abrir el modal
function openModal() {
    modalBack.style.display = 'flex'; // asegúrate que CSS tenga display:flex
    resetModalFields();
}

// Función para cerrar el modal
function closeModal() {
    modalBack.style.display = 'none';
}

// Función para limpiar campos del modal
function resetModalFields() {
    const productSel = document.getElementById('productSel');
    const categorySel = document.getElementById('categorySel');
    const quantity = document.getElementById('quantity');
    const montounit = document.getElementById('montounit');
    const itemsBody = document.getElementById('itemsBody');
    const montototal = document.getElementById('montototal');


    if (productSel) productSel.selectedIndex = 0;
    if (categorySel) categorySel.selectedIndex = 0;
    if (quantity) quantity.value = 1;
    if (montounit) montounit.textContent = 'S/ 0.00';
    if (montototal) montototal.textContent = 'S/ 0.00';
}

// ==========================
// Eventos del modal
// ==========================

// Abrir modal al hacer click en "+ Vender"
if (btnOpenModal) {
    btnOpenModal.addEventListener('click', openModal);
}

// Cerrar modal con botón
if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
}

// Cerrar modal haciendo click fuera del contenido
if (modalBack) {
    modalBack.addEventListener('click', (e) => {
        if (e.target === modalBack) closeModal();
    });
}

if (btnClear) {
    btnClear.addEventListener('click', resetModalFields);
}

if (btnAddItem) {
    btnAddItem.addEventListener('click', () => {
        console.log('Agregar item - pendiente implementar');
        // Aquí puedes agregar la lógica para añadir un producto a la tabla
    });
}

if (btnSaveSale) {
    btnSaveSale.addEventListener('click', () => {
        console.log('Guardar venta - pendiente implementar');
        // Aquí puedes agregar la lógica para guardar la venta
    });
}

//CARGAR DATOS EN CATEGORIA

async function cargarCategoriasEnSelect() {
    selectCategorias.innerHTML = `<option value="">Seleccione una categoría</option>`;

    try {
        const querySnapshot = await getDocs(collection(db, "categoria"));

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const option = document.createElement("option");
            option.value = data.id_categoria;
            option.textContent = data.nombre;

            selectCategorias.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// ABRIR MODAL

document.getElementById("btnOpen").addEventListener("click", cargarCategoriasEnSelect);



//funcion para cargar ARTICULOS en el select segun la categoria seleccionada
async function cargarticulos(id_categoria) {
    const categorySel = document.getElementById("categorySel");
    categorySel.innerHTML = `<option value="">Seleccione un valor</option>`;
    try {
        const q = query(collection(db, "articulos"), where("id_categoria", "==", parseInt(id_categoria)));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const option = document.createElement("option");
            option.value = doc.id;   // id del valor, no del atributo
            option.textContent = data.nombre;
            
            categorySel.appendChild(option);
        });
    }   catch (error) {
        console.error("Error cargando valores:", error);
    }
}


document.getElementById("selectCategorias").addEventListener("change", (e) => {
    const id_categoria = e.target.value;
    if (id_categoria) {
        cargarticulos(id_categoria);
    } else {
        const categorySel = document.getElementById("categorySel");
        categorySel.innerHTML = `<option value="">-- Selecciona una característica primero --</option>`;
    }
});


// Mostrar precio del articulo
const categorySel = document.getElementById("categorySel");
const montounit = document.getElementById("montounit");
const montototal = document.getElementById("montototal");


categorySel.addEventListener("change", async () => {
    const uid = categorySel.value;
    if (!uid) { 
        montounit.textContent = "S/ 0.00"; 
        precioUnitarioActual = 0;
        return; 
    }

    const docRef = doc(db, "articulos", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        precioUnitarioActual = docSnap.data().precio_base ?? 0;
        montounit.textContent = "S/ " + precioUnitarioActual.toFixed(2);
        montototal.textContent = "S/ " + precioUnitarioActual.toFixed(2);
    } else {
        precioUnitarioActual = 0;
        montounit.textContent = "S/ 0.00";
        montototal.textContent = "S/ 0.00";
    }
});

let precioUnitarioActual = 0;

const quantity = document.getElementById("quantity");

quantity.addEventListener("blur", () => {
    const qty = parseInt(quantity.value);
    if (!qty || qty < 1) {
        montounit.textContent = "S/ 0.00";
        return;
    }

    // obtener el precio unitario actual
    const precioUnitario = parseFloat(montototal.textContent.replace("S/ ", ""));
    if (isNaN(precioUnitario)) return;

    // calcular total
    const total = precioUnitario * qty;

    // actualizar montounit
    montototal.textContent = "S/ " + total.toFixed(2);
});

// ========================== AGREGAR ITEM

let contadorItems = 1;

const itemsBody = document.getElementById("itemsBody");

document.getElementById("btnAddItem").addEventListener("click", () => {
    const productoID = categorySel.value;
    const productoNombre = categorySel.options[categorySel.selectedIndex].text;
    const cantidad = parseInt(quantity.value);
    const montoUnitario = parseFloat(montounit.textContent.replace("S/ ", ""));
    const montoTotal = parseFloat(montototal.textContent.replace("S/ ", ""));

    if (!productoID || isNaN(cantidad) || isNaN(montoUnitario) || isNaN(montoTotal)) {
        alert("Por favor, complete todos los campos correctamente antes de agregar el item.");
        return;
    }

    const fecha = new Date().toLocaleDateString();

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${contadorItems}</td>
        <td>${productoNombre}</td>
        <td>${fecha}</td>
        <td>${cantidad}</td>
        <td>S/ ${montoUnitario.toFixed(2)}</td>
        <td>S/ ${montoTotal.toFixed(2)}</td>
        <td><button class="btnDeleteItem">Eliminar</button></td>
    `;

    tr.querySelector(".btnDeleteItem").addEventListener("click", () => {
        tr.remove();
        recalcularCodigos();
    });

    itemsBody.appendChild(tr);

    contadorItems++;
});

function recalcularCodigos() {
    contadorItems = 1;
    [...itemsBody.children].forEach((tr) => {
        tr.children[0].textContent = contadorItems++;
    });
}


///////////Guardar

// ==========================================
// GUARDAR VENTA + REFRESCAR TABLA PRINCIPAL
// ==========================================
document.getElementById("btnSaveSale").addEventListener("click", async () => {

    const filas = [...itemsBody.querySelectorAll("tr")];

    if (filas.length === 0) {
        alert("Debe agregar al menos un item para guardar la venta.");
        return;
    }

    // Construir arreglo de items
    const items = filas.map((tr) => ({
        nombre: tr.children[1].textContent.trim(),
        fecha: tr.children[2].textContent.trim(),
        cantidad: parseInt(tr.children[3].textContent.trim()),
        monto_unitario: parseFloat(tr.children[4].textContent.replace("S/ ", "")),
        monto_total: parseFloat(tr.children[5].textContent.replace("S/ ", "")),
    }));

    // Cantidad total REAL de unidades
    const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0);

    // Calcular total general de dinero
    const totalGeneral = items.reduce((acc, item) => acc + item.monto_total, 0);

    try {
        // 1️⃣ Guardar venta principal
        const ventaRef = await addDoc(collection(db, "ventas"), {
            fecha_registro: serverTimestamp(),
            total_general: totalGeneral,
            cantidad_items: cantidadTotal,
            cliente: "—",
            celular: "—",
        });

        // 2️⃣ Guardar items en subcolección
        for (const item of items) {
            await addDoc(collection(db, `ventas/${ventaRef.id}/items`), item);
        }

        // 3️⃣ Añadir venta a la tabla principal
        agregarVentaATabla(
            ventaRef.id,
            new Date().toLocaleDateString(),
            "—",
            "—",
            cantidadTotal,     // 👈 ahora SÍ refleja la cantidad correcta
            totalGeneral
        );

        // 4️⃣ Limpiar modal
        resetModalFields();
        itemsBody.innerHTML = "";
        contadorItems = 1;

        // 5️⃣ Cerrar modal
        closeModal();

        alert("Venta guardada exitosamente ✔️");

    } catch (error) {
        console.error("❌ Error al guardar venta:", error);
        alert("Error al guardar la venta. Revise consola.");
    }
});


function agregarVentaATabla(idVenta, fecha, cliente, celular, cantidad, monto) {
    const tablaBody = document.getElementById("tabla-body");

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${obtenerCorrelativoDisponible()}</td>
        <td>${fecha}</td>
        <td>${cliente}</td>
        <td>${celular}</td>
        <td>${cantidad}</td>
        <td>S/ ${monto.toFixed(2)}</td>
        <td class="acciones-td">
            <button class="btn-ver" title="Ver detalle">
                <i class="fa-solid fa-eye"></i>
            </button>

            <button class="btn-editar" title="Editar venta">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>

            <button class="btn-eliminar" title="Eliminar venta">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    // =======================
    // EVENTO: VER DETALLE
    // =======================
    tr.querySelector(".btn-ver").addEventListener("click", () => {
        console.log("Ver detalle de:", idVenta);
        // Aquí puedes abrir un modal con los detalles
        // abrirModalVer(idVenta);
    });

    // =======================
    // EVENTO: EDITAR
    // =======================
    tr.querySelector(".btn-editar").addEventListener("click", () => {
        console.log("Editar venta:", idVenta);
        // Aquí puedes poner el modal de edición
        // abrirModalEditar(idVenta);
    });

    // =======================
    // EVENTO: ELIMINAR
    // =======================
    tr.querySelector(".btn-eliminar").addEventListener("click", async () => {
        const confirmar = confirm("¿Seguro que deseas eliminar esta venta?");
        if (!confirmar) return;

        try {
            // Eliminar en Firestore:
            await deleteDoc(doc(db, "ventas", idVenta));

            // Eliminar en la tabla:
            tr.remove();

            alert("Venta eliminada correctamente.");
        } catch (error) {
            console.error("Error eliminando venta:", error);
            alert("Hubo un error al eliminar.");
        }
    });

    tablaBody.appendChild(tr);
}

/////CONTADOR PARA TABLA-#FACT.

function obtenerCorrelativoDisponible() {
    const filas = document.querySelectorAll("#tabla-body tr");
    const usados = [];

    filas.forEach(tr => {
        const num = parseInt(tr.children[0].textContent.trim());
        if (!isNaN(num)) usados.push(num);
    });

    // Ordenar números usados
    usados.sort((a, b) => a - b);

    // Buscar el primer hueco
    let contador = 1;
    for (let num of usados) {
        if (num !== contador) break;
        contador++;
    }

    return String(contador).padStart(3, "0");
}


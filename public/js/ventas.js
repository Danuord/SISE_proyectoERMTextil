// ===================== IMPORTS FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, serverTimestamp, Timestamp, collection, 
    onSnapshot, query, where, getDocs, getDoc, updateDoc, orderBy, runTransaction } 
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
const db = getFirestore();

console.log("ARCHIVO JS CARGADO ✔️");

// ==========================
// Modal Registro JS
// ==========================

// Selección de elementos
const selectClientes = document.getElementById("clienteSel");
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
    resetModalFields();
    itemsBody.innerHTML = "";
    modalBack.style.display = 'none';
}


let carrito = [];


// Función para limpiar campos del modal
function resetModalFields() {
    const productSel = document.getElementById('productSel');
    const selectCategorias = document.getElementById('selectCategorias');
    const categorySel = document.getElementById('categorySel');
    const clienteSel = document.getElementById('clienteSel');    
    const quantity = document.getElementById('quantity');
    const montounit = document.getElementById('montounit');
    const itemsBody = document.getElementById('itemsBody');
    const montototal = document.getElementById('montototal');


    if (productSel) productSel.selectedIndex = 0;
    if (categorySel) categorySel.selectedIndex = 0;
    if (quantity) quantity.value = 1;
    if (montounit) montounit.textContent = 'S/ 0.00';
    if (montototal) montototal.textContent = 'S/ 0.00';
    if (clienteSel) clienteSel.selectedIndex = 0;
    if (selectCategorias) selectCategorias.selectedIndex = 0;
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

if (btnSaveSale) {
    btnSaveSale.addEventListener('click', () => {
        console.log('Guardar venta - pendiente implementar');
        // Aquí puedes agregar la lógica para guardar la venta
    });
}

if (btnClear) {
    btnClear.addEventListener('click', resetModalFields);
}

//CARGAR DATOS EN CATEGORIA
document.getElementById("btnOpen").addEventListener("click", cargarCategoriasEnSelect);

async function cargarCategoriasEnSelect() {
    selectCategorias.innerHTML = `<option value="">Seleccione una categoría</option>`;

    try {
        const querySnapshot = await getDocs(collection(db, "categoria"));

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const option = document.createElement("option");
            option.value = docSnap.id;
            option.textContent = data.nombre;

            selectCategorias.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// cargar clientes
document.getElementById("btnOpen").addEventListener("click", cargarClientesEnSelect);

async function cargarClientesEnSelect() {
    selectClientes.innerHTML = `<option value="">Seleccione un cliente</option>`;

    try {
        const q = query(
            collection(db, "usuario"),
            where("rol", "==", "Cliente")
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const option = document.createElement("option");
            option.value = docSnap.id
            option.textContent = `${data.nombre} ${data.apellido}`;

            selectClientes.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando clientes:", error);
    }
}




//funcion para cargar ARTICULOS en el select segun la categoria seleccionada
async function cargarticulos(id_categoria) {
    const categorySel = document.getElementById("categorySel");
    categorySel.innerHTML = `<option value="">Seleccione un artículo</option>`;

    if (!id_categoria) return;

    try {
        const q = query(
            collection(db, "articulos"),
            where("id_categoria", "==", id_categoria) // ✅ SIN parseInt
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const option = document.createElement("option");
            option.value = docSnap.id;     // ✅ UID del artículo
            option.textContent = data.nombre;

            categorySel.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando artículos:", error);
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

function recalcularCodigos() {
    [...itemsBody.children].forEach((tr, index) => {
        tr.children[0].textContent = index + 1;
    });
}

const itemsBody = document.getElementById("itemsBody");

document.getElementById("btnAddItem").addEventListener("click", () => {

    const productoID = categorySel.value;

    console.log("▶ productoID (raw):", productoID);
    console.log("▶ tipo productoID:", typeof productoID);
    console.log("▶ productoID Number:", Number(productoID));
    const productoNombre = categorySel.options[categorySel.selectedIndex].text;
    const cantidad = parseInt(quantity.value);
    const montoUnitario = parseFloat(montounit.textContent.replace("S/ ", ""));
    const montoTotal = parseFloat(montototal.textContent.replace("S/ ", ""));

    if (!productoID || isNaN(cantidad) || isNaN(montoUnitario) || isNaN(montoTotal)) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    const fecha = new Date().toLocaleDateString();

    // 🔥 FUENTE ÚNICA DE VERDAD
    carrito.push({
        productoID,
        nombre: productoNombre,
        fecha,
        cantidad,
        monto_unitario: montoUnitario,
        monto_total: montoTotal
    });

    // 🧾 PINTAR FILA
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${carrito.length}</td>
        <td>${productoNombre}</td>
        <td>${fecha}</td>
        <td>${cantidad}</td>
        <td>S/ ${montoUnitario.toFixed(2)}</td>
        <td>S/ ${montoTotal.toFixed(2)}</td>
        <td><button class="btnDeleteItem">Eliminar</button></td>
    `;

    tr.querySelector(".btnDeleteItem").addEventListener("click", () => {
        const index = [...itemsBody.children].indexOf(tr);
        carrito.splice(index, 1);
        tr.remove();
        recalcularCodigos();
    });

    itemsBody.appendChild(tr);
});


///////////Guardar

// ==========================================
// GUARDAR VENTA + REFRESCAR TABLA PRINCIPAL
// ==========================================
document.getElementById("btnSaveSale").addEventListener("click", async () => {

    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    if (!clienteSel.value) {
        alert("Seleccione un cliente");
        return;
    }

    try {
        await runTransaction(db, async (transaction) => {

            /* =========================
               1️⃣ CREAR VENTA (CABECERA)
            ========================== */
            const ventaRef = doc(collection(db, "ventas"));

            const cantidadItems = carrito.reduce((a, i) => a + i.cantidad, 0);
            const totalGeneral = carrito.reduce((a, i) => a + i.monto_total, 0);

            transaction.set(ventaRef, {
                fecha_registro: serverTimestamp(),
                cliente_id: clienteSel.value,
                cliente_nombre: clienteSel.options[clienteSel.selectedIndex].text,
                cantidad_items: cantidadItems,
                total_general: totalGeneral
            });

            /* =========================
               2️⃣ DETALLE DE VENTA
            ========================== */
            for (const item of carrito) {

                // 🔎 Validar stock
                const stockQuery = query(
                    collection(db, "stock_inventario"),
                    where("id_articulo", "==", item.productoID)
                );

                const stockSnap = await getDocs(stockQuery);

                if (stockSnap.empty) {
                    throw new Error(`No existe stock para ${item.nombre}`);
                }

                let stockDisponible = 0;
                let stockDocRef = null;

                stockSnap.forEach(docSnap => {
                    stockDisponible += docSnap.data().stock;
                    if (!stockDocRef) stockDocRef = docSnap.ref;
                });

                if (stockDisponible < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${item.nombre}`);
                }

                /* 🧾 Crear detalle_venta */
                const detalleRef = doc(collection(db, "detalle_venta"));

                transaction.set(detalleRef, {
                    id_venta: ventaRef.id,
                    id_articulo: item.productoID,
                    nombre: item.nombre,
                    descripcion: item.descripcion || "",
                    cantidad: item.cantidad,
                    precio_unitario: item.monto_unitario ?? (item.monto_total / item.cantidad),
                    subtotal: item.monto_total
                });

                /* 📉 Descontar stock (simple, luego puedes mejorar por atributo) */
                const stockData = stockSnap.docs[0].data();
                transaction.update(stockSnap.docs[0].ref, {
                    stock: stockData.stock - item.cantidad
                });
            }
        });

        alert("Venta registrada correctamente ✅");
        carrito.length = 0;
        resetModalFields();
        closeModal();

    } catch (error) {
        console.error("Error al guardar la venta:", error);
        alert(error.message || "Error al guardar la venta");
    }
});

function agregarVentaATabla(idVenta, cliente, fecha, cantidad, monto) {
    const tablaBody = document.getElementById("tabla-body");
    const correlativo = obtenerCorrelativoDisponible();

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${correlativo}</td>
        <td>${cliente}</td>
        <td>${fecha}</td>
        <td>${cantidad}</td>
        <td>S/ ${monto.toFixed(2)}</td>
        <td class="acciones-td">
            <button 
                class="btnReporte" 
                data-id="${idVenta}"
                title="Ver comprobante"
            >
                <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-editar" title="Editar venta">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
        </td>
    `;

    // EDITAR
    tr.querySelector(".btn-editar").addEventListener("click", () => {
        console.log("Editar venta:", idVenta);
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

// LISTAR DATOS EN LA TABLA

function formatearFecha(timestamp) {
    if (!timestamp || !timestamp.toDate) return "-";
    return timestamp.toDate().toLocaleDateString("es-PE");
}

async function cargarVentasEnTabla() {
    const tablaBody = document.getElementById("tabla-body");
    tablaBody.innerHTML = "";

    try {
        const q = query(
            collection(db, "ventas"),
            orderBy("fecha_registro", "desc")
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center">
                        No hay ventas registradas
                    </td>
                </tr>
            `;
            return;
        }

        snap.forEach((docSnap) => {
            const v = docSnap.data();

            const cliente = v.cliente_nombre ?? "-";
            const fecha = formatearFecha(v.fecha_registro);
            const cantidad = Number(v.cantidad_items ?? 0);
            const monto = Number(v.total_general ?? 0);

            agregarVentaATabla(
                docSnap.id,
                cliente,
                fecha,
                cantidad,
                monto
            );
        });

    } catch (error) {
        console.error("Error cargando ventas:", error);
        alert("Error al cargar ventas.");
    }
}

document.addEventListener("DOMContentLoaded", cargarVentasEnTabla);

// ===================== PDF COMPROBANTE =====================

async function generarComprobanteVenta(ventaId) {
    try {
        // ====== OBTENER VENTA ======
        const ventaRef = doc(db, "ventas", ventaId);
        const ventaSnap = await getDoc(ventaRef);

        if (!ventaSnap.exists()) {
            alert("Venta no encontrada");
            return;
        }

        const venta = ventaSnap.data();

        // ====== OBTENER DETALLE DE VENTA ======
        const qDetalle = query(
            collection(db, "detalle_venta"),
            where("id_venta", "==", ventaId)
        );

        const detalleSnap = await getDocs(qDetalle);

        if (detalleSnap.empty) {
            alert("No hay detalle para esta venta");
            return;
        }

        // ====== CREAR PDF ======
        const pdf = new jsPDF();
        let y = 20;

        // ====== ENCABEZADO ======
        pdf.setFontSize(16);
        pdf.text("Empresa", 105, y, { align: "center" });
        y += 8;

        pdf.setFontSize(12);
        pdf.text("Comprobante de Venta", 105, y, { align: "center" });
        y += 12;

        // ====== DATOS DE LA VENTA ======
        pdf.setFontSize(11);
        pdf.text(`Cliente: ${venta.cliente_nombre}`, 20, y); y += 7;
        pdf.text(
            `Fecha: ${venta.fecha_registro.toDate().toLocaleDateString("es-PE")}`,
            20,
            y
        );
        y += 10;

        // ====== DETALLE ======
        pdf.setFontSize(12);
        pdf.text("Detalle de Artículos", 20, y);
        y += 8;

        pdf.setFontSize(10);

        detalleSnap.forEach(docSnap => {
            const d = docSnap.data();

            pdf.text(
                `${d.nombre}  x${d.cantidad}  -  S/ ${Number(d.precio_unitario).toFixed(2)}`,
                25,
                y
            );
            y += 6;
        });

        y += 6;

        // ====== TOTALES ======
        pdf.setFontSize(11);
        pdf.text(`Cantidad de artículos: ${venta.cantidad_items}`, 20, y); y += 7;
        pdf.text(
            `Total: S/ ${Number(venta.total_general).toFixed(2)}`,
            20,
            y
        );
        y += 15;

        // ====== PIE ======
        pdf.setFontSize(9);
        pdf.text(
            "Documento no legal, solo informativo",
            105,
            285,
            { align: "center" }
        );

        mostrarPDFEnModal(pdf);

    } catch (error) {
        console.error(error);
        alert("Error al generar el comprobante");
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
    const btn = e.target.closest(".btnReporte");

    if (!btn) return;

    const ventaId = btn.dataset.id;
    generarComprobanteVenta(ventaId);
});

document.getElementById("closePdfModal").addEventListener("click", () => {
    const modal = document.getElementById("pdfViewerModal");
    const iframe = document.getElementById("pdfViewerFrame");

    iframe.src = "";
    modal.classList.add("hidden");
});

// ========================== FILTRO DE COLUMNAS
const btnColumnas = document.getElementById("columnSelectorBtn");
const menuColumnas = document.getElementById("columnSelectorMenu");

btnColumnas.addEventListener("click", () => {
    menuColumnas.classList.toggle("hidden");
});

const checkboxes = document.querySelectorAll(
    "#columnSelectorMenu input[type='checkbox']"
);

checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        const colIndex = parseInt(this.dataset.col);

        // Selecciona todas las celdas de esa columna (th y td)
        const cells = document.querySelectorAll(
            `table tr th:nth-child(${colIndex + 1}),
             table tr td:nth-child(${colIndex + 1})`
        );

        cells.forEach(cell => {
            cell.style.display = this.checked ? "" : "none";
        });
    });
});

// EXPORTAR EXCEL

document.getElementById("exportVentasBtn")
  .addEventListener("click", exportarVentasExcel);

function exportarVentasExcel() {
    const table = document.getElementById("salesTable");
    if (!table) {
        alert("No se encontró la tabla de ventas");
        return;
    }

    // Clonar tabla
    const clonedTable = table.cloneNode(true);

    // Detectar columnas ocultas
    const hiddenIndexes = [];
    clonedTable.querySelectorAll("th").forEach((th, index) => {
        if 
        (
            th.classList.contains("hidden-col") ||
            th.classList.contains("no-export")
        ) {
            hiddenIndexes.push(index);
        }
    });

    // Eliminar columnas ocultas (de atrás hacia adelante)
    clonedTable.querySelectorAll("tr").forEach(tr => {
        hiddenIndexes
            .slice()
            .reverse()
            .forEach(i => {
                if (tr.children[i]) {
                    tr.removeChild(tr.children[i]);
                }
            });
    });

    // Convertir a HTML Excel
    const tableHTML = clonedTable.outerHTML.replace(/ /g, "%20");

    const fecha = new Date().toLocaleDateString("es-PE").replaceAll("/", "-");
    const nombreArchivo = `registro_ventas_${fecha}.xls`;

    // Descargar
    const link = document.createElement("a");
    link.href = "data:application/vnd.ms-excel," + tableHTML;
    link.download = nombreArchivo;
    link.click();
}
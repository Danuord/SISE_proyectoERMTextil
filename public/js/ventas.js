import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, addDoc, serverTimestamp, Timestamp, collection,
    onSnapshot, query, where, getDocs, getDoc, updateDoc, orderBy, runTransaction
}
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


// Selección de elementos
const selectClientes = document.getElementById("clienteSel");
const modalBack = document.getElementById('modalBack');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnAddItem = document.getElementById('btnAddItem');
const btnClear = document.getElementById('btnClear');
const btnSaveSale = document.getElementById('btnSaveSale');
const btnOpenModal = document.getElementById('btnOpen');

// Nuevos Elementos (Ventas Flexibles)
const chkServicio = document.getElementById("chkServicio");
const chkClienteManual = document.getElementById("chkClienteManual");
const colCategoria = document.getElementById("colCategoria");
const colProducto = document.getElementById("colProducto");
const colServicioDesc = document.getElementById("colServicioDesc");
const inputServicioDesc = document.getElementById("inputServicioDesc");
const colClienteSelect = document.getElementById("colClienteSelect");
const colClienteInput = document.getElementById("colClienteInput");
const inputClienteNombre = document.getElementById("inputClienteNombre");
const inputMontoManual = document.getElementById("inputMontoManual");

// Listener Modo Servicio
if (chkServicio) {
    chkServicio.addEventListener("change", () => {
        if (chkServicio.checked) {
            colCategoria.style.display = "none";
            colProducto.style.display = "none";
            colServicioDesc.style.display = "block";
            montounit.style.display = "none";
            inputMontoManual.style.display = "block";

            // Limpiar selección de producto
            selectCategorias.selectedIndex = 0;
            categorySel.innerHTML = "";
            inputMontoManual.value = "";
            document.getElementById('montototal').textContent = "S/ 0.00";
        } else {
            colCategoria.style.display = "block";
            colProducto.style.display = "block";
            colServicioDesc.style.display = "none";
            montounit.style.display = "block";
            inputMontoManual.style.display = "none";
        }
    });

    // Recalcular total al cambiar precio manual
    inputMontoManual.addEventListener("input", () => {
        const cant = parseInt(document.getElementById('quantity').value) || 1;
        const precio = parseFloat(inputMontoManual.value) || 0;
        document.getElementById('montototal').textContent = "S/ " + (cant * precio).toFixed(2);
    });

    // Y también al cambiar cantidad en modo manual (el listener de quantity ya existe, pero hay que adaptarlo o agregar uno nuevo)
    document.getElementById('quantity').addEventListener("input", () => {
        if (chkServicio.checked) {
            const cant = parseInt(document.getElementById('quantity').value) || 1;
            const precio = parseFloat(inputMontoManual.value) || 0;
            document.getElementById('montototal').textContent = "S/ " + (cant * precio).toFixed(2);
        }
    });
}

// Listener Cliente Manual
if (chkClienteManual) {
    chkClienteManual.addEventListener("change", () => {
        if (chkClienteManual.checked) {
            colClienteSelect.style.display = "none";
            colClienteInput.style.display = "block";
            clienteSel.selectedIndex = 0;
        } else {
            colClienteSelect.style.display = "block";
            colClienteInput.style.display = "none";
            inputClienteNombre.value = "";
        }
    });
}

function openModal() {
    modalBack.style.display = 'flex';
}

if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
        resetModalFields();
        openModal();
    });
}

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

    // Resetear switches de modo manual
    if (chkServicio) {
        chkServicio.checked = false;
        chkServicio.dispatchEvent(new Event('change'));
    }
    if (chkClienteManual) {
        chkClienteManual.checked = false;
        chkClienteManual.dispatchEvent(new Event('change'));
    }

    // Resetear estado de edición
    const btnSaveSale = document.getElementById('btnSaveSale');
    if (btnSaveSale) {
        delete btnSaveSale.dataset.editingId;
        btnSaveSale.textContent = "Guardar Venta";
    }
}


if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
}

if (modalBack) {
    modalBack.addEventListener('click', (e) => {
        if (e.target === modalBack) closeModal();
    });
}

if (btnSaveSale) {
    btnSaveSale.addEventListener('click', () => {
        console.log('Guardar venta - pendiente implementar');
    });
}

if (btnClear) {
    btnClear.addEventListener('click', resetModalFields);
}

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
            where("id_categoria", "==", id_categoria)
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            const option = document.createElement("option");
            option.value = docSnap.id;
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

    const precioUnitario = parseFloat(montototal.textContent.replace("S/ ", ""));
    if (isNaN(precioUnitario)) return;

    const total = precioUnitario * qty;

    montototal.textContent = "S/ " + total.toFixed(2);
});

function recalcularTotalVenta() {
    const total = carrito.reduce((sum, item) => sum + item.monto_total, 0);

}

function renderItemRow(item, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.nombre}</td>
            <td>${item.fecha}</td>
            <td style="width: 100px;">
                <input type="number" 
                       class="form-control input-sm input-cantidad" 
                       value="${item.cantidad}" 
                       min="1" 
                       style="width: 80px; text-align: center;">
            </td>
            <td class="td-precio">S/ ${item.monto_unitario.toFixed(2)}</td>
            <td class="td-subtotal">S/ ${item.monto_total.toFixed(2)}</td>
            <td><button class="btnDeleteItem">Eliminar</button></td>
        `;

    // Evento cambio de cantidad
    const inputQty = tr.querySelector(".input-cantidad");
    inputQty.addEventListener("change", () => {
        let newQty = parseInt(inputQty.value);
        if (newQty < 1 || isNaN(newQty)) {
            newQty = 1;
            inputQty.value = 1;
        }

        // Actualizar modelo
        item.cantidad = newQty;
        item.monto_total = item.monto_unitario * newQty;

        // Actualizar vista
        tr.querySelector(".td-subtotal").textContent = "S/ " + item.monto_total.toFixed(2);

        recalcularTotalVenta();
    });

    tr.querySelector(".btnDeleteItem").addEventListener("click", () => {
        const idx = carrito.indexOf(item);
        if (idx > -1) {
            carrito.splice(idx, 1);
            tr.remove();
            recalcularCodigos();
            recalcularTotalVenta();
        }
    });

    return tr;
}

function recalcularCodigos() {
    [...itemsBody.children].forEach((tr, index) => {
        tr.children[0].textContent = index + 1;
    });
}

const itemsBody = document.getElementById("itemsBody");

document.getElementById("btnAddItem").addEventListener("click", () => {

    let productoID, productoNombre, montoUnitario;
    const cantidad = parseInt(quantity.value);

    // LOGICA FLEXIBLE
    if (chkServicio && chkServicio.checked) {
        productoID = "SERVICIO"; // ID especial
        productoNombre = inputServicioDesc.value.trim();
        montoUnitario = parseFloat(inputMontoManual.value);

        if (!productoNombre) {
            alert("Ingrese una descripción para el servicio.");
            return;
        }
        if (isNaN(montoUnitario) || montoUnitario < 0) {
            alert("Ingrese un precio válido.");
            return;
        }
    } else {
        // LOGICA NORMAL
        productoID = categorySel.value;
        if (!productoID) {
            alert("Seleccione un producto");
            return;
        }
        productoNombre = categorySel.options[categorySel.selectedIndex].text;
        montoUnitario = parseFloat(montounit.textContent.replace("S/ ", ""));
    }

    // Calculo total
    const montoTotal = cantidad * montoUnitario;

    if (isNaN(cantidad) || cantidad < 1) {
        alert("Cantidad inválida");
        return;
    }

    const fecha = new Date().toLocaleDateString();

    const newItem = {
        productoID,
        nombre: productoNombre,
        fecha,
        cantidad,
        monto_unitario: montoUnitario,
        monto_total: montoTotal
    };

    carrito.push(newItem);

    const tr = renderItemRow(newItem, carrito.length - 1);
    itemsBody.appendChild(tr);
    recalcularTotalVenta();

    // Limpiar campos manuales si es necesario para facilitar siguiente ingreso
    if (chkServicio.checked) {
        inputServicioDesc.value = "";
        // inputMontoManual.value = ""; // Opcional: mantener precio anterior? Mejor no.
    }
});


//Guardar
//Guardar
document.getElementById("btnSaveSale").addEventListener("click", async () => {

    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    let clienteID, clienteNombre;

    // Obtener datos de cliente según modo
    if (chkClienteManual && chkClienteManual.checked) {
        clienteNombre = inputClienteNombre.value.trim();
        if (!clienteNombre) {
            alert("Ingrese el nombre del cliente manual.");
            return;
        }
        clienteID = "EXTERNO";
    } else {
        if (!clienteSel.value) {
            alert("Seleccione un cliente");
            return;
        }
        clienteID = clienteSel.value;
        clienteNombre = clienteSel.options[clienteSel.selectedIndex].text;
    }

    const editingId = btnSaveSale.dataset.editingId;

    try {
        await runTransaction(db, async (transaction) => {

            if (!editingId) {
                // Obtener el último número de comprobante
                const ventasQuery = query(
                    collection(db, "ventas"),
                    orderBy("numero_comprobante", "desc")
                );
                const ultimaVentaSnap = await getDocs(ventasQuery);


                let nuevoNumero = 1;
                if (!ultimaVentaSnap.empty) {
                    const ultimaVenta = ultimaVentaSnap.docs[0].data();
                    nuevoNumero = (ultimaVenta.numero_comprobante || 0) + 1;
                }

                const ventaRef = doc(collection(db, "ventas"));

                const cantidadItems = carrito.reduce((a, i) => a + i.cantidad, 0);
                const totalGeneral = carrito.reduce((a, i) => a + i.monto_total, 0);

                transaction.set(ventaRef, {
                    numero_comprobante: nuevoNumero,
                    fecha_registro: serverTimestamp(),
                    cliente_id: clienteID,
                    cliente_nombre: clienteNombre,
                    cantidad_items: cantidadItems,
                    total_general: totalGeneral,
                    estado: "activo"
                });

                for (const item of carrito) {
                    // SI ES SERVICIO, SALTAR LOGICA DE STOCK
                    if (item.productoID === "SERVICIO") {
                        const detalleRef = doc(collection(db, "detalle_venta"));
                        transaction.set(detalleRef, {
                            id_venta: ventaRef.id,
                            id_articulo: "SERVICIO",
                            nombre: item.nombre,
                            descripcion: item.nombre, // Usamos el nombre como descripción
                            cantidad: item.cantidad,
                            precio_unitario: item.monto_unitario,
                            subtotal: item.monto_total
                        });
                        continue;
                    }

                    // LOGICA NORMAL DE STOCK
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

                    const stockData = stockSnap.docs[0].data();
                    transaction.update(stockSnap.docs[0].ref, {
                        stock: stockData.stock - item.cantidad
                    });
                }
            }
            /*  ACTUALIZAR VENTA  */
            else {
                const ventaRef = doc(db, "ventas", editingId);

                // Obtener detalles antiguos
                const qDetalle = query(collection(db, "detalle_venta"), where("id_venta", "==", editingId));
                const oldDetailsSnap = await getDocs(qDetalle);

                // Mapa de cambios netos de stock: id_articulo -> cantidad (+ aumenta, - disminuye)
                const stockChanges = {};

                // Revertir stock
                oldDetailsSnap.forEach(d => {
                    const item = d.data();
                    if (item.id_articulo !== "SERVICIO") {
                        stockChanges[item.id_articulo] = (stockChanges[item.id_articulo] || 0) + item.cantidad;
                    }
                    transaction.delete(d.ref); // Borrar detalle antiguo
                });

                // Aplicar nuevo consumo
                carrito.forEach(item => {
                    if (item.productoID !== "SERVICIO") {
                        stockChanges[item.productoID] = (stockChanges[item.productoID] || 0) - item.cantidad;
                    }
                });

                // Procesar cambios de stock
                for (const [prodId, change] of Object.entries(stockChanges)) {
                    if (change === 0) continue;

                    const qStock = query(collection(db, "stock_inventario"), where("id_articulo", "==", prodId));
                    const stockSnap = await getDocs(qStock);

                    if (stockSnap.empty) throw new Error(`No se encontró registro de stock para artículo ID: ${prodId}`);

                    const stockDoc = stockSnap.docs[0];
                    const currentStock = stockDoc.data().stock;
                    const newStock = currentStock + change;

                    if (newStock < 0) {
                        throw new Error(`Stock insuficiente para artículo ID: ${prodId}.`);
                    }

                    transaction.update(stockDoc.ref, { stock: newStock });
                }

                // Crear nuevos detalles
                carrito.forEach(item => {
                    const detalleRef = doc(collection(db, "detalle_venta"));
                    transaction.set(detalleRef, {
                        id_venta: editingId,
                        id_articulo: item.productoID,
                        nombre: item.nombre,
                        descripcion: item.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.monto_unitario,
                        subtotal: item.monto_total
                    });
                });

                // Actualizar cabecera de venta
                const cantidadItems = carrito.reduce((a, i) => a + i.cantidad, 0);
                const totalGeneral = carrito.reduce((a, i) => a + i.monto_total, 0);

                transaction.update(ventaRef, {
                    cliente_id: clienteID,
                    cliente_nombre: clienteNombre,
                    cantidad_items: cantidadItems,
                    total_general: totalGeneral,
                    fecha_modificacion: serverTimestamp(),
                    estado: "activo"
                });
            }
        });

        alert(editingId ? "Venta actualizada correctamente ✅" : "Venta registrada correctamente ✅");
        carrito.length = 0;
        resetModalFields();
        closeModal();

    } catch (error) {
        console.error("Error al guardar la venta:", error);
        alert(error.message || "Error al guardar la venta");
    }
});

function agregarVentaATabla(idVenta, numeroComprobante, cliente, fecha, cantidad, monto) {
    const tablaBody = document.getElementById("tabla-body");
    const numeroFormateado = String(numeroComprobante).padStart(4, "0");

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${numeroFormateado}</td>
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
            <button class="btn-eliminar-venta" title="Eliminar venta" style="color: #dc3545;">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    // EDITAR
    tr.querySelector(".btn-editar").addEventListener("click", async () => {
        await editarVenta(idVenta);
    });

    // ELIMINAR
    tr.querySelector(".btn-eliminar-venta").addEventListener("click", async () => {
        if (confirm("¿Está seguro de eliminar esta venta? El stock será devuelto al inventario.")) {
            await eliminarVenta(idVenta);
        }
    });

    tablaBody.appendChild(tr);
}

// Función para editar una venta
async function editarVenta(ventaId) {
    try {
        // Obtener datos de la venta
        const ventaRef = doc(db, "ventas", ventaId);
        const ventaSnap = await getDoc(ventaRef);

        if (!ventaSnap.exists()) {
            alert("Venta no encontrada");
            return;
        }

        const venta = ventaSnap.data();

        // Obtener detalle de la venta
        const qDetalle = query(
            collection(db, "detalle_venta"),
            where("id_venta", "==", ventaId)
        );
        const detalleSnap = await getDocs(qDetalle);

        // Limpiar carrito actual
        carrito.length = 0;
        itemsBody.innerHTML = "";

        // Cargar items al carrito
        detalleSnap.forEach((docSnap) => {
            const item = docSnap.data();
            carrito.push({
                productoID: item.id_articulo,
                nombre: item.nombre,
                fecha: new Date().toLocaleDateString(),
                cantidad: item.cantidad,
                monto_unitario: item.precio_unitario,
                monto_total: item.subtotal
            });
        });

        // Renderizar items en el modal
        carrito.forEach((item, index) => {
            const tr = renderItemRow(item, index);
            itemsBody.appendChild(tr);
        });

        // Seleccionar cliente
        const clienteSel = document.getElementById("clienteSel");
        await cargarClientesEnSelect();

        // Lógica Cliente Externo
        if (venta.cliente_id === "EXTERNO") {
            if (chkClienteManual) {
                chkClienteManual.checked = true;
                chkClienteManual.dispatchEvent(new Event('change'));
            }
            document.getElementById("inputClienteNombre").value = venta.cliente_nombre;
        } else {
            if (chkClienteManual && chkClienteManual.checked) {
                chkClienteManual.checked = false;
                chkClienteManual.dispatchEvent(new Event('change'));
            }
            clienteSel.value = venta.cliente_id;
        }

        // Cargar Categorías
        await cargarCategoriasEnSelect();

        // Guardar ID de venta para actualización
        btnSaveSale.dataset.editingId = ventaId;
        btnSaveSale.textContent = "Actualizar Venta";

        // Abrir modal
        openModal();

    } catch (error) {
        console.error("Error al cargar venta para editar:", error);
        alert("Error al cargar la venta");
    }
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

// Función para eliminar venta (lógica)
async function eliminarVenta(ventaId) {
    try {
        await runTransaction(db, async (transaction) => {
            const ventaRef = doc(db, "ventas", ventaId);
            const ventaSnap = await transaction.get(ventaRef);

            if (!ventaSnap.exists()) throw "Venta no encontrada";

            // Obtener detalles para devolver stock
            const qDetalle = query(collection(db, "detalle_venta"), where("id_venta", "==", ventaId));
            const detallesSnap = await getDocs(qDetalle);

            // Marcar venta como inactivo
            transaction.update(ventaRef, { estado: "inactivo" });

            // Devolver stock
            for (const docDetalle of detallesSnap.docs) {
                const item = docDetalle.data();

                // Buscar stock
                const qStock = query(collection(db, "stock_inventario"), where("id_articulo", "==", item.id_articulo));
                const stockSnap = await getDocs(qStock);

                if (!stockSnap.empty) {
                    const stockDoc = stockSnap.docs[0];
                    const stockData = stockDoc.data();
                    const nuevoStock = (stockData.stock || 0) + item.cantidad;

                    transaction.update(stockDoc.ref, { stock: nuevoStock });
                }
            }
        });

        alert("Venta eliminada correctamente. Stock devuelto. 🗑️");

    } catch (error) {
        console.error("Error al eliminar venta:", error);
        alert("Error al eliminar venta: " + error.message);
    }
}


async function cargarVentasEnTabla() {
    const tablaBody = document.getElementById("tabla-body");

    try {
        const q = query(
            collection(db, "ventas"),
            where("estado", "!=", "inactivo"),
            orderBy("estado"),
            orderBy("fecha_registro", "desc")
        );

        const q2 = query(
            collection(db, "ventas"),
            orderBy("fecha_registro", "desc")
        );


        onSnapshot(q2, (snap) => {
            tablaBody.innerHTML = "";

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

                if (v.estado === "inactivo") return;

                const numeroComprobante = v.numero_comprobante || 0;
                const cliente = v.cliente_nombre ?? "-";
                const fecha = formatearFecha(v.fecha_registro);
                const cantidad = Number(v.cantidad_items ?? 0);
                const monto = Number(v.total_general ?? 0);

                agregarVentaATabla(
                    docSnap.id,
                    numeroComprobante,
                    cliente,
                    fecha,
                    cantidad,
                    monto
                );
            });
        }, (error) => {
            console.error("Error en onSnapshot ventas:", error);
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
        const ventaRef = doc(db, "ventas", ventaId);
        const ventaSnap = await getDoc(ventaRef);

        if (!ventaSnap.exists()) {
            alert("Venta no encontrada");
            return;
        }

        const venta = ventaSnap.data();

        const qDetalle = query(
            collection(db, "detalle_venta"),
            where("id_venta", "==", ventaId)
        );

        const detalleSnap = await getDocs(qDetalle);

        if (detalleSnap.empty) {
            alert("No hay detalle para esta venta");
            return;
        }

        const pdf = new jsPDF();

        const primaryColor = [102, 126, 234];
        const darkColor = [44, 62, 80];
        const grayColor = [127, 140, 141];

        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, 210, 40, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        pdf.text("JOAR'S S.A.C.", 20, 20);

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        pdf.text("COMPROBANTE DE VENTA", 20, 30);

        pdf.setFontSize(10);
        pdf.text(`RUC: 20123456789`, 150, 20);
        pdf.text(`Fecha: ${venta.fecha_registro.toDate().toLocaleDateString("es-PE")}`, 150, 28);

        let y = 55;
        pdf.setTextColor(...darkColor);

        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(15, y, 180, 25, 3, 3, "FD");

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("DATOS DEL CLIENTE", 20, y + 8);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        y += 16;

        const numeroComprobanteFormateado = String(venta.numero_comprobante || 0).padStart(4, "0");
        pdf.text(`Cliente: ${venta.cliente_nombre}`, 20, y);
        pdf.text(`N° Comprobante: ${numeroComprobanteFormateado}`, 110, y);

        y += 20;

        // --- TABLA DE PRODUCTOS ---
        pdf.setFillColor(...primaryColor);
        pdf.setTextColor(255, 255, 255);
        pdf.rect(15, y, 180, 10, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("PRODUCTO", 20, y + 7);
        pdf.text("CANT.", 110, y + 7);
        pdf.text("P. UNIT.", 135, y + 7);
        pdf.text("SUBTOTAL", 170, y + 7);

        y += 10;
        pdf.setTextColor(...darkColor);
        pdf.setFont("helvetica", "normal");

        function addProductRow(nombre, cantidad, precioUnit, subtotal) {
            pdf.setDrawColor(230, 230, 230);
            pdf.line(15, y + 8, 195, y + 8);

            // Nombre del producto (truncar si es muy largo)
            const nombreCorto = nombre.length > 35 ? nombre.substring(0, 32) + "..." : nombre;
            pdf.text(nombreCorto, 20, y + 6);
            pdf.text(String(cantidad), 115, y + 6);
            pdf.text(`S/ ${Number(precioUnit).toFixed(2)}`, 138, y + 6);

            const subtotalStr = `S/ ${Number(subtotal).toFixed(2)}`;
            const textWidth = pdf.getTextWidth(subtotalStr);
            pdf.text(subtotalStr, 190 - textWidth, y + 6);

            y += 10;
        }

        // Agregar productos
        detalleSnap.forEach(docSnap => {
            const d = docSnap.data();
            addProductRow(
                d.nombre,
                d.cantidad,
                d.precio_unitario,
                d.subtotal
            );
        });

        y += 5;

        // --- TOTALES ---
        pdf.setFillColor(240, 240, 240);
        pdf.rect(110, y, 85, 25, "F");

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...darkColor);
        pdf.text("Cantidad de artículos:", 115, y + 8);
        pdf.text(String(venta.cantidad_items), 185, y + 8);

        y += 10;

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("TOTAL:", 115, y + 8);

        const totalStr = `S/ ${Number(venta.total_general).toFixed(2)}`;
        const totalWidth = pdf.getTextWidth(totalStr);
        pdf.setTextColor(...primaryColor);
        pdf.text(totalStr, 190 - totalWidth, y + 8);

        y += 30;

        // --- PIE DE PÁGINA ---
        pdf.setTextColor(...grayColor);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");

        pdf.setDrawColor(150, 150, 150);
        pdf.line(70, y, 140, y);
        pdf.text("Firma del Cliente", 105, y + 5, { align: "center" });

        y += 15;
        pdf.setFontSize(8);
        pdf.text("Este documento es un comprobante interno generado por el sistema JOAR'S.", 105, y, { align: "center" });

        // Mostrar PDF en modal
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

    const clonedTable = table.cloneNode(true);

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

    const tableHTML = clonedTable.outerHTML.replace(/ /g, "%20");

    const fecha = new Date().toLocaleDateString("es-PE").replaceAll("/", "-");
    const nombreArchivo = `registro_ventas_${fecha}.xls`;

    const link = document.createElement("a");
    link.href = "data:application/vnd.ms-excel," + tableHTML;
    link.download = nombreArchivo;
    link.click();
}
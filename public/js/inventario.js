import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, addDoc, serverTimestamp, Timestamp, collection, onSnapshot, query, where, getDocs, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";


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

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("cerrar-modal")) {
        const modal = e.target.closest(".modal");
        if (modal) modal.style.display = "none";
    }
});

// Función para cargar atributos (modal valor)
async function cargarAtributosEnSelect() {
    selectAtributos.innerHTML = `<option value="">Seleccione un atributo</option>`;

    try {
        const querySnapshot = await getDocs(collection(db, "atributo"));

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const option = document.createElement("option");
            option.value = data.id_atributo;
            option.textContent = data.nombre_atributo;

            selectAtributos.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando atributos:", error);
    }
}

//funcion para cargar atributos (modal articulo)
async function cargarAtributosArtEnSelect() {
    selectAtributosArt.innerHTML = `<option value="">Seleccione un atributo</option>`;

    try {
        const querySnapshot = await getDocs(collection(db, "atributo"));

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const option = document.createElement("option");
            option.value = data.id_atributo;
            option.textContent = data.nombre_atributo;

            selectAtributosArt.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando atributos:", error);
    }
}

//funcion para cargar categorias
async function cargarCategoriasEnSelect() {
    selectCategorias.innerHTML = '<option value="">Seleccione una categoría</option>';

    const snapshot = await getDocs(collection(db, "categoria"));

    snapshot.forEach(docSnap => {
        const categoria = docSnap.data();

        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = categoria.nombre;

        selectCategorias.appendChild(option);
    });
}

//funcion para cargar valores
async function cargarValoresEnSelect(id_atributo) {
    const selectValor = document.getElementById("selectValor");
    selectValor.innerHTML = `<option value="">Seleccione un valor</option>`;
    try {
        const q = query(collection(db, "valor"), where("id_atributo", "==", parseInt(id_atributo)));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement("option");
            option.value = data.id_valor;
            option.textContent = data.valor;
            selectValor.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando valores:", error);
    }
}

// Evento para cargar valores al cambiar el atributo
document.getElementById("selectAtributosArt").addEventListener("change", (e) => {
    const id_atributo = e.target.value;
    if (id_atributo) {
        cargarValoresEnSelect(id_atributo);
    } else {
        const selectValor = document.getElementById("selectValor");
        selectValor.innerHTML = `<option value="">-- Selecciona una característica primero --</option>`;
    }
});



const btnGuardar = document.getElementById('guardarCategoria');
const inputNombre = document.getElementById('catNombre');
const inputDesc = document.getElementById('catDesc');
const tbodyCategorias = document.getElementById('tablaCategorias');
const modalId = 'modalCategoria';

// ===================== GUARDAR CATEGORIA =====================
document.addEventListener('DOMContentLoaded', () => {

    if (!btnGuardar || !inputNombre || !inputDesc || !tbodyCategorias) {
        console.error('Elementos del DOM para categorías no encontrados. Revisa IDs en el HTML.');
        return;
    }

    // --- Guardar categoría ---
    btnGuardar.addEventListener('click', async () => {
        const nombre = inputNombre.value.trim();
        const descripcion = inputDesc.value.trim();

        if (!nombre) {
            alert('Ingrese el nombre de la categoría.');
            return;
        }

        try {
            // Obtener correlativo
            const categoriaRef = doc(collection(db, 'categoria'));

            const payload = {
                nombre,
                descripcion: descripcion || null,
                estado: 'activo',
                fecha_registro: serverTimestamp()
            };

            await setDoc(categoriaRef, payload);

            // Limpieza del modal
            inputNombre.value = '';
            inputDesc.value = '';

            // Cerrar modal
            if (typeof cerrarModal === 'function') {
                cerrarModal(modalId);
            } else {
                // si no existe, ocultamos por si acaso
                const m = document.getElementById(modalId);
                if (m) m.style.display = 'none';
            }

        } catch (err) {
            console.error('Error guardando categoría:', err);
            alert('Ocurrió un error al guardar la categoría. Revisa la consola.');
        }
    });


    // ===================== CARGAR CATEGORIAS EN LA TABLA =====================

    const toggleCategoria = document.getElementById("toggleCategoria");
    const categoriaContent = document.getElementById("categoriaContent");
    const categoriaIcon = document.querySelector(".categoria-icon");

    toggleCategoria.addEventListener("click", () => {
        categoriaContent.classList.toggle("show");
        categoriaIcon.classList.toggle("rotate");
    });

    try {
        const colRef = collection(db, 'categoria');

        // Usamos onSnapshot para actualizaciones en tiempo real
        onSnapshot(colRef, async (snapshot) => {
            // Evitamos el doble disparo
            if (snapshot.metadata.hasPendingWrites) return;

            tbodyCategorias.innerHTML = ''; // Limpiamos
            const fragment = document.createDocumentFragment();

            // Procesamos los documentos
            const promesasCategorias = snapshot.docs.map(async (docSnap, index) => {
                const c = docSnap.data();
                const id = docSnap.id;
                const estado = c.estado || 'activo';
                const isInactivo = estado === 'inactivo';

                const tr = document.createElement('tr');
                if (isInactivo) tr.style.opacity = '0.6';

                // Badge de estado
                const estadoBadge = estado === 'activo'
                    ? '<span style="background:#d4edda; color:#155724; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">ACTIVO</span>'
                    : '<span style="background:#f8d7da; color:#721c24; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">INACTIVO</span>';

                // Botón de acción
                const actionBtn = estado === 'activo'
                    ? `<button class="btn btn-warning" onclick="archivarCategoria('${id}')" title="Archivar categoría"><i class="fa fa-archive"></i> Archivar</button>`
                    : `<button class="btn btn-success" onclick="restaurarCategoria('${id}')" title="Restaurar categoría"><i class="fa fa-undo"></i> Restaurar</button>`;

                tr.innerHTML = `
                    <td>${index + 1}</td> 
                    <td>${c.nombre || ''}</td>
                    <td>${c.descripcion || '-'}</td>
                    <td>${estadoBadge}</td>
                    <td>${actionBtn}</td>
                `;
                return tr;
            });

            // Esperamos a que todas las filas se procesen
            const filas = await Promise.all(promesasCategorias);

            // Agregamos todo al fragmento y luego al DOM
            filas.forEach(fila => fragment.appendChild(fila));
            tbodyCategorias.appendChild(fragment);

        }, (err) => {
            console.error('onSnapshot categorías error:', err);
        });
    } catch (err) {
        console.error('Error inicializando onSnapshot de categorías:', err);
    }
});


// ===================== ABRIR MODALES =====================
document.addEventListener("DOMContentLoaded", () => {

    const modales = {
        btnAddCategoria: "modalCategoria",
        btnAddArticulo: "modalArticulo",
        btnAddAtributo: "modalAtributo",
        btnAddValor: "modalValor",
    };

    Object.entries(modales).forEach(([btnId, modalId]) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);

        if (btn && modal) {
            btn.addEventListener("click", () => {
                modal.style.display = "flex";
            });
        }
    });
});


function abrirModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = "flex";
    deshabilitarCampos(true);
    btnEditarGuardar.innerText = "Editar";
    btnEditarGuardar.dataset.modo = "editar";
}

function cerrarModalEditar() {
    const modal = document.getElementById("modalEditarArticulo");
    if (modal) {
        modal.style.display = "none";
    }
}

// ===================== GUARDAR ATRIBUTO =====================
document.addEventListener("DOMContentLoaded", () => {

    const btnGuardarAtributo = document.getElementById("guardarAtributo");
    const inputAtributoNombre = document.getElementById("attrNombre");
    const modalAtributo = "modalAtributo";

    if (!btnGuardarAtributo || !inputAtributoNombre) {
        console.error("⚠ Elementos para registrar atributo no encontrados.");
        return;
    }

    btnGuardarAtributo.addEventListener("click", async () => {

        const nombre = inputAtributoNombre.value.trim();

        if (!nombre) {
            alert("Ingrese el nombre del atributo.");
            return;
        }

        try {
            // Obtener correlativo
            const snap = await getDocs(collection(db, "atributo"));
            const correlativo = snap.size + 1;

            // Crear referencia
            const nuevaRef = doc(collection(db, "atributo"));

            const payload = {
                id_atributo: correlativo,
                nombre_atributo: nombre
            };

            await setDoc(nuevaRef, payload);

            console.log("✅ Atributo registrado:", payload);

            // 🔄 RECARGAR los atributos en el modal de producto
            await cargarAtributosArtEnSelect();

            // Limpiar input
            inputAtributoNombre.value = "";

            // Cerrar modal
            cerrarModal(modalAtributo);

        } catch (error) {
            console.error("❌ Error guardando atributo:", error);
            alert("Error al guardar el atributo. Revisa la consola.");
        }
    });
});


// ===================== GUARDAR VALOR ========================
const selectAtributos = document.getElementById("selectAtributos");
selectAtributos.innerHTML = `<option value="">Seleccione un atributo</option>`;

const querySnapshot = await getDocs(collection(db, "atributo"));
querySnapshot.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = data.id_atributo;   // <- CORRECTO: el número correlativo
    option.textContent = data.nombre_atributo;
    selectAtributos.appendChild(option);
});

// Llamar la función cuando se abra el modal
document.getElementById("btnAddValor").addEventListener("click", cargarAtributosEnSelect);

document.getElementById("btnGuardarValor")?.addEventListener("click", async () => {
    const selectAtributo = document.getElementById("selectAtributos");
    const valorIngresado = document.getElementById("inputValor").value.trim();

    if (!selectAtributo.value || !valorIngresado) {
        return alert("Seleccione un atributo y escriba un valor.");
    }

    try {
        // Obtener correlativo
        const snap = await getDocs(collection(db, "valor"));
        const correlativo = snap.size + 1;

        // Crear referencia con ID propio
        const nuevaRef = doc(collection(db, "valor"));

        const payload = {
            id_valor: correlativo,          // <- Correlativo manual
            id_atributo: parseInt(selectAtributo.value), // <- el id del atributo
            valor: valorIngresado
        };

        await setDoc(nuevaRef, payload);

        // Limpiar modal
        document.getElementById("inputValor").value = "";
        selectAtributo.value = "";
        document.getElementById("modalValor").style.display = "none";

        console.log("✅ Valor guardado:", payload);

    } catch (error) {
        console.error("Error guardando valor:", error);
    }
});

// ===================== MOSTRAR DATOS EN LA TABLA (OPTIMIZADO) =====================
const tablaArticulosBody = document.getElementById("tablaArticulos");
let allProductos = []; // Array global para almacenar todos los productos

onSnapshot(collection(db, "articulos"), async (snapshot) => {
    // 💡 SOLUCIÓN: Solo procesar si no hay cambios pendientes de escritura local
    // Esto evita que se dispare dos veces seguidas al guardar
    if (snapshot.metadata.hasPendingWrites) return;

    const articulosProcesados = snapshot.docs.map(async (artDoc) => {
        const art = { id: artDoc.id, ...artDoc.data() };

        // 2. Ejecutar consultas de Categoría y Stock en paralelo (para este artículo)
        const [categoriaSnap, stockSnap] = await Promise.all([
            getDoc(doc(db, "categoria", art.id_categoria)),
            getDocs(query(collection(db, "stock_inventario"), where("id_articulo", "==", art.id)))
        ]);

        const categoriaNombre = categoriaSnap.exists()
            ? categoriaSnap.data().nombre
            : "-";

        let stockTotal = 0;
        let stockPromises = [];

        // 3. Procesar Stocks y crear Promesas para Atributo/Valor
        for (const sDoc of stockSnap.docs) {
            const sData = sDoc.data();
            stockTotal += sData.stock || 0;

            const attrValPromise = Promise.all([
                getDocs(query(collection(db, "atributo"), where("id_atributo", "==", sData.id_atributo))),
                getDocs(query(collection(db, "valor"), where("id_valor", "==", sData.id_valor)))
            ]);
            stockPromises.push(attrValPromise);
        }

        // 4. Esperar que todos los atributos y valores se carguen en paralelo
        const resultadosStocks = await Promise.all(stockPromises);

        let atributosNombres = [];
        let valoresNombres = [];

        resultadosStocks.forEach(([attrSnap, valSnap]) => {
            atributosNombres.push(
                !attrSnap.empty ? attrSnap.docs[0].data().nombre_atributo : "-"
            );
            valoresNombres.push(
                !valSnap.empty ? valSnap.docs[0].data().valor : "-"
            );
        });


        // 5. Retornar los datos finales del artículo
        return {
            art,
            categoriaNombre,
            stockTotal,
            atributosNombres,
            valoresNombres
        };
    });

    // Esperar que TODOS los artículos terminen de procesarse
    const resultadosFinales = await Promise.all(articulosProcesados);

    allProductos = resultadosFinales;
    tablaArticulosBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    // Renderizar filas
    resultadosFinales.forEach(({ art, categoriaNombre, stockTotal, atributosNombres, valoresNombres }) => {
        const estado = art.estado || 'activo';
        const isDescontinuado = estado === 'descontinuado';

        const tr = document.createElement("tr");
        if (isDescontinuado) tr.style.opacity = '0.6';

        // Badge de estado
        const estadoBadge = estado === 'activo'
            ? '<span style="background:#d4edda; color:#155724; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">ACTIVO</span>'
            : '<span style="background:#f8d7da; color:#721c24; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">DESCONTINUADO</span>';

        // Botones de acción
        const editBtn = `<button class="btn btn-warning btnEditarArticulo"
                                data-id="${art.id}"
                                title="Editar artículo">
                            <i class="fa fa-edit"></i>
                        </button>`;

        const actionBtn = estado === 'activo'
            ? `<button class="btn btn-danger" onclick="descontinuarProducto('${art.id}', ${stockTotal})" title="Descontinuar producto">
                    <i class="fa fa-ban"></i>
                </button>`
            : `<button class="btn btn-success" onclick="reactivarProducto('${art.id}')" title="Reactivar producto">
                    <i class="fa fa-check"></i>
                </button>`;

        tr.innerHTML = `
            <td>sin imagen</td>
            <td>${art.nombre}</td>
            <td>${categoriaNombre}</td>
            <td>${atributosNombres.join(", ")}</td>
            <td>${valoresNombres.join(", ")}</td>
            <td>S/ ${art.precio_base.toFixed(2)}</td>
            <td>${stockTotal}</td>
            <td>${art.descripcion || "-"}</td>
            <td>${estadoBadge}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    ${editBtn}
                    ${actionBtn}
                </div>
            </td>
        `;
        fragment.appendChild(tr);
    });

    // Insertar todo de una sola vez
    tablaArticulosBody.appendChild(fragment);
});

// ===================== RENDERIZAR PRODUCTOS CON FILTRO =====================
function renderProductos() {
    const filterEstado = document.getElementById("filterEstadoProducto")?.value || "";

    const productosFiltrados = allProductos.filter(({ art }) => {
        if (!filterEstado) return true;
        const estadoProducto = art.estado || 'activo';
        return estadoProducto === filterEstado;
    });

    tablaArticulosBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    productosFiltrados.forEach(({ art, categoriaNombre, stockTotal, atributosNombres, valoresNombres }) => {
        const estado = art.estado || 'activo';
        const isDescontinuado = estado === 'descontinuado';

        const tr = document.createElement("tr");
        if (isDescontinuado) tr.style.opacity = '0.6';

        const estadoBadge = estado === 'activo'
            ? '<span style="background:#d4edda; color:#155724; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">ACTIVO</span>'
            : '<span style="background:#f8d7da; color:#721c24; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:bold;">DESCONTINUADO</span>';
        const editBtn = `<button class="btn btn-warning btnEditarArticulo"
                                data-id="${art.id}"
                                title="Editar artículo">
                            <i class="fa fa-edit"></i>
                        </button>`;

        const actionBtn = estado === 'activo'
            ? `<button class="btn btn-danger" onclick="descontinuarProducto('${art.id}', ${stockTotal})" title="Descontinuar producto">
                    <i class="fa fa-ban"></i>
                </button>`
            : `<button class="btn btn-success" onclick="reactivarProducto('${art.id}')" title="Reactivar producto">
                    <i class="fa fa-check"></i>
                </button>`;

        tr.innerHTML = `
            <td>sin imagen</td>
            <td>${art.nombre}</td>
            <td>${categoriaNombre}</td>
            <td>${atributosNombres.join(", ")}</td>
            <td>${valoresNombres.join(", ")}</td>
            <td>S/ ${art.precio_base.toFixed(2)}</td>
            <td>${stockTotal}</td>
            <td>${art.descripcion || "-"}</td>
            <td>${estadoBadge}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    ${editBtn}
                    ${actionBtn}
                </div>
            </td>
        `;
        fragment.appendChild(tr);
    });

    tablaArticulosBody.appendChild(fragment);
}

// ====================== GUARDAR ARTICULO ========================

// Llenar select de categoria
const selectCategorias = document.getElementById("selectCategorias");
const selectAtributosArt = document.getElementById("selectAtributosArt");


document.getElementById("btnAddArticulo").addEventListener("click", cargarCategoriasEnSelect);
document.getElementById("btnAddArticulo").addEventListener("click", cargarAtributosArtEnSelect);

// Guardar artículo
document.getElementById("guardarArticulo").addEventListener("click", async () => {
    const nombre = document.getElementById("artNombre").value.trim();
    const descripcion = document.getElementById("artDesc").value.trim();
    const precio = parseFloat(document.getElementById("artPrecio").value);
    const stock = parseInt(document.getElementById("artCantidad").value);
    const categoriaId = document.getElementById("selectCategorias").value;
    const atributoId = document.getElementById("selectAtributosArt").value;
    const valorId = document.getElementById("selectValor").value;

    console.log("categoriaId:", categoriaId);
    console.log("selectCategorias:", document.getElementById("selectCategorias").innerHTML);

    if (!nombre || !precio || isNaN(precio) || !stock || isNaN(stock) || !categoriaId || !atributoId || !valorId) {
        return alert("Complete todos los campos obligatorios.");
    }

    try {
        const articuloRef = doc(collection(db, "articulos"));

        const articuloPayload = {
            nombre,
            descripcion: descripcion || null,
            precio_base: precio,
            id_categoria: categoriaId,
            estado: 'activo',
            fecha_registro: serverTimestamp(),
        }

        // BLOQUE STORAGE DESACTIVADO
        /*
        const storage = getStorage();
        const storageRef = ref(storage, `inventario/${categoriaId}/articulo_${correlativo}.jpg`);
        await uploadBytes(storageRef, imagenFile);
        const imagenURL = await getDownloadURL(storageRef);
        articuloPayload.imagen_url = imagenURL;
        */

        await setDoc(articuloRef, articuloPayload);

        const stockRef = doc(collection(db, "stock_inventario"));

        const stockPayload = {
            id_categoria: categoriaId,
            id_stock: stockRef.id,
            id_articulo: articuloRef.id,
            id_atributo: parseInt(atributoId),
            id_valor: parseInt(valorId),
            stock,
            fecha_registro: serverTimestamp()
        };
        await setDoc(stockRef, stockPayload);

        alert("Artículo y stock guardados correctamente (sin imagen por ahora).");

    } catch (error) {
        console.error(" Error:", error);
        alert("Ocurrió un error al guardar");
    }
});

// ===================== MODAL EDITAR ARTICULO =====================

document.getElementById("tablaArticulos").addEventListener("click", (e) => {
    const btn = e.target.closest(".btnEditarArticulo");
    if (!btn) return;

    const idArticulo = btn.dataset.id;

    const btnEditarGuardar = document.getElementById("btnEditarGuardar");
    btnEditarGuardar.dataset.id = idArticulo;

    populateEditarModal(idArticulo);

    deshabilitarCampos();
    btnEditarGuardar.innerText = "Editar";
    btnEditarGuardar.dataset.modo = "editar";

    // Abrir modal
    abrirModal("modalEditarArticulo");
});

// populateEditarModal: carga datos al modal y lo prepara para edición
async function populateEditarModal(articuloDocId) {
    try {
        // 1Obtener artículo por DOC ID
        const artRef = doc(db, "articulos", articuloDocId);
        const artSnap = await getDoc(artRef);

        if (!artSnap.exists()) {
            alert("Artículo no encontrado.");
            return;
        }

        const artData = artSnap.data();

        // Guardar docId para el update
        const btnEditarGuardar = document.getElementById("btnEditarGuardar");
        btnEditarGuardar.dataset.artdocid = articuloDocId;

        // Llenar campos del modal
        document.getElementById("editNombre").value = artData.nombre || "";
        document.getElementById("editDescripcion").value = artData.descripcion || "";
        document.getElementById("editPrecio").value =
            artData.precio_base != null ? artData.precio_base : "";

        // Categorías
        const selectCat = document.getElementById("editCategoria");
        selectCat.innerHTML = `<option value="">Cargando...</option>`;

        const catsSnap = await getDocs(collection(db, "categoria"));
        selectCat.innerHTML = `<option value="">-- Seleccione categoría --</option>`;

        catsSnap.forEach(cDoc => {
            const c = cDoc.data();
            const opt = document.createElement("option");
            opt.value = cDoc.id;
            opt.textContent = c.nombre;

            if (cDoc.id === artData.id_categoria) {
                opt.selected = true;
            }
            selectCat.appendChild(opt);
        });

        // Stock relacionado
        const qStock = query(
            collection(db, "stock_inventario"),
            where("id_articulo", "==", articuloDocId)
        );

        const snapStock = await getDocs(qStock);

        let stockTotal = 0;
        const stockDocIds = [];

        snapStock.forEach(sDoc => {
            stockTotal += Number(sDoc.data().stock || 0);
            stockDocIds.push(sDoc.id);
        });

        btnEditarGuardar.dataset.stockdocs = JSON.stringify(stockDocIds);
        document.getElementById("editStock").value = stockTotal;

        // Estado inicial
        deshabilitarCampos(true);
        btnEditarGuardar.innerText = "Editar";
        btnEditarGuardar.dataset.modo = "editar";

    } catch (error) {
        console.error("Error en populateEditarModal:", error);
        alert("Error cargando artículo.");
    }
}

// deshabilitar/habilitar campos en el modal (true = deshabilitar)
function deshabilitarCampos(state) {
    const campos = [
        "editNombre",
        "editDescripcion",
        "editPrecio",
        "editStock",
        "editCategoria"
    ];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !!state;
    });
}

// guardarCambiosArticulo: actualiza articulo y stock en Firestore
async function guardarCambiosArticulo() {
    try {
        const btn = document.getElementById("btnEditarGuardar");
        const articuloDocId = btn.dataset.artdocid;

        if (!articuloDocId) {
            alert("Falta identificación del artículo para actualizar.");
            return;
        }

        const nombre = document.getElementById("editNombre").value.trim();
        const descripcion = document.getElementById("editDescripcion").value.trim();
        const precio = parseFloat(document.getElementById("editPrecio").value);
        const stock = parseInt(document.getElementById("editStock").value);
        const categoriaId = document.getElementById("editCategoria").value;

        if (!nombre || isNaN(precio) || isNaN(stock) || !categoriaId) {
            alert("Complete todos los campos obligatorios.");
            return;
        }

        // Actualizar ARTÍCULO
        const artRef = doc(db, "articulos", articuloDocId);

        await updateDoc(artRef, {
            nombre,
            descripcion: descripcion || null,
            precio_base: precio,
            id_categoria: categoriaId,
            fecha_actualizacion: serverTimestamp()
        });

        // Actualizar STOCK (todos los relacionados)
        const stockDocIds = JSON.parse(btn.dataset.stockdocs || "[]");

        for (const stockDocId of stockDocIds) {
            const stockRef = doc(db, "stock_inventario", stockDocId);
            await updateDoc(stockRef, {
                stock,
                fecha_actualizacion: serverTimestamp()
            });
        }

        alert("Artículo actualizado correctamente.");
        cerrarModalEditar();

    } catch (error) {
        console.error("Error al guardar cambios:", error);
        alert("Error al actualizar el artículo.");
    }
}

// ---------- BOTÓN PRINCIPAL (Editar -> Guardar) ----------

document.getElementById("btnEditarGuardar").addEventListener("click", function () {
    const modo = this.dataset.modo || "editar";

    if (modo === "editar") {
        // pasar a modo edición: habilitar todos los campos
        deshabilitarCampos(false);
        this.innerText = "Guardar Cambios";
        this.dataset.modo = "guardar";
        return;
    }

    if (modo === "guardar") {
        // ejecutar guardado
        guardarCambiosArticulo();
    }
});

// ===================== ELIMINACIÓN LÓGICA =====================
// Archivar categoría
window.archivarCategoria = async function (id) {
    if (!confirm('¿Está seguro de archivar esta categoría?')) return;

    try {
        await updateDoc(doc(db, "categoria", id), {
            estado: "inactivo",
            fecha_actualizacion: serverTimestamp()
        });
    } catch (error) {
        console.error('Error archivando categoría:', error);
        alert('Error al archivar la categoría');
    }
};

// Restaurar categoría
window.restaurarCategoria = async function (id) {
    if (!confirm('¿Está seguro de restaurar esta categoría?')) return;

    try {
        await updateDoc(doc(db, "categoria", id), {
            estado: "activo",
            fecha_actualizacion: serverTimestamp()
        });
    } catch (error) {
        console.error('Error restaurando categoría:', error);
        alert('Error al restaurar la categoría');
    }
};

// Descontinuar producto
window.descontinuarProducto = async function (id, stock) {
    if (stock > 0) {
        alert('No se puede descontinuar un producto con stock disponible. Stock actual: ' + stock);
        return;
    }

    if (!confirm('¿Está seguro de descontinuar este producto?')) return;

    try {
        await updateDoc(doc(db, "articulos", id), {
            estado: "descontinuado",
            fecha_actualizacion: serverTimestamp()
        });
    } catch (error) {
        console.error('Error descontinuando producto:', error);
        alert('Error al descontinuar el producto');
    }
};

// Reactivar producto
window.reactivarProducto = async function (id) {
    if (!confirm('¿Está seguro de reactivar este producto?')) return;

    try {
        await updateDoc(doc(db, "articulos", id), {
            estado: "activo",
            fecha_actualizacion: serverTimestamp()
        });
    } catch (error) {
        console.error('Error reactivando producto:', error);
        alert('Error al reactivar el producto');
    }
};

// ===================== EVENT LISTENER PARA FILTRO DE PRODUCTOS =====================
setTimeout(() => {
    const filterEstadoProducto = document.getElementById('filterEstadoProducto');

    if (filterEstadoProducto) {
        filterEstadoProducto.addEventListener('change', renderProductos);
    } else {
        setTimeout(() => {
            const retry = document.getElementById('filterEstadoProducto');
            if (retry) {
                retry.addEventListener('change', renderProductos);
            }
        }, 1000);
    }
}, 500);

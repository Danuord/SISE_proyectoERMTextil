// ===================== IMPORTS DE FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, addDoc, serverTimestamp, Timestamp, collection, onSnapshot, query, where, getDocs, updateDoc, 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

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
const db = getFirestore();

console.log("✅ Firebase inicializado");

// ==== CERRAR CUALQUIER MODAL AUTOMÁTICAMENTE ====
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("cerrar-modal")) {
        const modal = e.target.closest(".modal");
        if (modal) modal.style.display = "none";
    }
});

// ===================== FUNCIONES AUXILIARES =====================
// Función para cargar atributos (modal valor)
async function cargarAtributosEnSelect() {
    selectAtributos.innerHTML = `<option value="">Seleccione un atributo</option>`;

    try {
        const querySnapshot = await getDocs(collection(db, "atributo"));

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            const option = document.createElement("option");
            option.value = data.id_atributo;            // id del atributo
            option.textContent = data.nombre_atributo;  // nombre del atributo

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
            option.value = data.id_atributo;            // id del atributo
            option.textContent = data.nombre_atributo;  // nombre del atributo

            selectAtributosArt.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando atributos:", error);
    }
}

//funcion para cargar categorias
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
            option.value = data.id_valor;   // id del valor, no del atributo
            option.textContent = data.valor;
            selectValor.appendChild(option);
        });
    }   catch (error) {
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

// ===================== GUARDAR CATEGORIA =====================
document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM (coinciden con tu HTML)
  const btnGuardar = document.getElementById('guardarCategoria');
  const inputNombre = document.getElementById('catNombre');
  const inputDesc = document.getElementById('catDesc');
  const tbodyCategorias = document.getElementById('tablaCategorias');
  const modalId = 'modalCategoria'; // id del modal que ya tienes

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
        const categoriasSnapshot = await getDocs(collection(db, 'categoria'));
        const correlativo = categoriasSnapshot.size + 1;

        // Crear referencia con ID largo (solo para Firestore)
        const nuevaRef = doc(collection(db, 'categoria'));

        const payload = {
            id_categoria: correlativo, // ahora sí: 1, 2, 3, 4...
            nombre,
            descripcion: descripcion || null,
            fecha_registro: serverTimestamp()
        };

      await setDoc(nuevaRef, payload);

      // Limpieza del modal
      inputNombre.value = '';
      inputDesc.value = '';

      // Cerrar modal (usa tu función cerrarModal si existe)
      if (typeof cerrarModal === 'function') {
        cerrarModal(modalId);
      } else {
        // si no existe, ocultamos por si acaso
        const m = document.getElementById(modalId);
        if (m) m.style.display = 'none';
      }

      console.log('✅ Categoría guardada', payload);
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
    const colRef = collection(db, 'categoria'); // asegúrate que el nombre coincida con Firestore
    onSnapshot(colRef, (snapshot) => {
      tbodyCategorias.innerHTML = ''; // limpiar
      snapshot.forEach(docSnap => {
        const c = docSnap.data();
        const tr = document.createElement('tr');

        // estructura de fila
        tr.innerHTML = `
          <td>${c.id_categoria}</td>
          <td>${c.nombre || ''}</td>
          <td>${c.descripcion || '-'}</td>
        `;

        tbodyCategorias.appendChild(tr);
      });
      console.log('🔄 Tabla de categorías actualizada');
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
    deshabilitarCampos();
    btnEditarGuardar.innerText = "Editar";
    btnEditarGuardar.dataset.modo = "editar";
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


// ====================== GUARDAR ARTICULO ========================

// Llenar select de categoria
const selectCategorias = document.getElementById("selectCategorias");

// Llenar select de atributos (modal articulo)
const selectAtributosArt = document.getElementById("selectAtributosArt");


document.getElementById("btnAddArticulo").addEventListener("click", cargarCategoriasEnSelect);
document.getElementById("btnAddArticulo").addEventListener("click", cargarAtributosArtEnSelect);

// Guardar artículo
document.getElementById("guardarArticulo").addEventListener("click", async () => {
    const nombre = document.getElementById("artNombre").value.trim();
    const descripcion = document.getElementById("artDesc").value.trim();
    const precio = parseFloat(document.getElementById("artPrecio").value);
    const stock = parseInt(document.getElementById("artCantidad").value);
    // const imagenFile = document.getElementById("artImagen").files[0]; // 🔵 DESACTIVADO
    const categoriaId = parseInt(document.getElementById("selectCategorias").value);
    const atributoId = document.getElementById("selectAtributosArt").value;
    const valorId = document.getElementById("selectValor").value;

    if (!nombre || !precio || isNaN(precio) || !stock || isNaN(stock) || !categoriaId || !atributoId || !valorId) {
        return alert("Complete todos los campos obligatorios.");
    }

    try {
        const snapArt = await getDocs(collection(db, "articulos"));
        const correlativo = snapArt.size + 1;

        const articuloRef = doc(collection(db, "articulos"));
        const articuloPayload = {
            id_articulo: correlativo,
            nombre,
            descripcion: descripcion || null,
            precio_base: precio,
            id_categoria: categoriaId,
            fecha_registro: serverTimestamp(),
            
            // imagen_url: null // 🔵 Puedes agregar esto si deseas dejarlo placeholder
        };

        // 🔵 BLOQUE STORAGE DESACTIVADO
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
            id_stock: stockRef.id,
            id_articulo: correlativo,
            id_atributo: parseInt(atributoId),
            id_valor: parseInt(valorId),
            stock,
            fecha_registro: serverTimestamp()
        };
        await setDoc(stockRef, stockPayload);

        alert("Artículo y stock guardados correctamente (sin imagen por ahora).");

    } catch (error) {
        console.error("❌ Error:", error);
        alert("Ocurrió un error al guardar");
    }
});

// ===================== MOSTRAR DATOS EN LA TABLA =====================
const tablaArticulosBody = document.getElementById("tablaArticulos");

onSnapshot(collection(db, "articulos"), async (snapshot) => {
    tablaArticulosBody.innerHTML = ""; // Limpiar tabla
    for (const artDoc of snapshot.docs) {
        const art = { id: artDoc.id, ...artDoc.data() };

        // Obtener nombre de categoría
        const catSnap = await getDocs(query(collection(db, "categoria"), where("id_categoria", "==", art.id_categoria)));
        const categoriaNombre = !catSnap.empty ? catSnap.docs[0].data().nombre : "-";

        // Obtener stock y atributos relacionados
        const stockSnap = await getDocs(query(collection(db, "stock_inventario"), where("id_articulo", "==", art.id_articulo)));

        let atributosNombres = [];
        let valoresNombres = [];
        let stockTotal = 0;

        for (const sDoc of stockSnap.docs) {
                const sData = sDoc.data();
                stockTotal += sData.stock || 0;

                // Obtener nombre del atributo
                const attrSnap = await getDocs(query(collection(db, "atributo"), where("id_atributo", "==", sData.id_atributo)));
                const attrNombre = !attrSnap.empty ? attrSnap.docs[0].data().nombre_atributo : "-";
                atributosNombres.push(attrNombre);

                // Obtener nombre del valor
                const valSnap = await getDocs(query(collection(db, "valor"), where("id_valor", "==", sData.id_valor)));
                const valNombre = !valSnap.empty ? valSnap.docs[0].data().valor : "-";
                valoresNombres.push(valNombre);
            }

        const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${art.id_articulo}</td>
                <td>null</td>
                <td>${art.nombre}</td>
                <td>${categoriaNombre}</td>
                <td>${atributosNombres.join(", ")}</td>
                <td>${valoresNombres.join(", ")}</td>
                <td>${art.precio_base}</td>
                <td>${stockTotal}</td>
                <td>${art.descripcion || "-"}</td>
                <td>
                    <button class="btn btn-warning btnEditarArticulo" data-id="${art.id_articulo}" title="Editar artículo">
                        <i class="fa fa-edit"></i>
                    </button>
                </td>
            `;
            tablaArticulosBody.appendChild(tr);
    }
});

// ===================== MODAL EDITAR ARTICULO =====================

document.getElementById("tablaArticulos").addEventListener("click", (e) => {
    const btn = e.target.closest(".btnEditarArticulo");
    if (!btn) return;

    const idArticulo = btn.dataset.id;

    // Guardamos el ID del artículo dentro del botón principal del modal
    const btnEditarGuardar = document.getElementById("btnEditarGuardar");
    btnEditarGuardar.dataset.id = idArticulo;

    // 🔄 Cargar datos de Firestore al modal
    populateEditarModal(idArticulo);

    // 🔒 Asegurar que inicia en modo EDITAR
    deshabilitarCampos();
    btnEditarGuardar.innerText = "Editar";
    btnEditarGuardar.dataset.modo = "editar";

    // Abrir modal
    abrirModal("modalEditarArticulo");
});

// populateEditarModal: carga datos al modal y lo prepara para edición
async function populateEditarModal(idArticulo) {
    try {
        const idNum = parseInt(idArticulo);

        // 1) obtener documento de articulos por id_articulo
        const qArt = query(collection(db, "articulos"), where("id_articulo", "==", idNum));
        const snapArt = await getDocs(qArt);
        if (snapArt.empty) {
            alert("Artículo no encontrado en Firestore.");
            return;
        }
        const artDoc = snapArt.docs[0];                // DocumentSnapshot
        const artData = artDoc.data();

        // Guardar el id del documento de Firestore (no el correlativo) para update
        const articuloDocId = artDoc.id;
        const btnEditarGuardar = document.getElementById("btnEditarGuardar");
        btnEditarGuardar.dataset.artdocid = articuloDocId;
        btnEditarGuardar.dataset.idarticulo = idNum;

        // 2) llenar campos del modal (usa tus ids)
        document.getElementById("editNombre").value = artData.nombre || "";
        // puede que tu campo se llame 'descripcion' o 'descripcion' en artData (usamos descripcion)
        document.getElementById("editDescripcion").value = artData.descripcion || "";
        document.getElementById("editPrecio").value = artData.precio_base != null ? artData.precio_base : "";

        // 3) cargar select de categorias y seleccionar la actual
        const selectCat = document.getElementById("editCategoria");
        selectCat.innerHTML = `<option value="">Cargando categorías...</option>`;
        const catsSnap = await getDocs(collection(db, "categoria"));
        selectCat.innerHTML = `<option value="">-- Seleccione categoría --</option>`;
        catsSnap.forEach(cDoc => {
            const c = cDoc.data();
            const opt = document.createElement("option");
            opt.value = c.id_categoria; // tu id_categoria correlativo
            opt.textContent = c.nombre;
            if (c.id_categoria === artData.id_categoria) opt.selected = true;
            selectCat.appendChild(opt);
        });

        // 4) obtener stock(s) relacionados (puede haber 1 o varios)
        const qStock = query(collection(db, "stock_inventario"), where("id_articulo", "==", idNum));
        const snapStock = await getDocs(qStock);
        let stockTotal = 0;
        const stockDocIds = [];
        snapStock.forEach(sDoc => {
            const s = sDoc.data();
            stockTotal += Number(s.stock || 0);
            stockDocIds.push(sDoc.id);
        });

        // Guardamos los ids de documentos de stock en dataset para usarlos al guardar
        btnEditarGuardar.dataset.stockdocs = JSON.stringify(stockDocIds);

        // Si no hay stock_documentos, dejamos vacío o 0
        document.getElementById("editStock").value = stockTotal;

        // 5) asegurar que los campos estén DESHABILITADOS a la apertura
        deshabilitarCampos(true);

        // 6) preparar el botón en modo "editar"
        btnEditarGuardar.innerText = "Editar";
        btnEditarGuardar.dataset.modo = "editar";

    } catch (error) {
        console.error("Error en populateEditarModal:", error);
        alert("Error cargando datos del artículo. Revisa consola.");
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
        const articuloDocId = btn.dataset.artdocid;        // Firestore doc id de articulos
        const idArticulo = parseInt(btn.dataset.idarticulo); // correlativo

        if (!articuloDocId || !idArticulo) {
            alert("Falta identificación del artículo para actualizar.");
            return;
        }

        // Leer valores nuevos del modal
        const nuevoNombre = document.getElementById("editNombre").value.trim();
        const nuevaDesc = document.getElementById("editDescripcion").value.trim();
        const nuevoPrecio = parseFloat(document.getElementById("editPrecio").value);
        const nuevoStock = parseInt(document.getElementById("editStock").value);
        const nuevaCategoria = parseInt(document.getElementById("editCategoria").value);

        // Validaciones básicas
        if (!nuevoNombre) return alert("El nombre no puede quedar vacío.");
        if (isNaN(nuevoPrecio)) return alert("Precio inválido.");
        if (isNaN(nuevoStock)) return alert("Stock inválido.");
        if (isNaN(nuevaCategoria)) return alert("Seleccione una categoría válida.");

        // 1) actualizar documento en 'articulos'
        const articuloRef = doc(db, "articulos", articuloDocId);
        await updateDoc(articuloRef, {
            nombre: nuevoNombre,
            descripcion: nuevaDesc || null,
            precio_base: nuevoPrecio,
            id_categoria: nuevaCategoria,
            fecha_registro: serverTimestamp() // opcional mantener fecha de modificación
        });

        // 2) actualizar stock_inventario: actualizar TODOS los documentos de stock relacionados
        // (nota: si prefieres actualizar solo uno específico, cambiamos la lógica)
        const stockDocsJSON = btn.dataset.stockdocs || "[]";
        const stockDocIds = JSON.parse(stockDocsJSON);

        if (stockDocIds.length === 0) {
            // Si no existen documentos de stock, creamos uno nuevo
            const newStockRef = doc(collection(db, "stock_inventario"));
            await setDoc(newStockRef, {
                id_stock: newStockRef.id,
                id_articulo: idArticulo,
                id_atributo: null,
                id_valor: null,
                stock: nuevoStock,
                fecha_registro: serverTimestamp()
            });
        } else {
            // Actualizamos cada doc de stock con el nuevo valor numérico
            await Promise.all(stockDocIds.map(async sid => {
                const stockRef = doc(db, "stock_inventario", sid);
                try {
                    await updateDoc(stockRef, { stock: nuevoStock, fecha_registro: serverTimestamp() });
                } catch (err) {
                    // si falla update (por ejemplo si el doc fue borrado), intentamos set
                    console.warn("updateDoc stock falló, intentando setDoc:", sid, err);
                    await setDoc(stockRef, { stock: nuevoStock }, { merge: true });
                }
            }));
        }

        // 3) cerrar modal y limpiar/actualizar UI
        deshabilitarCampos(true);
        btn.innerText = "Editar";
        btn.dataset.modo = "editar";

        cerrarModal("modalEditarArticulo");

        alert("Artículo y stock actualizados correctamente.");

    } catch (error) {
        console.error("Error guardando cambios del artículo:", error);
        alert("Ocurrió un error al guardar los cambios. Revisa la consola.");
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
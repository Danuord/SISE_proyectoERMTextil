// ===================== IMPORTS DE FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp,
    collection,
    onSnapshot,
    updateDoc,
    getDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("ARCHIVO rrhh.js CARGADO");

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

// ===================== VARIABLES GLOBALES =====================
let editingId = null;
let allUsers = []; // Almacenar todos los usuarios para filtrado

// ===================== FUNCIONES DE UTILIDAD =====================
function logout() {
    localStorage.removeItem('textileflow_session');
    window.location.href = './login.html';
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// User info is now handled by sidebar component

// ===================== VALIDACIONES ÚNICAS =====================
async function checkDocumentExists(documento, excludeUid = null) {
    const q = query(collection(db, "usuario"), where("documento", "==", documento));
    const querySnapshot = await getDocs(q);

    if (excludeUid) {
        return querySnapshot.docs.some(doc => doc.id !== excludeUid);
    }

    return !querySnapshot.empty;
}

async function checkEmailExists(email, excludeUid = null) {
    const q = query(collection(db, "usuario"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (excludeUid) {
        return querySnapshot.docs.some(doc => doc.id !== excludeUid);
    }

    return !querySnapshot.empty;
}

// ===================== RENDERIZAR TABLA DE USUARIOS =====================
function renderClientsTable() {
    const tbody = document.getElementById('clientesList');

    // Escuchar cambios en tiempo real de la colección "usuario"
    onSnapshot(collection(db, "usuario"), (snapshot) => {
        allUsers = [];

        snapshot.forEach(docSnap => {
            const cliente = docSnap.data();
            const uid = docSnap.id;

            // Agregar a array global
            allUsers.push({
                uid: uid,
                ...cliente
            });
        });

        applyFilters();
    });
}

function applyFilters() {
    const tbody = document.getElementById('clientesList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterTipoDoc = document.getElementById('filterTipoDoc').value;
    const filterRol = document.getElementById('filterRol').value;
    const filterEstado = document.getElementById('filterEstado').value;

    tbody.innerHTML = '';

    // Filtrar usuarios
    const filteredUsers = allUsers.filter(cliente => {
        // Excluir usuarios con rol "Cliente"
        if (cliente.rol === 'Cliente') return false;

        const matchesSearch = !searchTerm ||
            (cliente.nombre && cliente.nombre.toLowerCase().includes(searchTerm)) ||
            (cliente.apellido && cliente.apellido.toLowerCase().includes(searchTerm)) ||
            (cliente.email && cliente.email.toLowerCase().includes(searchTerm)) ||
            (cliente.documento && cliente.documento.includes(searchTerm));

        const matchesTipoDoc = !filterTipoDoc || cliente.tipo_documento === filterTipoDoc;
        const matchesRol = !filterRol || cliente.rol === filterRol;
        const matchesEstado = !filterEstado || cliente.estado === filterEstado;

        return matchesSearch && matchesTipoDoc && matchesRol && matchesEstado;
    });

    // Renderizar usuarios filtrados
    filteredUsers.forEach(cliente => {
        const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '-';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente.tipo_documento || '-'}</td>
            <td>${cliente.documento || '-'}</td>
            <td>${nombreCompleto}</td>
            <td>${cliente.email || '-'}</td>
            <td>${cliente.telefono || '-'}</td>
            <td>${cliente.direccion || '-'}</td>
            <td>
                <span class="role-badge">${cliente.rol === 'Administrador' ? 'Administrador' : 'Empleado'}</span>
            </td>
            <td>
                <span class="status-badge ${cliente.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                    ${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-edit" onclick="editClient('${cliente.uid}')" title="Editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-sm btn-toggle" onclick="toggleClientStatus('${cliente.uid}')" title="Cambiar estado">
                        <i class="fas fa-${cliente.estado === 'activo' ? 'times' : 'check'}"></i> ${cliente.estado === 'activo' ? 'Inactivar' : 'Activar'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===================== LIMPIAR FILTROS =====================
function clearFilters() {
    document.getElementById('filterTipoDoc').value = '';
    document.getElementById('filterRol').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('searchInput').value = '';
    applyFilters();
}

function openAddUserModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Empleado';
    document.getElementById('clientForm').reset();
    document.getElementById('rol').value = 'Empleado';
    document.getElementById('contrasena').required = true;
    document.getElementById('clientModal').classList.add('active');
}

function closeModal() {
    document.getElementById('clientModal').classList.remove('active');
    document.getElementById('clientForm').reset();
    editingId = null;
}

async function editClient(uid) {
    const docRef = doc(db, "usuario", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const cliente = docSnap.data();
        editingId = uid;

        document.getElementById('modalTitle').textContent = 'Editar Empleado';
        document.getElementById('tipoDocumento').value = cliente.tipo_documento || '';
        document.getElementById('numeroDocumento').value = cliente.documento || '';
        document.getElementById('nombre').value = cliente.nombre || '';
        document.getElementById('apellido').value = cliente.apellido || '';
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('rol').value = cliente.rol || 'Empleado';
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('direccion').value = cliente.direccion || '';

        document.getElementById('contrasena').required = false;
        document.getElementById('contrasena').value = '';
        document.getElementById('contrasena').placeholder = 'Dejar vacío para no cambiar';

        document.getElementById('clientModal').classList.add('active');
    }
}

async function handleSaveClient(event) {
    event.preventDefault();

    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const numeroDocumento = document.getElementById('numeroDocumento').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const rol = document.getElementById('rol').value;
    const telefono = document.getElementById('telefono').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const direccion = document.getElementById('direccion').value.trim();

    try {
        if (editingId) {
            // Validar documento único (excluyendo el actual)
            const docExists = await checkDocumentExists(numeroDocumento, editingId);
            if (docExists) {
                showAlert('Ya existe un usuario con ese número de documento', 'error');
                return;
            }

            // Obtener el email actual del usuario
            const currentUserDoc = await getDoc(doc(db, "usuario", editingId));
            const currentEmail = currentUserDoc.data()?.email;

            // Solo validar email si cambió
            if (email !== currentEmail) {
                const emailExists = await checkEmailExists(email, editingId);
                if (emailExists) {
                    showAlert('Ya existe un usuario con ese email', 'error');
                    return;
                }
            }

            const updateData = {
                tipo_documento: tipoDocumento,
                documento: numeroDocumento,
                nombre: nombre,
                apellido: apellido,
                email: email,
                rol: rol,
                telefono: telefono,
                direccion: direccion
            };

            // Solo actualizar contraseña si se ingresó una nueva
            if (contrasena) {
                // Nota: Firebase Auth no permite cambiar contraseña directamente desde aquí
                // Se necesitaría implementar una función especial para eso
                console.warn('Cambio de contraseña requiere implementación adicional');
            }

            await updateDoc(doc(db, "usuario", editingId), updateData);
            showAlert('Usuario actualizado exitosamente', 'success');
        } else {
            // ============ CREAR NUEVO USUARIO ============

            if (!contrasena) {
                showAlert('La contraseña es obligatoria para nuevos usuarios', 'error');
                return;
            }

            const docExists = await checkDocumentExists(numeroDocumento);
            if (docExists) {
                showAlert('Ya existe un usuario con ese número de documento', 'error');
                return;
            }

            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                showAlert('Ya existe un usuario con ese email', 'error');
                return;
            }

            // Crear usuario en Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, contrasena);
            const uid = userCredential.user.uid;

            // Guardar documento en Firestore
            await setDoc(doc(db, "usuario", uid), {
                tipo_documento: tipoDocumento,
                documento: numeroDocumento,
                nombre: nombre,
                apellido: apellido,
                email: email,
                estado: "activo",
                fecha_ingreso: serverTimestamp(),
                rol: rol,
                telefono: telefono,
                direccion: direccion
            });

            showAlert('Usuario registrado exitosamente', 'success');
        }

        closeModal();
    } catch (err) {
        console.error('Error al guardar usuario:', err);

        if (err.code === 'auth/email-already-in-use') {
            showAlert('El email ya está registrado en el sistema de autenticación', 'error');
        } else if (err.code === 'auth/weak-password') {
            showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        } else if (err.code === 'auth/invalid-email') {
            showAlert('El formato del email no es válido', 'error');
        } else {
            showAlert(`Error: ${err.message}`, 'error');
        }
    }
}

// ===================== CAMBIAR ESTADO DEL USUARIO =====================
async function toggleClientStatus(uid) {
    try {
        const docRef = doc(db, "usuario", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentStatus = docSnap.data().estado;
            const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';

            await updateDoc(docRef, {
                estado: newStatus
            });

            showAlert(`Usuario ${newStatus === 'activo' ? 'activado' : 'inactivado'} exitosamente`, 'success');
        }
    } catch (err) {
        console.error('Error al cambiar estado:', err);
        showAlert(`Error: ${err.message}`, 'error');
    }
}

// ===================== BÚSQUEDA EN TIEMPO REAL =====================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            applyFilters();
        });
        console.log('Event listener de búsqueda configurado correctamente');
    } else {
        console.error('No se encontró el elemento searchInput');
    }
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const tbody = document.getElementById('clientesList');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }

    doc.setFontSize(18);
    doc.text('Reporte de Usuarios - RRHH', 14, 15);

    doc.setFontSize(10);
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES');
    const timeStr = now.toLocaleTimeString('es-ES');
    doc.text(`Generado: ${dateStr} ${timeStr}`, 14, 22);

    const tableData = [];
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 9) {
            tableData.push([
                cells[0].textContent.trim(),
                cells[1].textContent.trim(),
                cells[2].textContent.trim(),
                cells[3].textContent.trim(),
                cells[4].textContent.trim(),
                cells[5].textContent.trim(),
                cells[6].textContent.trim(),
                cells[7].textContent.trim()
            ]);
        }
    });

    doc.autoTable({
        head: [['Tipo Doc', 'Documento', 'Nombre Completo', 'Email', 'Teléfono', 'Dirección', 'Rol', 'Estado']],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [102, 126, 234] },
        columnStyles: {
            2: { cellWidth: 40 },
            3: { cellWidth: 45 },
            5: { cellWidth: 40 }
        }
    });
    doc.save(`Usuarios_RRHH_${dateStr.replace(/\//g, '-')}.pdf`);
    showAlert('PDF generado exitosamente', 'success');
}

function exportToExcel() {
    const tbody = document.getElementById('clientesList');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }

    const excelData = [];

    excelData.push(['Tipo Doc', 'Documento', 'Nombre Completo', 'Email', 'Teléfono', 'Dirección', 'Rol', 'Estado']);

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 9) {
            excelData.push([
                cells[0].textContent.trim(),
                cells[1].textContent.trim(),
                cells[2].textContent.trim(),
                cells[3].textContent.trim(),
                cells[4].textContent.trim(),
                cells[5].textContent.trim(),
                cells[6].textContent.trim(),
                cells[7].textContent.trim()
            ]);
        }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    ws['!cols'] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 30 },
        { wch: 30 },
        { wch: 15 },
        { wch: 35 },
        { wch: 15 },
        { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios RRHH');

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(wb, `Usuarios_RRHH_${dateStr}.xlsx`);

    showAlert('Excel generado exitosamente', 'success');
}

function printTable() {
    const tbody = document.getElementById('clientesList');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0) {
        showAlert('No hay datos para imprimir', 'warning');
        return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');

    printWindow.document.write('<html><head><title>Reporte de Usuarios - RRHH</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h1 { color: #667eea; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    printWindow.document.write('th { background-color: #667eea; color: white; }');
    printWindow.document.write('tr:nth-child(even) { background-color: #f8f9fa; }');
    printWindow.document.write('.header-info { margin-bottom: 20px; color: #555; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');

    printWindow.document.write('<h1>Reporte de Usuarios - RRHH</h1>');
    const now = new Date();
    printWindow.document.write(`<div class="header-info">Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}</div>`);
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr>');
    printWindow.document.write('<th>Tipo Doc</th><th>Documento</th><th>Nombre Completo</th><th>Email</th>');
    printWindow.document.write('<th>Teléfono</th><th>Dirección</th><th>Rol</th><th>Estado</th>');
    printWindow.document.write('</tr></thead><tbody>');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 9) {
            printWindow.document.write('<tr>');
            for (let i = 0; i < 8; i++) {
                printWindow.document.write(`<td>${cells[i].textContent.trim()}</td>`);
            }
            printWindow.document.write('</tr>');
        }
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
    }, 250);
}
document.getElementById('clientModal').addEventListener('click', (e) => {
    if (e.target.id === 'clientModal') {
        closeModal();
    }
});

function showAlert(message, type = 'info') {
    alert(message);
}

// ===================== EXPONER FUNCIONES AL SCOPE GLOBAL =====================
window.logout = logout;
window.toggleMenu = toggleMenu;
window.openAddUserModal = openAddUserModal;
window.closeModal = closeModal;
window.editClient = editClient;
window.handleSaveClient = handleSaveClient;
window.toggleClientStatus = toggleClientStatus;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.generatePDF = generatePDF;
window.exportToExcel = exportToExcel;
window.printTable = printTable;

document.addEventListener('DOMContentLoaded', () => {
    // loadUserInfo removed - sidebar component handles user info
    renderClientsTable();
    setupSearch();
});

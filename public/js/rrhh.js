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
let editingId = null;
let allUsers = []; // Almacenar todos los usuarios para filtrado

function logout() {
    localStorage.removeItem('textileflow_session');
    window.location.href = './login.html';
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

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

function renderClientsTable() {
    const tbody = document.getElementById('clientesList');

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

    // Validar documento
    if (window.validateDocument) {
        const docValidation = window.validateDocument(tipoDocumento, numeroDocumento);
        if (!docValidation.valid) {
            window.showFieldError('numeroDocumento', docValidation.message);
            return;
        }
    }

    // Validar teléfono
    if (window.validatePhone && telefono) {
        const phoneValidation = window.validatePhone(telefono);
        if (!phoneValidation.valid) {
            window.showFieldError('telefono', phoneValidation.message);
            return;
        }
    }

    window.clearAllErrors && window.clearAllErrors();

    try {
        if (editingId) {
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
            const userData = docSnap.data();
            const userName = userData.displayName || `${userData.nombre || ''} ${userData.apellido || ''}`.trim();

            // Confirmación antes de inactivar
            if (newStatus === 'inactivo') {
                const fechaSalida = new Date().toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const confirmed = confirm(
                    `¿Está seguro de inactivar a ${userName}?\n\n` +
                    `Se registrará la fecha de salida como: ${fechaSalida}`
                );

                if (!confirmed) {
                    return;
                }
            }


            const updateData = {
                estado: newStatus
            };

            await updateDoc(docRef, updateData);

            // Si se está inactivando/reactivando, actualizar fechaSalida en usuario_admin
            try {
                const adminDocRef = doc(db, "usuario_admin", uid);
                const adminDoc = await getDoc(adminDocRef);

                if (adminDoc.exists()) {
                    if (newStatus === 'inactivo') {
                        const today = new Date().toISOString().split('T')[0];
                        await updateDoc(adminDocRef, { fechaSalida: today });
                    } else {
                        await updateDoc(adminDocRef, { fechaSalida: null });
                    }
                }
            } catch (adminErr) {
                console.warn('No se pudo actualizar fechaSalida en usuario_admin:', adminErr);
            }

            showAlert(`Usuario ${newStatus === 'activo' ? 'activado' : 'inactivado'} exitosamente`, 'success');

            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'tab-empleados') {
                renderEmpleadosTablePlanilla();
            } else if (activeTab && activeTab.id === 'tab-clientes') {
                renderClientsTableClientes();
            } else {
                renderClientsTable();
            }
        }
    } catch (err) {
        console.error('Error al cambiar estado:', err);
        showAlert(`Error: ${err.message}`, 'error');
    }
}

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

function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    if (tabName === 'clientes') {
        renderClientsTableClientes();
    } else if (tabName === 'empleados') {
        renderEmpleadosTablePlanilla();
    }
}

let allClients = [];

async function renderClientsTableClientes() {
    try {
        const querySnapshot = await getDocs(collection(db, "usuario"));
        allClients = [];

        querySnapshot.forEach((doc) => {
            const user = doc.data();
            // Solo incluir usuarios con rol "Cliente"
            if (user.rol === 'Cliente') {
                allClients.push({ uid: doc.id, ...user });
            }
        });

        displayClientsTable(allClients);
    } catch (error) {
        console.error("Error al cargar clientes:", error);
        showAlert("Error al cargar la lista de clientes", "error");
    }
}

function displayClientsTable(clients) {
    const tbody = document.getElementById('clientesListClientes');
    tbody.innerHTML = '';

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron clientes</td></tr>';
        return;
    }

    clients.forEach(client => {
        const tr = document.createElement('tr');
        const estadoClass = client.estado === 'activo' ? 'status-active' : 'status-inactive';
        const estadoText = client.estado === 'activo' ? 'Activo' : 'Inactivo';
        const estadoIcon = client.estado === 'activo' ? 'fa-check-circle' : 'fa-times-circle';

        tr.innerHTML = `
            <td>${client.tipo_documento || '-'}</td>
            <td>${client.documento || '-'}</td>
            <td>${client.displayName || `${client.nombre || ''} ${client.apellido || ''}`.trim() || '-'}</td>
            <td>${client.email || '-'}</td>
            <td>${client.telefono || '-'}</td>
            <td>${client.direccion || '-'}</td>
            <td><span class="status-badge ${estadoClass}"><i class="fas ${estadoIcon}"></i> ${estadoText}</span></td>
            <td>
                <button class="btn-icon" onclick="editClientCliente('${client.uid}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon ${client.estado === 'activo' ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleClientStatusCliente('${client.uid}')" 
                        title="${client.estado === 'activo' ? 'Desactivar' : 'Activar'}">
                    <i class="fas ${client.estado === 'activo' ? 'fa-ban' : 'fa-check'}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFiltersClientes() {
    const searchTerm = document.getElementById('searchInputClientes').value.toLowerCase();
    const filterTipoDoc = document.getElementById('filterTipoDocClientes').value;
    const filterEstado = document.getElementById('filterEstadoClientes').value;

    const filtered = allClients.filter(client => {
        const matchesSearch = !searchTerm ||
            (client.documento && client.documento.toLowerCase().includes(searchTerm)) ||
            (client.displayName && client.displayName.toLowerCase().includes(searchTerm)) ||
            (client.nombre && client.nombre.toLowerCase().includes(searchTerm)) ||
            (client.apellido && client.apellido.toLowerCase().includes(searchTerm)) ||
            (client.email && client.email.toLowerCase().includes(searchTerm));

        const matchesTipoDoc = !filterTipoDoc || client.tipo_documento === filterTipoDoc;
        const matchesEstado = !filterEstado || client.estado === filterEstado;

        return matchesSearch && matchesTipoDoc && matchesEstado;
    });

    displayClientsTable(filtered);
}

function clearFiltersClientes() {
    document.getElementById('searchInputClientes').value = '';
    document.getElementById('filterTipoDocClientes').value = '';
    document.getElementById('filterEstadoClientes').value = '';
    displayClientsTable(allClients);
}


function editClientCliente(uid) {
    // Reutilizar la función existente editClient
    editClient(uid);
}

async function toggleClientStatusCliente(uid) {
    await toggleClientStatus(uid);
    await renderClientsTableClientes();
}

function openAddClientModal() {
    openAddUserModal();
    document.getElementById('rol').value = 'Cliente';
}

// ===================== EXPORTAR FUNCIONES PARA CLIENTES =====================
function generatePDFClientes() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Lista de Clientes', 14, 22);

    const tableData = allClients.map(client => [
        client.tipo_documento || '-',
        client.documento || '-',
        client.displayName || `${client.nombre || ''} ${client.apellido || ''}`.trim() || '-',
        client.email || '-',
        client.telefono || '-',
        client.direccion || '-',
        client.estado === 'activo' ? 'Activo' : 'Inactivo'
    ]);

    doc.autoTable({
        head: [['Tipo Doc', 'Documento', 'Nombre', 'Email', 'Teléfono', 'Dirección', 'Estado']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save('clientes.pdf');
}

function exportToExcelClientes() {
    const data = allClients.map(client => ({
        'Tipo Doc': client.tipo_documento || '-',
        'Documento': client.documento || '-',
        'Nombre Completo': client.displayName || `${client.nombre || ''} ${client.apellido || ''}`.trim() || '-',
        'Email': client.email || '-',
        'Teléfono': client.telefono || '-',
        'Dirección': client.direccion || '-',
        'Estado': client.estado === 'activo' ? 'Activo' : 'Inactivo'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'clientes.xlsx');
}

function printTableClientes() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Lista de Clientes</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    printWindow.document.write('th { background-color: #667eea; color: white; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h2>Lista de Clientes</h2>');
    printWindow.document.write(document.getElementById('clientesTableClientes').outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function setupSearchClientes() {
    const searchInput = document.getElementById('searchInputClientes');
    if (searchInput) {
        searchInput.addEventListener('input', applyFiltersClientes);
    }
}

let allEmpleados = [];

async function renderEmpleadosTablePlanilla() {
    try {
        window.showLoading && window.showLoading();

        const usuariosSnapshot = await getDocs(collection(db, "usuario"));
        allEmpleados = [];

        for (const userDoc of usuariosSnapshot.docs) {
            const user = userDoc.data();
            if (user.rol === 'Empleado') {
                const empleado = { uid: userDoc.id, ...user };

                try {
                    const adminDocRef = doc(db, "usuario_admin", userDoc.id);
                    const adminDoc = await getDoc(adminDocRef);
                    if (adminDoc.exists()) {
                        const adminData = adminDoc.data();
                        empleado.salario = adminData.salario || 0;
                        empleado.fechaIngreso = adminData.fechaIngreso || null;
                        empleado.fechaSalida = adminData.fechaSalida || null;
                    } else {
                        empleado.salario = 0;
                        empleado.fechaIngreso = null;
                        empleado.fechaSalida = null;
                    }
                } catch (error) {
                    console.warn(`No se pudo obtener datos de usuario_admin para ${userDoc.id}:`, error);
                    empleado.salario = 0;
                    empleado.fechaIngreso = null;
                    empleado.fechaSalida = null;
                }

                allEmpleados.push(empleado);
            }
        }

        allEmpleados.sort((a, b) => {
            const fechaA = a.fechaIngreso || '1900-01-01';
            const fechaB = b.fechaIngreso || '1900-01-01';
            return fechaB.localeCompare(fechaA);
        });

        displayEmpleadosTable(allEmpleados);
    } catch (error) {
        console.error("Error al cargar empleados:", error);
        showAlert("Error al cargar la lista de empleados", "error");
    } finally {
        window.hideLoading && window.hideLoading();
    }
}

function displayEmpleadosTable(empleados) {
    const tbody = document.getElementById('empleadosListPlanilla');
    tbody.innerHTML = '';

    if (empleados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No se encontraron empleados</td></tr>';
        return;
    }

    empleados.forEach(emp => {
        const tr = document.createElement('tr');

        const salarioFormateado = emp.salario
            ? `S/. ${parseFloat(emp.salario).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'S/. 0.00';

        const fechaIngreso = emp.fechaIngreso
            ? new Date(emp.fechaIngreso).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
            : '-';

        // Calcular antigüedad
        const antiguedad = window.calcularAntiguedad ? window.calcularAntiguedad(emp.fechaIngreso) : '-';

        // Formatear fecha de salida
        const fechaSalida = emp.fechaSalida
            ? new Date(emp.fechaSalida).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
            : 'Sin fecha de salida';

        // Formatear estado (sin incluir fecha de salida aquí)
        let estadoHTML = '';
        if (emp.estado === 'activo') {
            estadoHTML = '<span class="status-badge status-active"><i class="fas fa-check-circle"></i> Activo</span>';
        } else {
            estadoHTML = '<span class="status-badge status-inactive"><i class="fas fa-times-circle"></i> Inactivo</span>';
        }

        if (emp.estado !== 'activo') {
            tr.classList.add('inactive-row');
        }

        tr.innerHTML = `
            <td>${emp.displayName || `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || '-'}</td>
            <td>${emp.telefono || '-'}</td>
            <td>${emp.email || '-'}</td>
            <td>${fechaIngreso}</td>
            <td style="font-style: italic; color: #6b7280;">${antiguedad}</td>
            <td style="font-weight: 600; color: #10b981;">${salarioFormateado}</td>
            <td>${estadoHTML}</td>
            <td>${fechaSalida}</td>
            <td>
                <button class="btn-icon" onclick="window.editEmpleadoPlanilla('${emp.uid}')" title="Ver Detalles">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFiltersEmpleados() {
    const searchTerm = document.getElementById('searchInputEmpleados').value.toLowerCase();
    const filterEstado = document.getElementById('filterEstadoEmpleados').value;
    const minSalario = parseFloat(document.getElementById('minSalario')?.value) || 0;
    const maxSalario = parseFloat(document.getElementById('maxSalario')?.value) || Infinity;

    const filtered = allEmpleados.filter(emp => {
        const matchesSearch = !searchTerm ||
            (emp.displayName && emp.displayName.toLowerCase().includes(searchTerm)) ||
            (emp.nombre && emp.nombre.toLowerCase().includes(searchTerm)) ||
            (emp.apellido && emp.apellido.toLowerCase().includes(searchTerm)) ||
            (emp.email && emp.email.toLowerCase().includes(searchTerm)) ||
            (emp.telefono && emp.telefono.toLowerCase().includes(searchTerm));

        const matchesEstado = !filterEstado || emp.estado === filterEstado;

        // Filtro de rango de salario
        const salario = parseFloat(emp.salario) || 0;
        const matchesSalario = salario >= minSalario && salario <= maxSalario;

        return matchesSearch && matchesEstado && matchesSalario;
    });

    displayEmpleadosTable(filtered);
}

function clearFiltersEmpleados() {
    document.getElementById('searchInputEmpleados').value = '';
    document.getElementById('filterEstadoEmpleados').value = '';
    document.getElementById('minSalario').value = '';
    document.getElementById('maxSalario').value = '';
    displayEmpleadosTable(allEmpleados);
}

function editEmpleadoPlanilla(uid) {
    switchTab('usuarios');
    setTimeout(() => {
        editClient(uid);
    }, 300);
}

function generatePDFEmpleados() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // Título
    doc.setFontSize(18);
    doc.text('Planilla de Empleados', 14, 22);

    // Información de filtros aplicados
    doc.setFontSize(10);
    const filterStatus = document.getElementById('filterEstadoEmpleados')?.value;
    let startYOffset = 0;
    if (filterStatus && filterStatus !== '') {
        const filterText = filterStatus === 'activo' ? 'Activos' : 'Inactivos';
        doc.text(`Filtro aplicado: ${filterText}`, 14, 28);
        startYOffset = 4;
    }

    const tableData = allEmpleados.map(emp => [
        emp.displayName || `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || '-',
        emp.telefono || '-',
        emp.email || '-',
        emp.fechaIngreso
            ? new Date(emp.fechaIngreso).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
            : '-',
        emp.salario
            ? `S/. ${parseFloat(emp.salario).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
            : 'S/. 0.00',
        emp.estado === 'activo' ? 'Activo' : 'Inactivo',
        emp.fechaSalida
            ? new Date(emp.fechaSalida).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
            : 'Sin fecha de salida'
    ]);

    // Calcular totales
    const totalSalario = allEmpleados.reduce((sum, emp) => sum + (parseFloat(emp.salario) || 0), 0);
    const empleadosActivos = allEmpleados.filter(emp => emp.estado === 'activo').length;
    const empleadosInactivos = allEmpleados.filter(emp => emp.estado === 'inactivo').length;

    // Generar tabla
    doc.autoTable({
        head: [['Nombre', 'Teléfono', 'Email', 'Fecha Ingreso', 'Salario', 'Estado', 'Fecha Salida']],
        body: tableData,
        startY: 30 + startYOffset,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [102, 126, 234] },
        columnStyles: {
            4: { halign: 'right' }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen de Planilla:', 14, finalY);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total de empleados: ${allEmpleados.length}`, 14, finalY + 6);
    doc.text(`Empleados activos: ${empleadosActivos}`, 14, finalY + 12);
    doc.text(`Empleados inactivos: ${empleadosInactivos}`, 14, finalY + 18);

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    const totalFormateado = `S/. ${totalSalario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(`Total de Planilla: ${totalFormateado}`, 14, finalY + 26);

    doc.save('planilla_empleados.pdf');
}

function exportToExcelEmpleados() {
    // Información de filtros
    const filterStatus = document.getElementById('filterEstadoEmpleados')?.value;
    const filterInfo = [];

    if (filterStatus && filterStatus !== '') {
        const filterText = filterStatus === 'activo' ? 'Activos' : 'Inactivos';
        filterInfo.push({ 'Planilla de Empleados': `Filtro aplicado: ${filterText}` });
        filterInfo.push({});
    }

    // Datos de empleados
    const data = allEmpleados.map(emp => ({
        'Nombre Completo': emp.displayName || `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || '-',
        'Teléfono': emp.telefono || '-',
        'Email': emp.email || '-',
        'Fecha de Ingreso': emp.fechaIngreso
            ? new Date(emp.fechaIngreso).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
            : '-',
        'Salario': emp.salario
            ? parseFloat(emp.salario).toFixed(2)
            : '0.00',
        'Estado': emp.estado === 'activo' ? 'Activo' : 'Inactivo',
        'Fecha de Salida': emp.fechaSalida
            ? new Date(emp.fechaSalida).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
            : 'Sin fecha de salida'
    }));

    // Calcular totales
    const totalSalario = allEmpleados.reduce((sum, emp) => sum + (parseFloat(emp.salario) || 0), 0);
    const empleadosActivos = allEmpleados.filter(emp => emp.estado === 'activo').length;
    const empleadosInactivos = allEmpleados.filter(emp => emp.estado === 'inactivo').length;

    data.push({});
    data.push({ 'Nombre Completo': 'RESUMEN DE PLANILLA' });
    data.push({ 'Nombre Completo': 'Total de empleados:', 'Teléfono': allEmpleados.length });
    data.push({ 'Nombre Completo': 'Empleados activos:', 'Teléfono': empleadosActivos });
    data.push({ 'Nombre Completo': 'Empleados inactivos:', 'Teléfono': empleadosInactivos });
    data.push({ 'Nombre Completo': 'TOTAL DE PLANILLA:', 'Salario': totalSalario.toFixed(2) });

    // Combinar filtros y datos
    const finalData = [...filterInfo, ...data];

    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
    XLSX.writeFile(wb, 'planilla_empleados.xlsx');
}

function printTableEmpleados() {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Planilla de Empleados</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }');
    printWindow.document.write('th { background-color: #667eea; color: white; }');
    printWindow.document.write('.inactive-row { background-color: #fee; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h2>Planilla de Empleados</h2>');
    printWindow.document.write('<p>Fecha: ' + new Date().toLocaleDateString('es-PE') + '</p>');
    printWindow.document.write(document.getElementById('empleadosTablePlanilla').outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function setupSearchEmpleados() {
    const searchInput = document.getElementById('searchInputEmpleados');
    if (searchInput) {
        searchInput.addEventListener('input', applyFiltersEmpleados);
    }
}

window.logout = logout;
window.toggleMenu = toggleMenu;
window.switchTab = switchTab;
window.openAddUserModal = openAddUserModal;
window.openAddClientModal = openAddClientModal;
window.closeModal = closeModal;
window.editClient = editClient;
window.editClientCliente = editClientCliente;
window.editEmpleadoPlanilla = editEmpleadoPlanilla;
window.handleSaveClient = handleSaveClient;
window.toggleClientStatus = toggleClientStatus;
window.toggleClientStatusCliente = toggleClientStatusCliente;
window.applyFilters = applyFilters;
window.applyFiltersClientes = applyFiltersClientes;
window.clearFilters = clearFilters;
window.clearFiltersClientes = clearFiltersClientes;
window.applyFiltersEmpleados = applyFiltersEmpleados;
window.clearFiltersEmpleados = clearFiltersEmpleados;
window.generatePDF = generatePDF;
window.generatePDFClientes = generatePDFClientes;
window.exportToExcel = exportToExcel;
window.exportToExcelClientes = exportToExcelClientes;
window.printTable = printTable;
window.printTableClientes = printTableClientes;
window.generatePDFEmpleados = generatePDFEmpleados;
window.exportToExcelEmpleados = exportToExcelEmpleados;
window.printTableEmpleados = printTableEmpleados;

document.addEventListener('DOMContentLoaded', () => {
    renderClientsTable();
    setupSearch();
    setupSearchClientes();
    setupSearchEmpleados();
});

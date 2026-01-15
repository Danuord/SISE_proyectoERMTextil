import { requireAuth, getCurrentUser } from '../../components/auth-guard.js';
import { getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

requireAuth();
const currentUser = getCurrentUser();

const firebaseConfig = {
    apiKey: "AIzaSyDRTKsoZ9Zzh1oo-DQtlxnZ4Pw6RWBv08c",
    authDomain: "textileflow-test.firebaseapp.com",
    projectId: "textileflow-test",
    storageBucket: "textileflow-test.firebasestorage.app",
    messagingSenderId: "227349652064",
    appId: "1:227349652064:web:d32994273a529a07e25905"
};

let app;
try {
    app = getApp('dashboard-app');
} catch (error) {
    app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Configurar persistencia
setPersistence(auth, browserLocalPersistence).then(() => {
    console.log("Persistencia configurada en admin-profile");
}).catch((error) => {
    console.error("Error configurando persistencia:", error);
});


// Listener para detectar cambios en el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("onAuthStateChanged - Usuario detectado:", user.email);
    } else {
        console.log("onAuthStateChanged - No hay usuario autenticado");
    }
});

// Esperar a que Firebase Auth restaure la sesión
setTimeout(() => {
    console.log("auth.currentUser después de 1 segundo:", auth.currentUser);
}, 1000);

// Cargar datos del perfil
async function loadProfile() {
    if (!currentUser) return;

    try {
        const userDoc = await getDoc(doc(db, "usuario", currentUser.uid));

        if (userDoc.exists()) {
            const data = userDoc.data();

            document.getElementById('nombre').value = data.nombre || '';
            document.getElementById('apellido').value = data.apellido || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('telefono').value = data.telefono || '';
            document.getElementById('direccion').value = data.direccion || '';
            document.getElementById('rol').value = data.rol || '';
            document.getElementById('dni').value = data.documento || '';

            const fullName = `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Usuario';
            document.getElementById('profileName').textContent = fullName;
            document.getElementById('profileRole').textContent = data.rol || 'Empleado';
        }
    } catch (error) {
        console.error("Error al cargar perfil:", error);
        showNotification("Error al cargar perfil", "error");
    }
}

// Guardar cambios del perfil
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const direccion = document.getElementById('direccion').value;

        try {
            await updateDoc(doc(db, "usuario", currentUser.uid), {
                nombre,
                apellido,
                email,
                telefono,
                direccion,
                displayName: `${nombre} ${apellido}`
            });

            // Actualizar localStorage
            const session = JSON.parse(localStorage.getItem('textileflow_session'));
            session.nombre = nombre;
            session.apellido = apellido;
            session.displayName = `${nombre} ${apellido}`;
            localStorage.setItem('textileflow_session', JSON.stringify(session));

            showNotification("Perfil actualizado correctamente", "success");
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            showNotification(`Error: ${error.message}`, "error");
        }
    });
}

// Cambiar contraseña
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showNotification("Las contraseñas no coinciden", "error");
            return;
        }

        if (newPassword.length < 6) {
            showNotification("La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }

        try {

            const user = auth.currentUser;

            if (!user) {
                console.error("auth.currentUser es NULL");
                console.log("Esto significa que Firebase Auth no tiene sesión activa");
                console.log("Verifica que hayas iniciado sesión recientemente");
                showNotification("Debes cerrar sesión y volver a iniciar sesión para cambiar tu contraseña", "error");
                return;
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            showNotification("Contraseña actualizada correctamente", "success");
            passwordForm.reset();
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            if (error.code === 'auth/wrong-password') {
                showNotification("Contraseña actual incorrecta", "error");
            } else {
                showNotification(`Error: ${error.message}`, "error");
            }
        }
    });
}

function showNotification(message, type = "info") {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

document.addEventListener('DOMContentLoaded', loadProfile);

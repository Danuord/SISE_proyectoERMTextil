// ===================== EMPLOYEE PROFILE =====================
import { requireAuth, getCurrentUser } from '../../components/auth-guard.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Cargar datos del perfil
async function loadProfile() {
    if (!currentUser) return;

    try {
        const userDoc = await getDoc(doc(db, "usuario", currentUser.uid));

        if (userDoc.exists()) {
            const data = userDoc.data();

            // Actualizar campos del formulario
            document.getElementById('nombre').value = data.nombre || '';
            document.getElementById('apellido').value = data.apellido || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('telefono').value = data.telefono || '';
            document.getElementById('direccion').value = data.direccion || '';
            document.getElementById('rol').value = data.rol || '';
            document.getElementById('fechaContratacion').value = data.fechaContratacion || '';

            // Actualizar header del perfil
            const fullName = `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Usuario';
            document.getElementById('profileName').textContent = fullName;
            document.getElementById('profileRole').textContent = data.rol || 'Empleado';
        }
    } catch (error) {
        console.error("Error al cargar perfil:", error);
        showToast("Error al cargar perfil", "error");
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

            showToast("✅ Perfil actualizado correctamente", "success");
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            showToast(`❌ Error: ${error.message}`, "error");
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
            showToast("❌ Las contraseñas no coinciden", "error");
            return;
        }

        if (newPassword.length < 6) {
            showToast("❌ La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }

        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            showToast("✅ Contraseña actualizada correctamente", "success");
            passwordForm.reset();
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            if (error.code === 'auth/wrong-password') {
                showToast("❌ Contraseña actual incorrecta", "error");
            } else {
                showToast(`❌ Error: ${error.message}`, "error");
            }
        }
    });
}

function showToast(message, type = "info") {
    const toast = document.getElementById("statusMessage");
    if (!toast) {
        console.log(message);
        return;
    }

    toast.className = `status-message show ${type}`;
    toast.textContent = message;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

window.toggleMenu = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

document.addEventListener('DOMContentLoaded', loadProfile);

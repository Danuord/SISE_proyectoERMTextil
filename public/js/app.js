import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";


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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase inicializado correctamente!");



async function handleLogin(e) {
    e.preventDefault();

    const form = document.getElementById('loginForm');
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    const alertContainer = document.getElementById('alertContainer');

    alertContainer.innerHTML = '';

    try {
        console.log('Iniciando login con:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('Usuario autenticado:', user.uid);

        // Obtener datos del usuario desde Firestore
        let userData = null;
        try {
            console.log('Buscando datos en Firestore (colección: usuario)...');
            const userDoc = await getDoc(doc(db, 'usuario', user.uid));

            if (userDoc.exists()) {
                const firestoreData = userDoc.data();
                console.log('Datos encontrados:', firestoreData);

                userData = {
                    uid: user.uid,
                    email: user.email,
                    nombre: firestoreData.nombre || '',
                    apellido: firestoreData.apellido || '',
                    displayName: firestoreData.nombre
                        ? `${firestoreData.nombre} ${firestoreData.apellido || ''}`.trim()
                        : user.email,
                    rol: firestoreData.rol || 'Empleado',
                    ...firestoreData
                };
            } else {
                console.warn('No se encontró documento en Firestore');
                userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.email,
                    rol: 'Empleado'
                };
            }
        } catch (e) {
            console.error('Error al obtener datos de Firestore:', e);
            userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.email,
                rol: 'Empleado'
            };
        }

        // Guardar sesión en localStorage
        const sessionData = {
            uid: userData.uid,
            email: userData.email,
            nombre: userData.nombre || '',
            apellido: userData.apellido || '',
            displayName: userData.displayName,
            rol: userData.rol,
            timestamp: Date.now()
        };

        console.log('Guardando sesión:', sessionData);
        localStorage.setItem('textileflow_session', JSON.stringify(sessionData));
        console.log('Sesión guardada correctamente');

        alert("¡Inicio de sesión exitoso!");

        window.location.href = "/pages/dashboard.html";

    } catch (error) {
        console.error("Código de error:", error.code);

        let message = "Credenciales incorrectas. Vuelve a intentarlo.";

        switch (error.code) {
            case "auth/invalid-email":
                message = "El formato del correo no es válido.";
                break;
            case "auth/user-not-found":
                message = "No existe una cuenta con este correo.";
                break;
            case "auth/wrong-password":
                message = "La contraseña es incorrecta.";
                break;
            case "auth/too-many-requests":
                message = "Demasiados intentos fallidos. Inténtalo más tarde.";
                break;
        }

        alertContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
}


document.getElementById("loginForm").addEventListener("submit", handleLogin);



const resetModal = document.getElementById("resetModal");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const closeResetModal = document.getElementById("closeResetModal");
const resetForm = document.getElementById("resetForm");

forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("→ Click detectado en 'Olvidaste tu contraseña'");
    resetModal.style.display = "flex";
});

closeResetModal.addEventListener("click", () => {
    resetModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === resetModal) {
        resetModal.style.display = "none";
    }
});

resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("resetEmail").value.trim();

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Se envió un enlace de recuperación a tu correo.");
        resetModal.style.display = "none";
        resetForm.reset();
    } catch (error) {
        console.error("Error al enviar el correo:", error.code);

        let message = "Ocurrió un error. Inténtalo nuevamente.";

        if (error.code === "auth/user-not-found") {
            message = "No existe una cuenta con ese correo.";
        }

        alert(message);
    }
});


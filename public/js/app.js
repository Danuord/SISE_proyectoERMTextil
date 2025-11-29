// ===============================
//  IMPORTS DE FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";


// ===============================
//  CONFIGURACIÓN DE FIREBASE
// ===============================
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

console.log("Firebase inicializado correctamente!");


// ===============================
//  FUNCIÓN DE LOGIN
// ===============================
async function handleLogin(e) {
    e.preventDefault();

    const form = document.getElementById('loginForm');
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    const alertContainer = document.getElementById('alertContainer');

    alertContainer.innerHTML = '';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

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


// ===============================
//  EVENT LISTENER LOGIN
// ===============================
document.getElementById("loginForm").addEventListener("submit", handleLogin);


// ===============================
//  MODAL RECUPERAR CONTRASEÑA
// ===============================

// Elementos
const resetModal = document.getElementById("resetModal");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const closeResetModal = document.getElementById("closeResetModal");
const resetForm = document.getElementById("resetForm");

// Abrir modal
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("→ Click detectado en 'Olvidaste tu contraseña'");
    resetModal.style.display = "flex";
});

// Cerrar modal
closeResetModal.addEventListener("click", () => {
    resetModal.style.display = "none";
});

// Cerrar haciendo clic fuera
window.addEventListener("click", (e) => {
    if (e.target === resetModal) {
        resetModal.style.display = "none";
    }
});

// Enviar email de recuperación
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


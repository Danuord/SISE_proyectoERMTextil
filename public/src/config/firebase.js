import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  console.log("🔧 Usando Firebase Emulators");
  
  try {
    if (typeof db !== 'undefined') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log("✓ Auth Emulator conectado");
    }
  } catch (e) {
    if (e.code !== 'auth/emulator-config-failed') {
      console.warn("Auth Emulator ya está conectado o error:", e);
    }
  }
  
  try {
    if (typeof db !== 'undefined') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log("✓ Firestore Emulator conectado");
    }
  } catch (e) {
    if (e.code !== 'failed-precondition') {
      console.warn("Firestore Emulator ya está conectado o error:", e);
    }
  }
} else {
  console.log("✓ Usando Firebase Cloud");
}

console.log("Firebase inicializado correctamente!");

export default app;

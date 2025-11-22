
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("Firebase inicializado correctamente!");

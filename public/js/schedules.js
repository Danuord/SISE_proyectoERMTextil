// ===================== GESTIÓN DE HORARIOS =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
const db = getFirestore(app);

let currentUser = null;
const session = localStorage.getItem('textileflow_session');
if (session) {
    currentUser = JSON.parse(session);
}

// ===================== CARGAR HORARIOS AL INICIAR =====================
document.addEventListener("DOMContentLoaded", async () => {

    await loadDefaultSchedule();
    await loadCustomSchedulesList();
    setupScheduleEventListeners();

});

// ===================== CARGAR HORARIO POR DEFECTO =====================
async function loadDefaultSchedule() {
    try {
        const scheduleDoc = await getDoc(doc(db, "configuracion", "horario_defecto"));

        if (scheduleDoc.exists()) {
            const data = scheduleDoc.data();
            document.getElementById('defaultEntry').value = data.entrada || "08:00";
            document.getElementById('defaultExit').value = data.salida || "17:00";
            document.getElementById('defaultTolerance').value = data.tolerancia || 15;

        } else {
            console.log("No hay horario por defecto configurado, usando valores predeterminados");
        }
    } catch (error) {
        console.error("Error al cargar horario por defecto:", error);
    }
}

// ===================== GUARDAR HORARIO POR DEFECTO =====================
async function saveDefaultSchedule(e) {
    e.preventDefault();

    const entrada = document.getElementById('defaultEntry').value;
    const salida = document.getElementById('defaultExit').value;
    const tolerancia = parseInt(document.getElementById('defaultTolerance').value);

    try {
        await setDoc(doc(db, "configuracion", "horario_defecto"), {
            entrada,
            salida,
            tolerancia,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || 'unknown'
        });

        showToast("Horario por defecto guardado correctamente", "success");
    } catch (error) {
        console.error("Error al guardar horario por defecto:", error);
        showToast(`Error: ${error.message}`, "error");
    }
}

// ===================== CARGAR LISTA DE HORARIOS PERSONALIZADOS =====================
async function loadCustomSchedulesList() {
    const container = document.getElementById('customSchedulesList');
    if (!container) return;

    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasNombres = {
        'lunes': 'Lunes',
        'martes': 'Martes',
        'miercoles': 'Miércoles',
        'jueves': 'Jueves',
        'viernes': 'Viernes',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
    };

    container.innerHTML = '<h4 style="margin-bottom: 15px; font-size: 1rem; color: #374151;">Horarios Configurados</h4>';

    let hasSchedules = false;

    for (const dia of dias) {
        try {
            const scheduleDoc = await getDoc(doc(db, "configuracion", `horario_${dia}`));

            if (scheduleDoc.exists()) {
                hasSchedules = true;
                const data = scheduleDoc.data();

                const scheduleItem = document.createElement('div');
                scheduleItem.style.cssText = 'background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;';

                scheduleItem.innerHTML = `
                    <div>
                        <strong style="color: #667eea;">${diasNombres[dia]}</strong><br>
                        <span style="font-size: 0.85rem; color: #6b7280;">
                            ${data.entrada} - ${data.salida} (Tolerancia: ${data.tolerancia} min)
                        </span>
                    </div>
                    <button class="btn-action btn-edit" onclick="editCustomSchedule('${dia}')">
                        <i class="fas fa-edit"></i>
                    </button>
                `;

                container.appendChild(scheduleItem);
            }
        } catch (error) {
            console.error(` Error al cargar horario de ${dia}:`, error);
        }
    }

    if (!hasSchedules) {
        container.innerHTML += '<p style="color: #999; font-size: 0.9rem; text-align: center; padding: 20px;">No hay horarios personalizados configurados</p>';
    }
}

// ===================== EDITAR HORARIO PERSONALIZADO =====================
window.editCustomSchedule = async function (dia) {
    const select = document.getElementById('customDaySelect');
    select.value = dia;

    // Trigger change event
    const event = new Event('change');
    select.dispatchEvent(event);
};

// ===================== GUARDAR HORARIO PERSONALIZADO =====================
async function saveCustomSchedule(e) {
    e.preventDefault();

    const dia = document.getElementById('customDaySelect').value;
    if (!dia) {
        showToast("Selecciona un día", "error");
        return;
    }

    const entrada = document.getElementById('customEntry').value;
    const salida = document.getElementById('customExit').value;
    const tolerancia = parseInt(document.getElementById('customTolerance').value);

    try {
        await setDoc(doc(db, "configuracion", `horario_${dia}`), {
            dia,
            entrada,
            salida,
            tolerancia,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || 'unknown'
        });

        showToast(`Horario de ${dia} guardado correctamente`, "success");

        await loadCustomSchedulesList();
    } catch (error) {
        console.error(`Error al guardar horario de ${dia}:`, error);
        showToast(`Error: ${error.message}`, "error");
    }
}

// ===================== ELIMINAR HORARIO PERSONALIZADO =====================
window.deleteCustomSchedule = async function () {
    const dia = document.getElementById('customDaySelect').value;
    if (!dia) {
        showToast("Selecciona un día", "error");
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar el horario de ${dia}?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "configuracion", `horario_${dia}`));

        showToast(`Horario de ${dia} eliminado`, "success");

        // Reset form
        document.getElementById('customScheduleForm').style.display = 'none';
        document.getElementById('customDaySelect').value = '';

        await loadCustomSchedulesList();
    } catch (error) {
        showToast(`Error: ${error.message}`, "error");
    }
};

// ===================== SETUP EVENT LISTENERS =====================
function setupScheduleEventListeners() {
    // Form de horario por defecto
    const defaultForm = document.getElementById('defaultScheduleForm');
    if (defaultForm) {
        defaultForm.addEventListener('submit', saveDefaultSchedule);
    }

    // Form de horario personalizado
    const customForm = document.getElementById('customScheduleForm');
    if (customForm) {
        customForm.addEventListener('submit', saveCustomSchedule);
    }

    // Select de día personalizado
    const daySelect = document.getElementById('customDaySelect');
    if (daySelect) {
        daySelect.addEventListener('change', async (e) => {
            const dia = e.target.value;
            const form = document.getElementById('customScheduleForm');

            if (!dia) {
                form.style.display = 'none';
                return;
            }

            form.style.display = 'block';

            // Cargar horario existente si hay
            try {
                const scheduleDoc = await getDoc(doc(db, "configuracion", `horario_${dia}`));

                if (scheduleDoc.exists()) {
                    const data = scheduleDoc.data();
                    document.getElementById('customEntry').value = data.entrada;
                    document.getElementById('customExit').value = data.salida;
                    document.getElementById('customTolerance').value = data.tolerancia;
                } else {
                    // Usar valores por defecto
                    const defaultDoc = await getDoc(doc(db, "configuracion", "horario_defecto"));
                    if (defaultDoc.exists()) {
                        const defaultData = defaultDoc.data();
                        document.getElementById('customEntry').value = defaultData.entrada || "08:00";
                        document.getElementById('customExit').value = defaultData.salida || "17:00";
                        document.getElementById('customTolerance').value = defaultData.tolerancia || 15;
                    } else {
                        document.getElementById('customEntry').value = "08:00";
                        document.getElementById('customExit').value = "17:00";
                        document.getElementById('customTolerance').value = 15;
                    }
                }
            } catch (error) {
                console.error(`Error al cargar horario de ${dia}:`, error);
            }
        });
    }
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

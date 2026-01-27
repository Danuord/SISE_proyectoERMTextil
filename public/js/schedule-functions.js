// ===================== FUNCIONES DE HORARIOS DINÁMICOS =====================

// Cargar horario por defecto desde Firestore
async function loadDefaultSchedule() {
    try {
        const docRef = doc(db, "configuracion", "horario_default");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            defaultSchedule = docSnap.data();
        } else {
            // Crear horario por defecto si no existe
            await setDoc(docRef, defaultSchedule);
        }

        // Actualizar formulario si existe
        const defaultEntryInput = document.getElementById('defaultEntry');
        const defaultExitInput = document.getElementById('defaultExit');
        const defaultToleranceInput = document.getElementById('defaultTolerance');

        if (defaultEntryInput) defaultEntryInput.value = defaultSchedule.horaEntrada;
        if (defaultExitInput) defaultExitInput.value = defaultSchedule.horaSalida;
        if (defaultToleranceInput) defaultToleranceInput.value = defaultSchedule.tolerancia;

    } catch (error) {
        console.error("Error al cargar horario por defecto:", error);
    }
}

// Cargar horarios personalizados por día
async function loadCustomSchedules() {
    try {
        const docRef = doc(db, "configuracion", "horarios_personalizados");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            customSchedules = docSnap.data();
        }
    } catch (error) {
        console.error("Error al cargar horarios personalizados:", error);
    }
}

// Obtener horario aplicable para un usuario en una fecha específica
function getApplicableSchedule(userId, fecha) {
    // Verificar horario personalizado del empleado
    if (employeeSchedules[userId] && employeeSchedules[userId].activo) {
        return employeeSchedules[userId];
    }

    // Verificar horario del día específico
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[new Date(fecha).getDay()];

    if (customSchedules[diaSemana]) {
        return customSchedules[diaSemana];
    }

    // Usar horario por defecto
    return defaultSchedule;
}

// Configurar listeners en tiempo real para cambios de horario
function setupScheduleListeners() {
    onSnapshot(doc(db, "configuracion", "horario_default"), (doc) => {
        if (doc.exists()) {
            defaultSchedule = doc.data();

            const defaultEntryInput = document.getElementById('defaultEntry');
            const defaultExitInput = document.getElementById('defaultExit');
            const defaultToleranceInput = document.getElementById('defaultTolerance');

            if (defaultEntryInput) defaultEntryInput.value = defaultSchedule.horaEntrada;
            if (defaultExitInput) defaultExitInput.value = defaultSchedule.horaSalida;
            if (defaultToleranceInput) defaultToleranceInput.value = defaultSchedule.tolerancia;

            if (isAdmin && typeof cargarAsistenciasHoy === 'function') {
                cargarAsistenciasHoy();
            }
        }
    });

    onSnapshot(doc(db, "configuracion", "horarios_personalizados"), (doc) => {
        if (doc.exists()) {
            customSchedules = doc.data();
            if (isAdmin && typeof cargarAsistenciasHoy === 'function') {
                cargarAsistenciasHoy();
            }
        }
    });
}

// Eliminar horario personalizado de un día
async function deleteCustomSchedule() {
    const day = document.getElementById('customDaySelect').value;

    if (!day) {
        showToast('Selecciona un día primero', 'error');
        return;
    }

    const confirmed = confirm(`¿Estás seguro de eliminar el horario personalizado de ${day}?`);
    if (!confirmed) return;

    try {
        const docRef = doc(db, "configuracion", "horarios_personalizados");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            delete data[day];

            await setDoc(docRef, data);
            showToast(`Horario de ${day} eliminado correctamente`, 'success');

            document.getElementById('customScheduleForm').style.display = 'none';
            document.getElementById('customDaySelect').value = '';

            if (typeof cargarAsistenciasHoy === 'function') {
                cargarAsistenciasHoy();
            }
        }
    } catch (error) {
        console.error("Error al eliminar horario:", error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

window.deleteCustomSchedule = deleteCustomSchedule;
window.getApplicableSchedule = getApplicableSchedule;

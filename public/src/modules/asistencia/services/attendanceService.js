import { db } from '/src/config/firebase.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import scheduleService from './scheduleService.js';

/**
 * Servicio de Asistencias con Firestore
 * Maneja registro, consulta, edición y validación de asistencias
 */

// ==================== UTILIDADES ====================

function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
}

function getTimeDifferenceInMinutes(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
}

// ==================== VALIDACIONES ====================

/**
 * Verifica si el empleado ya marcó entrada o salida hoy
 */
async function checkIfAlreadyMarked(userId, date, type) {
    try {
        const q = query(
            collection(db, 'attendances'),
            where('userId', '==', userId),
            where('date', '==', date),
            where('type', '==', type)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking if already marked:', error);
        return false;
    }
}

/**
 * Valida el estado de la asistencia (tarde, temprano, a tiempo)
 */
async function validateAttendanceStatus(userId, type, timestamp) {
    const date = formatDate(timestamp);
    const actualTime = formatTime(timestamp);

    // Obtener horario del día
    const schedule = await scheduleService.getScheduleForDate(date);

    if (!schedule) {
        return {
            status: 'normal',
            scheduledTime: null,
            minutesDifference: 0
        };
    }

    const scheduledTime = type === 'entrada' ? schedule.entryTime : schedule.exitTime;
    const toleranceMinutes = schedule.toleranceMinutes || 15;

    const diff = getTimeDifferenceInMinutes(actualTime, scheduledTime);

    let status = 'on-time';

    if (type === 'entrada') {
        // Para entrada: positivo = tarde, negativo = temprano
        if (diff > toleranceMinutes) {
            status = 'late';
        } else if (diff < -toleranceMinutes) {
            status = 'early';
        }
    } else {
        // Para salida: positivo = tarde (bueno), negativo = temprano (malo)
        if (diff < -toleranceMinutes) {
            status = 'early';
        } else if (diff > toleranceMinutes) {
            status = 'late';
        }
    }

    return {
        status,
        scheduledTime,
        minutesDifference: diff
    };
}

// ==================== REGISTRO DE ASISTENCIAS ====================

/**
 * Marca asistencia del empleado (auto-registro)
 */
async function markAttendance(userId, userEmail, displayName, role, type, notes = '') {
    try {
        const now = new Date();
        const date = formatDate(now);

        // Verificar si ya marcó este tipo hoy
        const alreadyMarked = await checkIfAlreadyMarked(userId, date, type);
        if (alreadyMarked) {
            return {
                success: false,
                error: `Ya has marcado ${type} hoy`
            };
        }

        // Validar estado
        const validation = await validateAttendanceStatus(userId, type, now);

        // Crear documento de asistencia
        const attendanceRef = doc(collection(db, 'attendances'));
        const attendanceData = {
            userId,
            userEmail,
            displayName,
            role,
            date,
            timestamp: Timestamp.fromDate(now),
            type,
            actualTime: formatTime(now),
            scheduledTime: validation.scheduledTime,
            status: validation.status,
            minutesDifference: validation.minutesDifference,
            source: 'self',
            notes: notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(attendanceRef, attendanceData);

        // Actualizar resumen del día
        await updateDailySummary(userId, date);

        return {
            success: true,
            data: { id: attendanceRef.id, ...attendanceData }
        };
    } catch (error) {
        console.error('Error marking attendance:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Registro manual de asistencia por administrador
 */
async function registerManualAttendance(adminId, employeeData, date, time, type, notes = '') {
    try {
        // Crear timestamp desde fecha y hora
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const timestamp = new Date(year, month - 1, day, hours, minutes);

        // Verificar si ya existe
        const alreadyMarked = await checkIfAlreadyMarked(employeeData.userId, date, type);
        if (alreadyMarked) {
            return {
                success: false,
                error: `El empleado ya tiene ${type} registrada para esta fecha`
            };
        }

        // Validar estado
        const validation = await validateAttendanceStatus(employeeData.userId, type, timestamp);

        // Crear documento
        const attendanceRef = doc(collection(db, 'attendances'));
        const attendanceData = {
            userId: employeeData.userId,
            userEmail: employeeData.email,
            displayName: employeeData.displayName,
            role: employeeData.role,
            date,
            timestamp: Timestamp.fromDate(timestamp),
            type,
            actualTime: time,
            scheduledTime: validation.scheduledTime,
            status: validation.status,
            minutesDifference: validation.minutesDifference,
            source: 'manual',
            registeredBy: adminId,
            notes: notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(attendanceRef, attendanceData);

        // Actualizar resumen
        await updateDailySummary(employeeData.userId, date);

        return {
            success: true,
            data: { id: attendanceRef.id, ...attendanceData }
        };
    } catch (error) {
        console.error('Error registering manual attendance:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== CONSULTAS ====================

/**
 * Obtiene todas las asistencias de hoy
 */
async function getTodayAttendances() {
    try {
        const today = formatDate(new Date());
        const q = query(
            collection(db, 'attendances'),
            where('date', '==', today),
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const attendances = [];

        snapshot.forEach(doc => {
            attendances.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: attendances };
    } catch (error) {
        console.error('Error getting today attendances:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene asistencias de una fecha específica
 */
async function getAttendancesByDate(date) {
    try {
        const q = query(
            collection(db, 'attendances'),
            where('date', '==', date),
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const attendances = [];

        snapshot.forEach(doc => {
            attendances.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: attendances };
    } catch (error) {
        console.error('Error getting attendances by date:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene asistencias de un empleado en un rango de fechas
 */
async function getUserAttendances(userId, startDate, endDate) {
    try {
        const q = query(
            collection(db, 'attendances'),
            where('userId', '==', userId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc'),
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const attendances = [];

        snapshot.forEach(doc => {
            attendances.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: attendances };
    } catch (error) {
        console.error('Error getting user attendances:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene el resumen diario de un empleado
 */
async function getDailySummary(userId, date) {
    try {
        const summaryId = `${userId}_${date}`;
        const summaryRef = doc(db, 'attendance_summary', summaryId);
        const summaryDoc = await getDoc(summaryRef);

        if (summaryDoc.exists()) {
            return { success: true, data: summaryDoc.data() };
        }

        return { success: false, error: 'No summary found' };
    } catch (error) {
        console.error('Error getting daily summary:', error);
        return { success: false, error: error.message };
    }
}

// ==================== ACTUALIZACIÓN ====================

/**
 * Actualiza una asistencia existente
 */
async function updateAttendance(attendanceId, updates, adminId) {
    try {
        const attendanceRef = doc(db, 'attendances', attendanceId);
        const attendanceDoc = await getDoc(attendanceRef);

        if (!attendanceDoc.exists()) {
            return { success: false, error: 'Asistencia no encontrada' };
        }

        const currentData = attendanceDoc.data();

        // Preparar historial de edición
        const editHistory = currentData.editHistory || [];
        editHistory.push({
            editedAt: serverTimestamp(),
            editedBy: adminId,
            changes: updates
        });

        // Si se actualiza la hora, recalcular validación
        let validationUpdate = {};
        if (updates.actualTime) {
            const [hours, minutes] = updates.actualTime.split(':').map(Number);
            const [year, month, day] = currentData.date.split('-').map(Number);
            const newTimestamp = new Date(year, month - 1, day, hours, minutes);

            const validation = await validateAttendanceStatus(
                currentData.userId,
                currentData.type,
                newTimestamp
            );

            validationUpdate = {
                timestamp: Timestamp.fromDate(newTimestamp),
                status: validation.status,
                minutesDifference: validation.minutesDifference
            };
        }

        // Actualizar documento
        await updateDoc(attendanceRef, {
            ...updates,
            ...validationUpdate,
            editedBy: adminId,
            editHistory,
            updatedAt: serverTimestamp()
        });

        // Actualizar resumen
        await updateDailySummary(currentData.userId, currentData.date);

        return { success: true };
    } catch (error) {
        console.error('Error updating attendance:', error);
        return { success: false, error: error.message };
    }
}

// ==================== RESUMEN DIARIO ====================

/**
 * Actualiza el resumen diario de un empleado
 */
async function updateDailySummary(userId, date) {
    try {
        // Obtener todas las asistencias del día
        const q = query(
            collection(db, 'attendances'),
            where('userId', '==', userId),
            where('date', '==', date)
        );

        const snapshot = await getDocs(q);
        let checkIn = null;
        let checkOut = null;
        let displayName = '';
        let wasLate = false;
        let leftEarly = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.type === 'entrada') {
                checkIn = data.timestamp;
                displayName = data.displayName;
                if (data.status === 'late') wasLate = true;
            } else if (data.type === 'salida') {
                checkOut = data.timestamp;
                if (data.status === 'early') leftEarly = true;
            }
        });

        // Calcular horas trabajadas
        let hoursWorked = null;
        if (checkIn && checkOut) {
            const diff = checkOut.toDate() - checkIn.toDate();
            hoursWorked = diff / (1000 * 60 * 60); // Convertir a horas
        }

        // Determinar estado
        let status = 'absent';
        if (checkIn && checkOut) {
            status = 'complete';
        } else if (checkIn || checkOut) {
            status = 'incomplete';
        }

        // Guardar resumen
        const summaryId = `${userId}_${date}`;
        const summaryRef = doc(db, 'attendance_summary', summaryId);

        await setDoc(summaryRef, {
            userId,
            date,
            displayName,
            checkIn,
            checkOut,
            hoursWorked,
            status,
            wasLate,
            leftEarly,
            lastUpdated: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating daily summary:', error);
        return { success: false, error: error.message };
    }
}

// ==================== EXPORTAR ====================

export default {
    // Registro
    markAttendance,
    registerManualAttendance,

    // Consultas
    getTodayAttendances,
    getAttendancesByDate,
    getUserAttendances,
    getDailySummary,

    // Actualización
    updateAttendance,

    // Utilidades
    checkIfAlreadyMarked,
    formatDate,
    formatTime
};

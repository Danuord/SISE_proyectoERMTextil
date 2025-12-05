import { db } from '/src/config/firebase.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

/**
 * Servicio de Horarios
 * Maneja la configuración de horarios por día y validaciones
 */

// Horario por defecto
const DEFAULT_SCHEDULE = {
    entryTime: '08:00',
    exitTime: '17:00',
    toleranceMinutes: 15,
    workHours: 8
};

// ==================== GESTIÓN DE HORARIOS ====================

/**
 * Obtiene el horario para una fecha específica
 * Si no existe, retorna el horario por defecto
 */
async function getScheduleForDate(date) {
    try {
        // Buscar horario específico para esta fecha
        const q = query(
            collection(db, 'schedules'),
            where('date', '==', date),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        // Si no hay horario específico, buscar el por defecto
        return await getDefaultSchedule();
    } catch (error) {
        console.error('Error getting schedule for date:', error);
        return DEFAULT_SCHEDULE;
    }
}

/**
 * Obtiene el horario por defecto
 */
async function getDefaultSchedule() {
    try {
        const q = query(
            collection(db, 'schedules'),
            where('isDefault', '==', true),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        return DEFAULT_SCHEDULE;
    } catch (error) {
        console.error('Error getting default schedule:', error);
        return DEFAULT_SCHEDULE;
    }
}

/**
 * Configura el horario para una fecha específica
 */
async function setScheduleForDate(adminId, date, entryTime, exitTime, toleranceMinutes = 15, appliesTo = 'all') {
    try {
        // Calcular horas de trabajo
        const [entryH, entryM] = entryTime.split(':').map(Number);
        const [exitH, exitM] = exitTime.split(':').map(Number);
        const workHours = (exitH * 60 + exitM - entryH * 60 - entryM) / 60;

        // Verificar si ya existe un horario para esta fecha
        const q = query(
            collection(db, 'schedules'),
            where('date', '==', date),
            limit(1)
        );

        const snapshot = await getDocs(q);

        const scheduleData = {
            date,
            entryTime,
            exitTime,
            toleranceMinutes,
            workHours,
            appliesTo,
            isDefault: false,
            setBy: adminId,
            updatedAt: serverTimestamp()
        };

        if (!snapshot.empty) {
            // Actualizar existente
            const scheduleRef = doc(db, 'schedules', snapshot.docs[0].id);
            await setDoc(scheduleRef, scheduleData, { merge: true });
            return { success: true, id: snapshot.docs[0].id };
        } else {
            // Crear nuevo
            const scheduleRef = doc(collection(db, 'schedules'));
            await setDoc(scheduleRef, {
                ...scheduleData,
                createdAt: serverTimestamp()
            });
            return { success: true, id: scheduleRef.id };
        }
    } catch (error) {
        console.error('Error setting schedule for date:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Configura el horario por defecto
 */
async function setDefaultSchedule(adminId, entryTime, exitTime, toleranceMinutes = 15) {
    try {
        // Calcular horas de trabajo
        const [entryH, entryM] = entryTime.split(':').map(Number);
        const [exitH, exitM] = exitTime.split(':').map(Number);
        const workHours = (exitH * 60 + exitM - entryH * 60 - entryM) / 60;

        // Buscar si ya existe un horario por defecto
        const q = query(
            collection(db, 'schedules'),
            where('isDefault', '==', true),
            limit(1)
        );

        const snapshot = await getDocs(q);

        const scheduleData = {
            entryTime,
            exitTime,
            toleranceMinutes,
            workHours,
            isDefault: true,
            appliesTo: 'all',
            setBy: adminId,
            updatedAt: serverTimestamp()
        };

        if (!snapshot.empty) {
            // Actualizar existente
            const scheduleRef = doc(db, 'schedules', snapshot.docs[0].id);
            await setDoc(scheduleRef, scheduleData, { merge: true });
            return { success: true, id: snapshot.docs[0].id };
        } else {
            // Crear nuevo
            const scheduleRef = doc(collection(db, 'schedules'));
            await setDoc(scheduleRef, {
                ...scheduleData,
                createdAt: serverTimestamp()
            });
            return { success: true, id: scheduleRef.id };
        }
    } catch (error) {
        console.error('Error setting default schedule:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene todos los horarios personalizados (no por defecto)
 */
async function getCustomSchedules(startDate = null, endDate = null) {
    try {
        let q;

        if (startDate && endDate) {
            q = query(
                collection(db, 'schedules'),
                where('isDefault', '==', false),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'desc')
            );
        } else {
            q = query(
                collection(db, 'schedules'),
                where('isDefault', '==', false),
                orderBy('date', 'desc')
            );
        }

        const snapshot = await getDocs(q);
        const schedules = [];

        snapshot.forEach(doc => {
            schedules.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: schedules };
    } catch (error) {
        console.error('Error getting custom schedules:', error);
        return { success: false, error: error.message };
    }
}

// ==================== VALIDACIONES ====================

/**
 * Verifica si una hora está tarde según el horario
 */
function isLate(actualTime, scheduledTime, toleranceMinutes) {
    const [actualH, actualM] = actualTime.split(':').map(Number);
    const [scheduledH, scheduledM] = scheduledTime.split(':').map(Number);

    const actualMinutes = actualH * 60 + actualM;
    const scheduledMinutes = scheduledH * 60 + scheduledM;
    const diff = actualMinutes - scheduledMinutes;

    return diff > toleranceMinutes;
}

/**
 * Verifica si una hora está temprano según el horario
 */
function isEarly(actualTime, scheduledTime, toleranceMinutes) {
    const [actualH, actualM] = actualTime.split(':').map(Number);
    const [scheduledH, scheduledM] = scheduledTime.split(':').map(Number);

    const actualMinutes = actualH * 60 + actualM;
    const scheduledMinutes = scheduledH * 60 + scheduledM;
    const diff = actualMinutes - scheduledMinutes;

    return diff < -toleranceMinutes;
}

/**
 * Calcula la diferencia en minutos entre dos horas
 */
function getTimeDifference(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
}

// ==================== EXPORTAR ====================

export default {
    // Consultas
    getScheduleForDate,
    getDefaultSchedule,
    getCustomSchedules,

    // Configuración
    setScheduleForDate,
    setDefaultSchedule,

    // Validaciones
    isLate,
    isEarly,
    getTimeDifference,

    // Constantes
    DEFAULT_SCHEDULE
};

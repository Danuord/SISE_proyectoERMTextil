/**
 * Utilidades para el módulo de asistencias
 * Funciones auxiliares para formateo, validaciones y cálculos
 */

// ==================== FORMATEO DE FECHAS Y HORAS ====================

/**
 * Formatea una fecha a YYYY-MM-DD
 */
export function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formatea una hora a HH:MM
 */
export function formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Formatea una fecha para mostrar (ej: "Lun, 03 Dic")
 */
export function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];

    return `${dayName}, ${day} ${month}`;
}

/**
 * Formatea timestamp de Firestore a hora local
 */
export function formatFirestoreTime(timestamp) {
    if (!timestamp) return '--:--';
    const date = timestamp.toDate();
    return formatTime(date);
}

// ==================== CÁLCULOS DE TIEMPO ====================

/**
 * Calcula la diferencia en minutos entre dos horas (HH:MM)
 */
export function getTimeDifferenceInMinutes(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
}

/**
 * Calcula horas trabajadas entre dos timestamps
 */
export function calculateHoursWorked(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;

    const entryTime = checkIn.toDate();
    const exitTime = checkOut.toDate();
    const diff = exitTime - entryTime;
    const hours = diff / (1000 * 60 * 60);

    return Math.round(hours * 100) / 100;
}

/**
 * Formatea horas decimales a HH:MM
 */
export function formatHoursToHHMM(hours) {
    if (!hours) return '00:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ==================== RANGOS DE FECHAS ====================

/**
 * Obtiene la fecha de hace N días
 */
export function getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
}

/**
 * Obtiene el rango de los últimos N días
 */
export function getLastNDaysRange(days) {
    const endDate = formatDate(new Date());
    const startDate = getDaysAgo(days - 1);
    return { startDate, endDate };
}

/**
 * Obtiene todas las fechas en un rango
 */
export function getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    while (current <= end) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

// ==================== VALIDACIONES ====================

/**
 * Valida formato de hora HH:MM
 */
export function isValidTimeFormat(time) {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
}

/**
 * Valida formato de fecha YYYY-MM-DD
 */
export function isValidDateFormat(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
}

// ==================== ESTADOS Y BADGES ====================

/**
 * Obtiene la clase CSS para un estado de asistencia
 */
export function getStatusClass(status) {
    const classes = {
        'on-time': 'status-on-time',
        'late': 'status-late',
        'early': 'status-early',
        'normal': 'status-normal',
        'complete': 'status-complete',
        'incomplete': 'status-incomplete',
        'absent': 'status-absent'
    };
    return classes[status] || 'status-normal';
}

/**
 * Obtiene el texto para mostrar de un estado
 */
export function getStatusText(status) {
    const texts = {
        'on-time': 'A tiempo',
        'late': 'Tarde',
        'early': 'Temprano',
        'normal': 'Normal',
        'complete': 'Completo',
        'incomplete': 'Incompleto',
        'absent': 'Ausente'
    };
    return texts[status] || status;
}

/**
 * Obtiene el icono para un estado
 */
export function getStatusIcon(status) {
    const icons = {
        'on-time': '✅',
        'late': '⏰',
        'early': '⚡',
        'normal': '➖',
        'complete': '✅',
        'incomplete': '⚠️',
        'absent': '❌'
    };
    return icons[status] || '•';
}

// ==================== AGRUPACIÓN DE DATOS ====================

/**
 * Agrupa asistencias por fecha
 */
export function groupAttendancesByDate(attendances) {
    const grouped = {};

    attendances.forEach(attendance => {
        const date = attendance.date;
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(attendance);
    });

    return grouped;
}

/**
 * Agrupa asistencias por empleado
 */
export function groupAttendancesByEmployee(attendances) {
    const grouped = {};

    attendances.forEach(attendance => {
        const userId = attendance.userId;
        if (!grouped[userId]) {
            grouped[userId] = {
                userId,
                displayName: attendance.displayName,
                email: attendance.userEmail,
                attendances: []
            };
        }
        grouped[userId].attendances.push(attendance);
    });

    return grouped;
}

// ==================== EXPORTAR ====================

export default {
    // Formateo
    formatDate,
    formatTime,
    formatDateDisplay,
    formatFirestoreTime,
    formatHoursToHHMM,

    // Cálculos
    getTimeDifferenceInMinutes,
    calculateHoursWorked,

    // Rangos
    getDaysAgo,
    getLastNDaysRange,
    getDateRange,

    // Validaciones
    isValidTimeFormat,
    isValidDateFormat,

    // Estados
    getStatusClass,
    getStatusText,
    getStatusIcon,

    // Agrupación
    groupAttendancesByDate,
    groupAttendancesByEmployee
};

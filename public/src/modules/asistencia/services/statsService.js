import { db } from '/src/config/firebase.js';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

/**
 * Servicio de Estadísticas de Asistencias
 * Calcula métricas y genera reportes
 */

// ==================== ESTADÍSTICAS POR EMPLEADO ====================

/**
 * Obtiene estadísticas de un empleado en un rango de fechas
 */
async function getEmployeeStats(userId, startDate, endDate) {
    try {
        // Obtener todas las asistencias del empleado en el rango
        const q = query(
            collection(db, 'attendances'),
            where('userId', '==', userId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);

        // Agrupar por fecha
        const attendancesByDate = {};
        let displayName = '';

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date;

            if (!displayName) displayName = data.displayName;

            if (!attendancesByDate[date]) {
                attendancesByDate[date] = {
                    date,
                    entrada: null,
                    salida: null,
                    wasLate: false,
                    leftEarly: false,
                    hoursWorked: 0
                };
            }

            if (data.type === 'entrada') {
                attendancesByDate[date].entrada = data;
                if (data.status === 'late') {
                    attendancesByDate[date].wasLate = true;
                }
            } else if (data.type === 'salida') {
                attendancesByDate[date].salida = data;
                if (data.status === 'early') {
                    attendancesByDate[date].leftEarly = true;
                }
            }
        });

        // Calcular estadísticas
        let totalDays = 0;
        let completeDays = 0;
        let incompleteDays = 0;
        let lateDays = 0;
        let earlyLeaveDays = 0;
        let totalHours = 0;

        Object.values(attendancesByDate).forEach(day => {
            totalDays++;

            if (day.entrada && day.salida) {
                completeDays++;

                // Calcular horas trabajadas
                const entryTime = day.entrada.timestamp.toDate();
                const exitTime = day.salida.timestamp.toDate();
                const hours = (exitTime - entryTime) / (1000 * 60 * 60);
                day.hoursWorked = hours;
                totalHours += hours;
            } else {
                incompleteDays++;
            }

            if (day.wasLate) lateDays++;
            if (day.leftEarly) earlyLeaveDays++;
        });

        const avgHoursPerDay = completeDays > 0 ? totalHours / completeDays : 0;

        return {
            success: true,
            data: {
                userId,
                displayName,
                startDate,
                endDate,
                totalDays,
                completeDays,
                incompleteDays,
                lateDays,
                earlyLeaveDays,
                totalHours: Math.round(totalHours * 100) / 100,
                avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
                attendanceRate: totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0,
                punctualityRate: totalDays > 0 ? Math.round(((totalDays - lateDays) / totalDays) * 100) : 0,
                dailyDetails: Object.values(attendancesByDate)
            }
        };
    } catch (error) {
        console.error('Error getting employee stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene estadísticas de todos los empleados en un rango
 */
async function getAllEmployeesStats(startDate, endDate) {
    try {
        // Obtener todas las asistencias en el rango
        const q = query(
            collection(db, 'attendances'),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);

        // Agrupar por empleado
        const employeeData = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;

            if (!employeeData[userId]) {
                employeeData[userId] = {
                    userId,
                    displayName: data.displayName,
                    email: data.userEmail,
                    attendancesByDate: {}
                };
            }

            const date = data.date;
            if (!employeeData[userId].attendancesByDate[date]) {
                employeeData[userId].attendancesByDate[date] = {
                    date,
                    entrada: null,
                    salida: null,
                    wasLate: false,
                    leftEarly: false
                };
            }

            if (data.type === 'entrada') {
                employeeData[userId].attendancesByDate[date].entrada = data;
                if (data.status === 'late') {
                    employeeData[userId].attendancesByDate[date].wasLate = true;
                }
            } else if (data.type === 'salida') {
                employeeData[userId].attendancesByDate[date].salida = data;
                if (data.status === 'early') {
                    employeeData[userId].attendancesByDate[date].leftEarly = true;
                }
            }
        });

        // Calcular estadísticas por empleado
        const stats = [];

        Object.values(employeeData).forEach(employee => {
            let totalDays = 0;
            let completeDays = 0;
            let lateDays = 0;
            let earlyLeaveDays = 0;
            let totalHours = 0;

            Object.values(employee.attendancesByDate).forEach(day => {
                totalDays++;

                if (day.entrada && day.salida) {
                    completeDays++;
                    const entryTime = day.entrada.timestamp.toDate();
                    const exitTime = day.salida.timestamp.toDate();
                    const hours = (exitTime - entryTime) / (1000 * 60 * 60);
                    totalHours += hours;
                }

                if (day.wasLate) lateDays++;
                if (day.leftEarly) earlyLeaveDays++;
            });

            const avgHoursPerDay = completeDays > 0 ? totalHours / completeDays : 0;

            stats.push({
                userId: employee.userId,
                displayName: employee.displayName,
                email: employee.email,
                totalDays,
                completeDays,
                lateDays,
                earlyLeaveDays,
                totalHours: Math.round(totalHours * 100) / 100,
                avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
                attendanceRate: totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0,
                punctualityRate: totalDays > 0 ? Math.round(((totalDays - lateDays) / totalDays) * 100) : 0
            });
        });

        // Ordenar por nombre
        stats.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error getting all employees stats:', error);
        return { success: false, error: error.message };
    }
}

// ==================== RESUMEN DIARIO ====================

/**
 * Obtiene resumen de asistencias de hoy
 */
async function getTodaySummary() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const q = query(
            collection(db, 'attendance_summary'),
            where('date', '==', today)
        );

        const snapshot = await getDocs(q);
        const summaries = [];

        snapshot.forEach(doc => {
            summaries.push(doc.data());
        });

        // Calcular totales
        const total = summaries.length;
        const complete = summaries.filter(s => s.status === 'complete').length;
        const incomplete = summaries.filter(s => s.status === 'incomplete').length;
        const absent = summaries.filter(s => s.status === 'absent').length;
        const late = summaries.filter(s => s.wasLate).length;

        return {
            success: true,
            data: {
                date: today,
                total,
                complete,
                incomplete,
                absent,
                late,
                summaries
            }
        };
    } catch (error) {
        console.error('Error getting today summary:', error);
        return { success: false, error: error.message };
    }
}

// ==================== DATOS PARA GRÁFICOS ====================

/**
 * Obtiene datos para gráfico de asistencia semanal
 */
async function getWeeklyAttendanceData(startDate, endDate) {
    try {
        const q = query(
            collection(db, 'attendance_summary'),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );

        const snapshot = await getDocs(q);

        // Agrupar por fecha
        const dataByDate = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date;

            if (!dataByDate[date]) {
                dataByDate[date] = {
                    date,
                    total: 0,
                    complete: 0,
                    incomplete: 0,
                    late: 0
                };
            }

            dataByDate[date].total++;
            if (data.status === 'complete') dataByDate[date].complete++;
            if (data.status === 'incomplete') dataByDate[date].incomplete++;
            if (data.wasLate) dataByDate[date].late++;
        });

        // Convertir a array y ordenar
        const chartData = Object.values(dataByDate).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        return { success: true, data: chartData };
    } catch (error) {
        console.error('Error getting weekly attendance data:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene datos para gráfico de tardanzas por empleado
 */
async function getLatenessByEmployee(startDate, endDate) {
    try {
        const q = query(
            collection(db, 'attendances'),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            where('type', '==', 'entrada'),
            where('status', '==', 'late')
        );

        const snapshot = await getDocs(q);

        // Contar por empleado
        const latenessByEmployee = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;

            if (!latenessByEmployee[userId]) {
                latenessByEmployee[userId] = {
                    userId,
                    displayName: data.displayName,
                    count: 0
                };
            }

            latenessByEmployee[userId].count++;
        });

        // Convertir a array y ordenar
        const chartData = Object.values(latenessByEmployee).sort((a, b) =>
            b.count - a.count
        );

        return { success: true, data: chartData };
    } catch (error) {
        console.error('Error getting lateness by employee:', error);
        return { success: false, error: error.message };
    }
}

// ==================== EXPORTAR ====================

export default {
    // Estadísticas
    getEmployeeStats,
    getAllEmployeesStats,
    getTodaySummary,

    // Datos para gráficos
    getWeeklyAttendanceData,
    getLatenessByEmployee
};

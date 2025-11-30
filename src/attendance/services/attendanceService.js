const STORAGE_KEY = 'attendance_records';

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeRecord(rec) {
    return {
        id: rec.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: rec.userId,
        role: rec.role || 'Empleado',
        type: rec.type, // 'Entrada' | 'Salida'
        timestamp: rec.timestamp || Date.now(),
        notes: rec.notes || '',
        source: rec.source || 'manual',
        displayName: rec.displayName || undefined
    };
}

function register(rec) {
    const list = load();
    const normalized = normalizeRecord(rec);
    list.push(normalized);
    // sort newest first
    list.sort((a, b) => b.timestamp - a.timestamp);
    save(list);
    try {
        const bc = new BroadcastChannel('attendance');
        bc.postMessage({ type: 'NEW_ATTENDANCE', record: normalized });
        bc.close();
    } catch {}
    return normalized;
}

function startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}
function endOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}

function getToday() {
    const list = load();
    const start = startOfDay();
    const end = endOfDay();
    return list.filter(r => r.timestamp >= start && r.timestamp <= end)
               .sort((a, b) => b.timestamp - a.timestamp);
}

function subscribe(onChange) {
    // Broadcast channel for cross-tab updates
    let bc;
    try {
        bc = new BroadcastChannel('attendance');
        bc.onmessage = () => onChange && onChange();
    } catch {}
    // Periodic refresh fallback (every 10s)
    const iv = setInterval(() => {
        onChange && onChange();
    }, 10000);
    // Return unsubscribe
    return () => {
        if (bc) {
            try { bc.close(); } catch {}
        }
        clearInterval(iv);
    };
}

export default {
    register,
    getToday,
    subscribe
};
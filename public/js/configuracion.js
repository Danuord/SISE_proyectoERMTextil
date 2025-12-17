// ===================== CONFIGURACIÓN - LÓGICA =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

console.log("✅ CONFIGURACION.JS CARGADO");

// ===================== CONFIG FIREBASE =====================
const firebaseConfig = {
    apiKey: "AIzaSyDRTKsoZ9Zzh1oo-DQtlxnZ4Pw6RWBv08c",
    authDomain: "textileflow-test.firebaseapp.com",
    projectId: "textileflow-test",
    storageBucket: "textileflow-test.firebasestorage.app",
    messagingSenderId: "227349652064",
    appId: "1:227349652064:web:d32994273a529a07e25905",
    measurementId: "G-XE4Z2S0LRB"
};

const app = initializeApp(firebaseConfig, 'configuracion-app');
const db = getFirestore(app);
console.log('✅ Firebase inicializado para configuración');

// ===================== VARIABLES GLOBALES =====================
let currentTab = 'general';
let unsavedChanges = false;

// ===================== INICIALIZACIÓN =====================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando módulo de configuración...");

    setupTabNavigation();
    setupSearchFunctionality();
    loadAllSettings();
    trackChanges();

    console.log("✅ Módulo de configuración listo");
});

// ===================== NAVEGACIÓN DE TABS =====================
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (unsavedChanges) {
                if (!confirm('Tienes cambios sin guardar. ¿Deseas continuar sin guardar?')) {
                    return;
                }
                unsavedChanges = false;
            }

            const tabName = button.dataset.tab;

            // Remover active de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Activar el seleccionado
            button.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            currentTab = tabName;
            console.log(`📑 Tab cambiado a: ${tabName}`);
        });
    });
}

// ===================== BÚSQUEDA =====================
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchSettings');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(button => {
            const tabText = button.textContent.toLowerCase();
            if (tabText.includes(searchTerm)) {
                button.style.display = 'flex';
            } else {
                button.style.display = 'none';
            }
        });
    });
}

// ===================== CARGAR CONFIGURACIONES =====================
async function loadAllSettings() {
    try {
        await Promise.all([
            loadGeneralSettings(),
            loadAsistenciasSettings(),
            loadInventarioSettings()
        ]);
        console.log('✅ Configuraciones cargadas');
    } catch (error) {
        console.error('❌ Error al cargar configuraciones:', error);
    }
}

async function loadGeneralSettings() {
    try {
        const docRef = doc(db, "configuracion_sistema", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('empresaNombre').value = data.empresaNombre || '';
            document.getElementById('empresaRuc').value = data.empresaRuc || '';
            document.getElementById('empresaDireccion').value = data.empresaDireccion || '';
            document.getElementById('empresaTelefono').value = data.empresaTelefono || '';
            document.getElementById('empresaEmail').value = data.empresaEmail || '';
            document.getElementById('zonaHoraria').value = data.zonaHoraria || 'America/Lima';
            document.getElementById('idioma').value = data.idioma || 'es';
            document.getElementById('formatoFecha').value = data.formatoFecha || 'DD/MM/YYYY';
            document.getElementById('formatoHora').value = data.formatoHora || '24h';
            document.getElementById('moneda').value = data.moneda || 'PEN';
            document.getElementById('separadorDecimal').value = data.separadorDecimal || '.';
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración general:', error);
    }
}

async function loadAsistenciasSettings() {
    try {
        const docRef = doc(db, "configuracion_sistema", "asistencias");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('horaInicio').value = data.horaInicio || '08:30';
            document.getElementById('horaFin').value = data.horaFin || '17:30';
            document.getElementById('toleranciaTardanza').value = data.toleranciaTardanza || 10;
            document.getElementById('tiempoAlmuerzo').value = data.tiempoAlmuerzo || 60;
            document.getElementById('permitirHorasExtras').checked = data.permitirHorasExtras !== false;
            document.getElementById('notificarTardanzas').checked = data.notificarTardanzas !== false;

            // Cargar días laborales
            if (data.diasLaborales) {
                const checkboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = data.diasLaborales.includes(parseInt(checkbox.value));
                });
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración de asistencias:', error);
    }
}

async function loadInventarioSettings() {
    try {
        const docRef = doc(db, "configuracion_sistema", "inventario");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('stockMinimo').value = data.stockMinimo || 10;
            document.getElementById('stockMaximo').value = data.stockMaximo || 1000;
            document.getElementById('alertasStockBajo').checked = data.alertasStockBajo !== false;
            document.getElementById('emailAlertasInventario').value = data.emailAlertasInventario || '';
            document.getElementById('metodoValorizacion').value = data.metodoValorizacion || 'FIFO';
            document.getElementById('incluirImpuestos').checked = data.incluirImpuestos || false;
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración de inventario:', error);
    }
}

// ===================== GUARDAR CONFIGURACIONES =====================
window.saveSettings = async function (tabName) {
    try {
        console.log(`💾 Guardando configuración: ${tabName}`);

        let data = {};
        let docName = tabName;

        switch (tabName) {
            case 'general':
                data = {
                    empresaNombre: document.getElementById('empresaNombre').value,
                    empresaRuc: document.getElementById('empresaRuc').value,
                    empresaDireccion: document.getElementById('empresaDireccion').value,
                    empresaTelefono: document.getElementById('empresaTelefono').value,
                    empresaEmail: document.getElementById('empresaEmail').value,
                    zonaHoraria: document.getElementById('zonaHoraria').value,
                    idioma: document.getElementById('idioma').value,
                    formatoFecha: document.getElementById('formatoFecha').value,
                    formatoHora: document.getElementById('formatoHora').value,
                    moneda: document.getElementById('moneda').value,
                    separadorDecimal: document.getElementById('separadorDecimal').value,
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'asistencias':
                const diasLaborales = [];
                document.querySelectorAll('.day-checkbox input:checked').forEach(checkbox => {
                    diasLaborales.push(parseInt(checkbox.value));
                });

                data = {
                    horaInicio: document.getElementById('horaInicio').value,
                    horaFin: document.getElementById('horaFin').value,
                    toleranciaTardanza: parseInt(document.getElementById('toleranciaTardanza').value),
                    tiempoAlmuerzo: parseInt(document.getElementById('tiempoAlmuerzo').value),
                    diasLaborales: diasLaborales,
                    permitirHorasExtras: document.getElementById('permitirHorasExtras').checked,
                    notificarTardanzas: document.getElementById('notificarTardanzas').checked,
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'inventario':
                data = {
                    stockMinimo: parseInt(document.getElementById('stockMinimo').value),
                    stockMaximo: parseInt(document.getElementById('stockMaximo').value),
                    alertasStockBajo: document.getElementById('alertasStockBajo').checked,
                    emailAlertasInventario: document.getElementById('emailAlertasInventario').value,
                    metodoValorizacion: document.getElementById('metodoValorizacion').value,
                    incluirImpuestos: document.getElementById('incluirImpuestos').checked,
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'pagos':
                data = {
                    diaPagoMensual: parseInt(document.getElementById('diaPagoMensual').value),
                    monedaPago: document.getElementById('monedaPago').value,
                    metodoPagoDefault: document.getElementById('metodoPagoDefault').value,
                    descuentoTardanza: parseFloat(document.getElementById('descuentoTardanza').value),
                    bonoPuntualidad: parseFloat(document.getElementById('bonoPuntualidad').value),
                    multiplicadorHorasExtras: parseFloat(document.getElementById('multiplicadorHorasExtras').value),
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'usuarios':
                data = {
                    longitudMinPass: parseInt(document.getElementById('longitudMinPass').value),
                    diasCambioPass: parseInt(document.getElementById('diasCambioPass').value),
                    requerirCaracteresEspeciales: document.getElementById('requerirCaracteresEspeciales').checked,
                    tiempoInactividad: parseInt(document.getElementById('tiempoInactividad').value),
                    sesionesSimultaneas: parseInt(document.getElementById('sesionesSimultaneas').value),
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'notificaciones':
                data = {
                    notifNuevosEmpleados: document.getElementById('notifNuevosEmpleados').checked,
                    notifAusencias: document.getElementById('notifAusencias').checked,
                    notifStockBajo: document.getElementById('notifStockBajo').checked,
                    notifPagosPendientes: document.getElementById('notifPagosPendientes').checked,
                    emailAdminPrincipal: document.getElementById('emailAdminPrincipal').value,
                    emailsAdicionales: document.getElementById('emailsAdicionales').value,
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'reportes':
                data = {
                    diasDefaultReportes: parseInt(document.getElementById('diasDefaultReportes').value),
                    formatoExportacion: document.getElementById('formatoExportacion').value,
                    incluirLogoPDF: document.getElementById('incluirLogoPDF').checked,
                    reportesAutomaticos: document.getElementById('reportesAutomaticos').checked,
                    diaEnvioReportes: parseInt(document.getElementById('diaEnvioReportes').value),
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'integracion':
                data = {
                    firebaseProjectId: document.getElementById('firebaseProjectId').value,
                    apiTipoCambio: document.getElementById('apiTipoCambio').checked,
                    apiSunat: document.getElementById('apiSunat').checked,
                    backupAutomatico: document.getElementById('backupAutomatico').checked,
                    frecuenciaBackup: document.getElementById('frecuenciaBackup').value,
                    retencionBackup: parseInt(document.getElementById('retencionBackup').value),
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            case 'apariencia':
                data = {
                    temaGeneral: document.getElementById('temaGeneral').value,
                    colorPrimario: document.getElementById('colorPrimario').value,
                    colorSecundario: document.getElementById('colorSecundario').value,
                    sidebarColapsable: document.getElementById('sidebarColapsable').checked,
                    mostrarIconosSidebar: document.getElementById('mostrarIconosSidebar').checked,
                    widgetKPIs: document.getElementById('widgetKPIs').checked,
                    widgetGraficos: document.getElementById('widgetGraficos').checked,
                    widgetActividad: document.getElementById('widgetActividad').checked,
                    fechaActualizacion: new Date().toISOString()
                };
                break;

            default:
                console.warn('⚠️ Tab no implementado:', tabName);
                showNotification('Error: Tab no encontrado', 'error');
                return;
        }

        // Guardar en Firestore
        await setDoc(doc(db, "configuracion_sistema", docName), data);

        unsavedChanges = false;
        showNotification('Configuración guardada exitosamente', 'success');
        console.log('✅ Configuración guardada:', tabName);

    } catch (error) {
        console.error('❌ Error al guardar configuración:', error);
        showNotification('Error al guardar la configuración', 'error');
    }
};

// ===================== RESTABLECER CONFIGURACIONES =====================
window.resetTab = async function (tabName) {
    if (!confirm('¿Estás seguro de que deseas restablecer esta configuración a sus valores por defecto?')) {
        return;
    }

    try {
        await loadAllSettings();
        unsavedChanges = false;
        showNotification('Configuración restablecida', 'info');
    } catch (error) {
        console.error('❌ Error al restablecer:', error);
        showNotification('Error al restablecer la configuración', 'error');
    }
};

// ===================== RASTREAR CAMBIOS =====================
function trackChanges() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            unsavedChanges = true;
        });
    });
}

// ===================== NOTIFICACIONES =====================
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Agregar estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================== PREVENIR SALIDA SIN GUARDAR =====================
window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

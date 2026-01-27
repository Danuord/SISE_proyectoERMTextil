// ===================== VALIDACIÓN DE DATOS =====================

/* Valida el número de documento según el tipo */
function validateDocument(tipo, numero) {
    const errors = {
        'DNI': 'El DNI debe tener exactamente 8 dígitos',
        'RUC': 'El RUC debe tener exactamente 11 dígitos',
        'CE': 'El Carnet de Extranjería debe tener entre 5 y 20 caracteres alfanuméricos',
        'PA': 'El Pasaporte debe tener entre 5 y 20 caracteres alfanuméricos',
        'CC': 'La Cédula debe tener entre 6 y 15 dígitos'
    };

    if (!numero || numero.trim() === '') {
        return { valid: false, message: 'El número de documento es obligatorio' };
    }

    numero = numero.trim();

    switch (tipo) {
        case 'DNI':
            if (!/^\d{8}$/.test(numero)) {
                return { valid: false, message: errors.DNI };
            }
            break;
        case 'RUC':
            if (!/^\d{11}$/.test(numero)) {
                return { valid: false, message: errors.RUC };
            }
            break;
        case 'CE':
        case 'PA':
            if (!/^[A-Z0-9]{5,20}$/i.test(numero)) {
                return { valid: false, message: errors[tipo] };
            }
            break;
        case 'CC':
            if (!/^\d{6,15}$/.test(numero)) {
                return { valid: false, message: errors.CC };
            }
            break;
    }

    return { valid: true, message: '' };
}

/* Valida el número de teléfono peruano */
function validatePhone(phone) {
    if (!phone || phone.trim() === '') {
        return { valid: true, message: '' };
    }

    phone = phone.trim();

    // Formato peruano: 9 dígitos que empiezan con 9
    if (!/^9\d{8}$/.test(phone)) {
        return {
            valid: false,
            message: 'El teléfono debe tener 9 dígitos y empezar con 9 (Ej: 987654321)'
        };
    }

    return { valid: true, message: '' };
}

/* Muestra un mensaje de error en el formulario */
function showFieldError(fieldId, message) {
    const errorSpan = document.getElementById(fieldId + 'Error');
    const input = document.getElementById(fieldId);

    if (errorSpan) {
        errorSpan.textContent = message;
    }

    if (input) {
        if (message) {
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    }
}

function clearAllErrors() {
    const errorSpans = document.querySelectorAll('.error-message');
    errorSpans.forEach(span => span.textContent = '');

    const errorInputs = document.querySelectorAll('.error');
    errorInputs.forEach(input => input.classList.remove('error'));
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ===================== CALCULAR ANTIGÜEDAD =====================
function calcularAntiguedad(fechaIngreso) {
    if (!fechaIngreso) return '-';

    const inicio = new Date(fechaIngreso);
    const hoy = new Date();

    let años = hoy.getFullYear() - inicio.getFullYear();
    let meses = hoy.getMonth() - inicio.getMonth();

    if (meses < 0) {
        años--;
        meses += 12;
    }

    if (años === 0 && meses === 0) {
        return 'Menos de 1 mes';
    } else if (años === 0) {
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else if (meses === 0) {
        return `${años} ${años === 1 ? 'año' : 'años'}`;
    } else {
        return `${años} ${años === 1 ? 'año' : 'años'}, ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
}

function setupValidation() {
    const tipoDocumento = document.getElementById('tipoDocumento');
    const numeroDocumento = document.getElementById('numeroDocumento');
    const telefono = document.getElementById('telefono');

    if (tipoDocumento && numeroDocumento) {
        // Validar cuando cambia el tipo o el número
        const validateDoc = () => {
            const tipo = tipoDocumento.value;
            const numero = numeroDocumento.value;

            if (tipo && numero) {
                const result = validateDocument(tipo, numero);
                showFieldError('numeroDocumento', result.valid ? '' : result.message);
            } else {
                showFieldError('numeroDocumento', '');
            }
        };

        tipoDocumento.addEventListener('change', validateDoc);
        numeroDocumento.addEventListener('input', validateDoc);
        numeroDocumento.addEventListener('blur', validateDoc);
    }

    if (telefono) {
        const validateTel = () => {
            const result = validatePhone(telefono.value);
            showFieldError('telefono', result.valid ? '' : result.message);
        };

        telefono.addEventListener('input', validateTel);
        telefono.addEventListener('blur', validateTel);
    }
}

window.validateDocument = validateDocument;
window.validatePhone = validatePhone;
window.showFieldError = showFieldError;
window.clearAllErrors = clearAllErrors;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.calcularAntiguedad = calcularAntiguedad;
window.setupValidation = setupValidation;

// Inicializar validaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setupValidation();
});

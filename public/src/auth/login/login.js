import authService from '../services/authService.js';
import { logger } from '../../utils/logger.js';

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.loginBtn = document.getElementById('loginBtn');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.forgotPasswordLink = document.getElementById('forgotPasswordLink');
        this.resetModal = document.getElementById('resetModal');
        this.closeResetModalBtn = document.getElementById('closeResetModal');
        this.resetForm = document.getElementById('resetForm');
        this.alertContainer = document.getElementById('alertContainer');
        this.rememberMe = document.getElementById('rememberMe');
        this.isLoading = false;
    }

    init() {
        logger.info('Inicializando página de login');
        this.attachEventListeners();
        this.loadRememberedEmail();
        this.checkIfAlreadyLogged();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));

        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());

        this.forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showResetModal();
        });

        this.closeResetModalBtn.addEventListener('click', () => this.hideResetModal());

        this.resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));

        this.resetModal.addEventListener('click', (e) => {
            if (e.target === this.resetModal) {
                this.hideResetModal();
            }
        });

        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
    }

    async handleLogin(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        this.isLoading = true;
        this.loginBtn.classList.add('loading');
        this.loginBtn.disabled = true;

        try {
            const email = this.emailInput.value.trim();
            const password = this.passwordInput.value;

            console.log('Intentando login con:', email);
            logger.info('Intentando login con:', email);

            const result = await authService.login(email, password);

            console.log('Resultado de login:', result);

            if (result && result.success) {
                console.log('Login exitoso');
                this.showAlert('¡Bienvenido! Iniciando sesión...', 'success');

                // Verificar que la sesión se guardó
                const savedSession = localStorage.getItem('textileflow_session');
                console.log('🔍 Verificando sesión guardada:', savedSession ? 'SÍ' : 'NO');

                if (!savedSession && result.userData) {
                    // Si no se guardó, guardarla manualmente
                    console.warn('⚠️ Sesión no guardada, guardando manualmente...');
                    const sessionData = {
                        uid: result.user.uid,
                        email: result.user.email,
                        nombre: result.userData.nombre || '',
                        apellido: result.userData.apellido || '',
                        displayName: result.userData.displayName || result.user.email,
                        rol: result.userData.rol || 'Empleado',
                        timestamp: Date.now()
                    };
                    localStorage.setItem('textileflow_session', JSON.stringify(sessionData));
                    console.log('✅ Sesión guardada manualmente:', sessionData);
                }

                if (this.rememberMe.checked) {
                    localStorage.setItem('textileflow_remembered_email', email);
                } else {
                    localStorage.removeItem('textileflow_remembered_email');
                }

                console.log('Redirigiendo a dashboard...');
                setTimeout(() => {
                    console.log('Ejecutando redirect a ./dashboard.html');
                    window.location.href = './dashboard.html';
                }, 1200);
            } else {
                console.error('Login fallido:', result);
                this.showAlert(result?.error || 'Error en login', 'error');
                logger.error('Error en login:', result?.error);
            }
        } catch (error) {
            console.error('Excepción en login:', error);
            this.showAlert('Error inesperado: ' + error.message, 'error');
            logger.error('Excepción en login:', error);
        } finally {
            this.isLoading = false;
            this.loginBtn.classList.remove('loading');
            this.loginBtn.disabled = false;
        }
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailError = document.getElementById('emailError');
        const formGroup = this.emailInput.parentElement.parentElement;

        if (!email) {
            emailError.textContent = 'El email es requerido';
            emailError.classList.add('show');
            formGroup.classList.add('error');
            return false;
        }

        if (!emailRegex.test(email)) {
            emailError.textContent = 'Email inválido';
            emailError.classList.add('show');
            formGroup.classList.add('error');
            return false;
        }

        emailError.classList.remove('show');
        formGroup.classList.remove('error');
        return true;
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const passwordError = document.getElementById('passwordError');
        const formGroup = this.passwordInput.parentElement.parentElement;

        if (!password) {
            passwordError.textContent = 'La contraseña es requerida';
            passwordError.classList.add('show');
            formGroup.classList.add('error');
            return false;
        }

        if (password.length < 6) {
            passwordError.textContent = 'Mínimo 6 caracteres';
            passwordError.classList.add('show');
            formGroup.classList.add('error');
            return false;
        }

        passwordError.classList.remove('show');
        formGroup.classList.remove('error');
        return true;
    }


    validateForm() {
        return this.validateEmail() && this.validatePassword();
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.getAttribute('type');
        const icon = this.togglePasswordBtn.querySelector('i');

        if (type === 'password') {
            this.passwordInput.setAttribute('type', 'text');
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            this.passwordInput.setAttribute('type', 'password');
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;

        let icon = '';
        switch (type) {
            case 'success':
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                icon = 'fas fa-exclamation-circle';
                break;
            case 'info':
                icon = 'fas fa-info-circle';
                break;
        }

        alert.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        this.alertContainer.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }

    showResetModal() {
        this.resetModal.style.display = 'flex';
        document.getElementById('resetEmail').focus();
    }

    hideResetModal() {
        this.resetModal.style.display = 'none';
        this.resetForm.reset();
    }

    async handleResetPassword(e) {
        e.preventDefault();

        const email = document.getElementById('resetEmail').value.trim();

        if (!email) {
            this.showAlert('Ingresa un email válido', 'error');
            return;
        }

        try {
            const result = await authService.resetPassword(email);

            if (result.success) {
                this.showAlert('Verifica tu email para recuperar tu contraseña', 'success');
                this.hideResetModal();
            } else {
                this.showAlert(result.error || 'Error al enviar email', 'error');
            }
        } catch (error) {
            this.showAlert('Error: ' + error.message, 'error');
        }
    }

    loadRememberedEmail() {
        const rememberedEmail = localStorage.getItem('textileflow_remembered_email');
        if (rememberedEmail) {
            this.emailInput.value = rememberedEmail;
            this.rememberMe.checked = true;
        }
    }

    checkIfAlreadyLogged() {
        const session = authService.getSession();
        if (session && authService.isAuthenticated()) {
            window.location.href = './dashboard.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginPage = new LoginPage();
    loginPage.init();
});

export default LoginPage;

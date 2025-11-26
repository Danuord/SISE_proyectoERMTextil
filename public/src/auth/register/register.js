import authService from '../services/authService.js';
import { logger } from '../../utils/logger.js';

class RegisterPage {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.alertContainer = document.getElementById('alertContainer');

        this.fullNameInput = document.getElementById('fullName');
        this.emailInput = document.getElementById('email');
        this.companyInput = document.getElementById('company');
        this.phoneInput = document.getElementById('phone');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.termsCheckbox = document.getElementById('terms');
        this.newsletterCheckbox = document.getElementById('newsletter');

        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

        this.googleRegisterBtn = document.getElementById('googleRegisterBtn');
        
        this.init();
    }

    init() {
        logger.info('Inicializando página de registro...');

        this.checkIfAlreadyLogged();

        this.form.addEventListener('submit', (e) => this.handleRegister(e));
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility('password'));
        this.toggleConfirmPasswordBtn.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));
        this.googleRegisterBtn.addEventListener('click', () => this.handleGoogleRegister());

        this.fullNameInput.addEventListener('blur', () => this.validateFullName());
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.phoneInput.addEventListener('blur', () => this.validatePhone());
        this.companyInput.addEventListener('blur', () => this.validateCompany());
        this.passwordInput.addEventListener('input', () => this.validatePassword());
        this.passwordInput.addEventListener('blur', () => this.validatePasswordMatch());
        this.confirmPasswordInput.addEventListener('blur', () => this.validatePasswordMatch());
        this.termsCheckbox.addEventListener('change', () => this.validateTerms());
    }

    checkIfAlreadyLogged() {
        const session = localStorage.getItem('textileflow_session');
        if (session) {
            logger.warn('Usuario ya está registrado, redirigiendo al dashboard');
            window.location.href = './dashboard.html';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const isFullNameValid = this.validateFullName();
        const isEmailValid = this.validateEmail();
        const isPhoneValid = this.validatePhone();
        const isCompanyValid = this.validateCompany();
        const isPasswordValid = this.validatePassword();
        const isPasswordMatchValid = this.validatePasswordMatch();
        const isTermsValid = this.validateTerms();
        
        if (!isFullNameValid || !isEmailValid || !isPhoneValid || !isCompanyValid || 
            !isPasswordValid || !isPasswordMatchValid || !isTermsValid) {
            this.showAlert('Por favor, completa correctamente todos los campos', 'error');
            return;
        }
        
        this.submitBtn.disabled = true;
        this.submitBtn.querySelector('.btn-text').style.display = 'none';
        this.submitBtn.querySelector('.btn-loader').style.display = 'inline';
        
        try {
            const userData = {
                email: this.emailInput.value.trim(),
                password: this.passwordInput.value,
                fullName: this.fullNameInput.value.trim(),
                company: this.companyInput.value.trim(),
                phone: this.phoneInput.value.trim(),
                newsletter: this.newsletterCheckbox.checked,
                createdAt: new Date().toISOString()
            };
            
            const result = await authService.register(userData);
            
            if (result.success) {
                logger.info('Registro exitoso', result);
               
                this.showAlert('Cuenta creada exitosamente. Iniciando sesión...', 'success');

                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 2000);
            } else {
                this.showAlert(result.error || 'Error al crear la cuenta', 'error');
                logger.error('Error en registro:', result.error);
                
                this.submitBtn.disabled = false;
                this.submitBtn.querySelector('.btn-text').style.display = 'inline';
                this.submitBtn.querySelector('.btn-loader').style.display = 'none';
            }
            
        } catch (error) {
            logger.error('Error en registro:', error);
            
            let errorMessage = 'Error al crear la cuenta';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email ya está registrado';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'La contraseña es muy débil';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showAlert(errorMessage, 'error');

            this.submitBtn.disabled = false;
            this.submitBtn.querySelector('.btn-text').style.display = 'inline';
            this.submitBtn.querySelector('.btn-loader').style.display = 'none';
        }
    }

    async handleGoogleRegister() {
        logger.info('Iniciando registro con Google...');
        
        try {
            const result = await authService.signInWithGoogle();
            
            if (result.isNewUser) {
                this.showAlert('Registro con Google exitoso', 'success');
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1500);
            } else {
                this.showAlert('Ya tienes cuenta, iniciando sesión...', 'info');
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1500);
            }
        } catch (error) {
            logger.error('Error en registro con Google:', error);
            this.showAlert('Error al registrarse con Google: ' + error.message, 'error');
        }
    }

    togglePasswordVisibility(fieldName) {
        const input = fieldName === 'password' ? this.passwordInput : this.confirmPasswordInput;
        const button = fieldName === 'password' ? this.togglePasswordBtn : this.toggleConfirmPasswordBtn;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            button.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    validateFullName() {
        const value = this.fullNameInput.value.trim();
        const formGroup = this.fullNameInput.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        
        if (!value) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El nombre completo es requerido';
            return false;
        }
        
        if (value.length < 3) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El nombre debe tener al menos 3 caracteres';
            return false;
        }
        
        if (value.length > 50) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El nombre no puede exceder 50 caracteres';
            return false;
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    validateEmail() {
        const value = this.emailInput.value.trim();
        const formGroup = this.emailInput.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!value) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El email es requerido';
            return false;
        }
        
        if (!emailRegex.test(value)) {
            formGroup.classList.add('error');
            errorEl.textContent = 'Email inválido';
            return false;
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    validateCompany() {
        const value = this.companyInput.value.trim();
        const formGroup = this.companyInput.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        
        if (!value) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El nombre de empresa es requerido';
            return false;
        }
        
        if (value.length < 2) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El nombre de empresa debe tener al menos 2 caracteres';
            return false;
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    validatePhone() {
        const value = this.phoneInput.value.trim();
        const formGroup = this.phoneInput.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        
        if (!value) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El teléfono es requerido';
            return false;
        }
        
        if (!phoneRegex.test(value)) {
            formGroup.classList.add('error');
            errorEl.textContent = 'Formato de teléfono inválido';
            return false;
        }
        
        if (value.replace(/\D/g, '').length < 7) {
            formGroup.classList.add('error');
            errorEl.textContent = 'El teléfono debe tener al menos 7 dígitos';
            return false;
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    validatePassword() {
        const value = this.passwordInput.value;
        const formGroup = this.passwordInput.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');

        strengthFill.className = 'strength-fill';
        
        if (!value) {
            formGroup.classList.add('error');
            errorEl.textContent = 'La contraseña es requerida';
            strengthText.textContent = '';
            return false;
        }
        
        if (value.length < 8) {
            formGroup.classList.add('error');
            errorEl.textContent = 'La contraseña debe tener al menos 8 caracteres';
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Muy débil';
            return false;
        }

        let strength = 0;

        if (/[A-Z]/.test(value)) strength++;
        if (/[a-z]/.test(value)) strength++;
        if (/\d/.test(value)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) strength++;
        if (value.length >= 12) strength++;
        
        if (strength <= 1) {
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Muy débil';
            formGroup.classList.add('error');
            errorEl.textContent = 'Contraseña muy débil, agrega mayúsculas, números y caracteres especiales';
            return false;
        } else if (strength <= 2) {
            strengthFill.classList.add('fair');
            strengthText.textContent = 'Débil';
        } else if (strength <= 3) {
            strengthFill.classList.add('good');
            strengthText.textContent = 'Buena';
        } else {
            strengthFill.classList.add('strong');
            strengthText.textContent = 'Muy fuerte';
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    validatePasswordMatch() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const formGroup = this.confirmPasswordInput.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        
        if (!confirmPassword) {
            formGroup.classList.add('error');
            errorEl.textContent = 'Por favor confirma tu contraseña';
            return false;
        }
        
        if (password !== confirmPassword) {
            formGroup.classList.add('error');
            errorEl.textContent = 'Las contraseñas no coinciden';
            return false;
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    validateTerms() {
        const formGroup = this.termsCheckbox.closest('.form-group');
        const errorEl = formGroup.querySelector('.error-message');
        
        if (!this.termsCheckbox.checked) {
            formGroup.classList.add('error');
            errorEl.textContent = 'Debes aceptar los términos y condiciones';
            return false;
        }
        
        formGroup.classList.remove('error');
        return true;
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        
        alertDiv.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        this.alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RegisterPage();
});

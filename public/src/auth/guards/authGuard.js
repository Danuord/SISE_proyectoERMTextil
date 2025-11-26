import authService from '../services/authService.js';
import { authStore } from '../../store/authStore.js';

class AuthGuard {

  static isAuthenticated() {
    const session = authService.getSession();
    return session !== null && authService.isAuthenticated();
  }


  static hasRole(role) {
    const state = authStore.getState();
    return state.userRole === role;
  }


  static hasPermission(permission) {
    return authStore.hasPermission(permission);
  }


  static hasAnyRole(roles) {
    const state = authStore.getState();
    return roles.includes(state.userRole);
  }


  static canActivate(requiredRole = null, requiredPermissions = []) {
    if (!this.isAuthenticated()) {
      console.warn('Usuario no autenticado');
      return false;
    }

    if (requiredRole && !this.hasRole(requiredRole)) {
      console.warn(`Rol requerido: ${requiredRole}`);
      return false;
    }

    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(perm => this.hasPermission(perm));
      if (!hasAllPermissions) {
        console.warn('Permisos insuficientes');
        return false;
      }
    }

    return true;
  }

  static redirectToLoginIfNotAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = './login.html';
      return true;
    }
    return false;
  }
}

export default AuthGuard;

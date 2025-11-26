class AuthStore {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userRole = null;
    this.userPermissions = [];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  getState() {
    return {
      currentUser: this.currentUser,
      isAuthenticated: this.isAuthenticated,
      userRole: this.userRole,
      userPermissions: this.userPermissions
    };
  }

  setUser(user, role, permissions) {
    this.currentUser = user;
    this.isAuthenticated = !!user;
    this.userRole = role;
    this.userPermissions = permissions || [];
    this.notify();
  }

  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userRole = null;
    this.userPermissions = [];
    this.notify();
  }

  hasPermission(permission) {
    return this.userPermissions.includes(permission);
  }

  hasRole(role) {
    return this.userRole === role;
  }
}

export const authStore = new AuthStore();
export default authStore;

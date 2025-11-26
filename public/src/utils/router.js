import AuthGuard from '../auth/guards/authGuard.js';

class Router {
  constructor() {
    this.routes = [];
    this.currentPath = window.location.pathname;
    this.notFoundCallback = null;
    this.beforeRouteChange = null;
  }

  route(path, handler, options = {}) {
    const { requireAuth = false, roles = [], permissions = [] } = options;
    this.routes.push({
      path,
      handler,
      requireAuth,
      roles,
      permissions,
      pattern: this.createPattern(path)
    });
  }

  navigate(path) {
    window.history.pushState(null, null, path);
    this.handleRouteChange();
  }

  async handleRouteChange() {
    const path = window.location.pathname;
    const route = this.findRoute(path);

    if (this.beforeRouteChange) {
      const canProceed = await this.beforeRouteChange(path);
      if (!canProceed) return;
    }

    if (route) {
      if (route.requireAuth && !AuthGuard.isAuthenticated()) {
        this.navigate('/login');
        return;
      }

      if (route.roles.length > 0 && !AuthGuard.hasAnyRole(route.roles)) {
        this.navigate('/dashboard');
        return;
      }

      if (route.permissions.length > 0) {
        const hasPermissions = route.permissions.every(perm => AuthGuard.hasPermission(perm));
        if (!hasPermissions) {
          this.navigate('/dashboard');
          return;
        }
      }

      route.handler(this.getParams(path, route.pattern));
    } else {
      this.handleNotFound();
    }
  }

  findRoute(path) {
    return this.routes.find(route => route.pattern.test(path));
  }

  createPattern(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '(?<$1>[^\/]+)');
    return new RegExp(`^${pattern}$`);
  }

  getParams(path, pattern) {
    const match = path.match(pattern);
    return match?.groups || {};
  }

  handleNotFound() {
    if (this.notFoundCallback) {
      this.notFoundCallback();
    } else {
      console.error('Ruta no encontrada:', window.location.pathname);
    }
  }

  setNotFoundHandler(callback) {
    this.notFoundCallback = callback;
  }

  setBeforeRouteChangeHandler(callback) {
    this.beforeRouteChange = callback;
  }

  init() {
    window.addEventListener('popstate', () => this.handleRouteChange());
    this.handleRouteChange();
  }
}

export const router = new Router();
export default router;

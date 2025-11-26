class PersistentLogger {
  constructor() {
    this.maxLogs = 100;
    this.loadLogs();
    
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;
    
    this.interceptConsoleLogs();
  }

  loadLogs() {
    try {
      const stored = localStorage.getItem('textileflow_logs');
      this.logs = stored ? JSON.parse(stored) : [];
    } catch {
      this.logs = [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem('textileflow_logs', JSON.stringify(this.logs.slice(-this.maxLogs)));
    } catch (e) {
      this.originalError('Error saving logs:', e);
    }
  }

  addLog(level, ...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      level,
      message,
      url: window.location.pathname
    };

    this.logs.push(logEntry);
    this.saveLogs();

    const originalMethod = this['original' + level.charAt(0).toUpperCase() + level.slice(1)] || this.originalLog;
    originalMethod.apply(console, args);
  }

  log(...args) {
    this.addLog('log', ...args);
  }

  error(...args) {
    this.addLog('error', ...args);
  }

  warn(...args) {
    this.addLog('warn', ...args);
  }

  info(...args) {
    this.addLog('info', ...args);
  }

  debug(...args) {
    this.addLog('debug', ...args);
  }

  interceptConsoleLogs() {
    const self = this;
    
    console.log = function(...args) {
      self.addLog('log', ...args);
    };

    console.error = function(...args) {
      self.addLog('error', ...args);
    };

    console.warn = function(...args) {
      self.addLog('warn', ...args);
    };
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('textileflow_logs');
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  displayLogs() {
    console.clear();
    console.log('%c=== PERSISTENT LOGS ===', 'color: blue; font-weight: bold; font-size: 14px');
    this.logs.forEach(log => {
      const style = log.level === 'error' ? 'color: red' : 
                   log.level === 'warn' ? 'color: orange' : 
                   'color: black';
      console.log(`%c[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`, style);
    });
    console.log('%c=== END LOGS ===', 'color: blue; font-weight: bold; font-size: 14px');
  }
}

window.persistentLogger = new PersistentLogger();

export default PersistentLogger;

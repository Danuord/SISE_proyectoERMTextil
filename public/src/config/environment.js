const isDevelopment = !window.location.hostname.includes('localhost') === false;

export const ENV = {
  isDevelopment,
  isProduction: !isDevelopment,

  FIREBASE_PROJECT_ID: 'textileflow-test',

  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,

  SESSION_TIMEOUT: 30 * 60 * 1000,
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000,
  
  STORAGE_PREFIX: 'textileflow_',
  
  LOG_LEVEL: isDevelopment ? 'debug' : 'error',
  ENABLE_CONSOLE_LOG: isDevelopment
};

export default ENV;

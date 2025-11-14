/**
 * Production-safe logger utility
 * Logs are only shown in development mode
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // Errors should always be logged for production monitoring
    // But we can sanitize sensitive information
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, only log error message, not full stack/details
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return {
            message: arg.message,
            name: arg.name
          };
        }
        if (typeof arg === 'object') {
          // Remove sensitive fields
          const { password, token, passwordHash, ...safe } = arg;
          return safe;
        }
        return arg;
      });
      console.error(...sanitized);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

module.exports = logger;


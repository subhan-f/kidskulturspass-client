/**
 * Helper functions for debugging - only active in development
 */

export const enableDebugLogging = () => {
  if (import.meta.env.DEV) {
    const originalError = console.error;
    console.error = (...args) => {
      const component = new Error().stack?.split('\n')[2]?.match(/[A-Za-z]+\.jsx/)?.[0] || 'Unknown';
      originalError.apply(console, [`[${component}]`, ...args]);
    };
  }
};

export const logMount = (componentName) => {
  if (import.meta.env.DEV) {
    console.log(`[${componentName}] mounted`);
    return () => console.log(`[${componentName}] unmounted`);
  }
  return () => {};
};

export const initDebug = () => {
  if (import.meta.env.DEV) {
    enableDebugLogging();
    window.debugApi = {
      checkSession: async () => {
        try {
          const response = await fetch('/auth/debug-session', { credentials: 'include' });
          return await response.json();
        } catch (error) {
          return { error: error.message };
        }
      },
      localStorage: {
        get: (key) => localStorage.getItem(key),
        set: (key, value) => localStorage.setItem(key, value),
        remove: (key) => localStorage.removeItem(key),
        all: () => Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {})
      }
    };
  }
};

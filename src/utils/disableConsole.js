// Disable console.log in production
if (import.meta.env.PROD) {
  // Override console methods to prevent logging in production
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.error and console.warn for important error tracking
  // console.error = () => {};
  // console.warn = () => {};
}


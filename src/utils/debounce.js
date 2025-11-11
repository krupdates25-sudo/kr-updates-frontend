// Debounce utility to prevent excessive API calls
export const debounce = (func, delay = 300) => {
  let timeoutId;
  let lastArgs;
  let lastThis;

  const debounced = function (...args) {
    lastThis = this;
    lastArgs = args;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(lastThis, lastArgs);
    }, delay);
  };

  // Add immediate execution option
  debounced.immediate = function (...args) {
    clearTimeout(timeoutId);
    return func.apply(this, args);
  };

  // Add cancel method
  debounced.cancel = function () {
    clearTimeout(timeoutId);
  };

  return debounced;
};

// Throttle utility for rate limiting
export const throttle = (func, limit = 1000) => {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Cache utility for API responses
export class ApiCache {
  constructor(maxSize = 50, ttl = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export default debounce;

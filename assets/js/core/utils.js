/**
 * Core Utilities
 * Formatting helpers, URL helpers, toast dispatchers, and debounce logic.
 */

window.StoreUtils = {
  /**
   * Format numbers to Moroccan Dirhams (MAD)
   */
  formatMoney(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "0 MAD";
    const num = Math.round(Number(amount));
    // Format with thousands separator if needed
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} MAD`;
  },

  /**
   * Calculate discount percentage
   */
  getDiscountPercentage(price, compareAtPrice) {
    if (!compareAtPrice || compareAtPrice <= price) return null;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  },

  /**
   * Parse URL Query parameters into an object
   */
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Update or set a URL query parameter without page reload
   */
  updateUrlParam(key, value) {
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    window.history.replaceState({}, "", url.toString());
  },

  /**
   * Debounce execution
   */
  debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Show toast notification
   */
  showToast(message, type = "info", duration = 3500) {
    if (window.ToastComponent) {
      window.ToastComponent.show(message, type, duration);
    } else {
      console.log(`[Toast] [${type.toUpperCase()}] ${message}`);
    }
  },

  /**
   * Generate clean slug
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
};

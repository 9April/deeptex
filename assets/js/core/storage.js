/**
 * Storage Manager
 * Safe localStorage wrapper with JSON serialization & error recovery.
 */

window.StoreStorage = {
  KEYS: {
    CART: "atelier_cart_v1",
    WISHLIST: "atelier_wishlist_v1",
    RECENTLY_VIEWED: "atelier_recent_v1",
    ORDERS: "atelier_orders_v1",
    DISCOUNT: "atelier_applied_discount_v1",
    ORDER_NOTE: "atelier_order_note_v1"
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Storage get error for key: ${key}`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage set error for key: ${key}`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Storage remove error for key: ${key}`, e);
      return false;
    }
  }
};

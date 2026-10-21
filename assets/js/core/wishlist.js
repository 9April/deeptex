/**
 * Wishlist Engine
 * Manages saved products in LocalStorage with reactivity, events, and count badges.
 */

window.StoreWishlist = {
  items: [],

  init() {
    this.items = StoreStorage.get(StoreStorage.KEYS.WISHLIST, []);
    this.emitChange();
  },

  has(productId) {
    return this.items.includes(productId);
  },

  toggle(productId) {
    const product = window.STORE_PRODUCTS.find(p => p.id === productId);
    const productName = product ? product.name : "Article";

    if (this.has(productId)) {
      this.items = this.items.filter(id => id !== productId);
      StoreUtils.showToast(`"${productName}" retiré de vos favoris.`, "info");
    } else {
      this.items.push(productId);
      StoreUtils.showToast(`"${productName}" ajouté à vos favoris !`, "success");
    }

    this.save();
    return this.has(productId);
  },

  remove(productId) {
    this.items = this.items.filter(id => id !== productId);
    this.save();
  },

  getProducts() {
    return window.STORE_PRODUCTS.filter(p => this.items.includes(p.id));
  },

  getCount() {
    return this.items.length;
  },

  save() {
    StoreStorage.set(StoreStorage.KEYS.WISHLIST, this.items);
    this.emitChange();
  },

  emitChange() {
    window.dispatchEvent(new CustomEvent("wishlist:updated", {
      detail: {
        items: this.items,
        count: this.getCount()
      }
    }));
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.StoreWishlist.init();
});

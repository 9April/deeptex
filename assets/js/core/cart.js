/**
 * Shopping Cart State Machine & Engine
 * Supports variant selection (color/size), SKU-level items, inventory checks,
 * Moroccan free shipping threshold meter, discount coupons, and event-driven UI updates.
 */

window.StoreCart = {
  items: [],
  discount: null,
  orderNote: "",

  init() {
    this.items = StoreStorage.get(StoreStorage.KEYS.CART, []);
    this.discount = StoreStorage.get(StoreStorage.KEYS.DISCOUNT, null);
    this.orderNote = StoreStorage.get(StoreStorage.KEYS.ORDER_NOTE, "");
    this.emitChange();
  },

  /**
   * Add a product variant to cart
   */
  addItem({ productId, colorCode, size, quantity = 1, openDrawer = true }) {
    const product = window.STORE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      StoreUtils.showToast("Produit introuvable.", "error");
      return false;
    }

    // Find specific variant
    const variant = product.variants.find(v => v.color === colorCode && v.size === size);
    if (!variant) {
      StoreUtils.showToast("Cette combinaison n'est pas disponible.", "error");
      return false;
    }

    if (variant.stock <= 0) {
      StoreUtils.showToast("Cet article est en rupture de stock.", "error");
      return false;
    }

    // Resolve color object
    const colorObj = product.colors.find(c => c.code === colorCode) || product.colors[0];
    const image = (product.images[colorCode] && product.images[colorCode][0]) || colorObj.image || product.images[Object.keys(product.images)[0]][0];

    // Check if variant is already in cart
    const existingIndex = this.items.findIndex(item => item.variantId === variant.id);

    if (existingIndex > -1) {
      const newQty = this.items[existingIndex].quantity + quantity;
      if (newQty > variant.stock) {
        StoreUtils.showToast(`Stock maximum atteint (${variant.stock} articles disponibles).`, "warning");
        this.items[existingIndex].quantity = variant.stock;
      } else {
        this.items[existingIndex].quantity = newQty;
      }
    } else {
      const initialQty = Math.min(quantity, variant.stock);
      this.items.push({
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        color: colorCode,
        colorName: colorObj.name,
        size: size,
        sku: variant.sku,
        price: variant.price || product.price,
        image: image,
        quantity: initialQty,
        maxStock: variant.stock
      });
    }

    this.save();
    StoreUtils.showToast(`${product.name} (${colorObj.name} / ${size}) ajouté au panier !`, "success");

    if (openDrawer && window.CartDrawerComponent) {
      window.CartDrawerComponent.open();
    }

    return true;
  },

  /**
   * Add a customized bundle pack (e.g. Pack 3 T-Shirts) to cart
   */
  addBundleItem({ productId = 'pack-trio-tshirts', bundleName, price = 599, compareAtPrice = 780, image, bundleItems = [], quantity = 1, openDrawer = true }) {
    const bundleVariantId = `pack-trio-${Date.now()}`;
    const product = (window.STORE_PRODUCTS || []).find(p => p.id === productId) || {
      id: productId,
      name: bundleName || 'Pack 3 T-Shirts Personnalisable',
      price: price,
      compareAtPrice: compareAtPrice
    };

    const bundleItem = {
      variantId: bundleVariantId,
      productId: product.id,
      name: bundleName || product.name,
      slug: product.slug || 'pack-trio-tshirts',
      isBundle: true,
      price: price,
      compareAtPrice: compareAtPrice,
      image: image || 'assets/images/products/t-shirts/tshirt-Pack-3.jpg',
      quantity: quantity,
      maxStock: 50,
      bundleItems: bundleItems // Array of { slot, productId, productName, colorCode, colorName, colorHex, size, sku, image }
    };

    this.items.push(bundleItem);
    this.save();

    const savings = (compareAtPrice && compareAtPrice > price) ? ` (Économie : ${compareAtPrice - price} MAD)` : '';
    StoreUtils.showToast(`${bundleItem.name} ajouté au panier !${savings}`, "success");

    if (openDrawer && window.CartDrawerComponent) {
      window.CartDrawerComponent.open();
    }

    return true;
  },

  /**
   * Update quantity of a line item
   */
  updateQuantity(variantId, newQuantity) {
    const itemIndex = this.items.findIndex(item => item.variantId === variantId);
    if (itemIndex === -1) return;

    if (newQuantity <= 0) {
      this.removeItem(variantId);
      return;
    }

    const item = this.items[itemIndex];
    if (newQuantity > item.maxStock) {
      StoreUtils.showToast(`Désolé, seulement ${item.maxStock} pièces disponibles.`, "warning");
      item.quantity = item.maxStock;
    } else {
      item.quantity = newQuantity;
    }

    this.save();
  },

  /**
   * Remove item from cart
   */
  removeItem(variantId) {
    const item = this.items.find(i => i.variantId === variantId);
    this.items = this.items.filter(i => i.variantId !== variantId);
    this.save();
    if (item) {
      StoreUtils.showToast(`"${item.name}" retiré du panier.`, "info");
    }
  },

  /**
   * Change variant (e.g. Size or Color) from inside the cart
   */
  updateItemVariant(oldVariantId, newColorCode, newSize) {
    const oldItem = this.items.find(i => i.variantId === oldVariantId);
    if (!oldItem) return false;

    const product = window.STORE_PRODUCTS.find(p => p.id === oldItem.productId);
    if (!product) return false;

    const newVariant = product.variants.find(v => v.color === newColorCode && v.size === newSize);
    if (!newVariant || newVariant.stock <= 0) {
      StoreUtils.showToast("Cette variante n'est pas disponible en stock.", "error");
      return false;
    }

    const qty = Math.min(oldItem.quantity, newVariant.stock);
    this.removeItem(oldVariantId);
    return this.addItem({
      productId: product.id,
      colorCode: newColorCode,
      size: newSize,
      quantity: qty,
      openDrawer: false
    });
  },

  /**
   * Clear all items in cart
   */
  clear() {
    this.items = [];
    this.discount = null;
    this.orderNote = "";
    this.save();
    StoreStorage.remove(StoreStorage.KEYS.DISCOUNT);
    StoreStorage.remove(StoreStorage.KEYS.ORDER_NOTE);
  },

  /**
   * Set order note
   */
  setOrderNote(note) {
    this.orderNote = note;
    StoreStorage.set(StoreStorage.KEYS.ORDER_NOTE, note);
  },

  /**
   * Apply a discount coupon
   */
  applyCoupon(code) {
    if (!code) return { success: false, message: "Veuillez saisir un code promo." };
    const cleanCode = code.trim().toUpperCase();
    const coupon = window.STORE_CONFIG.coupons[cleanCode];

    if (!coupon) {
      return { success: false, message: "Code promotionnel invalide ou expiré." };
    }

    const subtotal = this.getSubtotal();
    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return {
        success: false,
        message: `Ce code nécessite un montant minimum de ${StoreUtils.formatMoney(coupon.minSpend)}.`
      };
    }

    this.discount = {
      code: cleanCode,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description
    };

    StoreStorage.set(StoreStorage.KEYS.DISCOUNT, this.discount);
    this.emitChange();
    return { success: true, message: `Code ${cleanCode} appliqué avec succès !` };
  },

  /**
   * Remove active discount
   */
  removeCoupon() {
    this.discount = null;
    StoreStorage.remove(StoreStorage.KEYS.DISCOUNT);
    this.emitChange();
  },

  /**
   * Cart totals calculations
   */
  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getDiscountAmount() {
    if (!this.discount) return 0;
    const subtotal = this.getSubtotal();
    if (this.discount.type === "percentage") {
      return Math.round((subtotal * this.discount.value) / 100);
    }
    return 0;
  },

  getShippingCost() {
    if (this.items.length === 0) return 0;
    
    // Free shipping coupon
    if (this.discount && this.discount.type === "shipping") return 0;

    const subtotalAfterDiscount = this.getSubtotal() - this.getDiscountAmount();
    if (subtotalAfterDiscount >= window.STORE_CONFIG.shipping.freeThreshold) {
      return 0;
    }
    return window.STORE_CONFIG.shipping.standardCost;
  },

  getShippingProgress() {
    const subtotal = this.getSubtotal();
    const threshold = window.STORE_CONFIG.shipping.freeThreshold;
    const remaining = Math.max(0, threshold - subtotal);
    const percentage = Math.min(100, Math.round((subtotal / threshold) * 100));

    return {
      threshold,
      current: subtotal,
      remaining,
      percentage,
      isFree: subtotal >= threshold && this.items.length > 0
    };
  },

  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const shipping = this.getShippingCost();
    return Math.max(0, subtotal - discount + shipping);
  },

  /**
   * Persist and notify listeners
   */
  save() {
    StoreStorage.set(StoreStorage.KEYS.CART, this.items);
    this.emitChange();
  },

  emitChange() {
    window.dispatchEvent(new CustomEvent("cart:updated", {
      detail: {
        items: this.items,
        count: this.getCount(),
        subtotal: this.getSubtotal(),
        discount: this.getDiscountAmount(),
        shipping: this.getShippingCost(),
        total: this.getTotal(),
        shippingProgress: this.getShippingProgress(),
        appliedDiscount: this.discount
      }
    }));
  }
};

// Auto-initialize cart on script load
document.addEventListener("DOMContentLoaded", () => {
  window.StoreCart.init();
});

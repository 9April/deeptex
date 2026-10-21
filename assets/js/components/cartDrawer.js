/**
 * Cart Drawer Component
 * Interactive slide-out cart drawer with live quantity updates, Moroccan free shipping meter,
 * line-item removal, and direct checkout link.
 */

window.CartDrawerComponent = {
  container: null,

  init() {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "cart-drawer-root";
    this.container.className = "cart-drawer";
    document.body.appendChild(this.container);

    this.render();

    window.addEventListener("cart:updated", () => {
      this.render();
    });
  },

  open() {
    this.init();
    this.container.classList.add("open");
    document.body.classList.add("overflow-locked");
  },

  close() {
    if (!this.container) return;
    this.container.classList.remove("open");
    document.body.classList.remove("overflow-locked");
  },

  render() {
    if (!this.container) return;

    const cart = window.StoreCart;
    if (!cart) return;

    const items = cart.items;
    const count = cart.getCount();
    const subtotal = cart.getSubtotal();
    const shippingProgress = cart.getShippingProgress();

    this.container.innerHTML = `
      <div class="cart-drawer-panel">
        <!-- Header -->
        <div class="cart-drawer-header">
          <div class="cart-drawer-title">
            VOTRE PANIER (${count})
          </div>
          <button class="action-btn" onclick="window.CartDrawerComponent.close()" aria-label="Fermer le panier">✕</button>
        </div>

        <!-- Free Shipping Progress Bar (Morocco) -->
        <div class="free-shipping-meter">
          <div class="meter-text">
            <span>🚚</span>
            <span>
              ${shippingProgress.isFree 
                ? '<strong>Félicitations !</strong> Vous bénéficiez de la livraison gratuite au Maroc !' 
                : `Plus que <strong>${StoreUtils.formatMoney(shippingProgress.remaining)}</strong> pour la livraison gratuite`}
            </span>
          </div>
          <div class="meter-bar-container">
            <div class="meter-bar-fill ${shippingProgress.isFree ? 'achieved' : ''}" style="width: ${shippingProgress.percentage}%;"></div>
          </div>
        </div>

        <!-- Items Container -->
        <div class="cart-drawer-items">
          ${items.length === 0 ? `
            <div class="cart-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <h4 style="margin-bottom: 8px;">Votre panier est vide</h4>
              <p style="font-size: 0.88rem; margin-bottom: 20px;">Découvrez nos t-shirts essentiels et commencez vos achats.</p>
              <a href="shop.html" class="btn btn-primary btn-sm" onclick="window.CartDrawerComponent.close()">Découvrir la boutique</a>
            </div>
          ` : `
            ${items.map(item => `
              <div class="cart-item" data-variant-id="${item.variantId}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                  <a href="product.html?id=${item.productId}${item.color ? `&color=${item.color}` : ''}" class="cart-item-title" onclick="window.CartDrawerComponent.close()">
                    ${item.name}
                  </a>
                  ${item.isBundle && item.bundleItems ? `
                    <div class="cart-bundle-badge" style="display: inline-block; font-size: 0.68rem; font-weight: 700; background: var(--color-dark); color: #fff; padding: 2px 6px; border-radius: 2px; margin: 3px 0; text-transform: uppercase;">
                      ⚡ Pack Trio (3 Pièces)
                    </div>
                    <div class="cart-bundle-items-preview" style="font-size: 0.74rem; color: var(--color-text-secondary); margin: 4px 0 6px; line-height: 1.35; background: var(--color-bg-secondary); padding: 6px 8px; border-radius: 4px; border-left: 2px solid var(--color-dark);">
                      ${item.bundleItems.map((bi, i) => `
                        <div style="margin-bottom: 2px;">
                          <strong>#${i+1}</strong> ${bi.productName.replace('T-Shirt ', '')} • <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${bi.colorHex || '#111'};"></span>${bi.colorName}</span> (<strong>${bi.size}</strong>)
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="cart-item-variant">
                      ${item.colorName || ''} ${item.size ? `• Taille: <strong>${item.size}</strong>` : ''}
                    </div>
                  `}
                  <div class="cart-item-price">
                    ${StoreUtils.formatMoney(item.price)}
                    ${item.compareAtPrice && item.compareAtPrice > item.price ? `
                      <span style="font-size: 0.78rem; text-decoration: line-through; color: var(--color-text-muted); margin-left: 6px;">
                        ${StoreUtils.formatMoney(item.compareAtPrice)}
                      </span>
                    ` : ''}
                  </div>
                  
                  <div class="qty-control">
                    <button class="qty-btn" onclick="window.StoreCart.updateQuantity('${item.variantId}', ${item.quantity - 1})">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="window.StoreCart.updateQuantity('${item.variantId}', ${item.quantity + 1})">+</button>
                  </div>
                </div>
                <button class="cart-item-remove" onclick="window.StoreCart.removeItem('${item.variantId}')" title="Supprimer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            `).join('')}
          `}
        </div>

        <!-- Drawer Footer -->
        ${items.length > 0 ? `
          <div class="cart-drawer-footer">
            <div class="cart-summary-row">
              <span>Sous-total</span>
              <span class="font-heading" style="font-weight: 600;">${StoreUtils.formatMoney(subtotal)}</span>
            </div>
            <div class="cart-summary-row" style="font-size: 0.8rem; color: var(--color-text-muted);">
              <span>Livraison estimée (Maroc)</span>
              <span>${shippingProgress.isFree ? '<strong style="color: var(--color-success)">GRATUITE</strong>' : '35 MAD (calculée au paiement)'}</span>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <a href="cart.html" class="btn btn-secondary btn-full btn-sm" onclick="window.CartDrawerComponent.close()">
                Voir le panier
              </a>
              <a href="checkout.html" class="btn btn-primary btn-full btn-sm">
                Commander • ${StoreUtils.formatMoney(subtotal)}
              </a>
            </div>

            <div style="text-align: center; font-size: 0.72rem; color: var(--color-text-muted); margin-top: 4px;">
              🔒 Paiement à la livraison (Cash on Delivery) disponible
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Close on backdrop click
    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.CartDrawerComponent.init();
});

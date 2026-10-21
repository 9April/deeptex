/**
 * Dedicated Cart Page Controller
 * Table view, shipping meter, delivery instructions note, order summary, coupon application.
 */

window.CartPageController = {
  init() {
    if (window.HeaderComponent) window.HeaderComponent.mount();
    if (window.FooterComponent) window.FooterComponent.mount();

    this.render();

    window.addEventListener("cart:updated", () => {
      this.render();
    });
  },

  render() {
    const container = document.getElementById("cart-page-container");
    if (!container) return;

    const cart = window.StoreCart;
    if (!cart) return;

    const items = cart.items;
    const subtotal = cart.getSubtotal();
    const discount = cart.getDiscountAmount();
    const shipping = cart.getShippingCost();
    const total = cart.getTotal();
    const shippingProgress = cart.getShippingProgress();
    const appliedDiscount = cart.discount;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="container section-spacing text-center">
          <div style="max-width: 480px; margin: 0 auto; padding: 48px 24px; background-color: var(--color-bg-secondary);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h2 style="font-size: 1.8rem; margin-bottom: 12px;">Votre panier est actuellement vide</h2>
            <p style="margin-bottom: 24px;">Explorez nos collections pour trouver la pièce idéale.</p>
            <a href="shop.html" class="btn btn-primary">DÉCOUVRIR LES T-SHIRTS</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="container section-spacing">
        <h1 style="font-size: 2.2rem; margin-bottom: 24px;">VOTRE PANIER</h1>

        <!-- Free Shipping Meter -->
        <div class="free-shipping-meter" style="border: 1px solid var(--color-border); margin-bottom: 32px; padding: 18px 24px;">
          <div class="meter-text" style="font-size: 0.9rem;">
            <span>🚚</span>
            <span>
              ${shippingProgress.isFree 
                ? '<strong>Félicitations !</strong> Vous bénéficiez de la livraison gratuite au Maroc !' 
                : `Ajoutez encore <strong>${StoreUtils.formatMoney(shippingProgress.remaining)}</strong> pour bénéficier de la livraison offerte.`}
            </span>
          </div>
          <div class="meter-bar-container" style="height: 6px; margin-top: 10px;">
            <div class="meter-bar-fill ${shippingProgress.isFree ? 'achieved' : ''}" style="width: ${shippingProgress.percentage}%;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 48px; align-items: start;">
          <!-- Items Table -->
          <div>
            <div style="border-bottom: 2px solid var(--color-dark); padding-bottom: 12px; display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; font-family: var(--font-heading); font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              <span>Article</span>
              <span class="text-center">Prix</span>
              <span class="text-center">Quantité</span>
              <span class="text-right">Total</span>
            </div>

            <div style="display: flex; flex-direction: column;">
              ${items.map(item => `
                <div style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; align-items: center; padding: 24px 0; border-bottom: 1px solid var(--color-border);">
                  <!-- Product details -->
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 105px; object-fit: cover; background: #f5f5f5;">
                    <div>
                      <a href="product.html?id=${item.productId}${item.color ? `&color=${item.color}` : ''}" class="font-heading" style="font-weight: 600; font-size: 1rem;">
                        ${item.name}
                      </a>
                      ${item.isBundle && item.bundleItems ? `
                        <div class="cart-bundle-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; background: var(--color-dark); color: #fff; padding: 2px 8px; border-radius: 2px; margin: 4px 0; text-transform: uppercase;">
                          ⚡ Pack Trio (3 T-Shirts)
                        </div>
                        <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.4; background: var(--color-bg-secondary); padding: 8px 12px; border-radius: 4px; border-left: 2px solid var(--color-dark);">
                          ${item.bundleItems.map((bi, i) => `
                            <div style="margin-bottom: 3px;">
                              <strong>Pièce #${i+1} :</strong> ${bi.productName.replace('T-Shirt ', '')} • <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${bi.colorHex || '#111'};"></span>${bi.colorName}</span> (Taille: <strong>${bi.size}</strong>)
                            </div>
                          `).join('')}
                        </div>
                      ` : `
                        <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 4px;">
                          Couleur : <strong>${item.colorName || ''}</strong> ${item.size ? `| Taille : <strong>${item.size}</strong>` : ''}
                        </div>
                      `}
                      <button style="font-size: 0.78rem; color: var(--color-sale); text-decoration: underline; margin-top: 6px; cursor: pointer;"
                              onclick="window.StoreCart.removeItem('${item.variantId}')">
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <!-- Unit Price -->
                  <div class="text-center font-heading" style="font-weight: 600;">
                    ${StoreUtils.formatMoney(item.price)}
                    ${item.compareAtPrice && item.compareAtPrice > item.price ? `
                      <div style="font-size: 0.78rem; text-decoration: line-through; color: var(--color-text-muted); margin-top: 2px;">
                        ${StoreUtils.formatMoney(item.compareAtPrice)}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Qty -->
                  <div class="text-center">
                    <div class="qty-control">
                      <button class="qty-btn" onclick="window.StoreCart.updateQuantity('${item.variantId}', ${item.quantity - 1})">-</button>
                      <span class="qty-value">${item.quantity}</span>
                      <button class="qty-btn" onclick="window.StoreCart.updateQuantity('${item.variantId}', ${item.quantity + 1})">+</button>
                    </div>
                  </div>

                  <!-- Row Total -->
                  <div class="text-right font-heading" style="font-weight: 700; font-size: 1.05rem;">
                    ${StoreUtils.formatMoney(item.price * item.quantity)}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Special instructions textarea -->
            <div style="margin-top: 32px;">
              <label class="form-label" for="cart-order-note">Instructions de livraison spéciales :</label>
              <textarea id="cart-order-note" class="form-textarea" rows="3" placeholder="Code d'entrée, instructions d'accès pour le livreur...">${cart.orderNote || ''}</textarea>
            </div>
          </div>

          <!-- Order Summary Card -->
          <div style="background-color: var(--color-bg-secondary); padding: 32px; border: 1px solid var(--color-border);">
            <h3 style="font-size: 1.25rem; margin-bottom: 20px; text-transform: uppercase;">Résumé du Panier</h3>

            <!-- Coupon Input -->
            <div style="margin-bottom: 24px;">
              <div style="display: flex; gap: 8px;">
                <input type="text" id="cart-coupon-input" class="form-input" placeholder="Code promo (ex: WELCOME10)" style="text-transform: uppercase;" value="${appliedDiscount ? appliedDiscount.code : ''}">
                <button class="btn btn-secondary btn-sm" id="cart-apply-coupon-btn">Appliquer</button>
              </div>
              ${appliedDiscount ? `
                <div style="font-size: 0.8rem; color: var(--color-success); margin-top: 6px; display: flex; justify-content: space-between;">
                  <span>✓ ${appliedDiscount.code} appliqué (${appliedDiscount.description})</span>
                  <button style="color: var(--color-sale); text-decoration: underline;" onclick="window.StoreCart.removeCoupon()">Retirer</button>
                </div>
              ` : `
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 6px;">
                  💡 Astuce : Utilisez le code <strong>WELCOME10</strong> pour 10% de réduction.
                </div>
              `}
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); font-size: 0.95rem;">
              <div style="display: flex; justify-content: space-between;">
                <span>Sous-total</span>
                <span class="font-heading" style="font-weight: 600;">${StoreUtils.formatMoney(subtotal)}</span>
              </div>

              ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; color: var(--color-sale);">
                  <span>Réduction (${appliedDiscount.code})</span>
                  <span class="font-heading" style="font-weight: 600;">-${StoreUtils.formatMoney(discount)}</span>
                </div>
              ` : ''}

              <div style="display: flex; justify-content: space-between;">
                <span>Frais de livraison (Maroc)</span>
                <span>${shipping === 0 ? '<strong style="color: var(--color-success);">GRATUIT</strong>' : StoreUtils.formatMoney(shipping)}</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0; font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700;">
              <span>Total estimé</span>
              <span>${StoreUtils.formatMoney(total)}</span>
            </div>

            <a href="checkout.html" class="btn btn-primary btn-full btn-lg" style="margin-bottom: 12px;">
              PASSER LA COMMANDE
            </a>

            <div style="text-align: center; font-size: 0.78rem; color: var(--color-text-muted);">
              Taxes incluses. Paiement à la livraison (Cash on Delivery) accepté partout au Maroc.
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindCartPageEvents();
  },

  bindCartPageEvents() {
    // Note change
    const noteEl = document.getElementById("cart-order-note");
    if (noteEl) {
      noteEl.addEventListener("input", (e) => {
        window.StoreCart.setOrderNote(e.target.value);
      });
    }

    // Coupon button
    const couponBtn = document.getElementById("cart-apply-coupon-btn");
    const couponInput = document.getElementById("cart-coupon-input");
    if (couponBtn && couponInput) {
      couponBtn.addEventListener("click", () => {
        const code = couponInput.value.trim();
        const res = window.StoreCart.applyCoupon(code);
        if (res.success) {
          StoreUtils.showToast(res.message, "success");
        } else {
          StoreUtils.showToast(res.message, "error");
        }
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.CartPageController.init();
});

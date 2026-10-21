/**
 * Checkout Page Controller
 * 2-column Shopify-inspired layout with Moroccan market fields (City select, Phone format, COD payment).
 */

window.CheckoutController = {
  selectedPayment: "cod", // 'cod' (Cash on delivery) or 'card'

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById("checkout-page-container");
    if (!container) return;

    const cart = window.StoreCart;
    const items = (cart && cart.items) || [];
    const config = window.STORE_CONFIG;

    if (items.length === 0) {
      container.innerHTML = `
        <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 40px 20px;">
          <div>
            <h2 style="margin-bottom: 12px;">Votre panier est vide</h2>
            <p style="margin-bottom: 24px;">Veuillez ajouter des articles à votre panier avant de passer commande.</p>
            <a href="shop.html" class="btn btn-primary">Retour à la boutique</a>
          </div>
        </div>
      `;
      return;
    }

    const subtotal = cart.getSubtotal();
    const discount = cart.getDiscountAmount();
    const shipping = cart.getShippingCost();
    const total = cart.getTotal();
    const appliedDiscount = cart.discount;

    container.innerHTML = `
      <div class="checkout-layout">
        <!-- Main Form Left -->
        <main class="checkout-main">
          <!-- Logo & Back to Cart -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
            <a href="index.html" class="brand-logo">
              <span>${config.brandName}</span>
              <span class="brand-logo-sub">${config.brandSubtitle}</span>
            </a>
            <a href="cart.html" style="font-size: 0.84rem; text-decoration: underline; color: var(--color-text-secondary);">
              ← Retour au Panier
            </a>
          </div>

          <form id="checkout-form" onsubmit="window.CheckoutController.handleSubmit(event)">
            <!-- 1. Contact Information -->
            <div style="margin-bottom: 36px;">
              <h2 class="checkout-step-title">1. Coordonnées de Contact</h2>
              
              <div class="form-group">
                <label class="form-label" for="checkout-email">Adresse Email *</label>
                <input type="email" id="checkout-email" class="form-input" placeholder="exemple@email.com" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="checkout-phone">Numéro de Téléphone (Maroc) *</label>
                <input type="tel" id="checkout-phone" class="form-input" placeholder="06 12 34 56 78 ou +212 6..." required pattern="^((\\+212|0)[5-7]\\d{8})$" title="Veuillez entrer un numéro de téléphone marocain valide (ex: 0612345678)">
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">
                  Nécessaire pour la coordination avec le livreur lors de la livraison.
                </div>
              </div>
            </div>

            <!-- 2. Shipping Address in Morocco -->
            <div style="margin-bottom: 36px;">
              <h2 class="checkout-step-title">2. Adresse de Livraison au Maroc</h2>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="checkout-first-name">Prénom *</label>
                  <input type="text" id="checkout-first-name" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="checkout-last-name">Nom *</label>
                  <input type="text" id="checkout-last-name" class="form-input" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="checkout-address">Adresse (Rue, Numéro, Quartier) *</label>
                <input type="text" id="checkout-address" class="form-input" placeholder="Ex: 45 Boulevard Zerktouni, Quartier Gauthier" required>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="checkout-apartment">Appartement, Étage, Bâtiment</label>
                  <input type="text" id="checkout-apartment" class="form-input" placeholder="Appt 4, 2ème étage">
                </div>

                <div class="form-group">
                  <label class="form-label" for="checkout-city">Ville au Maroc *</label>
                  <select id="checkout-city" class="form-select" required>
                    <option value="" disabled selected>Sélectionnez votre ville...</option>
                    ${config.moroccanCities.map(city => `
                      <option value="${city}">${city}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="checkout-postal">Code Postal (optionnel)</label>
                  <input type="text" id="checkout-postal" class="form-input" placeholder="Ex: 20000">
                </div>
                <div class="form-group">
                  <label class="form-label">Pays</label>
                  <input type="text" class="form-input" value="Maroc 🇲🇦" disabled style="background-color: var(--color-bg-secondary);">
                </div>
              </div>
            </div>

            <!-- 3. Delivery Method -->
            <div style="margin-bottom: 36px;">
              <h2 class="checkout-step-title">3. Mode de Livraison</h2>
              <div style="border: 1px solid var(--color-dark); padding: 16px; background-color: var(--color-bg-secondary); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; font-size: 0.95rem;">Livraison Express Maroc (24 à 48h ouvrables)</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px;">
                    Expédié depuis nos ateliers de Casablanca avec suivi SMS
                  </div>
                </div>
                <div class="font-heading" style="font-weight: 700;">
                  ${shipping === 0 ? '<span style="color: var(--color-success)">GRATUIT</span>' : StoreUtils.formatMoney(shipping)}
                </div>
              </div>
            </div>

            <!-- 4. Payment Method -->
            <div style="margin-bottom: 36px;">
              <h2 class="checkout-step-title">4. Mode de Paiement</h2>

              <!-- Option 1: Cash on Delivery (COD) -->
              <div class="payment-method-card ${this.selectedPayment === 'cod' ? 'selected' : ''}" onclick="window.CheckoutController.selectPayment('cod')">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="radio" name="payment-method" value="cod" ${this.selectedPayment === 'cod' ? 'checked' : ''}>
                  <div>
                    <div style="font-weight: 600; font-size: 0.95rem;">💵 Paiement à la Livraison (Cash on Delivery)</div>
                    <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 4px;">
                      Réglez en espèces directement auprès du livreur lors de la réception de votre colis. Simple, sécurisé et sans avance.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Option 2: Card / CMI (Future Gateway) -->
              <div class="payment-method-card ${this.selectedPayment === 'card' ? 'selected' : ''}" onclick="window.CheckoutController.selectPayment('card')">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="radio" name="payment-method" value="card" ${this.selectedPayment === 'card' ? 'checked' : ''}>
                  <div>
                    <div style="font-weight: 600; font-size: 0.95rem;">💳 Carte Bancaire Marocaine ou Internationale</div>
                    <div style="font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 4px;">
                      CMI, Visa, Mastercard. <span class="badge" style="background: #E5E5E0; color: #444;">Intégration passerelle disponible prochainement</span>
                    </div>
                  </div>
                </div>
                ${this.selectedPayment === 'card' ? `
                  <div style="margin-top: 12px; padding: 12px; background: #fff; border: 1px solid var(--color-border); font-size: 0.82rem; color: var(--color-text-secondary);">
                    ℹ️ Pour ce premier lancement, nous vous invitons à sélectionner <strong>Paiement à la livraison</strong> pour finaliser instantanément votre commande.
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="checkout-submit-btn">
              CONFIRMER MA COMMANDE • ${StoreUtils.formatMoney(total)}
            </button>

            <div style="margin-top: 16px; text-align: center; font-size: 0.78rem; color: var(--color-text-muted);">
              En confirmant votre commande, vous acceptez nos conditions de vente et d'expédition.
            </div>
          </form>
        </main>

        <!-- Order Summary Sidebar Right -->
        <aside class="checkout-sidebar">
          <h3 style="font-size: 1.25rem; margin-bottom: 24px; text-transform: uppercase;">Récapitulatif de la commande</h3>

          <!-- Items list -->
          <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; max-height: 380px; overflow-y: auto; padding-right: 8px;">
            ${items.map(item => `
              <div style="display: grid; grid-template-columns: 64px 1fr auto; gap: 14px; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <div style="position: relative;">
                  <img src="${item.image}" alt="${item.name}" style="width: 64px; height: 80px; object-fit: cover; background: #fff; border: 1px solid var(--color-border); border-radius: 2px;">
                  <span style="position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; background-color: var(--color-dark); color: #fff; border-radius: 50%; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center;">
                    ${item.quantity}
                  </span>
                </div>
                <div>
                  <div class="font-heading" style="font-weight: 600; font-size: 0.92rem;">${item.name}</div>
                  ${item.isBundle && item.bundleItems ? `
                    <div style="display: inline-block; font-size: 0.68rem; font-weight: 700; background: var(--color-dark); color: #fff; padding: 1px 5px; border-radius: 2px; margin: 3px 0; text-transform: uppercase;">
                      ⚡ PACK TRIO (3 PIÈCES)
                    </div>
                    <div style="font-size: 0.74rem; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.35; background: var(--color-bg-secondary); padding: 6px 8px; border-radius: 3px; border-left: 2px solid var(--color-dark);">
                      ${item.bundleItems.map((bi, i) => `
                        <div style="margin-bottom: 2px;">
                          <strong>#${i+1}</strong> ${bi.productName.replace('T-Shirt ', '')} • <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${bi.colorHex || '#111'};"></span>${bi.colorName}</span> (<strong>${bi.size}</strong>)
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div style="font-size: 0.78rem; color: var(--color-text-secondary);">${item.colorName || ''} ${item.size ? `• ${item.size}` : ''}</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">SKU: ${item.sku || 'N/A'}</div>
                  `}
                </div>
                <div class="font-heading" style="font-weight: 600; font-size: 0.95rem;">
                  ${StoreUtils.formatMoney(item.price * item.quantity)}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Coupon Box -->
          <div style="padding: 16px 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); margin-bottom: 24px;">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="checkout-coupon-input" class="form-input" placeholder="Code promo" style="text-transform: uppercase;" value="${appliedDiscount ? appliedDiscount.code : ''}">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.CheckoutController.applyCoupon()">Appliquer</button>
            </div>
            ${appliedDiscount ? `
              <div style="font-size: 0.8rem; color: var(--color-success); margin-top: 6px; display: flex; justify-content: space-between;">
                <span>✓ ${appliedDiscount.code} appliqué</span>
                <button type="button" style="color: var(--color-sale); text-decoration: underline;" onclick="window.StoreCart.removeCoupon(); window.CheckoutController.render();">Retirer</button>
              </div>
            ` : ''}
          </div>

          <!-- Calculation details -->
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.92rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--color-text-secondary);">Sous-total</span>
              <span class="font-heading" style="font-weight: 600;">${StoreUtils.formatMoney(subtotal)}</span>
            </div>

            ${discount > 0 ? `
              <div style="display: flex; justify-content: space-between; color: var(--color-sale);">
                <span>Réduction (${appliedDiscount.code})</span>
                <span class="font-heading" style="font-weight: 600;">-${StoreUtils.formatMoney(discount)}</span>
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--color-text-secondary);">Livraison Express (Maroc)</span>
              <span>${shipping === 0 ? '<strong style="color: var(--color-success)">GRATUITE</strong>' : StoreUtils.formatMoney(shipping)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--color-border); font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700;">
              <span>Total à régler</span>
              <span>${StoreUtils.formatMoney(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    `;
  },

  selectPayment(method) {
    this.selectedPayment = method;
    this.render();
  },

  applyCoupon() {
    const input = document.getElementById("checkout-coupon-input");
    if (!input) return;
    const res = window.StoreCart.applyCoupon(input.value.trim());
    if (res.success) {
      StoreUtils.showToast(res.message, "success");
      this.render();
    } else {
      StoreUtils.showToast(res.message, "error");
    }
  },

  handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const email = document.getElementById("checkout-email").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const firstName = document.getElementById("checkout-first-name").value.trim();
    const lastName = document.getElementById("checkout-last-name").value.trim();
    const address = document.getElementById("checkout-address").value.trim();
    const apartment = document.getElementById("checkout-apartment").value.trim();
    const city = document.getElementById("checkout-city").value;
    const postal = document.getElementById("checkout-postal").value.trim();

    const cart = window.StoreCart;
    const orderNumber = `MA-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderNumber: orderNumber,
      date: new Date().toISOString(),
      customer: {
        firstName,
        lastName,
        email,
        phone
      },
      shippingAddress: {
        address,
        apartment,
        city,
        postal,
        country: "Maroc"
      },
      items: [...cart.items],
      paymentMethod: this.selectedPayment === 'cod' ? "Paiement à la livraison (Cash on Delivery)" : "Carte Bancaire",
      subtotal: cart.getSubtotal(),
      discount: cart.getDiscountAmount(),
      shipping: cart.getShippingCost(),
      total: cart.getTotal(),
      orderNote: cart.orderNote
    };

    // Save order in history (local backup)
    const existingOrders = StoreStorage.get(StoreStorage.KEYS.ORDERS, []);
    existingOrders.unshift(orderData);
    StoreStorage.set(StoreStorage.KEYS.ORDERS, existingOrders);

    // Save current active completed order for receipt page
    sessionStorage.setItem("atelier_latest_order", JSON.stringify(orderData));

    // Clear cart
    window.StoreCart.clear();

    // Persist order to MySQL database
    if (typeof fetch === 'function') {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      }).catch(e => console.warn('Database order sync skipped:', e.message))
        .finally(() => {
          window.location.href = `order-success.html?order=${orderNumber}`;
        });
      return;
    }

    // Fallback redirect
    window.location.href = `order-success.html?order=${orderNumber}`;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.CheckoutController.init();
});

/**
 * Customer Account Architecture Controller
 * Displays customer dashboard, order history, addresses, and wishlist tabs.
 * Prepared for clean REST API backend integration.
 */

window.AccountPageController = {
  init() {
    if (window.HeaderComponent) window.HeaderComponent.mount();
    if (window.FooterComponent) window.FooterComponent.mount();

    this.renderOrders();
  },

  renderOrders() {
    const list = document.getElementById("account-orders-list");
    if (!list) return;

    const orders = StoreStorage.get(StoreStorage.KEYS.ORDERS, []);

    if (orders.length === 0) {
      list.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; background-color: var(--color-bg-secondary);">
          <p style="margin-bottom: 12px;">Vous n'avez pas encore passé de commande.</p>
          <a href="shop.html" class="btn btn-secondary btn-sm">Commencer mes achats</a>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${orders.map(order => `
          <div style="border: 1px solid var(--color-border); padding: 20px; background-color: #FFFFFF;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong class="font-heading" style="font-size: 1.05rem;">Commande #${order.orderNumber}</strong>
                <div style="font-size: 0.78rem; color: var(--color-text-muted);">Passée le ${new Date(order.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style="text-align: right;">
                <span class="badge" style="background: #E8F5E9; color: #2E7D32;">En cours de préparation (Casablanca)</span>
                <div class="font-heading" style="font-weight: 700; margin-top: 4px;">${StoreUtils.formatMoney(order.total)}</div>
              </div>
            </div>

            <!-- Items brief -->
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem;">
              ${order.items.map(item => `
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.quantity}x ${item.name} (${item.colorName} / ${item.size})</span>
                  <span class="font-heading">${StoreUtils.formatMoney(item.price * item.quantity)}</span>
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--color-border); font-size: 0.8rem; color: var(--color-text-secondary); display: flex; justify-content: space-between;">
              <span>📍 Livraison : ${order.shippingAddress.address}, ${order.shippingAddress.city}</span>
              <span>💵 ${order.paymentMethod}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.AccountPageController.init();
});

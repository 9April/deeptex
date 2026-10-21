/**
 * Wishlist Page Controller
 * Displays saved items with quick add-to-cart, individual removal, and empty state.
 */

window.WishlistPageController = {
  init() {
    if (window.HeaderComponent) window.HeaderComponent.mount();
    if (window.FooterComponent) window.FooterComponent.mount();

    this.render();

    window.addEventListener("wishlist:updated", () => {
      this.render();
    });
  },

  render() {
    const container = document.getElementById("wishlist-grid-container");
    const countEl = document.getElementById("wishlist-count-display");
    if (!container) return;

    const wishlist = window.StoreWishlist;
    const items = (wishlist && wishlist.getProducts()) || [];

    if (countEl) {
      countEl.textContent = `${items.length} article${items.length > 1 ? 's' : ''} sauvegardé${items.length > 1 ? 's' : ''}`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 64px 20px; text-align: center; background-color: var(--color-bg-secondary);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; stroke: var(--color-text-muted);">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h3 style="margin-bottom: 8px;">Votre liste de favoris est vide</h3>
          <p style="margin-bottom: 24px;">Sauvegardez vos articles préférés pour les retrouver plus tard.</p>
          <a href="shop.html" class="btn btn-primary btn-sm">Découvrir la boutique</a>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(product => window.ProductCardComponent.render(product)).join('');
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.WishlistPageController.init();
});

/**
 * Header & Navigation Component
 * Sticky scroll detection, announcement bar, mobile drawer, wishlist/cart badges, and search modal.
 */

window.HeaderComponent = {
  mount(containerId = "site-header-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = window.STORE_CONFIG;
    const wishlistCount = window.StoreWishlist ? window.StoreWishlist.getCount() : 0;
    const cartCount = window.StoreCart ? window.StoreCart.getCount() : 0;

    container.innerHTML = `
      ${config.showAnnouncement ? `
        <div class="announcement-bar" id="announcement-bar">
          <span>${config.announcementText}</span>
          ${config.announcementLink ? ` &nbsp;•&nbsp; <a href="${config.announcementLink}">Découvrir</a>` : ''}
        </div>
      ` : ''}

      <header class="site-header" id="site-header">
        <div class="container">
          <div class="header-inner">
            <!-- Mobile Toggle -->
            <button class="action-btn mobile-menu-toggle" id="mobile-drawer-open" aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <!-- Brand Logo -->
            <a href="index.html" class="brand-logo">
              <span>${config.brandName}</span>
              <span class="brand-logo-sub">${config.brandSubtitle}</span>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="main-nav" aria-label="Navigation principale">
              <a href="shop.html" class="nav-link">Boutique</a>
              <a href="collections.html" class="nav-link">Collections</a>
              <a href="wholesale.html" class="nav-link" style="font-weight: 600; letter-spacing: 0.04em;">Wholesale (B2B)</a>
              <a href="about.html" class="nav-link">À Propos</a>
              <a href="contact.html" class="nav-link">Contact</a>
            </nav>

            <!-- Action Buttons -->
            <div class="header-actions">
              <!-- Live Search Trigger -->
              <button class="action-btn" id="search-modal-trigger" aria-label="Rechercher">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              <!-- Admin Control Center Shortcut -->
              <a href="admin.html" class="action-btn" aria-label="Tableau de Bord Admin" title="Tableau de Bord & Gestion des Stocks" style="color: #D4AF37;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </a>

              <!-- Account -->
              <a href="account.html" class="action-btn" aria-label="Compte">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </a>

              <!-- Wishlist -->
              <a href="wishlist.html" class="action-btn" aria-label="Favoris">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span class="badge-counter" id="header-wishlist-count" style="${wishlistCount > 0 ? '' : 'display:none;'}">${wishlistCount}</span>
              </a>

              <!-- Cart Drawer Trigger -->
              <button class="action-btn" id="cart-drawer-trigger" aria-label="Panier">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span class="badge-counter" id="header-cart-count" style="${cartCount > 0 ? '' : 'display:none;'}">${cartCount}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer" id="mobile-drawer">
        <div class="mobile-drawer-content">
          <div class="mobile-drawer-header">
            <div class="brand-logo">
              <span>${config.brandName}</span>
              <span class="brand-logo-sub">${config.brandSubtitle}</span>
            </div>
            <button class="action-btn" id="mobile-drawer-close" aria-label="Fermer le menu">✕</button>
          </div>

          <div class="mobile-drawer-nav">
            <a href="shop.html" class="mobile-nav-link">Boutique <span>→</span></a>
            <a href="collections.html" class="mobile-nav-link">Collections Drops <span>→</span></a>
            <a href="wholesale.html" class="mobile-nav-link" style="font-weight: 600;">Espace Wholesale (B2B) <span>→</span></a>
            <a href="shop.html?filter=sale" class="mobile-nav-link" style="color: var(--color-sale);">Soldes <span>→</span></a>
            <a href="about.html" class="mobile-nav-link">Notre Atelier <span>→</span></a>
            <a href="shipping-returns.html" class="mobile-nav-link">Livraison & Retours Maroc <span>→</span></a>
            <a href="contact.html" class="mobile-nav-link">Service Client <span>→</span></a>
            <a href="admin.html" class="mobile-nav-link" style="color: #D4AF37; font-weight: 600;">⚡ Gestion des Stocks (Admin) <span>→</span></a>
          </div>

          <div class="mobile-drawer-footer">
            <div style="font-size: 0.82rem; color: var(--color-text-secondary);">
              📍 Casablanca, Maroc<br>
              🚚 Livraison 24/48h partout au Maroc
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <a href="${config.social.instagram}" target="_blank" style="font-size: 0.8rem; font-weight: 600;">INSTAGRAM</a>
              <a href="${config.social.tiktok}" target="_blank" style="font-size: 0.8rem; font-weight: 600;">TIKTOK</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Search Modal -->
      <div class="search-modal" id="search-modal">
        <div class="search-modal-container">
          <div class="search-modal-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="search-modal-input" id="search-modal-input" placeholder="Rechercher un T-shirt, couleur, coupe..." autocomplete="off">
            <button class="action-btn" id="search-modal-close">✕</button>
          </div>
          <div class="search-modal-results" id="search-modal-results">
            <p class="text-muted" style="padding: 12px 0;">Tapez un mot-clé pour lancer la recherche en direct...</p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.bindBadges();
  },

  bindEvents() {
    // Mobile Drawer
    const drawer = document.getElementById("mobile-drawer");
    const openBtn = document.getElementById("mobile-drawer-open");
    const closeBtn = document.getElementById("mobile-drawer-close");

    if (openBtn && drawer) {
      openBtn.addEventListener("click", () => {
        drawer.classList.add("open");
        document.body.classList.add("overflow-locked");
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener("click", () => {
        drawer.classList.remove("open");
        document.body.classList.remove("overflow-locked");
      });
      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) {
          drawer.classList.remove("open");
          document.body.classList.remove("overflow-locked");
        }
      });
    }

    // Cart Trigger
    const cartTrigger = document.getElementById("cart-drawer-trigger");
    if (cartTrigger) {
      cartTrigger.addEventListener("click", () => {
        if (window.CartDrawerComponent) {
          window.CartDrawerComponent.open();
        } else {
          window.location.href = "cart.html";
        }
      });
    }

    // Search Modal
    const searchModal = document.getElementById("search-modal");
    const searchTrigger = document.getElementById("search-modal-trigger");
    const searchClose = document.getElementById("search-modal-close");
    const searchInput = document.getElementById("search-modal-input");
    const searchResults = document.getElementById("search-modal-results");

    if (searchTrigger && searchModal) {
      searchTrigger.addEventListener("click", () => {
        searchModal.classList.add("open");
        document.body.classList.add("overflow-locked");
        setTimeout(() => searchInput && searchInput.focus(), 100);
      });
    }

    const closeSearch = () => {
      searchModal.classList.remove("open");
      document.body.classList.remove("overflow-locked");
    };

    if (searchClose && searchModal) {
      searchClose.addEventListener("click", closeSearch);
      searchModal.addEventListener("click", (e) => {
        if (e.target === searchModal) closeSearch();
      });
    }

    // Live Search Typing
    if (searchInput && searchResults) {
      searchInput.addEventListener("input", StoreUtils.debounce((e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
          searchResults.innerHTML = '<p class="text-muted" style="padding: 12px 0;">Tapez au moins 2 caractères...</p>';
          return;
        }

        const results = window.StoreSearch.search(query);
        if (results.length === 0) {
          searchResults.innerHTML = `
            <div style="padding: 24px 0; text-align: center;">
              <p>Aucun produit trouvé pour "<strong>${query}</strong>"</p>
              <a href="shop.html" class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="document.getElementById('search-modal').classList.remove('open')">Voir toute la boutique</a>
            </div>
          `;
        } else {
          let html = `
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 8px;">
              ${results.length} résultat(s)
            </div>
          `;
          results.slice(0, 5).forEach(product => {
            const firstColor = product.colors[0];
            const img = (product.images[firstColor.code] && product.images[firstColor.code][0]) || firstColor.image;
            html += `
              <a href="product.html?id=${product.id}" class="search-result-item" onclick="document.getElementById('search-modal').classList.remove('open')">
                <img src="${img}" alt="${product.name}" class="search-result-thumb">
                <div class="search-result-info">
                  <div class="font-heading" style="font-weight: 600; font-size: 0.95rem;">${product.name}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${product.category} • ${product.colors.length} coloris</div>
                  <div style="font-weight: 700; font-size: 0.9rem; margin-top: 2px;">${StoreUtils.formatMoney(product.price)}</div>
                </div>
              </a>
            `;
          });
          html += `
            <div style="margin-top: 14px; text-align: center;">
              <a href="shop.html?q=${encodeURIComponent(query)}" class="btn btn-primary btn-sm btn-full" onclick="document.getElementById('search-modal').classList.remove('open')">
                Voir tous les résultats (${results.length})
              </a>
            </div>
          `;
          searchResults.innerHTML = html;
        }
      }, 200));
    }
  },

  bindBadges() {
    window.addEventListener("cart:updated", (e) => {
      const badge = document.getElementById("header-cart-count");
      if (badge) {
        badge.textContent = e.detail.count;
        badge.style.display = e.detail.count > 0 ? "flex" : "none";
      }
    });

    window.addEventListener("wishlist:updated", (e) => {
      const badge = document.getElementById("header-wishlist-count");
      if (badge) {
        badge.textContent = e.detail.count;
        badge.style.display = e.detail.count > 0 ? "flex" : "none";
      }
    });
  }
};

/**
 * Shop / Catalog Page Controller
 * Dynamic multi-facet filtering (category, size, color, price, stock, sale),
 * sorting, URL query param sync, and responsive layout.
 */

window.ShopController = {
  products: [],
  filters: {
    category: null,
    collection: null,
    sizes: [],
    colors: [],
    maxPrice: 800,
    inStockOnly: false,
    saleOnly: false,
    query: ""
  },
  sortBy: "featured",

  init() {
    if (window.HeaderComponent) window.HeaderComponent.mount();
    if (window.FooterComponent) window.FooterComponent.mount();

    // Filter out bundle packs from Catalogue Atelier (they are shown in Collections & Séries)
    this.products = (window.STORE_PRODUCTS || []).filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts');

    // Parse URL parameters
    const params = StoreUtils.getUrlParams();
    if (params.collection === 'packs-bundles') {
      window.location.href = 'collections.html?c=packs-bundles';
      return;
    }
    if (params.category) this.filters.category = params.category;
    if (params.collection) this.filters.collection = params.collection;
    if (params.sort) this.sortBy = params.sort;
    if (params.filter === "sale") this.filters.saleOnly = true;
    if (params.q) this.filters.query = params.q;
    if (params.size) this.filters.sizes = params.size.split(",");
    if (params.color) this.filters.colors = params.color.split(",");

    this.renderFilterSidebar();
    this.bindEvents();
    this.applyFiltersAndRender();
  },

  renderFilterSidebar() {
    const sidebar = document.getElementById("shop-filter-sidebar");
    if (!sidebar) return;

    // Collect all available sizes & colors from catalog
    const allSizes = ["S", "M", "L", "XL"];
    const colorMap = new Map();
    (this.products || []).forEach(p => {
      (p.colors || []).forEach(c => {
        if (!colorMap.has(c.code)) {
          colorMap.set(c.code, { name: c.name, code: c.code, hex: c.hex });
        }
      });
    });
    const allColors = Array.from(colorMap.values());

    sidebar.innerHTML = `
      <!-- Category Filter -->
      <div class="filter-group">
        <div class="filter-group-title">Catégories</div>
        <div class="filter-options-list">
          <label class="filter-checkbox-label">
            <input type="radio" name="filter-category" value="all" ${!this.filters.category ? 'checked' : ''}>
            <span>Tous les vêtements (${this.products.length})</span>
          </label>
          ${window.STORE_CATEGORIES.map(cat => {
            const count = (this.products || []).filter(p => p.category === cat.slug || p.category === cat.id).length;
            return `
            <label class="filter-checkbox-label" style="${!cat.active ? 'opacity: 0.5;' : ''}">
              <input type="radio" name="filter-category" value="${cat.slug}" ${this.filters.category === cat.slug ? 'checked' : ''} ${!cat.active ? 'disabled' : ''}>
              <span>${cat.name} ${!cat.active ? '(Bientôt)' : `(${count})`}</span>
            </label>
          `;
          }).join('')}
        </div>
      </div>

      <!-- Size Filter -->
      <div class="filter-group">
        <div class="filter-group-title">Tailles</div>
        <div class="filter-size-grid">
          ${allSizes.map(size => `
            <button type="button" class="filter-size-btn ${this.filters.sizes.includes(size) ? 'active' : ''}" data-size="${size}">
              ${size}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Color Filter -->
      <div class="filter-group">
        <div class="filter-group-title">Couleurs</div>
        <div class="filter-color-grid">
          ${allColors.map(c => `
            <button type="button" class="filter-color-btn ${this.filters.colors.includes(c.code) ? 'active' : ''}" data-color="${c.code}">
              <span class="color-swatch-dot" style="background-color: ${c.hex};"></span>
              <span>${c.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Price Range Filter -->
      <div class="filter-group">
        <div class="filter-group-title">
          <span>Prix Maximum</span>
          <span id="price-display-val" style="color: var(--color-dark);">${StoreUtils.formatMoney(this.filters.maxPrice)}</span>
        </div>
        <input type="range" id="filter-price-range" min="150" max="800" step="10" value="${this.filters.maxPrice}" style="width: 100%; accent-color: var(--color-dark); cursor: pointer;">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 6px;">
          <span>150 MAD</span>
          <span>800 MAD</span>
        </div>
      </div>

      <!-- Quick Toggles -->
      <div class="filter-group">
        <div class="filter-group-title">Disponibilité & Offres</div>
        <div class="filter-options-list">
          <label class="filter-checkbox-label">
            <input type="checkbox" id="filter-instock" ${this.filters.inStockOnly ? 'checked' : ''}>
            <span>En stock uniquement</span>
          </label>
          <label class="filter-checkbox-label">
            <input type="checkbox" id="filter-sale" ${this.filters.saleOnly ? 'checked' : ''}>
            <span style="color: var(--color-sale); font-weight: 600;">En solde uniquement</span>
          </label>
        </div>
      </div>

      <!-- Reset button -->
      <button class="btn btn-secondary btn-full btn-sm" id="clear-all-filters-btn">
        Réinitialiser les filtres
      </button>
    `;

    this.bindSidebarEvents();
  },

  bindSidebarEvents() {
    // Category radio changes
    document.querySelectorAll("input[name='filter-category']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        this.filters.category = e.target.value === "all" ? null : e.target.value;
        this.applyFiltersAndRender();
      });
    });

    // Size buttons
    document.querySelectorAll(".filter-size-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const size = btn.getAttribute("data-size");
        if (this.filters.sizes.includes(size)) {
          this.filters.sizes = this.filters.sizes.filter(s => s !== size);
          btn.classList.remove("active");
        } else {
          this.filters.sizes.push(size);
          btn.classList.add("active");
        }
        this.applyFiltersAndRender();
      });
    });

    // Color buttons
    document.querySelectorAll(".filter-color-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const color = btn.getAttribute("data-color");
        if (this.filters.colors.includes(color)) {
          this.filters.colors = this.filters.colors.filter(c => c !== color);
          btn.classList.remove("active");
        } else {
          this.filters.colors.push(color);
          btn.classList.add("active");
        }
        this.applyFiltersAndRender();
      });
    });

    // Price slider
    const priceSlider = document.getElementById("filter-price-range");
    const priceDisplay = document.getElementById("price-display-val");
    if (priceSlider) {
      priceSlider.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.filters.maxPrice = val;
        if (priceDisplay) priceDisplay.textContent = StoreUtils.formatMoney(val);
      });
      priceSlider.addEventListener("change", () => {
        this.applyFiltersAndRender();
      });
    }

    // In Stock toggle
    const inStockCheck = document.getElementById("filter-instock");
    if (inStockCheck) {
      inStockCheck.addEventListener("change", (e) => {
        this.filters.inStockOnly = e.target.checked;
        this.applyFiltersAndRender();
      });
    }

    // Sale toggle
    const saleCheck = document.getElementById("filter-sale");
    if (saleCheck) {
      saleCheck.addEventListener("change", (e) => {
        this.filters.saleOnly = e.target.checked;
        this.applyFiltersAndRender();
      });
    }

    // Clear all
    const clearBtn = document.getElementById("clear-all-filters-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearAllFilters());
    }
  },

  bindEvents() {
    // Sort dropdown
    const sortSelect = document.getElementById("shop-sort-select");
    if (sortSelect) {
      sortSelect.value = this.sortBy;
      sortSelect.addEventListener("change", (e) => {
        this.sortBy = e.target.value;
        this.applyFiltersAndRender();
      });
    }
  },

  clearAllFilters() {
    this.filters = {
      category: null,
      collection: null,
      sizes: [],
      colors: [],
      maxPrice: 800,
      inStockOnly: false,
      saleOnly: false,
      query: ""
    };
    this.sortBy = "featured";
    this.renderFilterSidebar();
    this.applyFiltersAndRender();
  },

  applyFiltersAndRender() {
    let list = [...this.products];

    // 1. Search query
    if (this.filters.query) {
      list = window.StoreSearch.search(this.filters.query, { products: list });
    }

    // 2. Category
    if (this.filters.category) {
      list = list.filter(p => p.category === this.filters.category);
    }

    // 3. Collection
    if (this.filters.collection) {
      list = list.filter(p => p.collections && p.collections.includes(this.filters.collection));
    }

    // 4. Sizes
    if (this.filters.sizes.length > 0) {
      list = list.filter(p => {
        return this.filters.sizes.some(size => {
          return p.variants.some(v => v.size === size && v.stock > 0);
        });
      });
    }

    // 5. Colors
    if (this.filters.colors.length > 0) {
      list = list.filter(p => {
        return this.filters.colors.some(colorCode => {
          return p.colors.some(c => c.code === colorCode);
        });
      });
    }

    // 6. Max Price
    list = list.filter(p => p.price <= this.filters.maxPrice);

    // 7. In stock only
    if (this.filters.inStockOnly) {
      list = list.filter(p => p.variants.some(v => v.stock > 0));
    }

    // 8. Sale only
    if (this.filters.saleOnly) {
      list = list.filter(p => p.isSale || (p.compareAtPrice && p.compareAtPrice > p.price));
    }

    // 9. Sorting
    if (this.sortBy === "newest") {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (this.sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else {
      // Featured
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    // Render Results Count & Active Filter Pills
    this.renderActiveFilterPills();
    this.renderGrid(list);
  },

  renderActiveFilterPills() {
    const pillsContainer = document.getElementById("active-filter-pills-container");
    const countEl = document.getElementById("shop-products-count");

    if (pillsContainer) {
      let pillsHtml = [];

      if (this.filters.query) {
        pillsHtml.push(`<span class="filter-pill">Recherche: "${this.filters.query}" <span class="filter-pill-remove" onclick="window.ShopController.removeQuery()">✕</span></span>`);
      }
      if (this.filters.category) {
        const cat = window.STORE_CATEGORIES.find(c => c.slug === this.filters.category);
        pillsHtml.push(`<span class="filter-pill">${cat ? cat.name : this.filters.category} <span class="filter-pill-remove" onclick="window.ShopController.removeCategory()">✕</span></span>`);
      }
      if (this.filters.collection) {
        const col = window.STORE_COLLECTIONS.find(c => c.slug === this.filters.collection);
        pillsHtml.push(`<span class="filter-pill">Collection: ${col ? col.title : this.filters.collection} <span class="filter-pill-remove" onclick="window.ShopController.removeCollection()">✕</span></span>`);
      }
      this.filters.sizes.forEach(s => {
        pillsHtml.push(`<span class="filter-pill">Taille: ${s} <span class="filter-pill-remove" onclick="window.ShopController.removeSize('${s}')">✕</span></span>`);
      });
      this.filters.colors.forEach(c => {
        pillsHtml.push(`<span class="filter-pill">Couleur: ${c} <span class="filter-pill-remove" onclick="window.ShopController.removeColor('${c}')">✕</span></span>`);
      });
      if (this.filters.saleOnly) {
        pillsHtml.push(`<span class="filter-pill" style="color: var(--color-sale);">Soldes <span class="filter-pill-remove" onclick="window.ShopController.removeSale()">✕</span></span>`);
      }
      if (this.filters.maxPrice < 500) {
        pillsHtml.push(`<span class="filter-pill">Max: ${StoreUtils.formatMoney(this.filters.maxPrice)} <span class="filter-pill-remove" onclick="window.ShopController.removePrice()">✕</span></span>`);
      }

      if (pillsHtml.length > 0) {
        pillsContainer.innerHTML = pillsHtml.join('') + `<button class="btn btn-sm btn-secondary" style="padding: 4px 10px; font-size: 0.72rem; border-radius: 999px;" onclick="window.ShopController.clearAllFilters()">Tout effacer</button>`;
        pillsContainer.style.display = "flex";
      } else {
        pillsContainer.innerHTML = "";
        pillsContainer.style.display = "none";
      }
    }
  },

  removeQuery() { this.filters.query = ""; this.applyFiltersAndRender(); },
  removeCategory() { this.filters.category = null; this.renderFilterSidebar(); this.applyFiltersAndRender(); },
  removeCollection() { this.filters.collection = null; this.applyFiltersAndRender(); },
  removeSize(s) { this.filters.sizes = this.filters.sizes.filter(item => item !== s); this.renderFilterSidebar(); this.applyFiltersAndRender(); },
  removeColor(c) { this.filters.colors = this.filters.colors.filter(item => item !== c); this.renderFilterSidebar(); this.applyFiltersAndRender(); },
  removeSale() { this.filters.saleOnly = false; this.renderFilterSidebar(); this.applyFiltersAndRender(); },
  removePrice() { this.filters.maxPrice = 500; this.renderFilterSidebar(); this.applyFiltersAndRender(); },

  renderGrid(list) {
    const grid = document.getElementById("shop-products-grid");
    const countEl = document.getElementById("shop-products-count");

    if (countEl) {
      countEl.textContent = `${list.length} produit${list.length > 1 ? 's' : ''}`;
    }

    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background-color: var(--color-bg-secondary);">
          <h3 style="margin-bottom: 8px;">Aucun produit trouvé</h3>
          <p style="margin-bottom: 20px;">Essayez d'ajuster ou d'effacer vos filtres de recherche.</p>
          <button class="btn btn-primary btn-sm" onclick="window.ShopController.clearAllFilters()">
            Réinitialiser les filtres
          </button>
        </div>
      `;
    } else {
      grid.innerHTML = list.map(p => window.ProductCardComponent.render(p)).join('');
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.ShopController.init();
});

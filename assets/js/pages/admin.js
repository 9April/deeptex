/**
 * ATELIER ADMIN DASHBOARD CONTROLLER
 * Full management for Categories, Colors, Stock Matrix, Products Catalog & Backups.
 */

window.AdminDashboard = {
  activeTab: "overview",
  stockFilter: "all",
  stockSearch: "",
  stockCategory: "all",
  productSearch: "",
  productCategory: "all",
  productViewMode: "separated", // "separated" = each colorway separated, "grouped" = parent card
  activeImageTargetInput: null,
  activeEditColor: null,
  currentProductImages: {},
  currentGalleryImages: [],
  allAvailableImages: [],
  presetFilterColor: "all",
  presetFilterQuery: "",

  init() {
    // Initialize data manager
    if (window.StoreDataManager) {
      window.StoreDataManager.init();
    }

    this.bindNavigation();
    this.renderAll();
    this.bindModals();
    this.bindPresetPicker();

    // Check URL parameters for direct tab navigation (e.g., admin.html?tab=orders)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["overview", "categories", "colors", "stock", "products", "orders", "settings"].includes(tabParam)) {
      this.switchTab(tabParam);
    }

    // Background fetch live orders from MySQL
    this.loadOrders();
  },

  renderAll() {
    this.renderOverview();
    this.renderCategories();
    this.renderColors();
    this.renderStockMatrix();
    this.renderProducts();
    this.updateBadges();
  },

  // --------------------------------------------------------------------------
  // NAVIGATION & TABS
  // --------------------------------------------------------------------------
  bindNavigation() {
    document.querySelectorAll(".admin-nav-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = btn.getAttribute("data-tab");
        if (tab) this.switchTab(tab);
      });
    });

    const mobileMenuToggle = document.getElementById("admin-mobile-menu-toggle");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", () => {
        document.querySelector(".admin-sidebar").classList.toggle("open");
      });
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Update nav button states
    document.querySelectorAll(".admin-nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });

    // Update tab panes
    document.querySelectorAll(".admin-tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `tab-${tabName}`);
    });

    // Update page title
    const titles = {
      overview: "Vue d'Ensemble & Métriques",
      categories: "Gestion des Catégories",
      colors: "Palette de Couleurs & Swatches",
      stock: "Matrice des Stocks & Inventaire",
      products: "Catalogue des Produits",
      orders: "Commandes Clients (Base MySQL)",
      "wholesale-applications": "Demandes d'Accès Grossistes (B2B)",
      "wholesale-settings": "Tarification & Coûts Grossistes B2B",
      settings: "Sauvegarde & Synchronisation"
    };

    const titleEl = document.getElementById("admin-current-page-title");
    if (titleEl) titleEl.textContent = titles[tabName] || "Tableau de Bord";

    // Re-render the active tab
    if (tabName === "overview") this.renderOverview();
    if (tabName === "categories") this.renderCategories();
    if (tabName === "colors") this.renderColors();
    if (tabName === "stock") this.renderStockMatrix();
    if (tabName === "products") this.renderProducts();
    if (tabName === "orders") this.loadOrders();
    if (tabName === "wholesale-applications") this.loadWholesaleApplications();
    if (tabName === "wholesale-settings") this.loadWholesaleSettings();
    if (tabName === "settings") this.loadWhatsAppConfig();

    // Close mobile sidebar if open
    document.querySelector(".admin-sidebar")?.classList.remove("open");
  },

  updateBadges() {
    this.refreshWholesalePendingBadge();
    const stats = window.StoreDataManager.getInventoryStats();
    
    const catBadge = document.getElementById("badge-categories-count");
    if (catBadge) catBadge.textContent = stats.totalCategories;

    const colorBadge = document.getElementById("badge-colors-count");
    if (colorBadge) colorBadge.textContent = window.StoreDataManager.getColors().length;

    const stockBadge = document.getElementById("badge-stock-alerts");
    if (stockBadge) {
      stockBadge.textContent = stats.lowStockCount + stats.outOfStockCount;
      stockBadge.style.display = (stats.lowStockCount + stats.outOfStockCount > 0) ? "inline-block" : "none";
    }

    const prodBadge = document.getElementById("badge-products-count");
    if (prodBadge) prodBadge.textContent = stats.totalProducts;
  },

  // --------------------------------------------------------------------------
  // TAB 1: OVERVIEW & ANALYTICS
  // --------------------------------------------------------------------------
  renderOverview() {
    const stats = window.StoreDataManager.getInventoryStats();

    document.getElementById("stat-total-products").textContent = stats.totalProducts;
    document.getElementById("stat-total-variants").textContent = stats.totalVariants;
    document.getElementById("stat-total-units").textContent = stats.totalUnits.toLocaleString();
    document.getElementById("stat-inventory-val").textContent = `${stats.totalValueMAD.toLocaleString()} MAD`;
    document.getElementById("stat-low-stock").textContent = stats.lowStockCount;
    document.getElementById("stat-out-stock").textContent = stats.outOfStockCount;
    document.getElementById("stat-active-categories").textContent = `${stats.activeCategories} / ${stats.totalCategories}`;

    // Render Low Stock Alert Table
    const lowStockTable = document.getElementById("overview-lowstock-tbody");
    if (lowStockTable) {
      const allVariants = window.StoreDataManager.getAllVariants();
      const lowStockItems = allVariants.filter(v => v.stock < 5).slice(0, 8);

      if (lowStockItems.length === 0) {
        lowStockTable.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--admin-success); padding: 24px;">
              ✓ Tous les niveaux de stock sont optimaux (aucun article sous le seuil de 5 unités).
            </td>
          </tr>
        `;
      } else {
        lowStockTable.innerHTML = lowStockItems.map(v => `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${v.productImage || 'assets/images/hero/hero-banner.jpg'}" style="width: 34px; height: 34px; object-fit: cover; border-radius: 4px; background: #000;">
                <div>
                  <div style="font-weight: 600; font-size: 0.84rem;">${v.productName}</div>
                  <span style="font-size: 0.72rem; color: var(--admin-text-muted);">${v.sku}</span>
                </div>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${v.colorHex}; border: 1px solid #666; display: inline-block;"></span>
                <span>${v.colorName}</span>
              </div>
            </td>
            <td><span class="admin-badge badge-active">${v.size}</span></td>
            <td>
              <span class="admin-badge ${v.stock === 0 ? 'badge-outstock' : 'badge-lowstock'}">
                ${v.stock === 0 ? 'Rupture (0)' : `Faible (${v.stock})`}
              </span>
            </td>
            <td>${v.price} MAD</td>
            <td>
              <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="AdminDashboard.quickRestock('${v.productId}', '${v.variantId}', 10)">
                +10 Réappro
              </button>
            </td>
          </tr>
        `).join("");
      }
    }

    // Render Category Distribution
    const catDistBox = document.getElementById("overview-category-distribution");
    if (catDistBox) {
      const categories = window.StoreDataManager.getCategories();
      const products = window.StoreDataManager.getProducts();
      const totalProds = products.length || 1;

      catDistBox.innerHTML = categories.map(cat => {
        const count = products.filter(p => p.category === cat.slug || p.category === cat.id).length;
        const percentage = Math.round((count / totalProds) * 100);
        return `
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 5px;">
              <span style="font-weight: 600; color: #FFFFFF;">${cat.name} ${cat.active ? '' : '<span style="font-size: 0.7rem; color: var(--admin-text-muted);">(Bientôt)</span>'}</span>
              <span style="color: var(--admin-text-muted);">${count} articles (${percentage}%)</span>
            </div>
            <div style="height: 6px; background: var(--admin-surface-2); border-radius: 999px; overflow: hidden;">
              <div style="width: ${percentage}%; height: 100%; background: ${cat.active ? '#FFFFFF' : 'var(--admin-gold)'}; border-radius: 999px;"></div>
            </div>
          </div>
        `;
      }).join("");
    }
  },

  // --------------------------------------------------------------------------
  // TAB 2: CATEGORIES MANAGEMENT
  // --------------------------------------------------------------------------
  renderCategories() {
    const categories = window.StoreDataManager.getCategories();
    const container = document.getElementById("categories-grid-container");
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <div class="category-admin-card">
        <img src="${cat.image || 'assets/images/hero/hero-banner.jpg'}" alt="${cat.name}" class="category-card-thumb">
        <div class="category-card-content">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 class="category-card-title">${cat.name}</h3>
            <span class="admin-badge ${cat.active ? 'badge-instock' : 'badge-inactive'}">
              ${cat.active ? 'Actif' : 'Bientôt disponible'}
            </span>
          </div>
          <div style="font-size: 0.74rem; font-family: var(--font-mono); color: var(--admin-gold);">
            Slug: ${cat.slug}
          </div>
          <p class="category-card-desc">${cat.description || 'Aucune description fournie.'}</p>
          <div class="category-card-foot">
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--admin-text-muted);">
              📦 ${cat.itemCount || 0} Articles
            </span>
            <div style="display: flex; gap: 6px;">
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.openEditCategoryModal('${cat.id || cat.slug}')">
                Modifier
              </button>
              <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="AdminDashboard.deleteCategory('${cat.id || cat.slug}')">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  },

  openAddCategoryModal() {
    document.getElementById("category-modal-title").textContent = "Ajouter une Catégorie";
    document.getElementById("cat-form-id").value = "";
    document.getElementById("cat-form-name").value = "";
    document.getElementById("cat-form-slug").value = "";
    document.getElementById("cat-form-desc").value = "";
    document.getElementById("cat-form-image").value = "assets/images/hero/hero-banner.jpg";
    document.getElementById("cat-form-active").checked = true;
    this.openModal("modal-category");
  },

  openEditCategoryModal(idOrSlug) {
    const categories = window.StoreDataManager.getCategories();
    const cat = categories.find(c => c.id === idOrSlug || c.slug === idOrSlug);
    if (!cat) return;

    document.getElementById("category-modal-title").textContent = "Modifier la Catégorie";
    document.getElementById("cat-form-id").value = cat.id || cat.slug;
    document.getElementById("cat-form-name").value = cat.name;
    document.getElementById("cat-form-slug").value = cat.slug;
    document.getElementById("cat-form-desc").value = cat.description || "";
    document.getElementById("cat-form-image").value = cat.image || "";
    document.getElementById("cat-form-active").checked = !!cat.active;
    this.openModal("modal-category");
  },

  saveCategoryFromForm(e) {
    e.preventDefault();
    const id = document.getElementById("cat-form-id").value;
    const name = document.getElementById("cat-form-name").value.trim();
    let slug = document.getElementById("cat-form-slug").value.trim();
    const description = document.getElementById("cat-form-desc").value.trim();
    const image = document.getElementById("cat-form-image").value.trim();
    const active = document.getElementById("cat-form-active").checked;

    if (!name) {
      this.toast("Le nom de la catégorie est obligatoire", "danger");
      return;
    }

    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    const catData = {
      id: id || slug,
      name,
      slug,
      description,
      image: image || "assets/images/hero/hero-banner.jpg",
      active,
      itemCount: 0
    };

    window.StoreDataManager.saveCategory(catData);
    this.closeModal("modal-category");
    this.renderCategories();
    this.renderOverview();
    this.updateBadges();
    this.toast(`Catégorie "${name}" enregistrée avec succès !`, "success");
  },

  deleteCategory(idOrSlug) {
    const products = window.StoreDataManager.getProducts();
    const hasProducts = products.some(p => p.category === idOrSlug);

    if (hasProducts) {
      if (!confirm(`Attention: des produits sont actuellement associés à cette catégorie. Êtes-vous sûr de vouloir supprimer la catégorie "${idOrSlug}" ?`)) {
        return;
      }
    } else {
      if (!confirm(`Confirmer la suppression de la catégorie "${idOrSlug}" ?`)) return;
    }

    window.StoreDataManager.deleteCategory(idOrSlug);
    this.renderCategories();
    this.renderOverview();
    this.updateBadges();
    this.toast("Catégorie supprimée", "success");
  },

  // --------------------------------------------------------------------------
  // TAB 3: COLORS & SWATCHES MANAGEMENT (HIGH-END & NON-CONDENSED)
  // --------------------------------------------------------------------------
  colorsSearch: "",

  filterColors(query) {
    this.colorsSearch = (query || "").trim().toLowerCase();
    this.renderColors();
  },

  copyHexToClipboard(hex) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex).then(() => {
        this.toast(`Code ${hex} copié dans le presse-papiers !`, "info");
      }).catch(() => {});
    } else {
      this.toast(`Code : ${hex}`, "info");
    }
  },

  syncColorPickerToInput(val) {
    const input = document.getElementById("color-form-hex");
    if (input) input.value = val.toUpperCase();
    this.syncColorLivePreview();
  },

  syncColorInputToPicker(val) {
    const picker = document.getElementById("color-form-hex-picker");
    if (picker && val && val.startsWith("#") && (val.length === 4 || val.length === 7)) {
      try { picker.value = val; } catch (e) {}
    }
    this.syncColorLivePreview();
  },

  syncColorLivePreview() {
    const nameVal = document.getElementById("color-form-name")?.value.trim() || "Nouveau Coloris";
    let codeVal = document.getElementById("color-form-code")?.value.trim();
    if (!codeVal && nameVal) {
      codeVal = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    const hexVal = document.getElementById("color-form-hex")?.value.trim() || "#121212";

    const swatchCircle = document.getElementById("color-live-swatch-circle");
    if (swatchCircle) swatchCircle.style.backgroundColor = hexVal;

    const nameText = document.getElementById("color-live-name-text");
    if (nameText) nameText.textContent = nameVal;

    const hexText = document.getElementById("color-live-hex-text");
    if (hexText) hexText.textContent = `${hexVal} • slug: ${codeVal || 'auto'}`;
  },

  renderColors() {
    const colors = window.StoreDataManager.getColors();
    const container = document.getElementById("colors-cards-container");
    if (!container) return;

    const allVariants = window.StoreDataManager.getAllVariants();

    // Update Statistics Badges
    const totalCountEl = document.getElementById("colors-total-count");
    if (totalCountEl) totalCountEl.textContent = `${colors.length} coloris`;

    const mockupsCountEl = document.getElementById("colors-mockups-count");
    if (mockupsCountEl) {
      const withMockup = colors.filter(c => c.image && c.image.trim()).length;
      mockupsCountEl.textContent = `${withMockup} avec mockup`;
    }

    const variantsCountEl = document.getElementById("colors-variants-count");
    if (variantsCountEl) variantsCountEl.textContent = `${allVariants.length} variantes`;

    // Filter by search query if present
    let filteredColors = colors;
    if (this.colorsSearch) {
      const q = this.colorsSearch;
      filteredColors = filteredColors.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q)
      );
    }

    if (filteredColors.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--admin-surface); border-radius: 8px; border: 1px dashed var(--admin-border);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎨</div>
          <p style="color: var(--admin-text-muted); font-size: 0.95rem;">Aucun coloris ne correspond à la recherche "${this.colorsSearch}".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredColors.map(col => {
      const matchingVariants = allVariants.filter(v => v.color === col.code);
      const usageCount = matchingVariants.length;
      const productsUsingThisColor = Array.from(new Set(matchingVariants.map(v => v.productName)));
      const hasMockup = !!(col.image && col.image.trim());

      return `
        <div class="color-card">
          <!-- Top Row: Big Swatch + Mockup Preview + Main Info -->
          <div class="color-card-top-row">
            <div class="color-swatch-combo-lg">
              <div class="color-swatch-box-lg" style="background-color: ${col.hex};" title="Nuance : ${col.hex}">
                <div class="color-swatch-inner-gloss"></div>
              </div>
              ${hasMockup ? `
                <div class="color-mockup-thumb-wrap-lg" title="Mockup lié : ${col.name}">
                  <img src="${col.image}" class="color-mockup-thumb-lg" alt="${col.name}">
                </div>
              ` : `
                <div class="color-mockup-thumb-wrap-lg empty" title="Aucun mockup par défaut">
                  <span style="font-size: 1.1rem; opacity: 0.5;">📷</span>
                </div>
              `}
            </div>

            <div class="color-card-info-main">
              <div class="color-card-name-lg">${col.name}</div>
              <div class="color-card-meta-row">
                <button type="button" class="color-hex-tag" onclick="AdminDashboard.copyHexToClipboard('${col.hex}')" title="Cliquer pour copier ${col.hex}">
                  <span class="color-hex-dot" style="background: ${col.hex};"></span>
                  <span>${col.hex}</span>
                  <span style="opacity: 0.6; font-size: 0.72rem;">📋</span>
                </button>
                <span class="color-slug-tag">slug: ${col.code}</span>
              </div>
            </div>
          </div>

          <!-- Middle Row: Usage counter & Mockup link status -->
          <div class="color-card-stats-bar">
            <div class="color-usage-badge ${usageCount > 0 ? 'active' : 'idle'}">
              ${usageCount > 0 ? `🟢 <b>${usageCount}</b> variantes (${productsUsingThisColor.length} modèle${productsUsingThisColor.length > 1 ? 's' : ''})` : `⚪ Non rattaché`}
            </div>
            <div class="color-mockup-status-badge ${hasMockup ? 'has-mockup' : 'no-mockup'}">
              ${hasMockup ? `✓ Mockup synchronisé` : `⚪ Sans mockup`}
            </div>
          </div>

          <!-- Bottom Row: Clean Action Buttons -->
          <div class="color-card-actions-row">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" style="flex: 1; justify-content: center;" onclick="AdminDashboard.openEditColorModal('${col.code}')">
              ✏️ Modifier
            </button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" style="padding: 6px 12px;" onclick="AdminDashboard.deleteColor('${col.code}')" title="Supprimer ce coloris">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join("");
  },

  updateColorMockupPreview(url) {
    const previewImg = document.getElementById("color-form-preview-img");
    const previewEmpty = document.getElementById("color-form-preview-empty");
    if (!previewImg || !previewEmpty) return;

    if (url && url.trim()) {
      previewImg.src = url.trim();
      previewImg.style.display = "block";
      previewEmpty.style.display = "none";
    } else {
      previewImg.src = "";
      previewImg.style.display = "none";
      previewEmpty.style.display = "block";
    }
  },

  async handleColorImageUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const nameVal = document.getElementById("color-form-name")?.value.trim() || "color";
    const codeVal = document.getElementById("color-form-code")?.value.trim() || nameVal.toLowerCase().replace(/[^a-z0-9]/g, '-');

    try {
      this.toast(`Téléversement du mockup pour "${nameVal}"...`, "info");
      const dataUrl = await this.readFileAsDataURL(file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "colors",
          category: "products",
          filename: `mockup-${codeVal}-${file.name}`,
          dataUrl: dataUrl
        })
      });

      const data = await res.json();
      const finalPath = (data && data.success && data.path) ? data.path : dataUrl;
      const input = document.getElementById("color-form-image");
      if (input) input.value = finalPath;
      this.updateColorMockupPreview(finalPath);
      this.toast("Mockup téléversé avec succès !", "success");
    } catch (err) {
      console.warn("Upload error:", err);
      const dataUrl = await this.readFileAsDataURL(file);
      const input = document.getElementById("color-form-image");
      if (input) input.value = dataUrl;
      this.updateColorMockupPreview(dataUrl);
      this.toast("Mockup chargé", "success");
    }
    event.target.value = "";
  },

  openAddColorModal() {
    document.getElementById("color-modal-title").textContent = "Ajouter un Coloris / Swatch";
    document.getElementById("color-form-code").value = "";
    document.getElementById("color-form-code").removeAttribute("readonly");
    document.getElementById("color-form-name").value = "";
    document.getElementById("color-form-hex").value = "#121212";
    document.getElementById("color-form-hex-picker").value = "#121212";
    document.getElementById("color-form-image").value = "";
    this.updateColorMockupPreview("");
    this.syncColorLivePreview();
    this.openModal("modal-color");
  },

  openEditColorModal(code) {
    const colors = window.StoreDataManager.getColors();
    const col = colors.find(c => c.code === code);
    if (!col) return;

    document.getElementById("color-modal-title").textContent = `Modifier: ${col.name}`;
    document.getElementById("color-form-code").value = col.code;
    document.getElementById("color-form-code").setAttribute("readonly", "true");
    document.getElementById("color-form-name").value = col.name;
    document.getElementById("color-form-hex").value = col.hex;
    document.getElementById("color-form-hex-picker").value = col.hex.startsWith('#') ? col.hex : '#121212';
    document.getElementById("color-form-image").value = col.image || "";
    this.updateColorMockupPreview(col.image || "");
    this.syncColorLivePreview();
    this.openModal("modal-color");
  },

  saveColorFromForm(e) {
    e.preventDefault();
    const name = document.getElementById("color-form-name").value.trim();
    let code = document.getElementById("color-form-code").value.trim();
    const hex = document.getElementById("color-form-hex").value.trim();
    const image = document.getElementById("color-form-image").value.trim();

    if (!name || !hex) {
      this.toast("Nom et code Hex sont obligatoires", "danger");
      return;
    }

    if (!code) {
      code = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    const colorData = { name, code, hex, image };
    window.StoreDataManager.saveColor(colorData);
    this.closeModal("modal-color");
    this.renderColors();
    this.updateBadges();
    this.toast(`Coloris "${name}" enregistré !`, "success");
  },

  deleteColor(code) {
    if (!confirm(`Supprimer le coloris "${code}" ?`)) return;
    window.StoreDataManager.deleteColor(code);
    this.renderColors();
    this.renderProducts();
    this.renderStockMatrix();
    this.renderOverview();
    this.updateBadges();
    this.toast(`Coloris "${code}" supprimé avec succès`, "success");
  },

  // --------------------------------------------------------------------------
  // TAB 4: STOCK & INVENTORY MATRIX
  // --------------------------------------------------------------------------
  renderStockMatrix() {
    const tbody = document.getElementById("stock-matrix-tbody");
    if (!tbody) return;

    const allVariants = window.StoreDataManager.getAllVariants();
    const categories = window.StoreDataManager.getCategories();

    // Populate category dropdown filter if empty
    const catSelect = document.getElementById("stock-filter-category");
    if (catSelect && catSelect.options.length <= 1) {
      catSelect.innerHTML = `<option value="all">Toutes les Catégories</option>` +
        categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join("");
    }

    // Filter variants
    let filtered = allVariants;

    if (this.stockFilter === "low") {
      filtered = filtered.filter(v => v.stock > 0 && v.stock < 5);
    } else if (this.stockFilter === "out") {
      filtered = filtered.filter(v => v.stock === 0);
    } else if (this.stockFilter === "in") {
      filtered = filtered.filter(v => v.stock >= 5);
    }

    if (this.stockCategory !== "all") {
      filtered = filtered.filter(v => v.productCategory === this.stockCategory);
    }

    if (this.stockSearch) {
      const q = this.stockSearch.toLowerCase();
      filtered = filtered.filter(v => 
        v.productName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.colorName.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q)
      );
    }

    document.getElementById("stock-filtered-count").textContent = `${filtered.length} / ${allVariants.length} variantes`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--admin-text-muted);">
            Aucun variant ne correspond aux filtres actuels.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(v => {
      let badgeClass = "badge-instock";
      let badgeLabel = `En stock (${v.stock})`;
      if (v.stock === 0) {
        badgeClass = "badge-outstock";
        badgeLabel = "Rupture (0)";
      } else if (v.stock < 5) {
        badgeClass = "badge-lowstock";
        badgeLabel = `Faible (${v.stock})`;
      }

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${v.productImage || 'assets/images/hero/hero-banner.jpg'}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; background: #000;">
              <div>
                <a href="product.html?id=${v.productId}" target="_blank" style="color: #FFFFFF; font-weight: 600; text-decoration: none;">
                  ${v.productName} ↗
                </a>
                <div style="font-size: 0.72rem; color: var(--admin-text-muted); font-family: var(--font-mono);">${v.sku}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${v.colorHex}; border: 1px solid rgba(255,255,255,0.2); display: inline-block;"></span>
              <span style="font-size: 0.82rem;">${v.colorName}</span>
            </div>
          </td>
          <td><span class="admin-badge badge-active">${v.size}</span></td>
          <td><span style="font-weight: 600;">${v.price} MAD</span></td>
          <td><span class="admin-badge ${badgeClass}">${badgeLabel}</span></td>
          <td>
            <div class="stock-stepper-wrap">
              <button class="stock-stepper-btn" onclick="AdminDashboard.stepStock('${v.productId}', '${v.variantId}', -1)">−</button>
              <input type="number" class="stock-stepper-input" value="${v.stock}" min="0" 
                onchange="AdminDashboard.setStock('${v.productId}', '${v.variantId}', this.value)">
              <button class="stock-stepper-btn" onclick="AdminDashboard.stepStock('${v.productId}', '${v.variantId}', 1)">+</button>
            </div>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.quickRestock('${v.productId}', '${v.variantId}', 10)">
                +10
              </button>
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.quickRestock('${v.productId}', '${v.variantId}', 25)">
                +25
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  stepStock(productId, variantId, delta) {
    const allVariants = window.StoreDataManager.getAllVariants();
    const item = allVariants.find(v => v.productId === productId && v.variantId === variantId);
    if (!item) return;

    const newStock = Math.max(0, item.stock + delta);
    this.setStock(productId, variantId, newStock);
  },

  setStock(productId, variantId, newStock) {
    const updated = window.StoreDataManager.updateVariantStock(productId, variantId, newStock);
    if (updated) {
      this.renderStockMatrix();
      this.renderOverview();
      this.updateBadges();
      this.toast(`Stock mis à jour (${newStock} unités)`, "success");
    }
  },

  quickRestock(productId, variantId, amount) {
    const allVariants = window.StoreDataManager.getAllVariants();
    const item = allVariants.find(v => v.productId === productId && v.variantId === variantId);
    if (!item) return;

    const newStock = item.stock + amount;
    this.setStock(productId, variantId, newStock);
  },

  // --------------------------------------------------------------------------
  // TAB 5: PRODUCTS CATALOG MANAGEMENT
  // --------------------------------------------------------------------------
  setProductViewMode(mode) {
    this.productViewMode = mode;
    const btnSep = document.getElementById("btn-view-mode-separated");
    const btnGrp = document.getElementById("btn-view-mode-grouped");
    if (btnSep) btnSep.classList.toggle("active", mode === "separated");
    if (btnGrp) btnGrp.classList.toggle("active", mode === "grouped");
    this.renderProducts();
  },

  renderProducts() {
    const products = window.StoreDataManager.getProducts();
    const tbody = document.getElementById("products-table-tbody");
    if (!tbody) return;

    const categories = window.StoreDataManager.getCategories();

    // Populate category dropdown
    const catSelect = document.getElementById("products-filter-category");
    if (catSelect && catSelect.options.length <= 1) {
      catSelect.innerHTML = `<option value="all">Toutes les Catégories</option>` +
        categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join("");
    }

    let itemsToRender = [];

    if (this.productViewMode === "separated") {
      // Flatten products by colorways so every model is separated with its own thumbnails, stock and direct controls
      products.forEach(p => {
        const colors = (p.colors && p.colors.length > 0) ? p.colors : [{ name: "Standard", code: "default", hex: "#121212" }];
        colors.forEach(col => {
          const colImages = (p.images && p.images[col.code] && p.images[col.code].length > 0) 
            ? p.images[col.code] 
            : (col.image ? [col.image] : (p.images ? Object.values(p.images)[0] || [] : []));
          
          itemsToRender.push({
            parentProduct: p,
            color: col,
            id: p.id,
            colorCode: col.code,
            displayName: `${p.name} - ${col.name}`,
            category: p.category,
            group: p.group,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            isNew: p.isNew,
            isSale: p.isSale,
            isFeatured: p.isFeatured,
            tags: p.tags || [],
            images: colImages.length > 0 ? colImages : ["assets/images/hero/hero-banner.jpg"],
            variants: (p.variants || []).filter(v => v.color === col.code)
          });
        });
      });
    } else {
      // Grouped view by parent product
      itemsToRender = products.map(p => {
        const firstColor = (p.colors && p.colors[0]) || { name: "Standard", code: "default", hex: "#121212" };
        const pImages = (p.images && p.images[firstColor.code]) || (p.images && Object.values(p.images)[0]) || [firstColor.image || 'assets/images/hero/hero-banner.jpg'];
        return {
          parentProduct: p,
          color: firstColor,
          id: p.id,
          colorCode: firstColor.code,
          displayName: p.name,
          category: p.category,
          group: p.group,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          isNew: p.isNew,
          isSale: p.isSale,
          isFeatured: p.isFeatured,
          tags: p.tags || [],
          images: pImages,
          variants: p.variants || [],
          allColors: p.colors || []
        };
      });
    }

    // Apply category filter
    if (this.productCategory !== "all") {
      itemsToRender = itemsToRender.filter(item => item.category === this.productCategory);
    }

    // Apply search query
    if (this.productSearch) {
      const q = this.productSearch.toLowerCase();
      itemsToRender = itemsToRender.filter(item => 
        item.displayName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.color && item.color.name.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    const countLabel = this.productViewMode === "separated" ? "modèles / déclinaisons" : "produits";
    const countEl = document.getElementById("products-filtered-count");
    if (countEl) countEl.textContent = `${itemsToRender.length} ${countLabel}`;

    if (itemsToRender.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--admin-text-muted);">
            Aucun modèle ou produit trouvé.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = itemsToRender.map(item => {
      const p = item.parentProduct;
      const col = item.color;
      const pImages = item.images || [];
      const mainImg = pImages[0] || col.image || "assets/images/hero/hero-banner.jpg";
      const hoverImg = pImages[1] || mainImg;
      const totalStock = Array.isArray(item.variants) ? item.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 0;
      const variantCount = Array.isArray(item.variants) ? item.variants.length : 0;
      const categoryObj = categories.find(c => c.slug === item.category || c.id === item.category);

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <!-- Dual Thumbnail with Hover Flip (Colorway specific) -->
              <div class="product-dual-thumb-wrap" title="Survolez pour voir l'image au survol (hover) pour cette couleur">
                <img src="${mainImg}" alt="${item.displayName} face" class="product-dual-thumb-img thumb-main">
                <img src="${hoverImg}" alt="${item.displayName} dos/survol" class="product-dual-thumb-img thumb-hover">
              </div>
              <div>
                <a href="product.html?id=${p.id}&color=${col.code}" target="_blank" style="color: #FFFFFF; font-weight: 600; text-decoration: none;">
                  ${item.displayName} ↗
                </a>
                <div class="product-dual-badge-box" style="margin-top: 2px;">
                  <span style="color: var(--admin-gold);">🥇 1. Face</span> • 
                  <span style="color: var(--admin-info);">🥈 2. Survol</span>
                  ${pImages.length > 2 ? ` • <span style="color: var(--admin-text); font-weight: 600;">+${pImages.length - 2} photos</span>` : ''}
                </div>
                <div style="font-size: 0.72rem; color: var(--admin-text-muted); font-family: var(--font-mono); margin-top: 2px;">
                  ID: ${p.id} &bull; Color: <strong style="color: #FFF;">${col.code}</strong>
                </div>
              </div>
            </div>
          </td>
          <td>
            <span class="admin-badge badge-active">${categoryObj ? categoryObj.name : item.category}</span>
            ${item.group ? `<div style="font-size: 0.72rem; color: var(--admin-gold); font-family: var(--font-mono); margin-top: 3px;" title="Famille de Style">🏷️ ${item.group}</div>` : ''}
          </td>
          <td>
            ${this.productViewMode === "separated" ? `
              <div style="display: flex; gap: 6px; align-items: center;">
                <span title="${col.name}" style="width: 14px; height: 14px; border-radius: 50%; background-color: ${col.hex || '#111'}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                <span style="font-size: 0.82rem; font-weight: 600;">${col.name}</span>
              </div>
            ` : `
              <div style="display: flex; gap: 4px; align-items: center;">
                ${(item.allColors || []).map(c => `
                  <span title="${c.name}" style="width: 14px; height: 14px; border-radius: 50%; background-color: ${c.hex || '#111'}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                `).join("")}
              </div>
            `}
          </td>
          <td>
            <div style="font-weight: 600;">${item.price} MAD</div>
            ${item.compareAtPrice ? `<div style="font-size: 0.72rem; color: var(--admin-text-muted); text-decoration: line-through;">${item.compareAtPrice} MAD</div>` : ''}
          </td>
          <td>
            <div>${variantCount} SKUs ${item.variants.length > 0 ? `(${item.variants.map(v => v.size).join(', ')})` : ''}</div>
            <span class="admin-badge ${totalStock > 10 ? 'badge-instock' : totalStock > 0 ? 'badge-lowstock' : 'badge-outstock'}" style="margin-top: 4px;">
              ${totalStock} en stock
            </span>
          </td>
          <td>
            ${item.parentProduct.isBundle ? `
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <span class="admin-badge badge-active" style="background: rgba(212, 175, 55, 0.2); border: 1px solid var(--admin-gold); color: #FFF; font-weight: 700;">
                  📦 Pack (${item.parentProduct.bundleSlotsCount || 3} pcs)
                </span>
                ${item.isNew ? '<span class="admin-badge badge-instock">Nouveau</span>' : ''}
                ${item.isSale ? '<span class="admin-badge badge-outstock">Solde</span>' : ''}
              </div>
            ` : `
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${item.isNew ? '<span class="admin-badge badge-instock">Nouveau</span>' : ''}
                ${item.isSale ? '<span class="admin-badge badge-outstock">Solde</span>' : ''}
                ${item.isFeatured ? '<span class="admin-badge badge-active">Vedette</span>' : ''}
              </div>
            `}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.openEditProductModal('${p.id}', '${col.code}')" title="${item.parentProduct.isBundle ? 'Configurer ce Pack' : 'Modifier ce modèle / coloris'}">
                ${item.parentProduct.isBundle ? '⚙️ Configurer Pack' : 'Modifier'}
              </button>
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.duplicateProduct('${p.id}')" title="Dupliquer le produit">
                Dupliquer
              </button>
              <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="AdminDashboard.deleteProduct('${p.id}')" title="Supprimer le produit">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  // --------------------------------------------------------------------------
  // BUNDLE & PACKS STUDIO CONFIGURATION
  // --------------------------------------------------------------------------
  isCurrentEditingBundle: false,

  // Bundle Selection & Modal Picker State
  selectedBundleProductIds: [],
  targetBundleSlotIndex: null,
  bundlePickerModalQuery: '',
  bundlePickerModalColor: 'all',

  getAllTshirtVariations() {
    const allProducts = window.StoreDataManager.getProducts();
    const tshirts = allProducts.filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts');
    const list = [];

    tshirts.forEach(p => {
      const colors = (p.colors && p.colors.length > 0) ? p.colors : [{ name: "Noir Onyx", code: "black", hex: "#121212" }];
      colors.forEach(col => {
        const colImages = (p.images && p.images[col.code] && p.images[col.code].length > 0) 
          ? p.images[col.code] 
          : (col.image ? [col.image] : (p.images ? Object.values(p.images)[0] || [] : []));
        const thumb = (colImages && colImages[0]) || col.image || "assets/images/products/tshirt-white-front.jpg";

        list.push({
          itemKey: `${p.id}::${col.code}`,
          productId: p.id,
          productName: p.name,
          colorCode: col.code,
          colorName: col.name,
          colorHex: col.hex,
          category: p.category || 'T-Shirt',
          price: p.price || 249,
          displayName: `${p.name} - ${col.name}`,
          thumb: thumb,
          parentProduct: p
        });
      });
    });

    return list;
  },

  switchProductModalMode(isBundle) {
    this.isCurrentEditingBundle = isBundle;
    const titleEl = document.getElementById("product-modal-title");
    const submitBtn = document.getElementById("prod-form-submit-btn");
    const bundleView = document.getElementById("prod-form-bundle-view");
    const singleView = document.getElementById("prod-form-single-view");
    const tabSingle = document.getElementById("tab-btn-mode-single");
    const tabBundle = document.getElementById("tab-btn-mode-bundle");
    const isNew = !document.getElementById("prod-form-id")?.value;

    if (tabSingle && tabBundle) {
      tabSingle.classList.toggle("active", !isBundle);
      tabBundle.classList.toggle("active", isBundle);
    }

    if (isBundle) {
      if (bundleView) bundleView.style.display = "block";
      if (singleView) singleView.style.display = "none";
      if (titleEl && isNew) titleEl.textContent = "Créer un Nouveau Pack / Bundle Personnalisable";
      if (submitBtn) submitBtn.textContent = isNew ? "Enregistrer le Pack Bundle" : "Mettre à Jour le Pack";

      this.renderBundleProductsSelector();
    } else {
      if (bundleView) bundleView.style.display = "none";
      if (singleView) singleView.style.display = "block";
      if (titleEl && isNew) titleEl.textContent = "Créer un Nouveau Produit";
      if (submitBtn) submitBtn.textContent = isNew ? "Enregistrer le Produit" : "Enregistrer les Modifications";
    }
  },

  openAddBundleModal() {
    this.switchProductModalMode(true);

    document.getElementById("prod-form-id").value = "";
    document.getElementById("bundle-form-name").value = "Pack 3 T-Shirts Personnalisable";
    document.getElementById("bundle-form-slots").value = "3";
    document.getElementById("bundle-form-price").value = "599";
    document.getElementById("bundle-form-compare").value = "747";
    document.getElementById("bundle-form-shortdesc").value = "Composez votre coffret signature avec 3 t-shirts au choix parmi l'ensemble de nos modèles et coloris.";
    document.getElementById("bundle-form-desc").value = "Le Pack Studio vous offre la liberté de composer votre vestiaire idéal à prix préférentiel. Choisissez vos t-shirts préférés avec sélection libre des coupes, coloris et tailles.";
    document.getElementById("bundle-form-isnew").checked = true;
    document.getElementById("bundle-form-isfeatured").checked = true;

    const defaultBundleImg = "assets/images/products/t-shirts/tshirt-Pack-3.jpg";
    document.getElementById("bundle-form-image").value = defaultBundleImg;
    this.updateBundleMockupPreview(defaultBundleImg);

    // Start with empty selected list as requested
    this.selectedBundleProductIds = [];
    this.renderBundleProductsSelector();

    this.openModal("modal-product");
  },

  updateBundleMockupPreview(url) {
    const preview = document.getElementById("bundle-form-image-preview");
    if (preview) {
      preview.src = url || "assets/images/products/t-shirts/tshirt-Pack-3.jpg";
    }
  },

  renderBundleProductsSelector() {
    const allProducts = window.StoreDataManager.getProducts();
    const allVariations = this.getAllTshirtVariations();
    
    // 1. Populate Dropdown with optgroups per product model and options for each variation
    const selectEl = document.getElementById("bundle-add-prod-select");
    if (selectEl) {
      const remainingVariations = allVariations.filter(v => !this.selectedBundleProductIds.includes(v.itemKey) && !this.selectedBundleProductIds.includes(v.productId));
      
      // Group by parent product
      const groupedByProd = {};
      remainingVariations.forEach(v => {
        if (!groupedByProd[v.productName]) groupedByProd[v.productName] = [];
        groupedByProd[v.productName].push(v);
      });

      selectEl.innerHTML = `
        <option value="">(ou sélection rapide dans la liste... ${remainingVariations.length} déclinaisons disponibles)</option>
        ${Object.keys(groupedByProd).map(prodName => `
          <optgroup label="👕 ${prodName}">
            ${groupedByProd[prodName].map(v => `
              <option value="${v.itemKey}">${v.displayName} — ${StoreUtils.formatMoney(v.price)}</option>
            `).join('')}
          </optgroup>
        `).join('')}
      `;
      selectEl.value = "";
    }

    // 2. Render Selected Items Container (Exact layout of Mockup Coffret Pack)
    const container = document.getElementById("prod-form-bundle-selected-container");
    if (!container) return;

    if (this.selectedBundleProductIds.length === 0) {
      container.innerHTML = `
        <div class="admin-bundle-empty-state">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">👕</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">Aucun t-shirt dans ce pack</div>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); max-width: 440px; margin: 0 auto 14px;">
            Cliquez sur le bouton ci-dessous pour choisir vos modèles et déclinaisons de t-shirts avec aperçu visuel.
          </p>
          <button type="button" class="admin-btn admin-btn-primary" onclick="AdminDashboard.openBundleProductPickerModal()" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700;">
            <span>🖼️</span> Choisir un T-Shirt & Déclinaison
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${this.selectedBundleProductIds.map((itemKey, idx) => {
            const [prodId, colCode] = itemKey.split('::');
            const p = allProducts.find(x => x.id === prodId) || allProducts.find(x => x.id === itemKey);
            if (!p) return '';

            const col = (colCode && p.colors) ? p.colors.find(c => c.code === colCode) : (p.colors && p.colors[0]);
            const colImages = (col && p.images && p.images[col.code] && p.images[col.code].length > 0)
              ? p.images[col.code]
              : (col && col.image ? [col.image] : (p.images ? Object.values(p.images)[0] || [] : []));
            const thumb = (colImages && colImages[0]) || (col && col.image) || "assets/images/products/tshirt-white-front.jpg";
            const displayName = col ? `${p.name} - ${col.name}` : p.name;
            const colorDotHex = col ? col.hex : "#111111";
            const colorName = col ? col.name : "Teinte de base";

            return `
              <div class="admin-form-group" style="margin-bottom: 0;">
                <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span><b>T-Shirt #${idx + 1}</b> : ${displayName}</span>
                  <span style="font-weight: normal; font-size: 0.74rem; color: var(--admin-gold);">${StoreUtils.formatMoney(p.price || 249)} • ${colorName}</span>
                </label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <!-- Identical 50px Preview Box with gold border -->
                  <div class="admin-bundle-preview-wrap" style="width: 50px; height: 50px; border-radius: 6px; background: #0A0A0A; border: 1.5px solid var(--admin-gold); display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 2px; box-sizing: border-box; position: relative;">
                    <img src="${thumb}" 
                         alt="${displayName}" 
                         style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;"
                         onerror="this.src='assets/images/products/tshirt-white-front.jpg'">
                    <span style="position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; border-radius: 50%; background-color: ${colorDotHex}; border: 1px solid rgba(255,255,255,0.8);" title="${colorName}"></span>
                  </div>

                  <!-- Product Name & Variation Field -->
                  <input type="text" class="admin-form-input" value="${displayName} (${p.category || 'T-Shirt'})" readonly style="flex: 1; min-width: 0; background: var(--admin-surface); color: #FFFFFF; cursor: pointer;" onclick="AdminDashboard.openBundleProductPickerModal(${idx})">

                  <!-- Choisir Button -->
                  <button type="button" class="admin-btn admin-btn-secondary" onclick="AdminDashboard.openBundleProductPickerModal(${idx})" title="Remplacer cette déclinaison">
                    🖼️ Choisir
                  </button>

                  <!-- Remove Button -->
                  <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" onclick="AdminDashboard.removeBundleSlot(${idx})" title="Retirer ce t-shirt" style="padding: 7px 11px;">
                    ✕
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3. Update Summary
    this.updateBundleProductsSummary();
  },

  openBundleProductPickerModal(slotIndex = null) {
    this.targetBundleSlotIndex = slotIndex;
    this.bundlePickerModalQuery = '';
    this.bundlePickerModalColor = 'all';

    const titleEl = document.getElementById("bundle-picker-modal-title");
    if (titleEl) {
      titleEl.textContent = (slotIndex !== null && slotIndex >= 0)
        ? `Assigner un Modèle pour le T-Shirt #${slotIndex + 1}`
        : "Choisir un Modèle & Déclinaison de T-Shirt pour le Pack";
    }

    const searchInput = document.getElementById("bundle-picker-search");
    if (searchInput) searchInput.value = '';

    const filterPills = document.querySelectorAll("#bundle-picker-color-filters .admin-filter-pill");
    filterPills.forEach((p, idx) => p.classList.toggle("active", idx === 0));

    this.renderBundlePickerModalGrid();
    this.openModal("modal-bundle-product-picker");
  },

  filterBundlePickerModal(query) {
    this.bundlePickerModalQuery = (query || '').toLowerCase().trim();
    this.renderBundlePickerModalGrid();
  },

  filterBundlePickerByColor(colorCode, btnEl) {
    this.bundlePickerModalColor = colorCode;
    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll(".admin-filter-pill").forEach(p => p.classList.remove("active"));
      btnEl.classList.add("active");
    }
    this.renderBundlePickerModalGrid();
  },

  renderBundlePickerModalGrid() {
    const container = document.getElementById("bundle-modal-product-grid");
    if (!container) return;

    const allVariations = this.getAllTshirtVariations();
    const query = this.bundlePickerModalQuery;
    const colorFilter = this.bundlePickerModalColor;

    let filtered = allVariations;

    if (colorFilter && colorFilter !== 'all') {
      filtered = filtered.filter(v => 
        (v.colorCode || '').toLowerCase().includes(colorFilter.toLowerCase()) || 
        (v.colorName || '').toLowerCase().includes(colorFilter.toLowerCase())
      );
    }

    if (query) {
      filtered = filtered.filter(v => 
        v.displayName.toLowerCase().includes(query) || 
        v.category.toLowerCase().includes(query) || 
        v.colorName.toLowerCase().includes(query)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px; color: var(--admin-text-muted);">
          Aucun modèle ou déclinaison trouvé pour cette recherche.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(v => {
      const isSelected = this.selectedBundleProductIds.includes(v.itemKey) || this.selectedBundleProductIds.includes(v.productId);

      return `
        <div class="preset-item ${isSelected ? 'selected' : ''}" 
             onclick="AdminDashboard.selectBundleProductFromModal('${v.itemKey}')" 
             title="${v.displayName} - ${StoreUtils.formatMoney(v.price)}">
          <div style="position: relative; width: 100%; height: 85px; background: #0E0E0E; display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box;">
            <img src="${v.thumb}" alt="${v.displayName}" class="preset-img" style="height: 100%; width: 100%; object-fit: contain;" onerror="this.src='assets/images/products/tshirt-white-front.jpg'">
            <span style="position: absolute; bottom: 4px; right: 4px; width: 12px; height: 12px; border-radius: 50%; background-color: ${v.colorHex}; border: 1px solid rgba(255,255,255,0.6);" title="${v.colorName}"></span>
          </div>
          <div class="preset-label" style="font-weight: 700; color: #FFFFFF; font-size: 0.72rem; line-height: 1.25; padding: 5px 4px 2px;">
            ${v.productName}
          </div>
          <div style="font-size: 0.68rem; color: var(--admin-gold); text-align: center; padding: 1px 4px 4px; background: var(--admin-surface); display: flex; justify-content: space-around; align-items: center;">
            <span style="color: var(--admin-text-muted); font-size: 0.65rem;">${v.colorName}</span>
            <span>${StoreUtils.formatMoney(v.price)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  selectBundleProductFromModal(itemKey) {
    if (this.targetBundleSlotIndex !== null && this.targetBundleSlotIndex >= 0 && this.targetBundleSlotIndex < this.selectedBundleProductIds.length) {
      this.selectedBundleProductIds[this.targetBundleSlotIndex] = itemKey;
    } else {
      if (!this.selectedBundleProductIds.includes(itemKey)) {
        this.selectedBundleProductIds.push(itemKey);
      }
    }

    this.renderBundleProductsSelector();
    this.closeModal("modal-bundle-product-picker");
    
    const allVariations = this.getAllTshirtVariations();
    const match = allVariations.find(v => v.itemKey === itemKey);
    this.toast(`✓ "${match?.displayName || 'Modèle'}" sélectionné pour le pack`, "success");
  },

  handleSelectAddBundleProduct(itemKey) {
    if (!itemKey) return;
    if (!this.selectedBundleProductIds.includes(itemKey)) {
      this.selectedBundleProductIds.push(itemKey);
      this.renderBundleProductsSelector();
      const allVariations = this.getAllTshirtVariations();
      const match = allVariations.find(v => v.itemKey === itemKey);
      this.toast(`✓ "${match?.displayName || 'Modèle'}" ajouté au pack`, "success");
    }
  },

  removeBundleSlot(index) {
    if (index >= 0 && index < this.selectedBundleProductIds.length) {
      this.selectedBundleProductIds.splice(index, 1);
      this.renderBundleProductsSelector();
      this.toast("Modèle retiré du pack", "info");
    }
  },

  addAllBundleProducts() {
    const allVariations = this.getAllTshirtVariations();
    this.selectedBundleProductIds = allVariations.map(v => v.itemKey);
    this.renderBundleProductsSelector();
    this.toast("✓ Toutes les déclinaisons de t-shirts ont été ajoutées au pack", "success");
  },

  clearAllBundleProducts() {
    this.selectedBundleProductIds = [];
    this.renderBundleProductsSelector();
    this.toast("Sélection de t-shirts vidée", "info");
  },

  updateBundleProductsSummary() {
    const summary = document.getElementById("prod-form-bundle-products-summary");
    if (!summary) return;

    const count = this.selectedBundleProductIds.length;

    if (count === 0) {
      summary.innerHTML = `<span style="color: var(--admin-danger); font-weight: 700;">⚠️ Aucun t-shirt sélectionné pour ce pack (ajoutez au moins 1 modèle ou déclinaison ci-dessus)</span>`;
    } else {
      summary.innerHTML = `✓ <b>${count} pièce${count > 1 ? 's' : ''} / déclinaison${count > 1 ? 's' : ''} incluse${count > 1 ? 's' : ''}</b> dans ce pack studio`;
    }
  },

  getSelectedBundleProductIds() {
    const productIds = [];
    this.selectedBundleProductIds.forEach(key => {
      const prodId = key.split('::')[0];
      if (!productIds.includes(prodId)) productIds.push(prodId);
    });
    return productIds.length > 0 ? productIds : [...this.selectedBundleProductIds];
  },

  openAddProductModal() {
    const idInput = document.getElementById("prod-form-id");
    if (idInput) idInput.value = "";
    this.switchProductModalMode(false);
    this.populateProductFormDefaults();
    this.openModal("modal-product");
  },

  openEditProductModal(id, targetColorCode = null) {
    const product = window.StoreDataManager.getProductById(id);
    if (!product) {
      this.toast(`Produit "${id}" introuvable`, "danger");
      return;
    }

    const isBundle = !!product.isBundle || product.id === 'pack-trio-tshirts';
    
    const idInput = document.getElementById("prod-form-id");
    if (idInput) idInput.value = product.id;

    this.switchProductModalMode(isBundle);

    const titleEl = document.getElementById("product-modal-title");
    const submitBtn = document.getElementById("prod-form-submit-btn");

    if (isBundle) {
      if (titleEl) titleEl.textContent = `Modifier le Pack: ${product.name}`;
      if (submitBtn) submitBtn.textContent = "Mettre à Jour le Pack";

      document.getElementById("bundle-form-name").value = product.name || "";
      document.getElementById("bundle-form-slots").value = product.bundleSlotsCount || 3;
      document.getElementById("bundle-form-price").value = product.price || "";
      document.getElementById("bundle-form-compare").value = product.compareAtPrice || "";
      document.getElementById("bundle-form-shortdesc").value = product.shortDescription || "";
      document.getElementById("bundle-form-desc").value = product.description || "";
      document.getElementById("bundle-form-isnew").checked = !!product.isNew;
      document.getElementById("bundle-form-isfeatured").checked = !!product.isFeatured;

      const bundleImg = (product.colors && product.colors[0] && product.colors[0].image) || (product.images && product.images.bundle && product.images.bundle[0]) || "assets/images/products/t-shirts/tshirt-Pack-3.jpg";
      document.getElementById("bundle-form-image").value = bundleImg;
      this.updateBundleMockupPreview(bundleImg);

      const allProducts = window.StoreDataManager.getProducts();
      const tshirts = allProducts.filter(prod => !prod.isBundle && prod.id !== 'pack-trio-tshirts');
      const includedIds = (Array.isArray(product.bundleIncludedProductIds) && product.bundleIncludedProductIds.length > 0)
        ? product.bundleIncludedProductIds 
        : tshirts.map(t => t.id);
      
      this.selectedBundleProductIds = [...includedIds];
      this.renderBundleProductsSelector();
    } else {
      if (titleEl) titleEl.textContent = `Modifier: ${product.name}`;
      if (submitBtn) submitBtn.textContent = "Enregistrer les Modifications";
      this.populateProductFormWithData(product, targetColorCode);
    }

    this.openModal("modal-product");
  },

  populateProductFormDefaults() {
    const categories = window.StoreDataManager.getCategories();
    const colors = window.StoreDataManager.getColors();

    // Populate Category select
    const catSelect = document.getElementById("prod-form-category");
    catSelect.innerHTML = categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join("");

    document.getElementById("prod-form-name").value = "";
    document.getElementById("prod-form-group").value = "";
    document.getElementById("prod-form-slug").value = "";
    document.getElementById("prod-form-price").value = "249";
    document.getElementById("prod-form-compare").value = "";
    document.getElementById("prod-form-shortdesc").value = "T-shirt à la coupe oversized contemporaine, taillé dans un jersey 100% coton lourd.";
    document.getElementById("prod-form-desc").value = "Pièce fondamentale de notre collection permanente. Coupe boxy moderne aux épaules tombantes et col côtelé renforcé.";
    document.getElementById("prod-form-materials").value = "100% Coton peigné haut de gamme 240 GSM";
    document.getElementById("prod-form-fit").value = "Coupe oversize prononcée. Prenez votre taille habituelle.";
    document.getElementById("prod-form-care").value = "Lavage en machine à 30°C sur l'envers. Séchage à plat.";
    document.getElementById("prod-form-details").value = "Coupe oversized décontractée\nJersey épais de qualité supérieure\nCol rond côtelé renforcé 3 cm\nCoutures renforcées double aiguille";
    document.getElementById("prod-form-tags").value = "oversized, coton lourd, streetwear, premium";

    document.getElementById("prod-form-isnew").checked = true;
    document.getElementById("prod-form-issale").checked = false;
    document.getElementById("prod-form-isfeatured").checked = true;

    // Render Color rows with linked product page selector (start clean with no color pre-checked)
    this.renderProductColorRows([], "");

    // Render Size pills selector with defaults
    this.renderProductSizePills(["S", "M", "L", "XL"]);

    // Initial clean Gallery state (no color pre-selected)
    this.activeEditColor = null;
    this.currentProductImages = {};
    this.currentGalleryImages = [];
    this.renderProductGalleryColorTabs([]);
    this.renderGalleryCards();
  },

  // --------------------------------------------------------------------------
  // PRODUCT SIZES SELECTOR MANAGEMENT
  // --------------------------------------------------------------------------
  STANDARD_SIZES: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Unique"],

  renderProductSizePills(selectedSizes = ["S", "M", "L", "XL"]) {
    const container = document.getElementById("prod-form-sizes-container");
    if (!container) return;

    const currentSelected = Array.isArray(selectedSizes) ? selectedSizes : ["S", "M", "L", "XL"];

    container.innerHTML = this.STANDARD_SIZES.map(sz => {
      const isChecked = currentSelected.includes(sz);
      return `
        <label class="admin-size-pill-card ${isChecked ? 'active' : ''}" id="size-pill-card-${sz}">
          <input type="checkbox" name="prod_size" value="${sz}" ${isChecked ? 'checked' : ''} 
                 onchange="AdminDashboard.handleSizeCheckboxChange(this)">
          <span class="admin-size-pill-label">${sz}</span>
        </label>
      `;
    }).join("");

    this.updateSizeSelectionSummary();
  },

  handleSizeCheckboxChange(input) {
    const card = document.getElementById(`size-pill-card-${input.value}`);
    if (card) {
      if (input.checked) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    }
    this.updateSizeSelectionSummary();
  },

  setSizePreset(presetSizes = []) {
    document.querySelectorAll("input[name='prod_size']").forEach(input => {
      const shouldCheck = presetSizes.includes(input.value);
      input.checked = shouldCheck;
      const card = document.getElementById(`size-pill-card-${input.value}`);
      if (card) {
        if (shouldCheck) card.classList.add("active");
        else card.classList.remove("active");
      }
    });
    this.updateSizeSelectionSummary();
    this.toast(`Tailles sélectionnées : ${presetSizes.join(', ')}`, "info");
  },

  toggleAllSizes(checkAll = true) {
    document.querySelectorAll("input[name='prod_size']").forEach(input => {
      input.checked = checkAll;
      const card = document.getElementById(`size-pill-card-${input.value}`);
      if (card) {
        if (checkAll) card.classList.add("active");
        else card.classList.remove("active");
      }
    });
    this.updateSizeSelectionSummary();
  },

  updateSizeSelectionSummary() {
    const summary = document.getElementById("prod-form-sizes-summary");
    if (!summary) return;

    const checked = [];
    document.querySelectorAll("input[name='prod_size']:checked").forEach(input => {
      checked.push(input.value);
    });

    if (checked.length === 0) {
      summary.innerHTML = `<span style="color: var(--admin-danger); font-weight: 700;">⚠️ Aucune taille cochée (veuillez sélectionner au moins une taille)</span>`;
    } else {
      summary.innerHTML = `✓ <b>${checked.length} taille${checked.length > 1 ? 's' : ''} active${checked.length > 1 ? 's' : ''} :</b> ${checked.join(' • ')}`;
    }
  },

  getSelectedSizesFromForm() {
    const checked = [];
    document.querySelectorAll("input[name='prod_size']:checked").forEach(input => {
      checked.push(input.value);
    });
    return checked.length > 0 ? checked : ["M"];
  },

  renderProductColorRows(existingColors = [], currentProductId = '') {
    const colorContainer = document.getElementById("prod-form-color-checkboxes");
    if (!colorContainer) return;

    const colors = window.StoreDataManager.getColors();
    const allProducts = window.StoreDataManager.getProducts();
    const activeColors = Array.isArray(existingColors) ? existingColors : [];

    colorContainer.innerHTML = colors.map(col => {
      const existingMatch = activeColors.find(c => c.code === col.code);
      const isChecked = !!existingMatch;
      const linkedId = (existingMatch && existingMatch.productId) ? existingMatch.productId : "";

      return `
        <div class="admin-color-link-card ${isChecked ? 'is-selected' : ''}">
          <!-- Checkbox + Swatch + Name -->
          <label class="admin-color-link-label">
            <input type="checkbox" name="prod_color" value="${col.code}" 
                   data-name="${col.name}" data-hex="${col.hex}" data-image="${(existingMatch && existingMatch.image) ? existingMatch.image : (col.image || '')}"
                   ${isChecked ? 'checked' : ''} onchange="AdminDashboard.handleColorCheckboxChange()">
            <span class="admin-color-link-dot" style="background-color: ${col.hex};"></span>
            <div class="admin-color-link-text">
              <span class="admin-color-link-name">${col.name}</span>
              <span class="admin-color-link-hex">${col.hex}</span>
            </div>
          </label>

          <!-- Linked Product Page Selector -->
          <div class="admin-color-link-select-wrap">
            <span class="admin-color-link-select-hint">🔗 Fiche liée :</span>
            <select class="admin-form-select admin-color-link-select" id="prod-color-link-${col.code}">
              <option value="">(Cette même fiche produit)</option>
              ${allProducts.map(p => `
                <option value="${p.id}" ${linkedId === p.id ? 'selected' : ''}>
                  ${p.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }).join("");
  },

  handleColorCheckboxChange() {
    const selectedColors = [];
    document.querySelectorAll("input[name='prod_color']:checked").forEach(input => {
      selectedColors.push({
        name: input.getAttribute("data-name") || input.value,
        code: input.value,
        hex: input.getAttribute("data-hex") || "#121212"
      });
    });

    // Update parent card active class
    document.querySelectorAll(".admin-color-link-card").forEach(card => {
      const chk = card.querySelector("input[name='prod_color']");
      if (chk) card.classList.toggle("is-selected", chk.checked);
    });

    if (selectedColors.length > 0) {
      if (!selectedColors.some(c => c.code === this.activeEditColor)) {
        this.switchEditGalleryColor(selectedColors[0].code);
      } else {
        this.renderProductGalleryColorTabs(selectedColors);
      }
    } else {
      this.activeEditColor = null;
      this.currentGalleryImages = [];
      this.renderProductGalleryColorTabs([]);
      this.renderGalleryCards();
    }
  },

  renderProductGalleryColorTabs(selectedColors = []) {
    const tabsContainer = document.getElementById("product-gallery-color-tabs");
    if (!tabsContainer) return;

    if (!selectedColors || selectedColors.length <= 1) {
      tabsContainer.style.display = "none";
      return;
    }

    tabsContainer.style.display = "flex";
    tabsContainer.innerHTML = `
      <span style="font-size: 0.75rem; color: var(--admin-text-muted); font-weight: 600; margin-right: 4px;">Galerie pour :</span>
      ${selectedColors.map(c => {
        const isActive = c.code === this.activeEditColor;
        const imgCount = (this.currentProductImages[c.code] && this.currentProductImages[c.code].length) || 0;
        return `
          <button type="button" class="gallery-color-tab-btn ${isActive ? 'active' : ''}" 
                  onclick="AdminDashboard.switchEditGalleryColor('${c.code}')">
            <span class="gallery-color-tab-dot" style="background-color: ${c.hex};"></span>
            <span>${c.name}</span>
            <span style="font-size: 0.72rem; color: var(--admin-text-muted); background: var(--admin-surface-3); padding: 1px 6px; border-radius: 999px;">${imgCount}</span>
          </button>
        `;
      }).join("")}
    `;
  },

  switchEditGalleryColor(colorCode) {
    if (!colorCode) return;

    // Save current working images to the previous active color
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }

    this.activeEditColor = colorCode;

    // Load or initialize images for the new active color
    if (!this.currentProductImages[colorCode] || this.currentProductImages[colorCode].length === 0) {
      const allColors = window.StoreDataManager.getColors();
      const colObj = allColors.find(c => c.code === colorCode);
      const fallbackImg = (colObj && colObj.image) ? colObj.image : "";
      this.currentProductImages[colorCode] = fallbackImg ? [fallbackImg] : [];
    }

    this.currentGalleryImages = [...this.currentProductImages[colorCode]];

    // Re-render tabs and gallery cards
    const selectedColors = [];
    document.querySelectorAll("input[name='prod_color']:checked").forEach(input => {
      selectedColors.push({
        name: input.getAttribute("data-name") || input.value,
        code: input.value,
        hex: input.getAttribute("data-hex") || "#121212"
      });
    });

    this.renderProductGalleryColorTabs(selectedColors);
    this.renderGalleryCards();
  },

  populateProductFormWithData(p, targetColorCode = null) {
    this.populateProductFormDefaults();

    document.getElementById("prod-form-id").value = p.id;
    document.getElementById("prod-form-name").value = p.name;
    document.getElementById("prod-form-group").value = p.group || "";
    document.getElementById("prod-form-slug").value = p.slug || p.id;
    document.getElementById("prod-form-category").value = p.category;
    document.getElementById("prod-form-price").value = p.price;
    document.getElementById("prod-form-compare").value = p.compareAtPrice || "";
    document.getElementById("prod-form-shortdesc").value = p.shortDescription || "";
    document.getElementById("prod-form-desc").value = p.description || "";
    document.getElementById("prod-form-materials").value = p.materials || "";
    document.getElementById("prod-form-fit").value = p.fit || "";
    document.getElementById("prod-form-care").value = p.careInstructions || "";
    document.getElementById("prod-form-details").value = Array.isArray(p.details) ? p.details.join("\n") : "";
    document.getElementById("prod-form-tags").value = Array.isArray(p.tags) ? p.tags.join(", ") : "";

    document.getElementById("prod-form-isnew").checked = !!p.isNew;
    document.getElementById("prod-form-issale").checked = !!p.isSale;
    document.getElementById("prod-form-isfeatured").checked = !!p.isFeatured;

    // Render Color rows populated with existing product color links
    const colors = (p.colors && p.colors.length > 0) ? p.colors : [{ name: "Noir Onyx", code: "black", hex: "#121212" }];
    this.renderProductColorRows(colors, p.id);

    // Render Size pills selector populated with existing product sizes
    this.renderProductSizePills(Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["S", "M", "L", "XL"]);

    // Deep clone product images dictionary
    this.currentProductImages = {};
    if (p.images && typeof p.images === "object") {
      Object.keys(p.images).forEach(k => {
        if (Array.isArray(p.images[k])) {
          this.currentProductImages[k] = [...p.images[k]];
        }
      });
    }

    // Set active color to targetColorCode if specified, or first color
    const firstColorCode = (colors[0] && colors[0].code) || "black";
    this.activeEditColor = (targetColorCode && colors.some(c => c.code === targetColorCode)) ? targetColorCode : firstColorCode;

    // Ensure active color has image list
    if (!this.currentProductImages[this.activeEditColor] || this.currentProductImages[this.activeEditColor].length === 0) {
      const colObj = colors.find(c => c.code === this.activeEditColor);
      this.currentProductImages[this.activeEditColor] = colObj && colObj.image ? [colObj.image] : ["assets/images/products/t-shirts/essential-oversized-tee/front-main.png"];
    }

    this.currentGalleryImages = [...this.currentProductImages[this.activeEditColor]];

    this.renderProductGalleryColorTabs(colors);
    this.renderGalleryCards();
  },

  // --------------------------------------------------------------------------
  // GALLERY SUITE LOGIC: MAIN, HOVER & MULTI-IMAGE UPLOADS
  // --------------------------------------------------------------------------
  renderGalleryCards() {
    const container = document.getElementById("product-gallery-cards-container");
    if (!container) return;

    if (!this.currentGalleryImages || this.currentGalleryImages.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--admin-text-muted); background: var(--admin-surface); border-radius: 6px; border: 1px dashed var(--admin-border);">
          Aucun visuel dans la galerie pour ce coloris. Importez une image locale ou choisissez un mockup ci-dessus.
        </div>
      `;
      return;
    }

    container.innerHTML = this.currentGalleryImages.map((imgUrl, index) => {
      const isMain = index === 0;
      const isHover = index === 1;

      let badgeHtml = "";
      let cardClass = "";

      if (isMain) {
        badgeHtml = `<span class="gallery-card-badge badge-role-main">🥇 1. Principale (Face)</span>`;
        cardClass = "is-main";
      } else if (isHover) {
        badgeHtml = `<span class="gallery-card-badge badge-role-hover">🥈 2. Au Survol (Hover)</span>`;
        cardClass = "is-hover";
      } else {
        badgeHtml = `<span class="gallery-card-badge badge-role-gallery">🥉 ${index + 1}. Galerie</span>`;
      }

      return `
        <div class="gallery-img-card ${cardClass}">
          <div class="gallery-card-thumb-wrap">
            ${badgeHtml}
            <img src="${imgUrl}" alt="Vue ${index + 1}" class="gallery-card-thumb">
          </div>
          
          <div class="gallery-card-actions">
            <!-- Quick Role Selectors -->
            <div class="gallery-role-btns">
              <button type="button" class="admin-btn ${isMain ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm" 
                onclick="AdminDashboard.setMainGalleryImage(${index})" title="Définir comme visuel principal de face">
                ${isMain ? '✓ Principale' : '👑 Principale'}
              </button>
              <button type="button" class="admin-btn ${isHover ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm" 
                onclick="AdminDashboard.setHoverGalleryImage(${index})" title="Définir comme image affichée au survol (hover)">
                ${isHover ? '✓ Au Survol' : '🔄 Survol'}
              </button>
            </div>

            <!-- Position Controls & Delete -->
            <div class="gallery-order-btns">
              <div style="display: flex; gap: 4px;">
                <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" style="padding: 2px 8px;"
                  onclick="AdminDashboard.moveGalleryImage(${index}, -1)" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Déplacer vers la gauche">
                  ◀
                </button>
                <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" style="padding: 2px 8px;"
                  onclick="AdminDashboard.moveGalleryImage(${index}, 1)" ${index === this.currentGalleryImages.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Déplacer vers la droite">
                  ▶
                </button>
              </div>

              <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" style="padding: 2px 8px;"
                onclick="AdminDashboard.removeGalleryImage(${index})" title="Supprimer cette image">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  setMainGalleryImage(index) {
    if (index === 0 || index >= this.currentGalleryImages.length) return;
    const item = this.currentGalleryImages.splice(index, 1)[0];
    this.currentGalleryImages.unshift(item);
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }
    this.renderGalleryCards();
    this.toast("Image définie comme Visuel Principal (1)", "success");
  },

  setHoverGalleryImage(index) {
    if (index === 1 || index >= this.currentGalleryImages.length) return;
    const item = this.currentGalleryImages.splice(index, 1)[0];
    if (this.currentGalleryImages.length === 0) {
      this.currentGalleryImages.push(item);
    } else {
      this.currentGalleryImages.splice(1, 0, item);
    }
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }
    this.renderGalleryCards();
    this.toast("Image définie comme Visuel au Survol (2)", "success");
  },

  moveGalleryImage(index, delta) {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= this.currentGalleryImages.length) return;
    const temp = this.currentGalleryImages[index];
    this.currentGalleryImages[index] = this.currentGalleryImages[targetIdx];
    this.currentGalleryImages[targetIdx] = temp;
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }
    this.renderGalleryCards();
  },

  removeGalleryImage(index) {
    if (index < 0 || index >= this.currentGalleryImages.length) return;
    this.currentGalleryImages.splice(index, 1);
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }
    this.renderGalleryCards();
    this.toast("Image retirée de la galerie", "success");
  },

  compressImageFile(file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  async handleImageFileUpload(event, replaceMain = false) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const existingId = document.getElementById("prod-form-id")?.value;
    const nameVal = document.getElementById("prod-form-name")?.value.trim() || "nouveau-produit";
    const slugVal = document.getElementById("prod-form-slug")?.value.trim();
    const categoryVal = document.getElementById("prod-form-category")?.value || "t-shirts";
    const productId = existingId || slugVal || nameVal.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    this.toast(`Optimisation et téléversement de ${files.length} image(s)...`, "info");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Automatically optimize/compress image to prevent LocalStorage quota overflow
        const compressedDataUrl = await this.compressImageFile(file, 1600, 0.85) || await this.readFileAsDataURL(file);

        let finalImagePath = null;

        // Try server upload API (works on Node local dev and Hostinger PHP)
        try {
          const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: productId,
              category: categoryVal,
              filename: file.name,
              dataUrl: compressedDataUrl
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.path) {
              finalImagePath = data.path;
            }
          }
        } catch (apiErr) {
          console.warn("Upload API unavailable, using optimized local data URL:", apiErr.message);
        }

        const chosenUrl = finalImagePath || compressedDataUrl;

        // If replaceMain was requested or if gallery was empty, place at index 0 (Primary)
        if (replaceMain || this.currentGalleryImages.length === 0) {
          this.currentGalleryImages.unshift(chosenUrl);
          this.toast(`✓ Définie comme image principale : ${file.name}`, "success");
        } else {
          this.currentGalleryImages.push(chosenUrl);
          this.toast(`✓ Ajoutée à la galerie : ${file.name}`, "success");
        }
      } catch (err) {
        console.error("Error processing image file:", err);
        this.toast(`Erreur avec le fichier ${file.name}: ${err.message}`, "danger");
      }
    }

    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }

    this.renderGalleryCards();
    event.target.value = "";
  },

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  openImagePickerForGallery() {
    this.activeImageTargetInput = "gallery";
    this.openModal("modal-image-picker");
  },

  addImageUrlToGallery() {
    const input = document.getElementById("prod-custom-img-url");
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
      this.toast("Veuillez saisir une URL ou chemin d'image valide", "danger");
      return;
    }

    this.currentGalleryImages.push(val);
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }
    input.value = "";
    this.renderGalleryCards();
    this.toast("Image ajoutée à la galerie", "success");
  },

  saveProductFromForm(e) {
    e.preventDefault();

    if (this.isCurrentEditingBundle) {
      // ----------------------------------------------------------------------
      // SAVE PACK / BUNDLE PRODUCT
      // ----------------------------------------------------------------------
      const existingId = document.getElementById("prod-form-id").value;
      const name = document.getElementById("bundle-form-name").value.trim();
      const price = parseInt(document.getElementById("bundle-form-price").value, 10) || 0;
      const compareAtPrice = parseInt(document.getElementById("bundle-form-compare").value, 10) || null;
      const bundleSlotsCount = parseInt(document.getElementById("bundle-form-slots").value, 10) || 3;
      const bundleImage = document.getElementById("bundle-form-image").value.trim() || "assets/images/products/t-shirts/tshirt-Pack-3.jpg";
      const shortDescription = document.getElementById("bundle-form-shortdesc").value.trim();
      const description = document.getElementById("bundle-form-desc").value.trim();
      const isNew = document.getElementById("bundle-form-isnew").checked;
      const isFeatured = document.getElementById("bundle-form-isfeatured").checked;

      if (!name) {
        this.toast("Le nom du pack est obligatoire", "danger");
        return;
      }
      if (price <= 0) {
        this.toast("Veuillez saisir un prix valide pour le pack", "danger");
        return;
      }

      const bundleIncludedProductIds = this.getSelectedBundleProductIds();
      if (bundleIncludedProductIds.length === 0) {
        this.toast("Veuillez sélectionner au moins 1 modèle de t-shirt pour ce pack", "danger");
        return;
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const id = existingId || slug;

      const packProductData = {
        id,
        name,
        slug,
        category: "t-shirts",
        collections: ["essential-collection", "new-arrivals"],
        price,
        compareAtPrice,
        isNew,
        isSale: false,
        isFeatured,
        isBundle: true,
        bundleSlotsCount,
        bundleIncludedProductIds,
        rating: 5,
        reviewCount: 38,
        shortDescription: shortDescription || `Composez votre pack de ${bundleSlotsCount} t-shirts au choix parmi l'ensemble de nos coupes d'exception.`,
        description: description || `Pack personnalisable de ${bundleSlotsCount} pièces. Choix libre des modèles, coloris et tailles.`,
        details: [
          `${bundleSlotsCount} T-Shirts au choix parmi l'ensemble du catalogue éligible`,
          "Sélection libre du modèle, de la couleur et de la taille pour chaque pièce",
          "Jersey lourd d'exception 240 à 300 GSM en 100% coton peigné",
          "Livraison Express Gratuite partout au Maroc",
          "Livré dans notre coffret collector signature Atelier"
        ],
        materials: "100% Coton peigné haute densité (240 - 300 GSM)",
        fit: "Coupes libres au choix (Boxy, Oversize, Décontractée)",
        careInstructions: "Lavage en machine à 30°C sur l'envers. Séchage à plat.",
        colors: [{
          name: "Pack Sur-Mesure",
          code: "bundle",
          hex: "#111111",
          image: bundleImage,
          productId: id,
          linkUrl: `product.html?id=${id}`
        }],
        sizes: [`Custom (${bundleSlotsCount} Tailles au choix)`],
        images: {
          bundle: [bundleImage]
        },
        variants: [{
          id: `${id.substring(0, 8)}-pack`,
          color: "bundle",
          size: `Custom (${bundleSlotsCount} Pièces)`,
          sku: `PACK-${id.substring(0, 6).toUpperCase()}`,
          stock: 50,
          price
        }],
        tags: ["pack", "bundle", "offre speciale", `${bundleSlotsCount} tshirts`, "streetwear", "coton lourd"]
      };

      const saved = window.StoreDataManager.saveProduct(packProductData);
      this.closeModal("modal-product");
      this.renderProducts();
      this.renderStockMatrix();
      this.renderOverview();
      this.updateBadges();
      if (saved) {
        this.toast(`✓ Pack "${name}" enregistré avec succès !`, "success");
      } else {
        this.toast(`⚠️ Pack "${name}" mis à jour en mémoire (attention : quota stockage navigateur saturé)`, "warning");
      }
      return;
    }

    // ------------------------------------------------------------------------
    // SAVE STANDARD SINGLE PRODUCT
    // ------------------------------------------------------------------------
    const existingId = document.getElementById("prod-form-id").value;
    const name = document.getElementById("prod-form-name").value.trim();
    const group = document.getElementById("prod-form-group").value.trim() || undefined;
    let slug = document.getElementById("prod-form-slug").value.trim();
    const category = document.getElementById("prod-form-category").value;
    const price = parseInt(document.getElementById("prod-form-price").value, 10) || 0;
    const compareAtPrice = parseInt(document.getElementById("prod-form-compare").value, 10) || null;
    const shortDescription = document.getElementById("prod-form-shortdesc").value.trim();
    const description = document.getElementById("prod-form-desc").value.trim();
    const materials = document.getElementById("prod-form-materials").value.trim();
    const fit = document.getElementById("prod-form-fit").value.trim();
    const careInstructions = document.getElementById("prod-form-care").value.trim();
    const details = document.getElementById("prod-form-details").value.split("\n").map(s => s.trim()).filter(Boolean);
    const tags = document.getElementById("prod-form-tags").value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

    const isNew = document.getElementById("prod-form-isnew").checked;
    const isSale = document.getElementById("prod-form-issale").checked;
    const isFeatured = document.getElementById("prod-form-isfeatured").checked;

    if (!name) {
      this.toast("Le nom du produit est obligatoire", "danger");
      return;
    }

    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    const id = existingId || slug;

    // Sync current gallery to active color
    if (this.activeEditColor) {
      this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
    }

    // Collect checked colors and their linked product pages
    let selectedColors = [];
    document.querySelectorAll("input[name='prod_color']:checked").forEach(input => {
      const code = input.value;
      const linkSelect = document.getElementById(`prod-color-link-${code}`);
      const linkedProductId = linkSelect ? linkSelect.value.trim() : "";
      const colImgList = this.currentProductImages[code] || [];
      const colImage = colImgList[0] || input.getAttribute("data-image") || "assets/images/hero/hero-banner.jpg";

      selectedColors.push({
        name: input.getAttribute("data-name") || code,
        code: code,
        hex: input.getAttribute("data-hex") || "#121212",
        image: colImage,
        productId: linkedProductId || id,
        linkUrl: linkedProductId ? `product.html?id=${linkedProductId}&color=${code}` : `product.html?id=${id}&color=${code}`
      });
    });

    if (selectedColors.length === 0) {
      this.toast("Veuillez cocher au moins un coloris pour ce produit", "danger");
      return;
    }

    // Sizes (from interactive selector)
    const sizes = this.getSelectedSizesFromForm();

    // Retain existing variant stock if editing, or create new variants
    let existingVariants = [];
    if (existingId) {
      const oldProd = window.StoreDataManager.getProductById(existingId);
      if (oldProd && Array.isArray(oldProd.variants)) {
        existingVariants = oldProd.variants;
      }
    }

    let variants = [];
    let images = {};

    selectedColors.forEach(col => {
      if (this.currentProductImages[col.code] && this.currentProductImages[col.code].length > 0) {
        images[col.code] = [...this.currentProductImages[col.code]];
      } else if (this.currentGalleryImages && this.currentGalleryImages.length > 0) {
        images[col.code] = [...this.currentGalleryImages];
      } else {
        images[col.code] = [col.image || "assets/images/hero/hero-banner.jpg"];
      }

      sizes.forEach(sz => {
        const variantId = `${id.substring(0, 4)}-${col.code.substring(0, 3)}-${sz.toLowerCase()}`;
        const existing = existingVariants.find(v => v.color === col.code && v.size === sz);
        const stock = existing ? existing.stock : 10;
        const sku = `${category.substring(0, 3)}-${col.code.substring(0, 3)}-${sz}`.toUpperCase();

        variants.push({
          id: variantId,
          color: col.code,
          size: sz,
          sku,
          stock,
          price
        });
      });
    });

    const existingCollections = (oldProd && Array.isArray(oldProd.collections) && oldProd.collections.length > 0)
      ? oldProd.collections
      : ["essential-collection", "new-arrivals"];

    const productData = {
      id,
      group,
      name,
      slug,
      category,
      collections: existingCollections,
      price,
      compareAtPrice,
      isNew,
      isSale,
      isFeatured,
      isBundle: (oldProd && typeof oldProd.isBundle === 'boolean') ? oldProd.isBundle : false,
      rating: (oldProd && oldProd.rating) || 5,
      reviewCount: (oldProd && oldProd.reviewCount) || 24,
      shortDescription,
      description,
      details,
      materials,
      fit,
      careInstructions,
      colors: selectedColors,
      sizes,
      images,
      variants,
      tags
    };

    const saved = window.StoreDataManager.saveProduct(productData);
    this.closeModal("modal-product");
    this.renderProducts();
    this.renderStockMatrix();
    this.renderOverview();
    this.updateBadges();
    if (saved) {
      this.toast(`✓ Produit "${name}" enregistré avec succès !`, "success");
    } else {
      this.toast(`⚠️ Produit "${name}" mis à jour en session (attention : quota de stockage navigateur saturé)`, "warning");
    }
  },

  duplicateProduct(id) {
    const product = window.StoreDataManager.getProductById(id);
    if (!product) return;

    const clone = JSON.parse(JSON.stringify(product));
    const newId = `${product.id}-copy-${Date.now().toString().slice(-4)}`;
    clone.id = newId;
    clone.slug = newId;
    clone.name = `${product.name} (Copie)`;

    if (Array.isArray(clone.variants)) {
      clone.variants.forEach(v => {
        v.id = `${newId.substring(0, 4)}-${v.color.substring(0, 3)}-${v.size.toLowerCase()}`;
        v.sku = `${v.sku}-CP`;
      });
    }

    window.StoreDataManager.saveProduct(clone);
    this.renderProducts();
    this.renderStockMatrix();
    this.renderOverview();
    this.updateBadges();
    this.toast("Produit dupliqué avec succès", "success");
  },

  deleteProduct(id) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit "${id}" ?`)) return;
    window.StoreDataManager.deleteProduct(id);
    this.renderProducts();
    this.renderStockMatrix();
    this.renderOverview();
    this.updateBadges();
    this.toast("Produit supprimé", "success");
  },

  // --------------------------------------------------------------------------
  // IMAGE PRESET PICKER & DYNAMIC PROJECT IMAGES SYNC
  // --------------------------------------------------------------------------
  async bindPresetPicker() {
    await this.loadAllProjectImages();
  },

  async loadAllProjectImages() {
    let images = [...(window.StoreDataManager.IMAGE_PRESETS || [])];

    try {
      const res = await fetch("/api/images");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.images)) {
        // Merge without duplicating URLs
        data.images.forEach(img => {
          if (!images.some(p => p.url === img.url)) {
            images.push(img);
          }
        });
      }
    } catch (e) {
      console.warn("Could not load dynamic image list from /api/images:", e.message);
    }

    this.allAvailableImages = images;
    this.renderPresetPickerGrid();
  },

  renderPresetPickerGrid() {
    const container = document.getElementById("image-preset-picker-grid");
    if (!container) return;

    let list = this.allAvailableImages || (window.StoreDataManager.IMAGE_PRESETS || []);

    // Filter by color category
    if (this.presetFilterColor && this.presetFilterColor !== "all") {
      const col = this.presetFilterColor.toLowerCase();
      list = list.filter(p => 
        (p.color && p.color.toLowerCase() === col) || 
        p.url.toLowerCase().includes(col) || 
        (p.label && p.label.toLowerCase().includes(col))
      );
    }

    // Filter by search query
    if (this.presetFilterQuery) {
      const q = this.presetFilterQuery.toLowerCase();
      list = list.filter(p => 
        (p.label && p.label.toLowerCase().includes(q)) || 
        p.url.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; color: var(--admin-text-muted);">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🔍</div>
          <div>Aucun visuel correspondant trouvé.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="preset-item" onclick="AdminDashboard.selectImagePreset('${p.url}')" title="${p.label}\n${p.url}">
        <img src="${p.url}" class="preset-img" alt="${p.label}" loading="lazy">
        <div class="preset-label" title="${p.label}">${p.label}</div>
      </div>
    `).join("");
  },

  filterImagePresets(query) {
    this.presetFilterQuery = query ? query.trim() : "";
    this.renderPresetPickerGrid();
  },

  filterImagePresetsByColor(color, btnEl) {
    this.presetFilterColor = color;
    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll(".admin-filter-pill").forEach(p => p.classList.remove("active"));
      btnEl.classList.add("active");
    }
    this.renderPresetPickerGrid();
  },

  async openImagePicker(targetInputId) {
    this.activeImageTargetInput = targetInputId;
    this.presetFilterQuery = "";
    this.presetFilterColor = "all";
    const searchInput = document.getElementById("image-preset-search");
    if (searchInput) searchInput.value = "";
    const filterPills = document.querySelectorAll("#image-preset-color-filters .admin-filter-pill");
    filterPills.forEach((p, idx) => p.classList.toggle("active", idx === 0));

    await this.loadAllProjectImages();
    this.openModal("modal-image-picker");
  },

  selectImagePreset(url) {
    if (this.activeImageTargetInput === "gallery") {
      this.currentGalleryImages.push(url);
      if (this.activeEditColor) {
        this.currentProductImages[this.activeEditColor] = [...this.currentGalleryImages];
      }
      this.renderGalleryCards();
    } else if (this.activeImageTargetInput) {
      const input = document.getElementById(this.activeImageTargetInput);
      if (input) {
        input.value = url;
        if (this.activeImageTargetInput === "color-form-image") {
          this.updateColorMockupPreview(url);
        } else if (this.activeImageTargetInput === "bundle-form-image" || this.activeImageTargetInput === "prod-form-bundle-image") {
          this.updateBundleMockupPreview(url);
        }
      }
    }
    this.closeModal("modal-image-picker");
    this.toast("Image sélectionnée", "success");
  },

  // --------------------------------------------------------------------------
  // BACKUPS, EXPORT, IMPORT & DISK SYNC
  // --------------------------------------------------------------------------
  async syncToDisk() {
    const btn = document.getElementById("btn-sync-to-disk");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `⏳ Synchronisation...`;
    }
    this.toast("Synchronisation du stockage local vers le code source...", "info");
    const res = await window.StoreDataManager.syncAllToDisk();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `⚡ Sync vers Code Source`;
    }
    if (res && res.success) {
      this.toast(`✅ Données synchronisées avec succès (${res.synced ? res.synced.join(', ') : 'OK'}) !`, "success");
    } else {
      this.toast(`Erreur lors de la synchronisation vers le disque`, "danger");
    }
  },

  exportData() {
    const json = window.StoreDataManager.exportCatalogJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atelier_catalog_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast("Catalogue exporté avec succès !", "success");
  },

  importData() {
    const fileInput = document.getElementById("import-json-file");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      this.toast("Veuillez sélectionner un fichier JSON", "danger");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = window.StoreDataManager.importCatalogJSON(e.target.result);
      if (res.success) {
        this.renderAll();
        this.toast(`Catalogue importé : ${res.count} produits chargés !`, "success");
      } else {
        this.toast(`Erreur d'import : ${res.error}`, "danger");
      }
    };
    reader.readAsText(file);
  },

  async confirmResetDefaults() {
    if (confirm("ATTENTION : Cette action va réinitialiser tout le catalogue (11 produits d'origine), les catégories et les stocks aux valeurs d'origine et synchroniser les fichiers. Continuer ?")) {
      window.StoreDataManager.resetToDefaults();
      await window.StoreDataManager.syncAllToDisk();
      this.renderAll();
      this.toast("✓ Catalogue des 11 produits d'origine réinitialisé et synchronisé avec succès !", "success");
    }
  },

  async restoreFullCatalogMaster() {
    if (!confirm("Voulez-vous vérifier et restaurer l'intégralité des 11 modèles d'origine (T-Shirts, Hoodies, Sweatshirts, Débardeurs et Packs) ? Vos modifications récentes seront préservées et fusionnées.")) return;
    window.StoreDataManager.resetToDefaults();
    await window.StoreDataManager.syncAllToDisk();
    this.renderAll();
    this.toast("✓ Catalogue complet réinitialisé et synchronisé avec succès (11 produits) !", "success");
  },

  clearBrowserCacheAndReload() {
    try {
      localStorage.removeItem("atelier_products_v1");
      localStorage.removeItem("atelier_categories_v1");
      localStorage.removeItem("atelier_colors_v1");
      localStorage.removeItem("atelier_catalog_updated_at_v1");
    } catch (e) {}
    this.toast("Cache local vidé ! Rechargement des données fraîches...", "info");
    setTimeout(() => {
      window.location.reload(true);
    }, 600);
  },

  // --------------------------------------------------------------------------
  // MODAL UTILITIES & TOASTS
  // --------------------------------------------------------------------------
  bindModals() {
    // Backdrop click close
    document.querySelectorAll(".admin-modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove("active");
          const anyActive = document.querySelector(".admin-modal-backdrop.active");
          if (!anyActive) {
            document.body.classList.remove("overflow-locked");
            document.body.style.overflow = "";
          }
        }
      });
    });

    // Close buttons
    document.querySelectorAll(".admin-modal-close, [data-modal-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.closest(".admin-modal-backdrop")?.classList.remove("active");
        const anyActive = document.querySelector(".admin-modal-backdrop.active");
        if (!anyActive) {
          document.body.classList.remove("overflow-locked");
          document.body.style.overflow = "";
        }
      });
    });

    // Color picker live sync
    const hexInput = document.getElementById("color-form-hex");
    const hexPicker = document.getElementById("color-form-hex-picker");
    if (hexInput && hexPicker) {
      hexPicker.addEventListener("input", (e) => {
        hexInput.value = e.target.value.toUpperCase();
      });
      hexInput.addEventListener("input", (e) => {
        if (e.target.value.startsWith("#") && e.target.value.length === 7) {
          hexPicker.value = e.target.value;
        }
      });
    }

    // Filters for Stock Matrix
    const stockSearch = document.getElementById("stock-search-input");
    if (stockSearch) {
      stockSearch.addEventListener("input", (e) => {
        this.stockSearch = e.target.value;
        this.renderStockMatrix();
      });
    }

    const stockStatus = document.getElementById("stock-filter-status");
    if (stockStatus) {
      stockStatus.addEventListener("change", (e) => {
        this.stockFilter = e.target.value;
        this.renderStockMatrix();
      });
    }

    const stockCat = document.getElementById("stock-filter-category");
    if (stockCat) {
      stockCat.addEventListener("change", (e) => {
        this.stockCategory = e.target.value;
        this.renderStockMatrix();
      });
    }

    // Filters for Products
    const prodSearch = document.getElementById("products-search-input");
    if (prodSearch) {
      prodSearch.addEventListener("input", (e) => {
        this.productSearch = e.target.value;
        this.renderProducts();
      });
    }

    const prodCat = document.getElementById("products-filter-category");
    if (prodCat) {
      prodCat.addEventListener("change", (e) => {
        this.productCategory = e.target.value;
        this.renderProducts();
      });
    }
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.classList.add("overflow-locked");
      document.body.style.overflow = "hidden";
      const body = modal.querySelector(".admin-modal-body");
      if (body) body.scrollTop = 0;
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
    const anyActive = document.querySelector(".admin-modal-backdrop.active");
    if (!anyActive) {
      document.body.classList.remove("overflow-locked");
      document.body.style.overflow = "";
    }
  },

  // --------------------------------------------------------------------------
  // LIVE MYSQL ORDERS MANAGEMENT
  // --------------------------------------------------------------------------
  async loadOrders() {
    const tbody = document.getElementById("admin-orders-table-body");
    const filterEl = document.getElementById("admin-orders-filter-status");
    const status = filterEl ? filterEl.value : "all";

    try {
      const sep = (status && status !== "all") ? `?status=${status}&` : "?";
      const url = `/api/orders${sep}_t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && data.success && Array.isArray(data.orders)) {
        this.renderOrdersTable(data.orders);
        const badge = document.getElementById("badge-orders-count");
        if (badge) badge.textContent = data.orders.length;
      } else {
        throw new Error(data.error || "Format de données invalide");
      }
    } catch (e) {
      console.warn("Could not load orders from MySQL:", e.message);
      const localOrders = (window.StoreStorage && window.StoreStorage.get(window.StoreStorage.KEYS.ORDERS, [])) || [];
      this.renderOrdersTable(localOrders, true);
      const badge = document.getElementById("badge-orders-count");
      if (badge) badge.textContent = localOrders.length;
    }
  },

  renderOrdersTable(orders, isLocalFallback = false) {
    const tbody = document.getElementById("admin-orders-table-body");
    if (!tbody) return;

    if (!orders || orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 48px 20px; color: var(--admin-text-muted);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
            <div style="font-weight: 600; font-size: 1rem; color: #FFF; margin-bottom: 4px;">Aucune commande client enregistrée</div>
            <div style="font-size: 0.82rem;">Les commandes passées sur la boutique apparaîtront ici en temps réel.</div>
          </td>
        </tr>
      `;
      return;
    }

    const statusBadge = (s) => {
      const map = {
        pending: '<span class="admin-badge" style="background:rgba(234, 179, 8, 0.2); color:#FDE047; border: 1px solid rgba(234, 179, 8, 0.4);">⏳ En attente</span>',
        confirmed: '<span class="admin-badge" style="background:rgba(59, 130, 246, 0.2); color:#93C5FD; border: 1px solid rgba(59, 130, 246, 0.4);">✅ Confirmée</span>',
        shipped: '<span class="admin-badge" style="background:rgba(16, 185, 129, 0.2); color:#6EE7B7; border: 1px solid rgba(16, 185, 129, 0.4);">🚚 Expédiée</span>',
        delivered: '<span class="admin-badge" style="background:#059669; color:#FFF; font-weight:700;">🎉 Livrée</span>',
        cancelled: '<span class="admin-badge" style="background:rgba(239, 68, 68, 0.2); color:#FCA5A5; border: 1px solid rgba(239, 68, 68, 0.4);">❌ Annulée</span>'
      };
      return map[s] || `<span class="admin-badge badge-secondary">${s}</span>`;
    };

    tbody.innerHTML = orders.map(ord => {
      const clientName = ord.customer_first_name 
        ? `${ord.customer_first_name} ${ord.customer_last_name}` 
        : (ord.customer ? `${ord.customer.firstName} ${ord.customer.lastName}` : "Client");
      const clientPhone = ord.customer_phone || (ord.customer && ord.customer.phone) || "N/A";
      const clientCity = ord.shipping_city || (ord.shippingAddress && ord.shippingAddress.city) || "Maroc";
      const clientAddr = ord.shipping_address || (ord.shippingAddress && ord.shippingAddress.address) || "";
      const total = ord.total || 0;
      const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (ord.date ? new Date(ord.date).toLocaleDateString() : "-");
      const currentStatus = ord.status || "pending";

      const items = ord.items || [];
      const itemsSummary = items.map(it => {
        if (it.isBundle && it.bundleItems) {
          return `<strong>Pack ${it.name}</strong> (${it.bundleItems.length} pcs)`;
        }
        return `${it.quantity || 1}x ${it.name} (${it.colorName || it.color || ''} - ${it.size || ''})`;
      }).join('<br>');

      return `
        <tr>
          <td><strong style="color:var(--admin-gold);">${ord.order_number || ord.orderNumber}</strong></td>
          <td style="font-size: 0.8rem; color: var(--admin-text-secondary); white-space: nowrap;">${dateStr}</td>
          <td>
            <strong>${clientName}</strong>
            <div style="font-size:0.75rem; color:var(--admin-text-muted);">${ord.customer_email || (ord.customer && ord.customer.email) || ''}</div>
          </td>
          <td>
            <div>📞 <strong>${clientPhone}</strong></div>
            <div style="font-size:0.78rem; color:var(--admin-text-secondary);">📍 ${clientCity} (${clientAddr})</div>
          </td>
          <td style="font-size: 0.82rem; line-height: 1.4;">${itemsSummary || '1 article'}</td>
          <td><strong style="font-size: 0.95rem; color:#FFF;">${total} MAD</strong></td>
          <td style="font-size: 0.78rem; color:var(--admin-text-secondary);">${ord.payment_method || ord.paymentMethod || 'COD'}</td>
          <td>${statusBadge(currentStatus)}</td>
          <td style="text-align: right;">
            <select class="admin-form-select" style="font-size: 0.78rem; padding: 4px 8px; width: auto; display: inline-block;" 
                    onchange="AdminDashboard.updateOrderStatus('${ord.order_number || ord.orderNumber}', this.value)">
              <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⏳ En attente</option>
              <option value="confirmed" ${currentStatus === 'confirmed' ? 'selected' : ''}>✅ Confirmer</option>
              <option value="shipped" ${currentStatus === 'shipped' ? 'selected' : ''}>🚚 Expédier</option>
              <option value="delivered" ${currentStatus === 'delivered' ? 'selected' : ''}>🎉 Livrer</option>
              <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>❌ Annuler</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  },

  async updateOrderStatus(orderNumber, newStatus) {
    try {
      const res = await fetch("/api/orders?action=update_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status: newStatus })
      });
      const data = await res.json();
      if (data && data.success) {
        this.toast(`Statut de la commande ${orderNumber} mis à jour : ${newStatus}`, "success");
      }
    } catch (e) {
      this.toast(`Commande ${orderNumber} mise à jour`, "info");
    }
    this.loadOrders();
  },

  toast(message, type = "success") {
    let container = document.querySelector(".admin-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "admin-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `admin-toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'info' ? 'ℹ️' : '⚠️';
    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  showToast(message, type = "success") {
    return this.toast(message, type);
  },

  // --------------------------------------------------------------------------
  // WHOLESALE & B2B CONTROLLER MODULE
  // --------------------------------------------------------------------------
  wholesaleApps: [],
  currentWsFilter: 'all',
  wsSearchQuery: '',
  wholesaleSettingsData: null,
  ADMIN_API_KEY: 'atelier-secret-admin-key-2026',

  async refreshWholesalePendingBadge() {
    try {
      const res = await fetch("/api/wholesale/admin/applications?status=pending", {
        headers: { "X-Admin-Key": this.ADMIN_API_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        const pendingCount = (data.counts && data.counts.pending) || 0;
        const badge = document.getElementById("badge-wholesale-pending");
        if (badge) {
          badge.textContent = pendingCount;
          badge.style.display = pendingCount > 0 ? "inline-block" : "none";
        }
      }
    } catch (e) {}
  },

  async loadWholesaleApplications() {
    const container = document.getElementById("wholesale-applications-container");
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--admin-text-muted);">
        Chargement des candidatures grossistes...
      </div>
    `;

    try {
      const res = await fetch("/api/wholesale/admin/applications", {
        headers: { "X-Admin-Key": this.ADMIN_API_KEY }
      });

      if (!res.ok) {
        throw new Error("Accès refusé ou serveur indisponible");
      }

      const data = await res.json();
      this.wholesaleApps = data.applications || [];

      // Update counters
      const counts = data.counts || {};
      const elTotal = document.getElementById("ws-stat-total");
      const elPending = document.getElementById("ws-stat-pending");
      const elInfo = document.getElementById("ws-stat-info");
      const elApproved = document.getElementById("ws-stat-approved");
      const elRejected = document.getElementById("ws-stat-rejected");

      if (elTotal) elTotal.textContent = counts.all || 0;
      if (elPending) elPending.textContent = counts.pending || 0;
      if (elInfo) elInfo.textContent = counts.more_info_required || 0;
      if (elApproved) elApproved.textContent = counts.approved || 0;
      if (elRejected) elRejected.textContent = (counts.rejected || 0) + (counts.suspended || 0);

      const badge = document.getElementById("badge-wholesale-pending");
      if (badge) {
        badge.textContent = counts.pending || 0;
        badge.style.display = (counts.pending > 0) ? "inline-block" : "none";
      }

      this.renderWholesaleApplicationsTable();
    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--admin-danger);">
          Erreur de chargement: ${err.message}
        </div>
      `;
    }
  },

  filterWholesaleApps(status) {
    this.currentWsFilter = status;
    document.querySelectorAll("[data-ws-filter]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-ws-filter") === status);
    });
    this.renderWholesaleApplicationsTable();
  },

  searchWholesaleApps(term) {
    this.wsSearchQuery = (term || '').toLowerCase().trim();
    this.renderWholesaleApplicationsTable();
  },

  renderWholesaleApplicationsTable() {
    const container = document.getElementById("wholesale-applications-container");
    if (!container) return;

    let apps = this.wholesaleApps;

    if (this.currentWsFilter !== 'all') {
      apps = apps.filter(a => a.application_status === this.currentWsFilter);
    }

    if (this.wsSearchQuery) {
      apps = apps.filter(a => 
        (a.full_name && a.full_name.toLowerCase().includes(this.wsSearchQuery)) ||
        (a.business_name && a.business_name.toLowerCase().includes(this.wsSearchQuery)) ||
        (a.email && a.email.toLowerCase().includes(this.wsSearchQuery)) ||
        (a.city && a.city.toLowerCase().includes(this.wsSearchQuery)) ||
        (a.sales_channel && a.sales_channel.toLowerCase().includes(this.wsSearchQuery))
      );
    }

    if (apps.length === 0) {
      container.innerHTML = `
        <div class="admin-card" style="padding: 40px; text-align: center; color: var(--admin-text-muted);">
          Aucun dossier trouvé pour les filtres sélectionnés.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${apps.map(app => this.renderApplicationCard(app)).join('')}
      </div>
    `;
  },

  renderApplicationCard(app) {
    let statusBadge = "";
    switch (app.application_status) {
      case "pending":
        statusBadge = `<span style="background: #FEF9C3; color: #854D0E; border: 1px solid #FDE047; padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">EN ATTENTE</span>`;
        break;
      case "more_info_required":
        statusBadge = `<span style="background: #E0F2FE; color: #075985; border: 1px solid #7DD3FC; padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">COMPLÉMENT REQUIS</span>`;
        break;
      case "approved":
        statusBadge = `<span style="background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">APPROUVÉ ✓</span>`;
        break;
      case "rejected":
        statusBadge = `<span style="background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">REFUSÉ ✕</span>`;
        break;
      case "suspended":
        statusBadge = `<span style="background: #F3F4F6; color: #374151; border: 1px solid #D1D5DB; padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">SUSPENDU ⚠️</span>`;
        break;
    }

    return `
      <div class="admin-card" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--admin-border); padding-bottom: 14px; margin-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFF; margin: 0;">${app.business_name ? `${app.business_name} (${app.full_name})` : app.full_name}</h3>
              ${statusBadge}
              <span style="font-size: 0.76rem; color: var(--admin-text-muted);">Soumis le ${new Date(app.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div style="font-size: 0.84rem; color: var(--admin-text-muted); margin-top: 4px;">
              📍 ${app.city || 'Ville non spécifiée'}, ${app.country} • 📞 ${app.phone} • ✉️ <a href="mailto:${app.email}" style="color: #60A5FA;">${app.email}</a>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${app.application_status !== 'approved' ? `
              <button class="admin-btn admin-btn-sm" style="background: #166534; color: #FFF;" onclick="AdminDashboard.updateApplicantStatus(${app.id}, 'approved')">
                ✓ Approuver
              </button>
            ` : `
              <button class="admin-btn admin-btn-sm" style="background: #4B5563; color: #FFF;" onclick="AdminDashboard.updateApplicantStatus(${app.id}, 'suspended')">
                ⚠️ Suspendre
              </button>
            `}

            ${app.application_status === 'suspended' ? `
              <button class="admin-btn admin-btn-sm" style="background: #166534; color: #FFF;" onclick="AdminDashboard.updateApplicantStatus(${app.id}, 'approved')">
                ✓ Réactiver l'Accès
              </button>
            ` : ''}

            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.openWsInfoModal(${app.id})">
              📝 Demander Infos
            </button>

            ${app.application_status !== 'rejected' ? `
              <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="AdminDashboard.updateApplicantStatus(${app.id}, 'rejected')">
                ✕ Refuser
              </button>
            ` : ''}

            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminDashboard.openWsNotesModal(${app.id})">
              💬 Notes ${app.admin_notes ? '●' : ''}
            </button>
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; font-size: 0.84rem;">
          <div>
            <strong style="color: var(--admin-text-muted);">Structure :</strong>
            <span style="color: #FFF;">${app.business_type}</span>
          </div>
          <div>
            <strong style="color: var(--admin-text-muted);">Canal de vente :</strong>
            <span style="color: #FFF;">${app.sales_channel || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: var(--admin-text-muted);">Quantité Initiale :</strong>
            <span style="color: #FBBF24; font-weight: 700;">${app.estimated_initial_order} pcs</span>
          </div>
          <div>
            <strong style="color: var(--admin-text-muted);">Fréquence :</strong>
            <span style="color: #FFF;">${app.expected_reorder_freq || 'N/A'}</span>
          </div>
          <div>
            <strong style="color: var(--admin-text-muted);">Statut d'activité :</strong>
            <span style="color: #FFF;">${app.selling_status === 'already_selling' ? 'En activité' : 'En lancement'}</span>
          </div>
          <div>
            <strong style="color: var(--admin-text-muted);">Lien Web / Social :</strong>
            ${app.website_social_url ? `
              <a href="${app.website_social_url}" target="_blank" style="color: #38BDF8; text-decoration: underline;">
                Visiter le profil ↗
              </a>
            ` : '<span style="color: var(--admin-text-muted);">Non renseigné</span>'}
          </div>
        </div>

        ${app.additional_info ? `
          <div style="margin-top: 10px; font-size: 0.82rem; color: #D1D5DB; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 4px;">
            <strong>Commentaire candidat :</strong> "${app.additional_info}"
          </div>
        ` : ''}

        ${app.info_request_message ? `
          <div style="margin-top: 8px; font-size: 0.82rem; color: #7DD3FC; background: rgba(2, 132, 199, 0.1); padding: 8px 12px; border-radius: 4px; border-left: 2px solid #0284C7;">
            <strong>Précision demandée :</strong> "${app.info_request_message}"
            ${app.applicant_response ? `<div style="margin-top: 4px; color: #FFF;"><strong>Réponse candidat :</strong> "${app.applicant_response}"</div>` : '<div style="margin-top: 4px; color: #94A3B8;">(En attente de réponse du candidat)</div>'}
          </div>
        ` : ''}

        ${app.admin_notes ? `
          <div style="margin-top: 8px; font-size: 0.82rem; color: #FCD34D; background: rgba(234, 179, 8, 0.08); padding: 8px 12px; border-radius: 4px;">
            <strong>Note interne admin :</strong> "${app.admin_notes}"
          </div>
        ` : ''}
      </div>
    `;
  },

  async updateApplicantStatus(userId, status, notes = null, infoRequestMessage = null) {
    try {
      const payload = { userId, status };
      if (notes !== null) payload.adminNotes = notes;
      if (infoRequestMessage !== null) payload.infoRequestMessage = infoRequestMessage;

      const res = await fetch("/api/wholesale/admin/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.ADMIN_API_KEY
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de mise à jour");
      }

      this.showToast(data.message, "success");
      if (data.emailNotice) {
        setTimeout(() => this.showToast(data.emailNotice, "info"), 800);
      }

      this.loadWholesaleApplications();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  },

  openWsInfoModal(userId) {
    const inputId = document.getElementById("ws-info-userid");
    const msg = document.getElementById("ws-info-message");
    if (inputId) inputId.value = userId;
    if (msg) msg.value = "";
    document.getElementById("modal-ws-request-info")?.classList.add("open");
  },

  closeWsInfoModal() {
    document.getElementById("modal-ws-request-info")?.classList.remove("open");
  },

  confirmRequestWsInfo() {
    const userId = document.getElementById("ws-info-userid")?.value;
    const msg = document.getElementById("ws-info-message")?.value.trim();
    if (!msg) {
      alert("Veuillez saisir le message explicatif.");
      return;
    }
    this.closeWsInfoModal();
    this.updateApplicantStatus(userId, "more_info_required", null, msg);
  },

  openWsNotesModal(userId) {
    const app = this.wholesaleApps.find(a => a.id === parseInt(userId, 10));
    const inputId = document.getElementById("ws-notes-userid");
    const notesText = document.getElementById("ws-notes-text");
    if (inputId) inputId.value = userId;
    if (notesText) notesText.value = (app && app.admin_notes) || "";
    document.getElementById("modal-ws-notes")?.classList.add("open");
  },

  closeWsNotesModal() {
    document.getElementById("modal-ws-notes")?.classList.remove("open");
  },

  saveWsNotes() {
    const userId = document.getElementById("ws-notes-userid")?.value;
    const notes = document.getElementById("ws-notes-text")?.value.trim();
    this.closeWsNotesModal();
    this.updateApplicantStatus(userId, this.wholesaleApps.find(a => a.id === parseInt(userId, 10))?.application_status || 'pending', notes);
  },

  // --------------------------------------------------------------------------
  // WHOLESALE SETTINGS & PRODUCTION COSTS CONTROLLER
  // --------------------------------------------------------------------------
  async loadWholesaleSettings() {
    const tbody = document.getElementById("ws-costs-table-body");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--admin-text-muted);">
          Chargement des paramètres et coûts grossistes...
        </td>
      </tr>
    `;

    try {
      const res = await fetch("/api/wholesale/admin/settings", {
        headers: { "X-Admin-Key": this.ADMIN_API_KEY }
      });

      if (!res.ok) throw new Error("Erreur de chargement des paramètres grossiste");

      const data = await res.json();
      this.wholesaleSettingsData = data;

      const config = data.config || {};
      const elMoq = document.getElementById("ws-cfg-moq");
      const elM1 = document.getElementById("ws-cfg-m1");
      const elM2 = document.getElementById("ws-cfg-m2");
      const elM3 = document.getElementById("ws-cfg-m3");

      if (elMoq) elMoq.value = config.moq || 10;
      if (elM1 && config.tiers && config.tiers[0]) elM1.value = Math.round(config.tiers[0].target_margin * 100);
      if (elM2 && config.tiers && config.tiers[1]) elM2.value = Math.round(config.tiers[1].target_margin * 100);
      if (elM3 && config.tiers && config.tiers[2]) elM3.value = Math.round(config.tiers[2].target_margin * 100);

      this.renderWholesaleCostsTable();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--admin-danger);">
            ${err.message}
          </td>
        </tr>
      `;
    }
  },

  renderWholesaleCostsTable() {
    const tbody = document.getElementById("ws-costs-table-body");
    if (!tbody || !this.wholesaleSettingsData) return;

    const products = (this.wholesaleSettingsData.products || []).filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts');
    const config = this.wholesaleSettingsData.config || {};
    const marginFloor = config.margin_floor || 0.20;

    const m1 = (parseFloat(document.getElementById("ws-cfg-m1")?.value) || 35) / 100;
    const m2 = (parseFloat(document.getElementById("ws-cfg-m2")?.value) || 30) / 100;
    const m3 = (parseFloat(document.getElementById("ws-cfg-m3")?.value) || 25) / 100;

    const calcPrice = (cost, margin) => {
      if (!cost || cost <= 0) return "-";
      let price = Math.round(cost / (1 - margin));
      if ((price - cost) / price < marginFloor) {
        price = Math.ceil(cost / (1 - marginFloor));
      }
      return `${price} MAD`;
    };

    tbody.innerHTML = products.map(p => {
      const cost = p.unitCost || 0;
      const isConfigured = cost > 0;
      const isDisabled = p.disabled || !isConfigured;

      const sizesCount = p.sizesCount || 4;
      const colorsCount = p.colorsCount || 1;
      const gridMoq = p.gridMoq || (sizesCount * colorsCount);
      const currentMoq = p.moq || gridMoq;
      const isManual = (currentMoq !== gridMoq);

      return `
        <tr id="row-ws-${p.id}">
          <td>
            <div style="font-weight: 700; color: #FFF;">${p.name}</div>
            <div style="font-size: 0.74rem; color: var(--admin-text-muted);">ID: ${p.id}</div>
          </td>
          <td>
            <strong style="color: #FFF;">${p.retailPrice} MAD</strong>
          </td>
          <td style="width: 120px;">
            <input type="number" 
              class="admin-form-input ws-cost-input" 
              style="width: 95px; font-weight: 700; color: #D4AF37;" 
              data-product-id="${p.id}" 
              value="${cost || ''}" 
              placeholder="0"
              min="0"
              step="1"
              oninput="AdminDashboard.onCostInputChange('${p.id}', this.value)">
          </td>
          <td style="width: 140px;">
            <span class="badge" style="background: rgba(96,165,250,0.12); color: #60A5FA; font-size: 0.76rem; padding: 4px 8px; border: 1px solid rgba(96,165,250,0.25); white-space: nowrap;" title="Pack Starter : 1 pc par taille x ${colorsCount} coloris">
              ${sizesCount}T × ${colorsCount}C = ${gridMoq} pcs
            </span>
          </td>
          <td style="width: 170px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <input type="number" 
                class="admin-form-input ws-moq-input" 
                id="input-moq-${p.id}"
                style="width: 75px; font-weight: 700; color: #60A5FA; text-align: center;" 
                data-product-id="${p.id}" 
                data-grid-moq="${gridMoq}"
                value="${currentMoq}" 
                placeholder="${gridMoq}"
                min="1"
                step="1"
                oninput="AdminDashboard.onMoqInputChange('${p.id}', this.value)">
              <button type="button" 
                class="admin-btn admin-btn-sm admin-btn-secondary" 
                style="padding: 4px 8px; font-size: 0.72rem; line-height: 1; white-space: nowrap;" 
                title="Rétablir le MOQ calculé du Pack Starter (${sizesCount}T × ${colorsCount}C = ${gridMoq} pcs)"
                onclick="AdminDashboard.resetProductMoqToGrid('${p.id}', ${gridMoq})">
                ⚡ Pack
              </button>
            </div>
            <div id="moq-mode-label-${p.id}" style="font-size: 0.7rem; margin-top: 3px; color: ${isManual ? '#F59E0B' : '#9CA3AF'};">
              ${isManual ? '✏️ Manuel' : '📐 Pack (T × C)'}
            </div>
          </td>
          <td id="cell-t1-${p.id}" style="color: #FBBF24; font-weight: 600;">
            ${calcPrice(cost, m1)}
          </td>
          <td id="cell-t2-${p.id}" style="color: #FBBF24; font-weight: 600;">
            ${calcPrice(cost, m2)}
          </td>
          <td id="cell-t3-${p.id}" style="color: #4ADE80; font-weight: 700;">
            ${calcPrice(cost, m3)}
          </td>
          <td>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" 
                id="ws-toggle-${p.id}" 
                ${!isDisabled ? 'checked' : ''} 
                ${!isConfigured ? 'disabled' : ''}
                onchange="AdminDashboard.toggleProductWholesale('${p.id}', this.checked)">
              <span style="font-size: 0.8rem; color: ${!isDisabled ? '#4ADE80' : '#9CA3AF'};">
                ${!isConfigured ? 'Coût manquant' : (!isDisabled ? 'Actif B2B' : 'Désactivé')}
              </span>
            </label>
          </td>
        </tr>
      `;
    }).join('');
  },

  onMoqInputChange(productId, val) {
    const input = document.getElementById(`input-moq-${productId}`);
    const label = document.getElementById(`moq-mode-label-${productId}`);
    if (!input || !label) return;
    const gridMoq = parseInt(input.getAttribute('data-grid-moq'), 10);
    const parsed = parseInt(val, 10);
    if (parsed === gridMoq) {
      label.textContent = "📐 Pack (T × C)";
      label.style.color = "#9CA3AF";
    } else {
      label.textContent = "✏️ Manuel";
      label.style.color = "#F59E0B";
    }
  },

  resetProductMoqToGrid(productId, gridMoq) {
    const input = document.getElementById(`input-moq-${productId}`);
    const label = document.getElementById(`moq-mode-label-${productId}`);
    if (input) input.value = gridMoq;
    if (label) {
      label.textContent = "📐 Pack (T × C)";
      label.style.color = "#9CA3AF";
    }
  },

  applyGridFormulaToAllMoqs() {
    const inputs = document.querySelectorAll(".ws-moq-input");
    inputs.forEach(input => {
      const gridMoq = input.getAttribute("data-grid-moq");
      if (gridMoq) {
        input.value = gridMoq;
        const pid = input.getAttribute("data-product-id");
        const label = document.getElementById(`moq-mode-label-${pid}`);
        if (label) {
          label.textContent = "📐 Pack (T × C)";
          label.style.color = "#9CA3AF";
        }
      }
    });
    this.showToast("Tous les MOQs ont été recalculés selon la formule Pack Starter (Tailles × Couleurs) ! Cliquez sur 'Enregistrer la Grille B2B' pour confirmer.", "info");
  },

  onCostInputChange(productId, costVal) {
    const cost = parseFloat(costVal) || 0;
    const m1 = (parseFloat(document.getElementById("ws-cfg-m1")?.value) || 35) / 100;
    const m2 = (parseFloat(document.getElementById("ws-cfg-m2")?.value) || 30) / 100;
    const m3 = (parseFloat(document.getElementById("ws-cfg-m3")?.value) || 25) / 100;
    const marginFloor = 0.20;

    const calcPrice = (c, margin) => {
      if (!c || c <= 0) return "-";
      let price = Math.round(c / (1 - margin));
      if ((price - c) / price < marginFloor) {
        price = Math.ceil(c / (1 - marginFloor));
      }
      return `${price} MAD`;
    };

    const cell1 = document.getElementById(`cell-t1-${productId}`);
    const cell2 = document.getElementById(`cell-t2-${productId}`);
    const cell3 = document.getElementById(`cell-t3-${productId}`);
    const toggle = document.getElementById(`ws-toggle-${productId}`);

    if (cell1) cell1.textContent = calcPrice(cost, m1);
    if (cell2) cell2.textContent = calcPrice(cost, m2);
    if (cell3) cell3.textContent = calcPrice(cost, m3);

    if (toggle) {
      toggle.disabled = (cost <= 0);
      if (cost <= 0) toggle.checked = false;
      const label = toggle.nextElementSibling;
      if (label) {
        label.textContent = (cost <= 0) ? 'Coût manquant' : (toggle.checked ? 'Actif B2B' : 'Désactivé');
        label.style.color = (cost <= 0) ? '#9CA3AF' : (toggle.checked ? '#4ADE80' : '#9CA3AF');
      }
    }
  },

  toggleProductWholesale(productId, enabled) {
    const toggle = document.getElementById(`ws-toggle-${productId}`);
    if (toggle) {
      const label = toggle.nextElementSibling;
      if (label) {
        label.textContent = enabled ? 'Actif B2B' : 'Désactivé';
        label.style.color = enabled ? '#4ADE80' : '#9CA3AF';
      }
    }
  },

  async saveWholesaleSettings() {
    const m1 = (parseFloat(document.getElementById("ws-cfg-m1")?.value) || 35) / 100;
    const m2 = (parseFloat(document.getElementById("ws-cfg-m2")?.value) || 30) / 100;
    const m3 = (parseFloat(document.getElementById("ws-cfg-m3")?.value) || 25) / 100;

    const productCosts = {};
    const productMoqs = {};
    const disabledProducts = [];

    document.querySelectorAll(".ws-cost-input").forEach(input => {
      const pid = input.getAttribute("data-product-id");
      const cost = parseFloat(input.value) || 0;
      if (cost > 0) {
        productCosts[pid] = cost;
      }
      const toggle = document.getElementById(`ws-toggle-${pid}`);
      if (toggle && !toggle.checked) {
        disabledProducts.push(pid);
      }
    });

    document.querySelectorAll(".ws-moq-input").forEach(input => {
      const pid = input.getAttribute("data-product-id");
      const m = parseInt(input.value, 10) || 1;
      productMoqs[pid] = m;
    });

    const tiers = [
      { id: "tier_min", name: "MOQ", min_qty: 1, max_qty: 24, target_margin: m1, description: "Tarif de base dès le MOQ atteint" },
      { id: "tier_mid", name: "Palier 2 (MOQ-49)", min_qty: 25, max_qty: 49, target_margin: m2, description: "Tarif volume dès 25 pièces au total" },
      { id: "tier_high", name: "Palier 3 (50+)", min_qty: 50, max_qty: null, target_margin: m3, description: "Meilleur tarif dès 50 pièces au total" }
    ];

    try {
      const res = await fetch("/api/wholesale/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.ADMIN_API_KEY
        },
        body: JSON.stringify({
          tiers,
          productCosts,
          productMoqs,
          disabledProducts
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'enregistrement");
      }

      this.showToast("Grille de coûts et paramètres grossistes enregistrés avec succès !", "success");
      this.loadWholesaleSettings();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  },

  // --------------------------------------------------------------------------
  // WHATSAPP CLOUD API (META) MANAGEMENT
  // --------------------------------------------------------------------------
  async loadWhatsAppConfig() {
    try {
      const res = await fetch("/api/whatsapp/config");
      const data = await res.json();
      if (!data.success || !data.config) return;
      const cfg = data.config;

      const phoneIdEl = document.getElementById("ws-cfg-phone-id");
      const tokenEl = document.getElementById("ws-cfg-token");
      const testPhoneEl = document.getElementById("ws-cfg-test-phone");
      const templateEl = document.getElementById("ws-cfg-template");
      const langEl = document.getElementById("ws-cfg-lang");
      const enabledEl = document.getElementById("ws-cfg-enabled");
      const badgeEl = document.getElementById("ws-status-badge");

      if (phoneIdEl) phoneIdEl.value = cfg.phone_number_id || "";
      if (tokenEl) tokenEl.value = cfg.access_token || "";
      if (testPhoneEl) testPhoneEl.value = cfg.test_recipient || "";
      if (templateEl) templateEl.value = cfg.template_name || "hello_world";
      if (langEl) langEl.value = cfg.language_code || "en_US";
      if (enabledEl) enabledEl.checked = !!cfg.enabled;

      if (badgeEl) {
        if (cfg.phone_number_id && cfg.access_token) {
          badgeEl.innerHTML = `<span class="badge" style="background: rgba(37, 211, 102, 0.2); color: #25D366; font-weight: 700;">✓ Configuré (${cfg.enabled ? 'Actif' : 'En pause'})</span>`;
        } else {
          badgeEl.innerHTML = `<span class="badge" style="background: rgba(148, 163, 184, 0.2); color: #94A3B8;">Non configuré</span>`;
        }
      }
    } catch (e) {
      console.warn("Could not load WhatsApp config:", e);
    }
  },

  async saveWhatsAppSettings() {
    const phoneId = document.getElementById("ws-cfg-phone-id")?.value.trim() || "";
    const token = document.getElementById("ws-cfg-token")?.value.trim() || "";
    const testPhone = document.getElementById("ws-cfg-test-phone")?.value.trim() || "";
    const templateName = document.getElementById("ws-cfg-template")?.value.trim() || "hello_world";
    const languageCode = document.getElementById("ws-cfg-lang")?.value.trim() || "en_US";
    const enabled = document.getElementById("ws-cfg-enabled")?.checked || false;

    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number_id: phoneId,
          access_token: token,
          test_recipient: testPhone,
          template_name: templateName,
          language_code: languageCode,
          enabled: enabled
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Échec de sauvegarde");

      this.showToast("Paramètres WhatsApp Cloud API sauvegardés !", "success");
      this.loadWhatsAppConfig();
    } catch (err) {
      alert("Erreur de sauvegarde : " + err.message);
    }
  },

  async testWhatsAppNotification() {
    const testPhone = document.getElementById("ws-cfg-test-phone")?.value.trim();
    const resultBox = document.getElementById("ws-test-result");
    const btn = document.getElementById("btn-ws-test");

    if (!testPhone) {
      alert("Veuillez saisir votre numéro de test (destinataire vérifié dans Meta).");
      return;
    }

    // Auto-save first so the server has the latest keys
    await this.saveWhatsAppSettings();

    if (resultBox) {
      resultBox.style.display = "block";
      resultBox.innerHTML = `
        <div style="padding: 10px 14px; background: rgba(59, 130, 246, 0.1); border: 1px solid #3B82F6; border-radius: 6px; color: #60A5FA; font-size: 0.85rem;">
          ⏳ Envoi du message WhatsApp via Meta Cloud API en cours vers <strong>${testPhone}</strong>...
        </div>
      `;
    }

    if (btn) btn.disabled = true;

    try {
      const templateName = document.getElementById("ws-cfg-template")?.value.trim() || "hello_world";
      const languageCode = document.getElementById("ws-cfg-lang")?.value.trim() || "en_US";

      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: testPhone,
          template_name: templateName,
          language_code: languageCode
        })
      });
      const data = await res.json();

      if (data.success) {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="padding: 12px 14px; background: rgba(34, 197, 94, 0.1); border: 1px solid #22C55E; border-radius: 6px; color: #4ADE80; font-size: 0.85rem;">
              <strong>🎉 Succès ! Message WhatsApp envoyé avec succès !</strong><br>
              Destinataire : <code>${data.recipient}</code><br>
              ID Message Meta : <code>${data.data?.messages?.[0]?.id || 'OK'}</code><br>
              Vérifiez dès maintenant votre smartphone.
            </div>
          `;
        }
        this.showToast("Message WhatsApp envoyé avec succès !", "success");
      } else {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="padding: 12px 14px; background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; border-radius: 6px; color: #F87171; font-size: 0.85rem;">
              <strong>⚠️ Erreur retournée par Meta :</strong><br>
              <code>${data.error || 'Erreur inconnue'}</code><br>
              <div style="font-size: 0.78rem; opacity: 0.85; margin-top: 6px;">
                💡 Conseil : Assurez-vous que votre numéro de téléphone a bien été ajouté et vérifié dans votre tableau de bord Meta (WhatsApp > API Setup > To).
              </div>
            </div>
          `;
        }
      }
    } catch (err) {
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="padding: 12px 14px; background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; border-radius: 6px; color: #F87171; font-size: 0.85rem;">
            Erreur technique : ${err.message}
          </div>
        `;
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.AdminDashboard.init();
});

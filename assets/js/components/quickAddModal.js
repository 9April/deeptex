/**
 * Quick Add Modal Component
 * Allows rapid selection of color & size variant directly from product grids.
 */

window.QuickAddModalComponent = {
  container: null,

  init() {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "quick-add-modal-root";
    this.container.className = "modal-overlay";
    document.body.appendChild(this.container);
  },

  open(productId) {
    this.init();
    let targetId = productId;
    const aliases = window.PRODUCT_ALIASES || {};
    if (targetId && aliases[targetId]) {
      const aliasData = typeof aliases[targetId] === 'string' ? { targetId: aliases[targetId] } : aliases[targetId];
      targetId = aliasData.targetId;
    }

    const allProducts = window.STORE_PRODUCTS || window.DEFAULT_STORE_PRODUCTS || [];
    const product = allProducts.find(p => p.id === targetId || p.slug === targetId);
    if (!product) return;

    if (product.isBundle || product.id === 'pack-trio-tshirts') {
      window.location.href = `product.html?id=${product.id}`;
      return;
    }

    let currentProduct = product;
    let selectedColor = (currentProduct.colors && currentProduct.colors[0]) ? currentProduct.colors[0].code : 'black';
    let selectedSize = (currentProduct.sizes && currentProduct.sizes[0]) || 'M';

    const renderContent = () => {
      const activeColorObj = (currentProduct.colors || []).find(c => c.code === selectedColor) || (currentProduct.colors && currentProduct.colors[0]) || {};
      
      const possibleCodes = [selectedColor];
      if (selectedColor === 'rose') possibleCodes.push('pink');
      if (selectedColor === 'pink') possibleCodes.push('rose');
      if (selectedColor === 'dark-blue') possibleCodes.push('navy', 'darkblue');
      if (selectedColor === 'navy') possibleCodes.push('dark-blue');

      let img = null;
      if (currentProduct.images) {
        for (const code of possibleCodes) {
          if (currentProduct.images[code] && currentProduct.images[code][0]) {
            img = currentProduct.images[code][0];
            break;
          }
        }
      }
      if (!img) img = activeColorObj.image || 'assets/images/hero/hero-banner.jpg';

      const variant = (currentProduct.variants || []).find(v => v.color === selectedColor && v.size === selectedSize);
      const inStock = variant && variant.stock > 0;

      this.container.innerHTML = `
        <div class="modal-window" style="max-width: 480px;">
          <button class="action-btn modal-close" onclick="window.QuickAddModalComponent.close()">✕</button>
          
          <div style="display: flex; gap: 16px; margin-bottom: 20px; align-items: center;">
            <img src="${img}" alt="${currentProduct.name}" style="width: 80px; height: 105px; object-fit: cover; background: #f5f5f5;">
            <div>
              <div class="product-card-category">${currentProduct.category}</div>
              <h3 style="font-size: 1.15rem; margin-bottom: 4px;">${currentProduct.name}</h3>
              <div class="font-heading" style="font-weight: 700; font-size: 1.1rem;">${StoreUtils.formatMoney(currentProduct.price)}</div>
            </div>
          </div>

          <!-- Color selection -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
              Couleur : <strong>${activeColorObj.name}</strong>
            </div>
            <div style="display: flex; gap: 10px;">
              ${currentProduct.colors.map(color => {
                const isSelected = color.code === selectedColor;
                return `
                  <button class="pdp-swatch-btn ${isSelected ? 'active' : ''}" 
                          style="background-color: ${color.hex};" 
                          title="${color.name}"
                          data-product-id="${color.productId || currentProduct.id}"
                          data-color="${color.code}">
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Size selection -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
              Taille : <strong>${selectedSize}</strong>
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
              ${currentProduct.sizes.map(size => {
                const v = currentProduct.variants.find(item => item.color === selectedColor && item.size === size);
                const hasStock = v && v.stock > 0;
                return `
                  <button class="pdp-size-btn ${size === selectedSize ? 'active' : ''} ${!hasStock ? 'disabled' : ''}" 
                          data-size="${size}"
                          ${!hasStock ? 'disabled' : ''}>
                    ${size}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Add Action -->
          <button class="btn btn-primary btn-full" id="quick-add-confirm-btn" ${!inStock ? 'disabled' : ''}>
            ${inStock ? `AJOUTER AU PANIER • ${StoreUtils.formatMoney(currentProduct.price)}` : 'RUPTURE DE STOCK'}
          </button>
        </div>
      `;

      // Swatch clicks
      this.container.querySelectorAll(".pdp-swatch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const targetProductId = btn.getAttribute("data-product-id");
          const targetColorCode = btn.getAttribute("data-color");
          if (targetProductId && targetProductId !== currentProduct.id) {
            const nextProd = window.STORE_PRODUCTS.find(p => p.id === targetProductId);
            if (nextProd) {
              currentProduct = nextProd;
              selectedColor = targetColorCode || nextProd.colors[0].code;
              if (!currentProduct.sizes.includes(selectedSize)) {
                selectedSize = currentProduct.sizes[0];
              }
            }
          } else {
            selectedColor = targetColorCode;
          }
          renderContent();
        });
      });

      // Size clicks
      this.container.querySelectorAll(".pdp-size-btn:not(.disabled)").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedSize = btn.getAttribute("data-size");
          renderContent();
        });
      });

      // Confirm Add
      const addBtn = this.container.querySelector("#quick-add-confirm-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          window.StoreCart.addItem({
            productId: currentProduct.id,
            colorCode: selectedColor,
            size: selectedSize,
            quantity: 1,
            openDrawer: true
          });
          window.QuickAddModalComponent.close();
        });
      }
    };

    renderContent();
    this.container.classList.add("open");
    document.body.classList.add("overflow-locked");

    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) this.close();
    });
  },

  close() {
    if (!this.container) return;
    this.container.classList.remove("open");
    document.body.classList.remove("overflow-locked");
  }
};

/**
 * Reusable Product Card Component
 * Renders consistent, interactive product cards with multi-color swatches,
 * image swapping, wishlist toggle, and quick-add trigger.
 */

window.ProductCardComponent = {
  getSiblings(product) {
    if (!product) return [];
    const products = window.STORE_PRODUCTS || [];
    if (product.group) {
      const grouped = products.filter(p => p.group === product.group);
      if (grouped.length > 0) return grouped;
    }
    const parts = product.name.split(" - ");
    if (parts.length > 1) {
      const baseName = parts[0].trim();
      const matched = products.filter(p => p.name.split(" - ")[0].trim() === baseName);
      if (matched.length > 1) return matched;
    }
    return [product];
  },

  render(product, options = {}) {
    if (!product) return "";

    const isWishlisted = window.StoreWishlist ? window.StoreWishlist.has(product.id) : false;
    const defaultColor = (product.colors && product.colors[0]) || { name: 'Noir Onyx', code: 'black', hex: '#121212', image: 'assets/images/hero/hero-banner.jpg' };
    const defaultImages = (product.images && product.images[defaultColor.code]) || [defaultColor.image];
    const primaryImg = defaultImages[0] || defaultColor.image;
    const hoverImg = defaultImages[1] || primaryImg;

    const discountPercent = StoreUtils.getDiscountPercentage(product.price, product.compareAtPrice);
    const hasMultipleColors = product.colors && product.colors.length > 1;

    const isBundle = product.isBundle || product.id === 'pack-trio-tshirts';
    const productUrl = isBundle ? `product.html?id=${product.id}` : `product.html?id=${product.id}&color=${defaultColor.code}`;

    return `
      <div class="product-card ${isBundle ? 'product-card-bundle' : ''}" data-product-id="${product.id}" data-active-color="${defaultColor.code}">
        <div class="product-card-media">
          <!-- Badges -->
          <div class="product-card-badges">
            ${isBundle ? `<span class="badge" style="background:var(--color-dark);color:#fff;font-weight:700;">PACK ${product.bundleSlotsCount || 3} PIÈCES</span>` : ''}
            ${product.isNew && !isBundle ? '<span class="badge badge-new">NOUVEAU</span>' : ''}
            ${discountPercent ? `<span class="badge badge-sale">-${discountPercent}%</span>` : ''}
          </div>

          <!-- Wishlist Heart Button -->
          <button class="product-card-wishlist ${isWishlisted ? 'active' : ''}" 
                  onclick="window.ProductCardComponent.handleWishlist('${product.id}', this)"
                  aria-label="Ajouter aux favoris">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <!-- Images -->
          <a href="${productUrl}" id="card-media-link-${product.id}">
            <img src="${primaryImg}" alt="${product.name}" class="product-card-img img-primary" id="card-img-${product.id}">
            <img src="${hoverImg}" alt="${product.name} au dos" class="product-card-img img-hover" id="card-hover-img-${product.id}">
          </a>

          <!-- Quick Add Button Overlay -->
          <div class="product-card-quick-add">
            ${isBundle ? `
              <button class="btn btn-sm" style="background: var(--color-dark); color: #fff;" onclick="window.location.href='${productUrl}'">
                ⚡ COMPOSER LE PACK
              </button>
            ` : `
              <button class="btn btn-sm" onclick="window.QuickAddModalComponent.open('${product.id}')">
                ⚡ AJOUT RAPIDE
              </button>
            `}
          </div>
        </div>

        <div class="product-card-info">
          <div class="product-card-category">${isBundle ? 'OFFRE PACK' : product.category}</div>
          <h3 class="product-card-title">
            <a href="${productUrl}" id="card-title-link-${product.id}">
              ${product.name}
            </a>
          </h3>

          <div class="product-card-prices">
            <span class="product-card-price">${StoreUtils.formatMoney(product.price)}</span>
            ${product.compareAtPrice ? `
              <span class="product-card-compare-price">${StoreUtils.formatMoney(product.compareAtPrice)}</span>
            ` : ''}
          </div>

          <!-- Color Swatches or Bundle Indicator -->
          ${isBundle ? `
            <div style="font-size: 0.74rem; color: var(--color-text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
              <span>✨ ${product.bundleSlotsCount || 3} Pièces au choix</span>
              ${product.compareAtPrice && product.compareAtPrice > product.price ? `
                <span style="color: var(--color-text-muted);">•</span>
                <span style="color: var(--color-success); font-weight: 700;">Éco. ${product.compareAtPrice - product.price} MAD</span>
              ` : ''}
            </div>
          ` : (hasMultipleColors ? `
            <div class="product-card-swatches">
              ${product.colors.map((col, index) => {
                const isCurrent = col.code === defaultColor.code;
                return `
                  <button type="button" 
                          class="color-swatch-dot ${isCurrent ? 'active' : ''}" 
                          style="background-color: ${col.hex};" 
                          title="${col.name}"
                          onmouseenter="window.ProductCardComponent.selectColor('${product.id}', '${col.code}', this, event)"
                          onclick="window.ProductCardComponent.selectColor('${product.id}', '${col.code}', this, event)">
                  </button>
                `;
              }).join('')}
            </div>
          ` : '')}
        </div>
      </div>
    `;
  },

  handleWishlist(productId, btnElement) {
    if (!window.StoreWishlist) return;
    const isNowSaved = window.StoreWishlist.toggle(productId);
    if (isNowSaved) {
      btnElement.classList.add("active");
    } else {
      btnElement.classList.remove("active");
    }
  },

  selectColor(productId, colorCode, swatchElement, e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    const card = swatchElement ? swatchElement.closest(".product-card") : document.querySelector(`.product-card[data-product-id="${productId}"]`);
    const product = (window.STORE_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;

    // Update active swatch dot highlight
    if (swatchElement && swatchElement.parentElement) {
      const swatches = swatchElement.parentElement.querySelectorAll(".color-swatch-dot");
      swatches.forEach(s => s.classList.remove("active"));
      swatchElement.classList.add("active");
    }

    const colorObj = (product.colors || []).find(c => c.code === colorCode) || {};

    // Check alias keys for color code (e.g. rose / pink, dark-blue / navy)
    const possibleCodes = [colorCode];
    if (colorCode === 'rose') possibleCodes.push('pink');
    if (colorCode === 'pink') possibleCodes.push('rose');
    if (colorCode === 'dark-blue') possibleCodes.push('navy', 'darkblue');
    if (colorCode === 'navy') possibleCodes.push('dark-blue');

    let images = [];
    if (product.images) {
      for (const code of possibleCodes) {
        if (product.images[code] && product.images[code].length > 0) {
          images = product.images[code];
          break;
        }
      }
    }

    if (images.length === 0 && colorObj.image) {
      images = [colorObj.image];
    }

    const primaryImg = (images && images[0]) || colorObj.image || (product.colors && product.colors[0] && product.colors[0].image) || '';
    const hoverImg = (images && images[1]) || primaryImg;

    const imgEl = (card && card.querySelector(".product-card-img.img-primary")) || document.getElementById(`card-img-${productId}`);
    const hoverEl = (card && card.querySelector(".product-card-img.img-hover")) || document.getElementById(`card-hover-img-${productId}`);
    const linkEl = (card && card.querySelector(".product-card-title a")) || document.getElementById(`card-title-link-${productId}`);
    const mediaLinkEl = (card && card.querySelector(".product-card-media a")) || document.getElementById(`card-media-link-${productId}`);

    if (imgEl && primaryImg) imgEl.src = primaryImg;
    if (hoverEl && hoverImg) hoverEl.src = hoverImg;
    if (card) card.setAttribute("data-active-color", colorCode);

    // Update the card link destination to open the main product associated with this card's title
    const destUrl = `product.html?id=${productId}&color=${colorCode}`;
    if (linkEl) linkEl.href = destUrl;
    if (mediaLinkEl) mediaLinkEl.href = destUrl;
  }
};

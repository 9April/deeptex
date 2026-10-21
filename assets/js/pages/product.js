/**
 * Product Details Page (PDP) Controller
 * Multi-image gallery with zoom, variant synchronization (color/size/SKU/stock),
 * interactive size guide modal, accordions, and related products cross-sell.
 * Includes complete full-width Pack 3 T-Shirts Visual Studio Customizer with placeholder state.
 */

window.ProductPageController = {
  product: null,
  selectedColor: null,
  selectedSize: null,
  selectedQuantity: 1,
  activeImageIndex: 0,

  // Pack 3 T-Shirts Builder State
  activeSlotTab: 1, // 1 | 2 | 3
  activeFilterModel: 'all', // 'all' | 'graphic-tee-colored' | 'essential-oversized-tee' | 'minimal-embroidered-logo-tee'
  bundleViewMode: 'live', // 'live' | 'box'
  bundlePlaceholderImage: 'assets/images/products/tshirt-white-front.jpg',
  
  // Slots start empty until the customer chooses each t-shirt
  bundleSlots: [
    { slot: 1, productId: null, colorCode: null, size: "M" },
    { slot: 2, productId: null, colorCode: null, size: "M" },
    { slot: 3, productId: null, colorCode: null, size: "M" }
  ],

  // Quick Look Modal State
  quickLookState: {
    isOpen: false,
    productId: null,
    colorCode: null,
    variant: null,
    activeImage: null,
    selectedSize: 'M',
    targetSlot: 1
  },

  // Complete list of default t-shirt variant cards with official front and back photos
  DEFAULT_TSHIRT_VARIANTS: [
    // 1. Graphic Colored Edition (4 colors)
    {
      productId: "graphic-tee-colored",
      modelName: "T-Shirt Graphic Colored Edition",
      modelShort: "Graphic Colored",
      gsm: "260 GSM",
      fit: "Coupe Boxy Contemporaine",
      colorCode: "black",
      colorName: "Noir Onyx",
      colorHex: "#121212",
      image: "assets/images/products/t-shirts/vintage-washed-charcoal-tee/front-main.png",
      backImage: "assets/images/products/t-shirts/vintage-washed-charcoal-tee/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/vintage-washed-charcoal-tee/front-main.png",
        "assets/images/products/t-shirts/vintage-washed-charcoal-tee/back-hover.png"
      ],
      description: "Coupe boxy contemporaine en jersey lourd 260 GSM. Sérigraphie haute densité signature Atelier, col rond indéformable.",
      sku: "T-S-BLA",
      category: "graphic"
    },
    {
      productId: "graphic-tee-colored",
      modelName: "T-Shirt Graphic Colored Edition",
      modelShort: "Graphic Colored",
      gsm: "260 GSM",
      fit: "Coupe Boxy Contemporaine",
      colorCode: "dark-blue",
      colorName: "Bleu Foncé",
      colorHex: "#192231",
      image: "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/front-main.png",
      backImage: "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/front-main.png",
        "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/back-hover.png"
      ],
      description: "Teinte bleu profond sur jersey peigné 260 GSM. Finitions premium et lettrage graphique subtil.",
      sku: "T-S-DAR",
      category: "graphic"
    },
    {
      productId: "graphic-tee-colored",
      modelName: "T-Shirt Graphic Colored Edition",
      modelShort: "Graphic Colored",
      gsm: "260 GSM",
      fit: "Coupe Boxy Contemporaine",
      colorCode: "indigo",
      colorName: "Indigo",
      colorHex: "#EADACB",
      image: "assets/images/products/t-shirts/essential-tee-indigo/front-main.png",
      backImage: "assets/images/products/t-shirts/essential-tee-indigo/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/essential-tee-indigo/front-main.png",
        "assets/images/products/t-shirts/essential-tee-indigo/back-hover.png"
      ],
      description: "Nuance minérale chaleureuse sur coton 260 GSM haute tenue. Coupe boxy équilibrée.",
      sku: "T-S-IND",
      category: "graphic"
    },
    {
      productId: "graphic-tee-colored",
      modelName: "T-Shirt Graphic Colored Edition",
      modelShort: "Graphic Colored",
      gsm: "260 GSM",
      fit: "Coupe Boxy Contemporaine",
      colorCode: "rose",
      colorName: "Baby Pink",
      colorHex: "#F6D9DC",
      image: "assets/images/products/t-shirts/essential-tee-rose/tshirt-pink-front.png",
      backImage: "assets/images/products/t-shirts/essential-tee-rose/tshirt-pink-back.png",
      gallery: [
        "assets/images/products/t-shirts/essential-tee-rose/tshirt-pink-front.png",
        "assets/images/products/t-shirts/essential-tee-rose/tshirt-pink-back.png"
      ],
      description: "Rose pastel poudré sophistiqué en jersey 260 GSM. Toucher ultra doux et tombé parfait.",
      sku: "T-S-ROS",
      category: "graphic"
    },

    // 2. Oversized Monogramme Big (3 colors)
    {
      productId: "essential-oversized-tee",
      modelName: "T-Shirt Oversized Monogramme Big",
      modelShort: "Oversized Monogramme",
      gsm: "240 GSM",
      fit: "Coupe Oversize Tombante",
      colorCode: "black",
      colorName: "Noir Onyx",
      colorHex: "#121212",
      image: "assets/images/products/t-shirts/essential-oversized-tee/front-main.png",
      backImage: "assets/images/products/t-shirts/essential-oversized-tee/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/essential-oversized-tee/front-main.png",
        "assets/images/products/t-shirts/essential-oversized-tee/back-hover.png"
      ],
      description: "Coupe streetwear oversize avec épaules tombantes et monogramme signature au dos.",
      sku: "T-S-BLA",
      category: "oversized"
    },
    {
      productId: "essential-oversized-tee",
      modelName: "T-Shirt Oversized Monogramme Big",
      modelShort: "Oversized Monogramme",
      gsm: "240 GSM",
      fit: "Coupe Oversize Tombante",
      colorCode: "navy",
      colorName: "Bleu Marine",
      colorHex: "#1D2E4E",
      image: "assets/images/products/t-shirts/heavyweight-boxy-tee-300/front-main.png",
      backImage: "assets/images/products/t-shirts/heavyweight-boxy-tee-300/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/heavyweight-boxy-tee-300/front-main.png",
        "assets/images/products/t-shirts/heavyweight-boxy-tee-300/back-hover.png"
      ],
      description: "Bleu marine profond sur jersey peigné 240 GSM. Silhouette moderne ample et décontractée.",
      sku: "T-S-NAV",
      category: "oversized"
    },
    {
      productId: "essential-oversized-tee",
      modelName: "T-Shirt Oversized Monogramme Big",
      modelShort: "Oversized Monogramme",
      gsm: "240 GSM",
      fit: "Coupe Oversize Tombante",
      colorCode: "white",
      colorName: "Blanc Craie",
      colorHex: "#F4F4F0",
      image: "assets/images/products/t-shirts/oversized-tee-big-white/front-main.png",
      backImage: "assets/images/products/t-shirts/oversized-tee-big-white/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/oversized-tee-big-white/front-main.png",
        "assets/images/products/t-shirts/oversized-tee-big-white/back-hover.png"
      ],
      description: "Blanc naturel mat et lumineux. Coton peigné 240 GSM avec grand monogramme contrasté au dos.",
      sku: "T-S-WHI",
      category: "oversized"
    },

    // 3. Minimal Essential (4 colors)
    {
      productId: "minimal-embroidered-logo-tee",
      modelName: "T-Shirt Minimal Essential",
      modelShort: "Minimal Essential",
      gsm: "250 GSM",
      fit: "Coupe Semi-Oversize Épurée",
      colorCode: "black",
      colorName: "Noir Onyx",
      colorHex: "#121212",
      image: "assets/images/products/t-shirts/minimal-embroidered-logo-tee/front-main.png",
      backImage: "assets/images/products/t-shirts/minimal-embroidered-logo-tee/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/minimal-embroidered-logo-tee/front-main.png",
        "assets/images/products/t-shirts/minimal-embroidered-logo-tee/back-hover.png"
      ],
      description: "Logo minimaliste brodé au cœur sur jersey lourd 250 GSM. Élégance intemporelle et coupe droite nette.",
      sku: "T-S-BLA",
      category: "minimal"
    },
    {
      productId: "minimal-embroidered-logo-tee",
      modelName: "T-Shirt Minimal Essential",
      modelShort: "Minimal Essential",
      gsm: "250 GSM",
      fit: "Coupe Semi-Oversize Épurée",
      colorCode: "blue-m",
      colorName: "Bleu Royal",
      colorHex: "#254E70",
      image: "assets/images/products/t-shirts/essential-tee-blue-m/front-main.png",
      backImage: "assets/images/products/t-shirts/essential-tee-blue-m/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/essential-tee-blue-m/front-main.png",
        "assets/images/products/t-shirts/essential-tee-blue-m/back-hover.png"
      ],
      description: "Teinte bleu royal vibrante et raffinée. Broderie fine signature Atelier sur poitrine.",
      sku: "T-S-BLU",
      category: "minimal"
    },
    {
      productId: "minimal-embroidered-logo-tee",
      modelName: "T-Shirt Minimal Essential",
      modelShort: "Minimal Essential",
      gsm: "250 GSM",
      fit: "Coupe Semi-Oversize Épurée",
      colorCode: "white",
      colorName: "Blanc Craie",
      colorHex: "#F4F4F0",
      image: "assets/images/products/t-shirts/atelier-studio-drop-tee/front-main.png",
      backImage: "assets/images/products/t-shirts/atelier-studio-drop-tee/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/atelier-studio-drop-tee/front-main.png",
        "assets/images/products/t-shirts/atelier-studio-drop-tee/back-hover.png"
      ],
      description: "La pièce indispensable du vestiaire masculin. Blanc craie naturel, col doublé et broderie ton-sur-ton.",
      sku: "T-S-WHI",
      category: "minimal"
    },
    {
      productId: "minimal-embroidered-logo-tee",
      modelName: "T-Shirt Minimal Essential",
      modelShort: "Minimal Essential",
      gsm: "250 GSM",
      fit: "Coupe Semi-Oversize Épurée",
      colorCode: "beige",
      colorName: "Beige Sable",
      colorHex: "#D9CEB2",
      image: "assets/images/products/t-shirts/relaxed-earth-tone-tee/front-main.png",
      backImage: "assets/images/products/t-shirts/relaxed-earth-tone-tee/back-hover.png",
      gallery: [
        "assets/images/products/t-shirts/relaxed-earth-tone-tee/front-main.png",
        "assets/images/products/t-shirts/relaxed-earth-tone-tee/back-hover.png"
      ],
      description: "Teinte sable naturelle d'inspiration terre cuite. Toucher peigné soyeux et silhouette décontractée.",
      sku: "T-S-BEI",
      category: "minimal"
    },

    // 4. Heritage Regular (8 colors)
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage - Gris Chiné",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "Gris",
      colorName: "Empty Grey",
      colorHex: "#A8A9AD",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/grey-front.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/grey-back.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/grey-front.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/grey-back.png"
      ],
      description: "T-shirt essentiel à la coupe regular intemporelle en jersey doux et respirant 180 GSM.",
      sku: "T-S-GRI",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "taupe",
      colorName: "Brun Taupe",
      colorHex: "#7B6252",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Brown _ Taupe.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Brown _ Taupe b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Brown _ Taupe.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Brown _ Taupe b.png"
      ],
      description: "Nuance taupe minérale sur jersey 180 GSM doux et respirant.",
      sku: "T-S-TAU",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "cream",
      colorName: "Crème",
      colorHex: "#EFEAD8",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Cream.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Cream b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Cream.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Cream b.png"
      ],
      description: "Teinte crème lumineuse sur coton respirant 180 GSM.",
      sku: "T-S-CRE",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "dusty-rose",
      colorName: "Rose Poudré",
      colorHex: "#D6A5A3",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Dusty Rose _ Pink.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Dusty Rose _ Pink b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Dusty Rose _ Pink.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Dusty Rose _ Pink b.png"
      ],
      description: "Rose poudré délicat sur jersey premium 180 GSM.",
      sku: "T-S-DUS",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "light-blue",
      colorName: "Bleu Ciel",
      colorHex: "#9EBCD4",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Light Blue.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Light Blue b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Light Blue.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Light Blue b.png"
      ],
      description: "Bleu ciel frais et épuré sur coupe regular.",
      sku: "T-S-LIG",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "medium-grey",
      colorName: "Gris Moyen",
      colorHex: "#8A8D90",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Medium Grey.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Medium Grey b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Medium Grey.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Medium Grey b.png"
      ],
      description: "Gris moyen intemporel pour toutes les silhouettes urbaines.",
      sku: "T-S-MED",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "strong-blue",
      colorName: "Bleu Intense",
      colorHex: "#1E4870",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Strong Blue.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Strong Blue b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Strong Blue.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Strong Blue b.png"
      ],
      description: "Bleu intense profond et vibrant sur jersey respirant.",
      sku: "T-S-STR",
      category: "heritage"
    },
    {
      productId: "heritage-regular-tshirt-heather-grey",
      modelName: "T-Shirt Regular Heritage",
      modelShort: "Heritage Regular",
      gsm: "180 GSM",
      fit: "Coupe Regular Classique",
      colorCode: "teal",
      colorName: "Bleu Canard",
      colorHex: "#276063",
      image: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Teal _ Blue-Green.png",
      backImage: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Teal _ Blue-Green b.png",
      gallery: [
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Teal _ Blue-Green.png",
        "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Teal _ Blue-Green b.png"
      ],
      description: "Nuance canard canopée contemporaine.",
      sku: "T-S-TEA",
      category: "heritage"
    }
  ],

  allTshirtVariants: [],

  buildBundleAvailableVariants() {
    if (!this.product || (!this.product.isBundle && this.product.id !== 'pack-trio-tshirts')) {
      this.allTshirtVariants = [...this.DEFAULT_TSHIRT_VARIANTS];
      return;
    }

    const storeProducts = (window.STORE_PRODUCTS && window.STORE_PRODUCTS.length > 0)
      ? window.STORE_PRODUCTS
      : (window.DEFAULT_STORE_PRODUCTS || []);

    const includedIds = (this.product.bundleIncludedProductIds && this.product.bundleIncludedProductIds.length > 0)
      ? this.product.bundleIncludedProductIds
      : ['graphic-tee-colored', 'essential-oversized-tee', 'minimal-embroidered-logo-tee'];

    let variants = [];

    // 1. Gather pre-configured matching variants
    const defaultMatches = this.DEFAULT_TSHIRT_VARIANTS.filter(v => includedIds.includes(v.productId));
    variants.push(...defaultMatches);

    // 2. Also check if custom products created in Admin are included
    includedIds.forEach(prodId => {
      if (defaultMatches.some(v => v.productId === prodId)) return;
      const found = storeProducts.find(p => p.id === prodId);
      if (found && !found.isBundle && found.id !== 'pack-trio-tshirts') {
        const colors = (found.colors && found.colors.length > 0) ? found.colors : [{ name: 'Standard', code: 'default', hex: '#121212', image: 'assets/images/hero/hero-banner.jpg' }];
        colors.forEach(col => {
          const possibleCodes = [col.code];
          if (col.code === 'rose') possibleCodes.push('pink');
          if (col.code === 'pink') possibleCodes.push('rose');
          if (col.code === 'dark-blue') possibleCodes.push('navy', 'darkblue');
          if (col.code === 'navy') possibleCodes.push('dark-blue');

          let images = [];
          if (found.images) {
            for (const code of possibleCodes) {
              if (found.images[code] && found.images[code].length > 0) {
                images = found.images[code];
                break;
              }
            }
          }
          if (images.length === 0 && col.image) images = [col.image];
          const frontImg = images[0] || col.image || 'assets/images/products/tshirt-white-front.jpg';
          const backImg = images[1] || null;

          variants.push({
            productId: found.id,
            modelName: found.name,
            modelShort: found.name.replace(/^T-Shirt\s+/i, ''),
            gsm: found.gsm || "240 GSM",
            fit: found.fit || "Coupe Contemporaine",
            colorCode: col.code,
            colorName: col.name,
            colorHex: col.hex || "#121212",
            image: frontImg,
            backImage: backImg,
            gallery: images,
            description: found.description || found.shortDescription || "",
            sku: `${found.sku || 'TS'}-${(col.code || 'COL').toUpperCase().slice(0, 3)}`,
            category: found.category || "t-shirts"
          });
        });
      }
    });

    if (variants.length === 0) {
      variants = [...this.DEFAULT_TSHIRT_VARIANTS];
    }

    this.allTshirtVariants = variants;
  },

  init() {
    if (window.HeaderComponent) window.HeaderComponent.mount();
    if (window.FooterComponent) window.FooterComponent.mount();

    const params = StoreUtils.getUrlParams();
    let rawId = params.id;
    let initialColor = params.color;

    // Check alias mapping if user arrives with an old or sibling URL
    const aliases = window.PRODUCT_ALIASES || {
      "vintage-washed-charcoal-tee": { targetId: "graphic-tee-colored", defaultColor: "black" },
      "graphic-tee-colored-blue-dark": { targetId: "graphic-tee-colored", defaultColor: "dark-blue" },
      "essential-tee-rose": { targetId: "graphic-tee-colored", defaultColor: "rose" },
      "essential-tee-indigo": { targetId: "graphic-tee-colored", defaultColor: "indigo" },
      "heavyweight-boxy-tee-300": { targetId: "essential-oversized-tee", defaultColor: "navy" },
      "oversized-tee-big-white": { targetId: "essential-oversized-tee", defaultColor: "white" },
      "essential-tee-blue-m": { targetId: "minimal-embroidered-logo-tee", defaultColor: "blue-m" },
      "atelier-studio-drop-tee": { targetId: "minimal-embroidered-logo-tee", defaultColor: "white" },
      "relaxed-earth-tone-tee": { targetId: "minimal-embroidered-logo-tee", defaultColor: "beige" }
    };

    if (rawId && aliases[rawId]) {
      const aliasData = typeof aliases[rawId] === 'string' ? { targetId: aliases[rawId] } : aliases[rawId];
      if (!initialColor && aliasData.defaultColor) {
        initialColor = aliasData.defaultColor;
        StoreUtils.updateUrlParam("color", initialColor);
      }
      rawId = aliasData.targetId;
      StoreUtils.updateUrlParam("id", rawId);
    }

    const allProducts = (window.STORE_PRODUCTS && window.STORE_PRODUCTS.length > 0)
      ? window.STORE_PRODUCTS
      : (window.DEFAULT_STORE_PRODUCTS || []);

    if (!rawId && allProducts.length > 0) {
      rawId = allProducts[0].id;
    }

    this.product = allProducts.find(p => p.id === rawId || p.slug === rawId);

    if (!this.product && window.DEFAULT_STORE_PRODUCTS) {
      this.product = window.DEFAULT_STORE_PRODUCTS.find(p => p.id === rawId || p.slug === rawId);
      if (this.product && window.STORE_PRODUCTS) {
        window.STORE_PRODUCTS.push(this.product);
      }
    }

    if (!this.product) {
      this.renderNotFound();
      return;
    }

    // Ensure all default colorways and images are present in this.product
    if (this.product && window.DEFAULT_STORE_PRODUCTS) {
      const def = window.DEFAULT_STORE_PRODUCTS.find(p => p.id === this.product.id || p.slug === this.product.id);
      if (def && Array.isArray(def.colors)) {
        const existingCodes = new Set((this.product.colors || []).map(c => c.code));
        const mergedColors = [...(this.product.colors || [])];
        def.colors.forEach(defColor => {
          if (!existingCodes.has(defColor.code)) {
            mergedColors.push(defColor);
            existingCodes.add(defColor.code);
          }
        });
        this.product.colors = mergedColors;
        this.product.images = { ...(def.images || {}), ...(this.product.images || {}) };
        def.colors.forEach(defColor => {
          if (!this.product.images[defColor.code] || this.product.images[defColor.code].length === 0) {
            if (def.images && def.images[defColor.code]) {
              this.product.images[defColor.code] = def.images[defColor.code];
            }
          }
        });
        mergedColors.forEach(c => {
          if (this.product.images && this.product.images[c.code] && this.product.images[c.code].length > 0) {
            c.image = this.product.images[c.code][0];
          }
        });
        const existingVarKeys = new Set((this.product.variants || []).map(v => `${v.color}-${v.size}`));
        const mergedVariants = [...(this.product.variants || [])];
        (def.variants || []).forEach(defVar => {
          const key = `${defVar.color}-${defVar.size}`;
          if (!existingVarKeys.has(key)) {
            mergedVariants.push(defVar);
            existingVarKeys.add(key);
          }
        });
        this.product.variants = mergedVariants;
      }
    }

    // Set document title for SEO
    document.title = `${this.product.name} | ${window.STORE_CONFIG.brandName}`;

    // Resolve initial color
    let colorParam = initialColor || params.color;
    if (colorParam === 'indigo' && this.product.colors && !this.product.colors.some(c => c.code === 'indigo') && this.product.colors.some(c => c.code === 'beige')) {
      colorParam = 'beige';
      StoreUtils.updateUrlParam("color", 'beige');
    }
    const colorExists = (this.product.colors || []).some(c => c.code === colorParam);
    this.selectedColor = colorExists ? colorParam : (this.product.colors && this.product.colors[0] ? this.product.colors[0].code : 'black');

    // Resolve initial size
    this.selectedSize = (this.product.sizes && this.product.sizes[0]) || "M";

    // Setup dynamic slots and variants if bundle
    if (this.product.isBundle || this.product.id === 'pack-trio-tshirts') {
      const slotsCount = (this.product.bundleSlotsCount && parseInt(this.product.bundleSlotsCount, 10) > 0)
        ? parseInt(this.product.bundleSlotsCount, 10)
        : 3;
      
      this.bundleSlots = [];
      for (let i = 1; i <= slotsCount; i++) {
        this.bundleSlots.push({ slot: i, productId: null, colorCode: null, size: (this.product.sizes && this.product.sizes[0]) || "M" });
      }
      this.activeSlotTab = 1;
      this.activeFilterModel = 'all';
      this.buildBundleAvailableVariants();
    }

    this.render();
    this.bindEvents();
    if (!this.product.isBundle) {
      this.renderRelatedProducts();
    }
  },

  renderNotFound() {
    const main = document.getElementById("pdp-main-content");
    if (!main) return;

    main.innerHTML = `
      <div class="container section-spacing text-center">
        <h2>Pièce introuvable</h2>
        <p style="margin: 16px 0 24px;">Le produit demandé n'existe pas ou n'est plus disponible.</p>
        <a href="shop.html" class="btn btn-primary">Retour à la boutique</a>
      </div>
    `;
  },

  render() {
    if (this.product && (this.product.isBundle || this.product.id === 'pack-trio-tshirts')) {
      this.renderBundleCustomizer();
      return;
    }

    const p = this.product;
    const activeColorObj = p.colors.find(c => c.code === this.selectedColor) || p.colors[0];
    
    // Resolve gallery images with color alias support
    const possibleCodes = [this.selectedColor];
    if (this.selectedColor === 'rose') possibleCodes.push('pink');
    if (this.selectedColor === 'pink') possibleCodes.push('rose');
    if (this.selectedColor === 'dark-blue') possibleCodes.push('navy', 'darkblue');
    if (this.selectedColor === 'navy') possibleCodes.push('dark-blue');

    let images = [];
    if (p.images) {
      for (const code of possibleCodes) {
        if (p.images[code] && p.images[code].length > 0) {
          images = p.images[code];
          break;
        }
      }
    }
    if (images.length === 0) {
      images = [activeColorObj.image || 'assets/images/hero/hero-banner.jpg'];
    }
    const activeImage = images[this.activeImageIndex] || images[0];

    const currentVariant = p.variants.find(v => v.color === this.selectedColor && v.size === this.selectedSize) || p.variants[0];
    const inStock = currentVariant && currentVariant.stock > 0;
    const discountPercent = StoreUtils.getDiscountPercentage(p.price, p.compareAtPrice);

    // Ensure standard PDP layout container
    const main = document.getElementById("pdp-main-content");
    if (main) {
      main.innerHTML = `
        <div class="container section-spacing">
          <div class="pdp-layout">
            <section class="pdp-gallery" id="pdp-gallery-container"></section>
            <section class="pdp-info" id="pdp-info-container"></section>
          </div>
          <section style="margin-top: clamp(60px, 8vw, 100px); padding-top: 48px; border-top: 1px solid var(--color-border);">
            <div class="section-header text-center">
              <span class="badge" style="background: var(--color-bg-secondary); color: var(--color-dark); margin-bottom: 8px;">COMPLÉTEZ VOTRE VESTIAIRE</span>
              <h2>VOUS AIMEREZ AUSSI</h2>
              <p class="section-subtitle">D'autres pièces conçues avec la même exigence de confection.</p>
            </div>
            <div class="product-grid-4col" id="pdp-related-grid"></div>
          </section>
        </div>
      `;
    }

    // 1. Render Gallery
    const galleryContainer = document.getElementById("pdp-gallery-container");
    if (galleryContainer) {
      galleryContainer.innerHTML = `
        <div class="pdp-thumbnails">
          ${images.map((img, idx) => `
            <div class="pdp-thumb ${idx === this.activeImageIndex ? 'active' : ''}" onclick="window.ProductPageController.setImageIndex(${idx})">
              <img src="${img}" alt="${p.name} vue ${idx + 1}">
            </div>
          `).join('')}
        </div>
        <div class="pdp-main-image-viewport" id="pdp-main-viewport">
          <img src="${activeImage}" alt="${p.name}" class="pdp-main-img" id="pdp-zoom-img">
        </div>
      `;

      this.bindImageZoom();
    }

    // 2. Render Details & Selectors
    const infoContainer = document.getElementById("pdp-info-container");
    if (infoContainer) {
      infoContainer.innerHTML = `
        <div class="pdp-breadcrumbs">
          <a href="index.html">Accueil</a>
          <span>/</span>
          <a href="shop.html">Boutique</a>
          <span>/</span>
          <a href="shop.html?category=${p.category}">${p.category}</a>
        </div>

        <h1 class="pdp-title">${p.name}</h1>

        <div class="pdp-price-row">
          <span style="color: var(--color-dark);">${StoreUtils.formatMoney(p.price)}</span>
          ${p.compareAtPrice ? `<span class="pdp-compare-price">${StoreUtils.formatMoney(p.compareAtPrice)}</span>` : ''}
          ${discountPercent ? `<span class="badge badge-sale">ÉCONOMISEZ ${discountPercent}%</span>` : ''}
          ${p.isNew ? `<span class="badge badge-new">NOUVEAU</span>` : ''}
        </div>

        <!-- Rating overview -->
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.86rem;">
          <div style="color: #F59E0B; letter-spacing: 2px;">★★★★★</div>
          <span style="font-weight: 600;">${p.rating}</span>
          <span style="color: var(--color-text-muted);">(${p.reviewCount} avis vérifiés)</span>
        </div>

        <p class="pdp-short-desc">${p.shortDescription}</p>

        <!-- Color Selector -->
        <div class="variant-block">
          <div class="variant-label-row">
            <span>Couleur : <strong>${activeColorObj.name}</strong></span>
          </div>
          <div class="pdp-color-swatches">
            ${(p.colors || []).map(item => {
              const isCurrent = (item.code === this.selectedColor);
              return `
                <button type="button"
                        class="pdp-swatch-btn ${isCurrent ? 'active' : ''}" 
                        style="background-color: ${item.hex};" 
                        title="${item.name}"
                        onclick="window.ProductPageController.setColor('${item.code}')">
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Size Selector -->
        <div class="variant-block">
          <div class="variant-label-row">
            <span>Taille : <strong>${this.selectedSize}</strong></span>
            <button type="button" style="text-decoration: underline; font-size: 0.78rem; text-transform: uppercase;" onclick="window.SizeGuideModalComponent.open()">
              📐 Guide des tailles
            </button>
          </div>
          <div class="pdp-size-grid">
            ${p.sizes.map(size => {
              const variant = p.variants.find(v => v.color === this.selectedColor && v.size === size);
              const available = variant && variant.stock > 0;
              return `
                <button type="button" 
                        class="pdp-size-btn ${size === this.selectedSize ? 'active' : ''} ${!available ? 'disabled' : ''}"
                        ${!available ? 'disabled' : ''}
                        onclick="window.ProductPageController.setSize('${size}')">
                  ${size}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Inventory / Stock Status Badge -->
        <div style="font-size: 0.84rem; display: flex; align-items: center; gap: 8px; margin-top: -4px;">
          ${inStock ? `
            <span style="width: 8px; height: 8px; background-color: var(--color-success); border-radius: 50%;"></span>
            <span>En stock dans notre atelier de Casablanca ${currentVariant.stock <= 5 ? `<strong style="color: var(--color-warning);">(${currentVariant.stock} restants)</strong>` : ''}</span>
          ` : `
            <span style="width: 8px; height: 8px; background-color: var(--color-sale); border-radius: 50%;"></span>
            <span style="color: var(--color-sale); font-weight: 600;">Rupture de stock pour cette combinaison</span>
          `}
        </div>

        <!-- Actions -->
        <div class="pdp-actions-row">
          <div class="pdp-qty-selector">
            <button class="pdp-qty-btn" onclick="window.ProductPageController.updateQty(-1)">-</button>
            <input type="text" class="pdp-qty-input" value="${this.selectedQuantity}" readonly>
            <button class="pdp-qty-btn" onclick="window.ProductPageController.updateQty(1)">+</button>
          </div>
          <button class="btn btn-primary pdp-add-btn" id="pdp-add-to-cart-btn" ${!inStock ? 'disabled' : ''} onclick="window.ProductPageController.addToCart(false)">
            ${inStock ? 'AJOUTER AU PANIER' : 'ÉPUISÉ'}
          </button>
        </div>

        <button class="btn pdp-buy-now-btn" ${!inStock ? 'disabled' : ''} onclick="window.ProductPageController.addToCart(true)">
          ACHETER MAINTENANT (EXPRESS)
        </button>

        <!-- Guarantee pills -->
        <div style="background-color: var(--color-bg-secondary); padding: 14px 18px; border: 1px solid var(--color-border); font-size: 0.82rem; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🚚</span>
            <span><strong>Livraison Express au Maroc :</strong> Expédition en 24/48h. Offerte dès 500 MAD.</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>💵</span>
            <span><strong>Paiement à la livraison (Cash on Delivery) :</strong> Réglez en espèces à réception.</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🔄</span>
            <span><strong>Échanges faciles :</strong> 7 jours pour échanger votre taille gratuitement.</span>
          </div>
        </div>

        <!-- Collapsible Accordions -->
        <div class="pdp-accordions">
          <div class="accordion-item open">
            <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
              <span>Détails & Coupe</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="accordion-content">
              <p style="margin-bottom: 12px;">${p.description}</p>
              <ul style="list-style: disc; padding-left: 20px; font-size: 0.88rem; color: var(--color-text-secondary); display: flex; flex-direction: column; gap: 6px;">
                ${p.details.map(d => `<li>${d}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
              <span>Matières & Entretien</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="accordion-content">
              <p style="margin-bottom: 8px;"><strong>Matière :</strong> ${p.materials}</p>
              <p style="margin-bottom: 8px;"><strong>Conseil d'entretien :</strong> ${p.careInstructions}</p>
              <p><strong>Conseil taille :</strong> ${p.fit}</p>
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
              <span>Livraison & Retours au Maroc</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="accordion-content">
              <p style="margin-bottom: 8px;">Toutes nos commandes sont préparées et expédiées depuis nos ateliers à Casablanca.</p>
              <p style="margin-bottom: 6px;">• <strong>Casablanca, Rabat :</strong> 24 heures ouvrables.</p>
              <p style="margin-bottom: 6px;">• <strong>Marrakech, Tanger, Agadir, Fès, etc. :</strong> 24 à 48 heures ouvrables.</p>
              <p>• <strong>Frais de livraison :</strong> 35 MAD (Gratuit pour les commandes de 500 MAD ou plus).</p>
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
              <span>Avis Clients (${p.reviewCount})</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="accordion-content">
              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.84rem; margin-bottom: 4px;">
                    <strong>Yassine K. (Casablanca)</strong>
                    <span style="color: #F59E0B;">★★★★★</span>
                  </div>
                  <p style="font-size: 0.84rem;">La qualité du coton est impressionnante, bien lourd comme promis. Le col ne bouge pas après 3 lavages.</p>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.84rem; margin-bottom: 4px;">
                    <strong>Mehdi B. (Rabat)</strong>
                    <span style="color: #F59E0B;">★★★★★</span>
                  </div>
                  <p style="font-size: 0.84rem;">Livraison super rapide en 24h à Rabat. La coupe oversize est parfaitement équilibrée.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ==========================================================================
     PACK 3 T-SHIRTS VISUAL STUDIO BUILDER
     ========================================================================== */

  renderBundleCustomizer() {
    const p = this.product;
    const main = document.getElementById("pdp-main-content");
    if (!main) return;

    const slotsCount = (this.bundleSlots && this.bundleSlots.length > 0) ? this.bundleSlots.length : 3;
    const price = p.price || 599;
    const comparePrice = p.compareAtPrice || (slotsCount * 260);
    const savings = (comparePrice && comparePrice > price) ? (comparePrice - price) : 0;
    const savingsPct = StoreUtils.getDiscountPercentage(price, comparePrice);
    const perPiecePrice = (price / slotsCount).toFixed(2);
    const availableSizes = (p.sizes && p.sizes.length > 0) ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL'];

    // Resolve details for each slot (with tshirt-white-front.jpg placeholder for empty slots)
    const resolvedSlots = this.bundleSlots.map(slot => {
      const isSelected = !!(slot.productId && slot.colorCode);
      if (!isSelected) {
        return {
          ...slot,
          isSelected: false,
          variant: {
            productId: null,
            modelName: `T-Shirt #${slot.slot}`,
            modelShort: `T-Shirt #${slot.slot}`,
            gsm: "À sélectionner",
            fit: "Cliquez sur une photo ci-dessous",
            colorCode: null,
            colorName: "Non choisi",
            colorHex: "#D4D4D0",
            image: "assets/images/products/tshirt-white-front.jpg",
            sku: ""
          }
        };
      }

      const variant = this.allTshirtVariants.find(t => t.productId === slot.productId && t.colorCode === slot.colorCode) 
                   || this.allTshirtVariants.find(t => t.productId === slot.productId) 
                   || this.allTshirtVariants[0];
      return {
        ...slot,
        isSelected: true,
        variant
      };
    });

    // Filter available t-shirt variant image cards
    let visibleVariants = this.allTshirtVariants;
    if (this.activeFilterModel !== 'all') {
      visibleVariants = this.allTshirtVariants.filter(t => t.productId === this.activeFilterModel);
      if (visibleVariants.length === 0) {
        visibleVariants = this.allTshirtVariants;
        this.activeFilterModel = 'all';
      }
    }

    const currentActiveSlot = resolvedSlots.find(s => s.slot === this.activeSlotTab) || resolvedSlots[0];
    const totalSelectedCount = resolvedSlots.filter(s => s.isSelected).length;
    const uniqueModelIds = [...new Set(this.allTshirtVariants.map(v => v.productId))];

    main.innerHTML = `
      <div class="bundle-studio-wrapper">
        <div class="container section-spacing bundle-studio-container">
          
          <!-- Studio Header -->
          <div class="bundle-studio-header">
            <div class="pdp-breadcrumbs" style="margin-bottom: 12px;">
              <a href="index.html">Accueil</a>
              <span>/</span>
              <a href="collections.html">Collections</a>
              <span>/</span>
              <a href="collections.html?c=packs-bundles">Offres Packs & Bundles</a>
              <span>/</span>
              <span style="color: var(--color-dark); font-weight: 700;">${p.name}</span>
            </div>

            <div class="bundle-header-row">
              <div class="bundle-header-left">
                <div class="bundle-header-badges">
                  <span class="badge" style="background: var(--color-dark); color: #fff; font-weight: 700;">OFFRE PACK ${slotsCount} PIÈCES</span>
                  ${savings > 0 ? `<span class="badge badge-sale">ÉCONOMISEZ ${savings} MAD (-${savingsPct}%)</span>` : ''}
                  <span class="badge" style="background: #EBF8F2; color: #047857; font-weight: 700;">🚚 LIVRAISON GRATUITE</span>
                </div>
                <h1 class="bundle-page-title">${p.name}</h1>
                <p class="bundle-page-subtitle">
                  Composez votre pack sur-mesure en choisissant vos ${slotsCount} t-shirts préférés parmi les modèles et coloris ci-dessous.
                </p>
              </div>

              <div class="bundle-header-price-card">
                <div class="bundle-price-card-label">PRIX TOTAL (${slotsCount} T-SHIRTS)</div>
                <div class="bundle-price-card-figures">
                  <span class="bundle-price-val">${StoreUtils.formatMoney(price)}</span>
                  ${comparePrice ? `<span class="bundle-compare-val">${StoreUtils.formatMoney(comparePrice)}</span>` : ''}
                </div>
                <div class="bundle-price-card-sub">Soit ${perPiecePrice} MAD / Pièce • Coffret Inclus</div>
              </div>
            </div>
          </div>

          <!-- Full-Width Studio Content Layout -->
          <div class="bundle-studio-main">
            
            <!-- Slot Selector Tabs at Top -->
            <div class="bundle-main-slot-tabs">
              ${resolvedSlots.map(s => `
                <button type="button" 
                        class="bundle-main-tab ${this.activeSlotTab === s.slot ? 'active' : ''} ${!s.isSelected ? 'tab-unselected' : ''}"
                        onclick="window.ProductPageController.selectSlotTab(${s.slot})">
                  <div class="bundle-tab-top">
                    <span class="bundle-tab-num">T-SHIRT #${s.slot}</span>
                    <span class="bundle-tab-check" style="${!s.isSelected ? 'color: var(--color-text-muted);' : ''}">
                      ${s.isSelected ? '✓ SÉLECTIONNÉ' : '+ À CHOISIR'}
                    </span>
                  </div>
                  <div class="bundle-tab-summary">
                    <img src="${s.variant.image}" alt="${s.variant.modelName}" class="bundle-tab-thumb ${!s.isSelected ? 'thumb-placeholder' : ''}">
                    <div class="bundle-tab-text-wrap">
                      <div class="bundle-tab-title">${s.variant.modelShort}</div>
                      <div class="bundle-tab-sub">
                        ${s.isSelected ? `
                          <span class="bundle-preview-swatch-dot" style="background-color: ${s.variant.colorHex}; width:8px; height:8px;"></span>
                          ${s.variant.colorName} • <strong>${s.size}</strong>
                          <a href="product.html?id=${s.variant.productId}&color=${s.variant.colorCode}" 
                             target="_blank" 
                             class="bundle-tab-pdp-link" 
                             onclick="event.stopPropagation()" 
                             title="Ouvrir la page individuelle de ce t-shirt">
                            ↗ Fiche
                          </a>
                        ` : `
                          <span style="color: var(--color-text-muted);">Non sélectionné • Taille <strong>${s.size}</strong></span>
                        `}
                      </div>
                    </div>
                  </div>
                </button>
              `).join('')}
            </div>

            <!-- Active Slot Studio Configuration Box -->
            <div class="bundle-active-slot-panel">
              
              <div class="bundle-active-slot-banner">
                <div class="bundle-active-banner-flex">
                  <div>
                    <span class="badge" style="background: var(--color-dark); color: #fff; margin-bottom: 4px;">CONFIGURATION EN COURS</span>
                    <h2 style="font-size: 1.3rem; font-weight: 800; margin: 2px 0 0;">
                      Étape ${this.activeSlotTab}/${slotsCount} : Choisissez le T-Shirt #${this.activeSlotTab}
                    </h2>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <div class="bundle-active-summary-pill">
                      ${currentActiveSlot.isSelected ? `
                        Choix actuel : <strong>${currentActiveSlot.variant.modelShort} • ${currentActiveSlot.variant.colorName} (${currentActiveSlot.size})</strong>
                        <a href="product.html?id=${currentActiveSlot.variant.productId}&color=${currentActiveSlot.variant.colorCode}" 
                           target="_blank" 
                           class="bundle-banner-pdp-link" 
                           title="Ouvrir la fiche produit individuelle de ce t-shirt">
                          ↗ Voir la fiche
                        </a>
                      ` : `
                        Statut : <strong style="color: var(--color-sale);">Aucun t-shirt choisi pour ce slot</strong>
                      `}
                    </div>
                    ${currentActiveSlot.isSelected ? `
                      <button type="button" class="btn-clear-slot" onclick="window.ProductPageController.clearSlot(${this.activeSlotTab})" title="Vider ce choix et remettre le t-shirt par défaut">
                        ✕ Vider
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- Model Filters -->
              <div class="bundle-filter-section">
                <div class="bundle-step-instruction">
                  1. Filtrer par Coupe / Modèle :
                </div>
                <div class="bundle-filter-model-pills">
                  <button type="button" class="bundle-filter-pill ${this.activeFilterModel === 'all' ? 'active' : ''}" onclick="window.ProductPageController.setFilterModel('all')">
                    ✨ Tous les T-Shirts (${this.allTshirtVariants.length})
                  </button>
                  ${uniqueModelIds.map(modelId => {
                    const varsForModel = this.allTshirtVariants.filter(v => v.productId === modelId);
                    const modelShort = (varsForModel[0] && varsForModel[0].modelShort) || modelId;
                    return `
                      <button type="button" class="bundle-filter-pill ${this.activeFilterModel === modelId ? 'active' : ''}" onclick="window.ProductPageController.setFilterModel('${modelId}')">
                        ${modelShort} (${varsForModel.length} coloris)
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- VISUAL T-SHIRT IMAGE GALLERY GRID -->
              <div class="bundle-grid-section">
                <div class="bundle-step-instruction">
                  2. Cliquez sur votre taille pour sélectionner directement le T-Shirt #${this.activeSlotTab} :
                </div>

                <div class="bundle-visual-tshirts-grid">
                  ${visibleVariants.map(variant => {
                    const isSelected = (variant.productId === currentActiveSlot.productId && variant.colorCode === currentActiveSlot.colorCode);
                    return `
                      <div class="bundle-visual-card ${isSelected ? 'selected' : ''}" 
                           onclick="window.ProductPageController.selectTshirtForActiveSlot('${variant.productId}', '${variant.colorCode}')">
                        
                        <!-- Selected Badge -->
                        ${isSelected ? `
                          <div class="bundle-card-selected-badge">
                            ✓ CHOISI POUR T-SHIRT #${this.activeSlotTab}
                          </div>
                        ` : ''}

                        <!-- Model Tag Top Row with clean link (outside image) -->
                        <div class="bundle-card-top-tag-row">
                          <span class="bundle-card-top-tag">${variant.modelShort}</span>
                          <a href="product.html?id=${variant.productId}&color=${variant.colorCode}" 
                             target="_blank" 
                             class="bundle-card-header-link" 
                             onclick="event.stopPropagation()" 
                             title="Ouvrir la fiche de ce t-shirt dans un nouvel onglet">
                            ↗ Fiche
                          </a>
                        </div>

                        <!-- Image Container with Front/Back Hover & Quick Look (no clutter inside image) -->
                        <div class="bundle-card-img-container">
                          <img src="${variant.image}" alt="${variant.modelName} ${variant.colorName} - Face" class="bundle-card-img bundle-img-front" loading="lazy">
                          ${variant.backImage ? `
                            <img src="${variant.backImage}" alt="${variant.modelName} ${variant.colorName} - Dos" class="bundle-card-img bundle-img-back" loading="lazy">
                          ` : ''}

                          <!-- Quick Look Action Button -->
                          <button type="button" class="bundle-quick-look-btn" onclick="event.stopPropagation(); window.ProductPageController.openQuickLook('${variant.productId}', '${variant.colorCode}')" title="Aperçu Rapide du T-Shirt">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>Aperçu Rapide</span>
                          </button>

                          <!-- Hover indicator pill -->
                          <div class="bundle-view-hover-pill">
                            <span class="view-tag-front">Face</span>
                            <span class="view-tag-sep">/</span>
                            <span class="view-tag-back">Dos ↻</span>
                          </div>
                        </div>

                        <!-- Card Info -->
                        <div class="bundle-card-body">
                          <div class="bundle-card-color-row">
                            <span class="bundle-card-swatch-circle" style="background-color: ${variant.colorHex};"></span>
                            <span class="bundle-card-color-name">${variant.colorName}</span>
                          </div>
                          <div class="bundle-card-model-sub">
                            ${variant.gsm} • ${variant.fit}
                          </div>

                          <!-- Direct Size Quick Select (1-click select) -->
                          <div class="bundle-card-quick-sizes" onclick="event.stopPropagation()">
                            <div class="bundle-card-sizes-label">Choisir en 1 clic :</div>
                            <div class="bundle-card-sizes-grid">
                              ${availableSizes.map(sz => {
                                const isThisSizeActive = isSelected && currentActiveSlot.size === sz;
                                return `
                                  <button type="button" 
                                          class="bundle-card-size-pill ${isThisSizeActive ? 'active' : ''}" 
                                          onclick="event.stopPropagation(); window.ProductPageController.selectTshirtAndSize('${variant.productId}', '${variant.colorCode}', '${sz}')"
                                          title="Choisir ${variant.modelShort} (${variant.colorName}) en taille ${sz} pour T-Shirt #${this.activeSlotTab}">
                                    ${sz}
                                  </button>
                                `;
                              }).join('')}
                            </div>
                          </div>
                        </div>

                        <!-- Click action button -->
                        <button type="button" class="bundle-card-select-action ${isSelected ? 'is-active' : ''}">
                          ${isSelected ? `✓ Choisi (${currentActiveSlot.size})` : `Sélectionner (${currentActiveSlot.size})`}
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Size Selection for Active Slot -->
              <div class="bundle-active-size-section">
                <div class="bundle-size-header-row">
                  <div style="font-size: 0.86rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
                    3. Taille pour le T-Shirt #${this.activeSlotTab} : <strong style="font-size: 1.05rem; color: var(--color-dark);">${currentActiveSlot.size}</strong>
                  </div>
                  <button type="button" style="text-decoration: underline; font-size: 0.78rem; text-transform: uppercase; font-weight: 600;" onclick="window.SizeGuideModalComponent.open()">
                    📐 Guide des tailles
                  </button>
                </div>

                <div class="bundle-active-size-grid">
                  ${availableSizes.map(sz => `
                    <button type="button" 
                            class="bundle-active-size-btn ${sz === currentActiveSlot.size ? 'active' : ''}"
                            onclick="window.ProductPageController.setBundleSlotSize(${this.activeSlotTab}, '${sz}')">
                      ${sz}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Navigation to Next Slot / Cart -->
              <div class="bundle-slot-nav-footer">
                ${this.activeSlotTab < slotsCount ? `
                  <button type="button" class="btn btn-primary" style="padding: 12px 24px; font-size: 0.92rem;" onclick="window.ProductPageController.selectSlotTab(${this.activeSlotTab + 1})">
                    Passer au T-Shirt #${this.activeSlotTab + 1} →
                  </button>
                ` : `
                  <button type="button" class="btn btn-primary pdp-add-btn" style="padding: 12px 28px; font-size: 0.95rem; font-weight: 700;" onclick="window.ProductPageController.addBundleToCart(false)">
                    ⚡ Valider et Ajouter le Pack au Panier (${StoreUtils.formatMoney(price)})
                  </button>
                `}
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary);">
                  ${totalSelectedCount === slotsCount ? `✓ Vos ${slotsCount} t-shirts sont configurés !` : `${totalSelectedCount} sur ${slotsCount} t-shirts choisis`}
                </span>
              </div>

            </div>

            <!-- Full-Width Pack Order Checkout Card -->
            <div class="bundle-purchase-card bundle-checkout-summary-bar">
              <div class="bundle-purchase-row">
                <div>
                  <div class="bundle-purchase-label">RÉCAPITULATIF DU PACK (${slotsCount} PIÈCES SUR-MESURE)</div>
                  <div class="bundle-purchase-price">${StoreUtils.formatMoney(price)} ${comparePrice ? `<span class="bundle-purchase-compare">${StoreUtils.formatMoney(comparePrice)}</span>` : ''}</div>
                </div>
                <div style="text-align: right;">
                  ${savings > 0 ? `<span class="badge badge-sale" style="font-size: 0.82rem; padding: 4px 10px;">ÉCONOMIE ${savings} MAD (-${savingsPct}%)</span>` : ''}
                  <div style="font-size: 0.76rem; color: var(--color-success); font-weight: 700; margin-top: 4px;">🚚 LIVRAISON EXPRESS OFFERTE</div>
                </div>
              </div>

              <div class="bundle-checkout-actions-row">
                <button type="button" class="btn btn-primary pdp-add-btn bundle-main-add-btn" onclick="window.ProductPageController.addBundleToCart(false)">
                  ⚡ AJOUTER MON PACK AU PANIER • ${StoreUtils.formatMoney(price)}
                </button>
                <button type="button" class="btn pdp-buy-now-btn bundle-main-buy-btn" onclick="window.ProductPageController.addBundleToCart(true)">
                  COMMANDER MAINTENANT (CASH ON DELIVERY)
                </button>
              </div>

              <div class="bundle-trust-bullets-grid">
                <div>🚚 <strong>Livraison Express 24/48h Offerte</strong> partout au Maroc</div>
                <div>💵 <strong>Paiement en espèces à la livraison</strong> après vérification</div>
                <div>🔄 <strong>Échanges de taille gratuits</strong> sous 7 jours</div>
                <div>📦 <strong>Coffret collector rigide</strong> signature Atelier inclus</div>
              </div>
            </div>

            <!-- Detailed Specifications & Morocco Shipping Accordions -->
            <div class="pdp-accordions" style="margin-top: 24px;">
              <div class="accordion-item open">
                <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                  <span>Détails & Avantages du Pack</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                  <p style="margin-bottom: 12px;">${p.description || "Pack personnalisable exclusif composé de t-shirts haut de gamme confectionnés dans nos ateliers."}</p>
                  <ul style="list-style: disc; padding-left: 20px; font-size: 0.88rem; color: var(--color-text-secondary); display: flex; flex-direction: column; gap: 6px;">
                    ${(p.details && p.details.length) ? p.details.map(d => `<li>${d}</li>`).join('') : `
                      <li>Sélection de ${slotsCount} t-shirts de qualité supérieure</li>
                      <li>Grammage lourd 240 à 260 GSM en 100% Coton peigné</li>
                      <li>Coffret premium signature Atelier inclus</li>
                    `}
                  </ul>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                  <span>Matières & Confection d'Exception (100% Coton Peigné)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                  <p style="margin-bottom: 8px;"><strong>Matières :</strong> 100% Coton peigné haute densité de 240 à 260 GSM (Grammes par Mètre Carré).</p>
                  <p style="margin-bottom: 8px;"><strong>Col indéformable :</strong> Col rond doublé 1x1 avec surpiqûre renforcée anti-gondolage.</p>
                  <p style="margin-bottom: 8px;"><strong>Entretien :</strong> Lavage machine à 30°C sur l'envers. Séchage à plat vivement conseillé.</p>
                  <p><strong>Origine :</strong> Confectionné artisanalement dans nos ateliers partenaires à Casablanca.</p>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                  <span>Livraison Express 24/48h & Retours Partout au Maroc</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                  <p style="margin-bottom: 8px;">• <strong>Frais de port :</strong> <strong style="color: var(--color-success);">OFFERTS</strong> sur les packs.</p>
                  <p style="margin-bottom: 6px;">• <strong>Casablanca, Mohammedia, Rabat, Salé :</strong> 24h ouvrables.</p>
                  <p style="margin-bottom: 6px;">• <strong>Marrakech, Tanger, Fès, Meknès, Agadir, etc. :</strong> 24 à 48h ouvrables.</p>
                  <p>• <strong>Paiement :</strong> Espèces au livreur après vérification du colis.</p>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                  <span>Avis Clients sur les Packs (${p.reviewCount || 48})</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                  <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
                      <div style="display: flex; justify-content: space-between; font-size: 0.84rem; margin-bottom: 4px;">
                        <strong>Othmane M. (Casablanca)</strong>
                        <span style="color: #F59E0B;">★★★★★</span>
                      </div>
                      <p style="font-size: 0.84rem;">Prendre les modèles en pack personnalisé est un super deal ! Qualité tissu 10/10 et livraison rapide.</p>
                    </div>
                    <div>
                      <div style="display: flex; justify-content: space-between; font-size: 0.84rem; margin-bottom: 4px;">
                        <strong>Hamza T. (Marrakech)</strong>
                        <span style="color: #F59E0B;">★★★★★</span>
                      </div>
                      <p style="font-size: 0.84rem;">Le coffret est magnifique et la livraison en 24h chrono. Rien à envier aux marques internationales haut de gamme.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  selectSlotTab(slotNumber) {
    this.activeSlotTab = slotNumber;
    this.renderBundleCustomizer();
    if (window.innerWidth <= 1100) {
      const panel = document.querySelector('.bundle-active-slot-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  },

  setFilterModel(modelId) {
    this.activeFilterModel = modelId;
    this.renderBundleCustomizer();
  },

  selectTshirtForActiveSlot(productId, colorCode) {
    const slot = this.bundleSlots.find(s => s.slot === this.activeSlotTab);
    if (!slot) return;

    slot.productId = productId;
    slot.colorCode = colorCode;

    // Check if next slot is empty to guide the user seamlessly
    const nextEmptySlot = this.bundleSlots.find(s => s.slot > this.activeSlotTab && (!s.productId || !s.colorCode));
    if (nextEmptySlot) {
      this.activeSlotTab = nextEmptySlot.slot;
    }

    this.renderBundleCustomizer();
  },

  selectTshirtAndSize(productId, colorCode, size) {
    const slot = this.bundleSlots.find(s => s.slot === this.activeSlotTab);
    if (!slot) return;

    slot.productId = productId;
    slot.colorCode = colorCode;
    slot.size = size;

    const variant = this.allTshirtVariants.find(t => t.productId === productId && t.colorCode === colorCode);
    const variantName = variant ? `${variant.modelShort} (${variant.colorName})` : "T-Shirt";

    if (window.StoreUtils && window.StoreUtils.showToast) {
      window.StoreUtils.showToast(`✓ Slot #${slot.slot} : ${variantName} sélectionné en taille ${size}`, "success");
    }

    // Advance to next empty slot seamlessly
    const nextEmptySlot = this.bundleSlots.find(s => s.slot > this.activeSlotTab && (!s.productId || !s.colorCode));
    if (nextEmptySlot) {
      this.activeSlotTab = nextEmptySlot.slot;
    }

    this.renderBundleCustomizer();
  },

  clearSlot(slotNumber) {
    const slot = this.bundleSlots.find(s => s.slot === slotNumber);
    if (!slot) return;
    slot.productId = null;
    slot.colorCode = null;
    this.renderBundleCustomizer();
  },

  setBundleSlotSize(slotNumber, size) {
    const slot = this.bundleSlots.find(s => s.slot === slotNumber);
    if (!slot) return;
    slot.size = size;
    this.renderBundleCustomizer();
  },

  setBundleViewMode(mode) {
    this.bundleViewMode = mode;
    this.renderBundleCustomizer();
  },

  /* ==========================================================================
     QUICK LOOK MODAL FOR BUNDLE T-SHIRTS
     ========================================================================== */

  openQuickLook(productId, colorCode) {
    const variant = this.allTshirtVariants.find(t => t.productId === productId && t.colorCode === colorCode)
                 || this.DEFAULT_TSHIRT_VARIANTS.find(t => t.productId === productId && t.colorCode === colorCode)
                 || this.allTshirtVariants.find(t => t.productId === productId)
                 || this.allTshirtVariants[0];
    if (!variant) return;

    const currentSlot = this.bundleSlots.find(s => s.slot === this.activeSlotTab) || this.bundleSlots[0];
    const initialSize = currentSlot ? (currentSlot.size || 'M') : 'M';

    this.quickLookState = {
      isOpen: true,
      productId: productId,
      colorCode: colorCode,
      variant: variant,
      activeImage: variant.image,
      selectedSize: initialSize,
      targetSlot: this.activeSlotTab
    };

    this.renderQuickLookModal();
  },

  closeQuickLook() {
    this.quickLookState.isOpen = false;
    const modalRoot = document.getElementById('bundle-quicklook-modal-root');
    if (modalRoot) {
      modalRoot.classList.remove('open');
      modalRoot.style.display = 'none';
    }
  },

  setQuickLookImage(imgSrc) {
    this.quickLookState.activeImage = imgSrc;
    const bigImg = document.getElementById('quicklook-big-img');
    if (bigImg) {
      bigImg.src = imgSrc;
    }
    const thumbs = document.querySelectorAll('.quicklook-thumb-btn');
    thumbs.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-img') === imgSrc);
    });
  },

  setQuickLookSize(sz) {
    this.quickLookState.selectedSize = sz;
    const btns = document.querySelectorAll('.quicklook-size-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-size') === sz);
    });
    const cta = document.getElementById('quicklook-apply-cta');
    if (cta) {
      cta.innerHTML = `⚡ CHOISIR POUR LE T-SHIRT #${this.quickLookState.targetSlot} (TAILLE ${sz})`;
    }
  },

  setQuickLookTargetSlot(slotNum) {
    this.quickLookState.targetSlot = slotNum;
    const slotBtns = document.querySelectorAll('.quicklook-slot-choice-btn');
    slotBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-slot')) === slotNum);
    });
    const cta = document.getElementById('quicklook-apply-cta');
    if (cta) {
      cta.innerHTML = `⚡ CHOISIR POUR LE T-SHIRT #${slotNum} (TAILLE ${this.quickLookState.selectedSize})`;
    }
  },

  applyQuickLookChoice() {
    const { productId, colorCode, selectedSize, targetSlot, variant } = this.quickLookState;
    if (!productId || !colorCode) return;

    const slot = this.bundleSlots.find(s => s.slot === targetSlot);
    if (slot) {
      slot.productId = productId;
      slot.colorCode = colorCode;
      slot.size = selectedSize;
    }

    if (window.StoreUtils && window.StoreUtils.showToast) {
      window.StoreUtils.showToast(`✓ T-Shirt #${targetSlot} configuré : ${variant.modelShort} (${variant.colorName} - Taille ${selectedSize})`, "success");
    }

    // Advance to next empty slot
    const nextEmptySlot = this.bundleSlots.find(s => s.slot > targetSlot && (!s.productId || !s.colorCode));
    if (nextEmptySlot) {
      this.activeSlotTab = nextEmptySlot.slot;
    } else {
      this.activeSlotTab = targetSlot;
    }

    this.closeQuickLook();
    this.renderBundleCustomizer();
  },

  renderQuickLookModal() {
    let modalRoot = document.getElementById('bundle-quicklook-modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'bundle-quicklook-modal-root';
      modalRoot.className = 'modal-overlay';
      document.body.appendChild(modalRoot);
    }

    const { variant, activeImage, selectedSize, targetSlot } = this.quickLookState;
    if (!variant) return;

    const p = this.product || {};
    const availableSizes = (p.sizes && p.sizes.length > 0) ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL'];

    modalRoot.innerHTML = `
      <div class="modal-window quicklook-modal-window" onclick="event.stopPropagation()">
        <button type="button" class="quicklook-close-btn" onclick="window.ProductPageController.closeQuickLook()" aria-label="Fermer l'aperçu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div class="quicklook-grid">
          
          <!-- Gallery Left -->
          <div class="quicklook-gallery">
            <div class="quicklook-big-img-wrap">
              <img id="quicklook-big-img" src="${activeImage}" alt="${variant.modelName} ${variant.colorName}" class="quicklook-big-img">
              <div class="quicklook-badge-top">${variant.gsm}</div>
            </div>
            
            <div class="quicklook-thumbs-row">
              <button type="button" class="quicklook-thumb-btn ${activeImage === variant.image ? 'active' : ''}" data-img="${variant.image}" onclick="window.ProductPageController.setQuickLookImage('${variant.image}')">
                <img src="${variant.image}" alt="Face">
                <span>Face</span>
              </button>
              ${variant.backImage ? `
                <button type="button" class="quicklook-thumb-btn ${activeImage === variant.backImage ? 'active' : ''}" data-img="${variant.backImage}" onclick="window.ProductPageController.setQuickLookImage('${variant.backImage}')">
                  <img src="${variant.backImage}" alt="Dos">
                  <span>Dos</span>
                </button>
              ` : ''}
            </div>

            <!-- Small reshaped link under Face - Dos -->
            <a href="product.html?id=${variant.productId}&color=${variant.colorCode}" 
               target="_blank" 
               class="quicklook-gallery-pdp-link" 
               title="Ouvrir la page individuelle de ce t-shirt">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              <span>Voir la page produit dédiée ↗</span>
            </a>
          </div>

          <!-- Product Details Right -->
          <div class="quicklook-details">
            <div class="quicklook-tag">COUPE & MATIÈRE ATELIER</div>
            <h2 class="quicklook-title">${variant.modelName}</h2>
            
            <div class="quicklook-color-banner">
              <span class="bundle-preview-swatch-dot" style="background-color: ${variant.colorHex}; width: 14px; height: 14px;"></span>
              <span class="quicklook-color-name">Coloris : <strong>${variant.colorName}</strong></span>
              <span class="badge" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border); font-size: 0.72rem; padding: 2px 8px;">
                ${variant.fit}
              </span>
            </div>

            <p class="quicklook-desc">
              ${variant.description || "Confectionné artisanalement dans nos ateliers en 100% coton peigné haute densité. Col rond doublé indéformable et coupe soignée."}
            </p>

            <div class="quicklook-specs-list">
              <div>🧶 <strong>Matière :</strong> 100% Coton Peigné Extra-Doux (${variant.gsm})</div>
              <div>✂️ <strong>Coupe :</strong> ${variant.fit}</div>
              <div>🚚 <strong>Livraison :</strong> Offerte partout au Maroc sous 24/48h</div>
            </div>

            <!-- Target Slot Switcher -->
            <div class="quicklook-target-slot-section">
              <div class="quicklook-section-title">1. Affecter au slot :</div>
              <div class="quicklook-slots-row">
                ${this.bundleSlots.map(s => `
                  <button type="button" 
                          class="quicklook-slot-choice-btn ${targetSlot === s.slot ? 'active' : ''}" 
                          data-slot="${s.slot}" 
                          onclick="window.ProductPageController.setQuickLookTargetSlot(${s.slot})">
                    T-Shirt #${s.slot}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Size Selection -->
            <div class="quicklook-size-section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div class="quicklook-section-title">2. Choisir la taille :</div>
                <button type="button" style="text-decoration: underline; font-size: 0.76rem; font-weight: 600;" onclick="window.SizeGuideModalComponent.open()">
                  📐 Guide des tailles
                </button>
              </div>
              <div class="quicklook-sizes-row">
                ${availableSizes.map(sz => `
                  <button type="button" 
                          class="quicklook-size-btn ${sz === selectedSize ? 'active' : ''}" 
                          data-size="${sz}" 
                          onclick="window.ProductPageController.setQuickLookSize('${sz}')">
                    ${sz}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- CTA -->
            <button type="button" id="quicklook-apply-cta" class="btn btn-primary btn-full quicklook-cta-btn" onclick="window.ProductPageController.applyQuickLookChoice()">
              ⚡ CHOISIR POUR LE T-SHIRT #${targetSlot} (TAILLE ${selectedSize})
            </button>

          </div>

        </div>
      </div>
    `;

    modalRoot.style.display = 'flex';
    modalRoot.onclick = () => this.closeQuickLook();

    // Trigger open animation
    requestAnimationFrame(() => {
      modalRoot.classList.add('open');
    });
  },

  addBundleToCart(isBuyNow = false) {
    const slotsCount = (this.bundleSlots && this.bundleSlots.length) || 3;
    const unselectedSlot = this.bundleSlots.find(s => !s.productId || !s.colorCode);
    if (unselectedSlot) {
      StoreUtils.showToast(`Veuillez choisir le T-Shirt #${unselectedSlot.slot} pour compléter votre ${this.product.name}.`, "warning");
      this.selectSlotTab(unselectedSlot.slot);
      return;
    }

    const bundleItems = this.bundleSlots.map(slot => {
      const variant = this.allTshirtVariants.find(t => t.productId === slot.productId && t.colorCode === slot.colorCode)
                   || this.allTshirtVariants.find(t => t.productId === slot.productId)
                   || this.allTshirtVariants[0];

      return {
        slot: slot.slot,
        productId: variant.productId,
        productName: variant.modelName,
        colorCode: variant.colorCode,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        size: slot.size,
        sku: `${variant.sku}-${slot.size}`,
        image: variant.image
      };
    });

    const success = window.StoreCart.addBundleItem({
      productId: this.product.id,
      bundleName: this.product.name,
      price: this.product.price || 599,
      compareAtPrice: this.product.compareAtPrice || (slotsCount * 260),
      image: (this.product.colors && this.product.colors[0] ? this.product.colors[0].image : 'assets/images/products/t-shirts/tshirt-Pack-3.jpg'),
      bundleItems: bundleItems,
      quantity: 1,
      openDrawer: !isBuyNow
    });

    if (success && isBuyNow) {
      window.location.href = "checkout.html";
    }
  },

  switchToSiblingProduct(targetProductId, targetColorCode) {
    if (this.product && this.product.id === targetProductId && this.selectedColor === targetColorCode) {
      return;
    }

    const target = (window.STORE_PRODUCTS || []).find(p => p.id === targetProductId);
    if (!target) return;

    this.product = target;
    this.selectedColor = targetColorCode || (target.colors && target.colors[0] ? target.colors[0].code : null);
    this.activeImageIndex = 0;

    if (this.product.sizes && !this.product.sizes.includes(this.selectedSize)) {
      this.selectedSize = this.product.sizes[0];
    }

    StoreUtils.updateUrlParam("id", target.id);
    if (this.selectedColor) {
      StoreUtils.updateUrlParam("color", this.selectedColor);
    } else {
      StoreUtils.updateUrlParam("color", null);
    }

    document.title = `${this.product.name} | ${window.STORE_CONFIG.brandName}`;
    this.render();
    this.renderRelatedProducts();
  },

  setColor(colorCode) {
    this.selectedColor = colorCode;
    this.activeImageIndex = 0;
    StoreUtils.updateUrlParam("color", colorCode);
    this.render();
  },

  setSize(size) {
    this.selectedSize = size;
    this.render();
  },

  setImageIndex(idx) {
    this.activeImageIndex = idx;
    this.render();
  },

  updateQty(delta) {
    const currentVariant = this.product.variants.find(v => v.color === this.selectedColor && v.size === this.selectedSize);
    const maxStock = (currentVariant && currentVariant.stock) || 10;
    const newQty = this.selectedQuantity + delta;

    if (newQty >= 1 && newQty <= maxStock) {
      this.selectedQuantity = newQty;
      const input = document.querySelector(".pdp-qty-input");
      if (input) input.value = this.selectedQuantity;
    }
  },

  addToCart(isBuyNow = false) {
    if (this.product && this.product.isBundle) {
      this.addBundleToCart(isBuyNow);
      return;
    }

    const success = window.StoreCart.addItem({
      productId: this.product.id,
      colorCode: this.selectedColor,
      size: this.selectedSize,
      quantity: this.selectedQuantity,
      openDrawer: !isBuyNow
    });

    if (success && isBuyNow) {
      window.location.href = "checkout.html";
    }
  },

  bindEvents() {
    // Accordion headers
  },

  bindImageZoom() {
    const viewport = document.getElementById("pdp-main-viewport");
    const img = document.getElementById("pdp-zoom-img");
    if (!viewport || !img) return;

    viewport.addEventListener("mousemove", (e) => {
      const rect = viewport.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = "scale(1.5)";
    });

    viewport.addEventListener("mouseleave", () => {
      img.style.transformOrigin = "center center";
      img.style.transform = "scale(1)";
    });
  },

  renderRelatedProducts() {
    const grid = document.getElementById("pdp-related-grid");
    if (!grid) return;

    const related = (window.STORE_PRODUCTS || [])
      .filter(p => p.id !== this.product.id && !p.isBundle && p.id !== 'pack-trio-tshirts')
      .slice(0, 4);
    grid.innerHTML = related.map(p => window.ProductCardComponent.render(p)).join('');
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.ProductPageController.init();
});

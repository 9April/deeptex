/**
 * ATELIER Store Data Management Engine
 * Handles bi-directional synchronization between Admin Dashboard and Storefront.
 * Persists customized categories, colors, inventory stock, and products in localStorage.
 */

window.StoreDataManager = {
  KEYS: {
    PRODUCTS: "atelier_products_v1",
    CATEGORIES: "atelier_categories_v1",
    COLORS: "atelier_colors_v1",
    LAST_UPDATED: "atelier_catalog_updated_at_v1"
  },

  // Default color palette presets
  DEFAULT_COLORS: [
      {
          "name": "Noir Onyx",
          "code": "black",
          "hex": "#121212",
          "image": "assets/images/products/t-shirts/essential-oversized-tee/front-main.png"
      },
      {
          "name": "Bleu Marine",
          "code": "navy",
          "hex": "#1D2E4E",
          "image": "assets/images/products/t-shirts/heavyweight-boxy-tee-300/front-main.png"
      },
      {
          "name": "Blanc Craie",
          "code": "white",
          "hex": "#F4F4F0",
          "image": "assets/images/products/t-shirts/oversized-tee-big-white/front-main.png"
      },
      {
          "name": "Bleu Foncé",
          "code": "dark-blue",
          "hex": "#192231",
          "image": "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/front-main.png"
      },
      {
          "name": "Indigo",
          "code": "indigo",
          "hex": "#EADACB",
          "image": "assets/images/products/t-shirts/essential-tee-indigo/front-main.png"
      },
      {
          "name": "Beige Sable",
          "code": "beige",
          "hex": "#D9CEB2",
          "image": "assets/images/products/t-shirts/relaxed-earth-tone-tee/front-main.png"
      },
      {
          "name": "Gris Anthracite",
          "code": "charcoal",
          "hex": "#2B2D2F",
          "image": "assets/images/products/t-shirts/vintage-washed-charcoal-tee/front-main.png"
      },
      {
          "name": "Vert Olive",
          "code": "olive",
          "hex": "#484E3A",
          "image": "assets/images/products/tshirt-olive-front.jpg"
      },
      {
          "name": "Terre Cuite",
          "code": "terracotta",
          "hex": "#9E4733",
          "image": "assets/images/products/tshirt-terracotta-front.jpg"
      },
      {
          "name": "Bleu Royal",
          "code": "blue-m",
          "hex": "#254E70",
          "image": "assets/images/products/t-shirts/essential-tee-blue-m/front-main.png"
      },
      {
          "name": "Baby Pink",
          "code": "rose",
          "hex": "#F6D9DC",
          "image": ""
      },
      {
          "name": "Rose Poudré",
          "code": "pink",
          "hex": "#E59E9E",
          "image": "assets/images/products/tshirt-pink-front.png"
      },
      {
          "name": "Pack Trio Sur-Mesure",
          "code": "bundle",
          "hex": "#111111",
          "image": "assets/images/products/t-shirts/tshirt-Pack-3.jpg"
      }
  ],

  // Available image mockup library presets for quick selection
  IMAGE_PRESETS: [
    { label: "Inverted Label - Bleu Nuit Face (Mockup)", url: "assets/images/products/t-shirts/lv front empty/lv empty front.png", color: "navy" },
    { label: "Inverted Label - Bleu Nuit Dos", url: "assets/images/products/t-shirts/lv front empty/lv empty back.png", color: "navy" },
    { label: "Inverted Label - Gris Face (Mockup)", url: "assets/images/products/t-shirts/lv front empty/lv empty front grey.png", color: "charcoal" },
    { label: "Inverted Label - Gris Dos", url: "assets/images/products/t-shirts/lv front empty/lv empty back grey.png", color: "charcoal" },
    { label: "Inverted Label - Rose Face (Mockup)", url: "assets/images/products/t-shirts/lv front empty/lv empty front pink.png", color: "pink" },
    { label: "Inverted Label - Rose Dos", url: "assets/images/products/t-shirts/lv front empty/lv empty back pink.png", color: "pink" },
    { label: "Inverted Label - Noir Face (Mockup)", url: "assets/images/products/t-shirts/lv front empty/lv empty front black.png", color: "black" },
    { label: "Inverted Label - Noir Dos", url: "assets/images/products/t-shirts/lv front empty/lv empty back black.png", color: "black" },
    { label: "Crewneck - Beige Sable Face (Mockup)", url: "assets/images/products/t-shirts/Hoodie zipless/hoodie zipless front.png", color: "beig" },
    { label: "Crewneck - Beige Sable Dos", url: "assets/images/products/t-shirts/Hoodie zipless/hoodie zipless back.png", color: "beig" },
    { label: "Crewneck - Bleu Roi Face (Mockup)", url: "assets/images/products/t-shirts/Hoodie zipless/hoodie zipless front Blue roi.png", color: "royal-blue" },
    { label: "Crewneck - Bleu Roi Dos", url: "assets/images/products/t-shirts/Hoodie zipless/hoodie zipless back Blue roi.png", color: "royal-blue" },
    { label: "Crewneck - Vert Armée Face (Mockup)", url: "assets/images/products/t-shirts/Hoodie zipless/hoodie zipless front green army.png", color: "green-army" },
    { label: "Crewneck - Vert Armée Dos", url: "assets/images/products/t-shirts/Hoodie zipless/hoodie zipless back green army.png", color: "green-army" },
    { label: "Zip Hoodie - Noir Face (Mockup)", url: "assets/images/products/t-shirts/Hoodie zip/Hoodie Over Front black.png", color: "black" },
    { label: "Zip Hoodie - Noir Dos", url: "assets/images/products/t-shirts/Hoodie zip/Hoodie Over back black.png", color: "black" },
    { label: "Zip Hoodie - Beige Sable Face (Mockup)", url: "assets/images/products/t-shirts/Hoodie zip/Hoodie Over Front beig.png", color: "beig" },
    { label: "Zip Hoodie - Beige Sable Dos", url: "assets/images/products/t-shirts/Hoodie zip/Hoodie Over back beig.png", color: "beig" },
    { label: "Muscle Tee Over - Noir Face (Mockup)", url: "assets/images/products/t-shirts/Tank top over/tank top over front black.png", color: "black" },
    { label: "Muscle Tee Over - Noir Dos", url: "assets/images/products/t-shirts/Tank top over/tank top over back black.png", color: "black" },
    { label: "Muscle Tee Over - Blanc Craie Face (Mockup)", url: "assets/images/products/t-shirts/Tank top over/tank top over front white.png", color: "white" },
    { label: "Muscle Tee Over - Blanc Craie Dos", url: "assets/images/products/t-shirts/Tank top over/tank top over back white.png", color: "white" },
    { label: "Tank Top Relaxed - Vert Militaire Face (Mockup)", url: "assets/images/products/t-shirts/Tank top/Tank top front Green army.jpeg", color: "green-army" },
    { label: "Tank Top Relaxed - Vert Militaire Dos", url: "assets/images/products/t-shirts/Tank top/Tank top back Green army.jpeg", color: "green-army" },
    { label: "Tank Top Relaxed - Beige Sable Face (Mockup)", url: "assets/images/products/t-shirts/Tank top/Tank top front beig.jpeg", color: "beig" },
    { label: "Tank Top Relaxed - Beige Sable Dos", url: "assets/images/products/t-shirts/Tank top/Tank top back beig.jpeg", color: "beig" },
    { label: "Tank Top Relaxed - Gris Chiné Face (Mockup)", url: "assets/images/products/t-shirts/Tank top/Tank top front Gris.png", color: "gris" },
    { label: "Tank Top Relaxed - Gris Chiné Dos", url: "assets/images/products/t-shirts/Tank top/Tank top back Gris.png", color: "gris" },
    { label: "Tank Top Relaxed - Blanc Crème Face (Mockup)", url: "assets/images/products/t-shirts/Tank top/Tank top front white creme.jpeg", color: "white-creme" },
    { label: "Tank Top Relaxed - Blanc Crème Dos", url: "assets/images/products/t-shirts/Tank top/Tank top back white creme.jpeg", color: "white-creme" },
    { label: "Tank Top Relaxed - Noir Face (Mockup)", url: "assets/images/products/t-shirts/Tank top/Tank top front black.jpeg", color: "black" },
    { label: "Tank Top Relaxed - Noir Dos", url: "assets/images/products/t-shirts/Tank top/Tank top back black.jpeg", color: "black" },
    { label: "T-Shirt Rose - Face (Mockup par défaut)", url: "assets/images/products/tshirt-pink-front.png", color: "pink" },
    { label: "Essential Big - Noir Face", url: "assets/images/products/t-shirts/essential-oversized-tee/front-main.png", color: "black" },
    { label: "Essential Big - Noir Dos (Hover)", url: "assets/images/products/t-shirts/essential-oversized-tee/back-hover.png", color: "black" },
    { label: "Heavyweight 300 - Bleu Marine Face", url: "assets/images/products/t-shirts/heavyweight-boxy-tee-300/front-main.png", color: "navy" },
    { label: "Heavyweight 300 - Bleu Marine Dos (Hover)", url: "assets/images/products/t-shirts/heavyweight-boxy-tee-300/back-hover.png", color: "navy" },
    { label: "Oversized Big - Blanc Craie Face", url: "assets/images/products/t-shirts/oversized-tee-big-white/front-main.png", color: "white" },
    { label: "Oversized Big - Blanc Craie Dos (Hover)", url: "assets/images/products/t-shirts/oversized-tee-big-white/back-hover.png", color: "white" },
    { label: "T-Shirt Blanc - Face (Mockup)", url: "assets/images/products/tshirt-white-front.jpg", color: "white" },
    { label: "T-Shirt Blanc - Dos (Mockup)", url: "assets/images/products/tshirt-white-back.jpg", color: "white" },
    { label: "T-Shirt Noir - Face (Mockup)", url: "assets/images/products/tshirt-black-front.jpg", color: "black" },
    { label: "T-Shirt Noir - Dos (Mockup)", url: "assets/images/products/tshirt-black-back.jpg", color: "black" },
    { label: "T-Shirt Charcoal - Face (Mockup)", url: "assets/images/products/tshirt-charcoal-front.jpg", color: "charcoal" },
    { label: "T-Shirt Vert Olive - Face (Mockup)", url: "assets/images/products/tshirt-olive-front.jpg", color: "olive" },
    { label: "T-Shirt Terre Cuite - Face (Mockup)", url: "assets/images/products/tshirt-terracotta-front.jpg", color: "terracotta" },
    { label: "Vintage Graphic - Noir Face", url: "assets/images/products/t-shirts/vintage-washed-charcoal-tee/front-main.png", color: "black" },
    { label: "Vintage Graphic - Noir Dos (Hover)", url: "assets/images/products/t-shirts/vintage-washed-charcoal-tee/back-hover.png", color: "black" },
    { label: "Graphic Colored - Bleu Foncé Face", url: "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/front-main.png", color: "dark-blue" },
    { label: "Graphic Colored - Bleu Foncé Dos (Hover)", url: "assets/images/products/t-shirts/graphic-tee-colored-blue-dark/back-hover.png", color: "dark-blue" },
    { label: "Relaxed Earth - Beige Sable Face", url: "assets/images/products/t-shirts/relaxed-earth-tone-tee/front-main.png", color: "beige" },
    { label: "Relaxed Earth - Beige Sable Dos (Hover)", url: "assets/images/products/t-shirts/relaxed-earth-tone-tee/back-hover.png", color: "beige" },
    { label: "Minimal Logo - Noir Onyx Face", url: "assets/images/products/t-shirts/minimal-embroidered-logo-tee/front-main.png", color: "black" },
    { label: "Minimal Logo - Noir Onyx Dos (Hover)", url: "assets/images/products/t-shirts/minimal-embroidered-logo-tee/back-hover.png", color: "black" },
    { label: "Minimal Essential - Bleu Royal Face", url: "assets/images/products/t-shirts/essential-tee-blue-m/front-main.png", color: "navy" },
    { label: "Minimal Essential - Bleu Royal Dos (Hover)", url: "assets/images/products/t-shirts/essential-tee-blue-m/back-hover.png", color: "navy" },
    { label: "Minimal Essential - Indigo Face", url: "assets/images/products/t-shirts/essential-tee-indigo/front-main.png", color: "indigo" },
    { label: "Minimal Essential - Indigo Dos (Hover)", url: "assets/images/products/t-shirts/essential-tee-indigo/back-hover.png", color: "indigo" },
    { label: "Studio Drop - Blanc Craie Face", url: "assets/images/products/t-shirts/atelier-studio-drop-tee/front-main.png", color: "white" },
    { label: "Studio Drop - Blanc Craie Dos (Hover)", url: "assets/images/products/t-shirts/atelier-studio-drop-tee/back-hover.png", color: "white" },
    { label: "Catégorie - T-Shirts", url: "assets/images/categories/category-tshirts.jpg", color: "default" },
    { label: "Catégorie - Accessoires", url: "assets/images/categories/category-accessories.jpeg", color: "default" },
    { label: "Catégorie - Hoodies", url: "assets/images/categories/category-hoodies.jpg", color: "default" },
    { label: "Catégorie - Pantalons & Cargos", url: "assets/images/categories/category-pants.jpg", color: "default" },
    { label: "Heritage - Gris Chiné Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/grey-front.png", color: "Gris" },
    { label: "Heritage - Gris Chiné Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/grey-back.png", color: "Gris" },
    { label: "Heritage - Brun Taupe Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Brown _ Taupe.png", color: "taupe" },
    { label: "Heritage - Brun Taupe Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Brown _ Taupe b.png", color: "taupe" },
    { label: "Heritage - Crème Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Cream.png", color: "cream" },
    { label: "Heritage - Crème Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Cream b.png", color: "cream" },
    { label: "Heritage - Rose Poudré Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Dusty Rose _ Pink.png", color: "dusty-rose" },
    { label: "Heritage - Rose Poudré Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Dusty Rose _ Pink b.png", color: "dusty-rose" },
    { label: "Heritage - Bleu Ciel Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Light Blue.png", color: "light-blue" },
    { label: "Heritage - Bleu Ciel Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Light Blue b.png", color: "light-blue" },
    { label: "Heritage - Gris Moyen Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Medium Grey.png", color: "medium-grey" },
    { label: "Heritage - Gris Moyen Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Medium Grey b.png", color: "medium-grey" },
    { label: "Heritage - Bleu Intense Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Strong Blue.png", color: "strong-blue" },
    { label: "Heritage - Bleu Intense Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Strong Blue b.png", color: "strong-blue" },
    { label: "Heritage - Bleu Canard Face", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Teal _ Blue-Green.png", color: "teal-canard" },
    { label: "Heritage - Bleu Canard Dos", url: "assets/images/products/t-shirts/heritage-regular-tshirt-heather-grey/Variantes/Teal _ Blue-Green b.png", color: "teal-canard" },
    { label: "Rodeo Bear - Polo Beige Face", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/polo-front.png", color: "beig" },
    { label: "Rodeo Bear - Polo Beige Dos (Hover)", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/polo-bakc.png", color: "beig" },
    { label: "Rodeo Bear - Light Beige Face", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Light Beige Front.png", color: "light-beige" },
    { label: "Rodeo Bear - Light Beige Dos", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Light Beige Back.png", color: "light-beige" },
    { label: "Rodeo Bear - Olive Green Face", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Olive Green Front.png", color: "olive-green" },
    { label: "Rodeo Bear - Olive Green Dos", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Olive Green Back.png", color: "olive-green" },
    { label: "Rodeo Bear - Tan Face", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Tan Front.png", color: "tan" },
    { label: "Rodeo Bear - Tan Dos", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Tan Back.png", color: "tan" },
    { label: "Rodeo Bear - Teal Face", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Teal Front.png", color: "teal" },
    { label: "Rodeo Bear - Teal Dos", url: "assets/images/products/t-shirts/rodeo-bear-classic-fit-tee/Variantes/Teal Back.png", color: "teal" },
    { label: "Hero Banner", url: "assets/images/hero/hero-banner.jpg", color: "default" }
  ],

  /**
   * Initialize and synchronize global window store arrays
   */
  init() {
    this.syncGlobalStores();
  },

  syncGlobalStores() {
    window.STORE_PRODUCTS = this.getProducts();
    window.STORE_CATEGORIES = this.getCategories();
    window.STORE_COLORS = this.getColors();
  },

  /**
   * Sync complete catalog (products, categories, colors) to disk files
   */
  syncAllToDisk(deletedProductId = null) {
    if (typeof fetch !== 'function') return Promise.resolve({ success: false });
    const products = this.getProducts();
    const defaults = window.DEFAULT_STORE_PRODUCTS || [];
    const existingIds = new Set((products || []).map(p => p.id));
    defaults.forEach(d => {
      if (d && d.id && !existingIds.has(d.id) && d.id !== deletedProductId) {
        products.push(d);
        existingIds.add(d.id);
      }
    });

    const payload = {
      products: products,
      categories: this.getCategories(),
      colors: this.getColors(),
      deletedProductId: deletedProductId || undefined
    };
    return fetch('/api/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(data => {
        if (data && data.success) {
          console.log('[StoreDataManager] Full catalog synced to disk:', data.synced);
        }
        return data;
      })
      .catch(e => {
        console.warn('[StoreDataManager] Disk sync skipped:', e.message);
        return { success: false, error: e.message };
      });
  },

  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  getProducts() {
    try {
      const stored = localStorage.getItem(this.KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const DEPRECATED_IDS = new Set([
            "heavyweight-boxy-tee-300", 
            "oversized-tee-big-white", 
            "vintage-washed-charcoal-tee", 
            "graphic-tee-colored-blue-dark", 
            "essential-tee-rose",
            "essential-tee-indigo",
            "essential-tee-blue-m",
            "atelier-studio-drop-tee",
            "relaxed-earth-tone-tee",
            "classic-relaxed-tank-top"
          ]);
          const cleaned = parsed.filter(p => p && p.id && !DEPRECATED_IDS.has(p.id));
          
          const defaultList = window.DEFAULT_STORE_PRODUCTS || [];
          const finalProducts = [];
          const processedIds = new Set();

          // 1. Reconcile stored items with master defaults
          cleaned.forEach(item => {
            if (!item || !item.id) return;
            processedIds.add(item.id);

            const def = defaultList.find(d => d.id === item.id);
            if (!def) {
              finalProducts.push(item);
              return;
            }

            const merged = { ...def, ...item };
            
            // Merge collections (ensure default collections like packs-bundles are preserved)
            const defColls = Array.isArray(def.collections) ? def.collections : [];
            const itemColls = Array.isArray(item.collections) ? item.collections : [];
            const mergedColls = Array.from(new Set([...defColls, ...itemColls]));
            if (def.isBundle || def.id === 'pack-trio-tshirts') {
              if (!mergedColls.includes('packs-bundles')) {
                mergedColls.unshift('packs-bundles');
              }
            }
            merged.collections = mergedColls;

            // Merge colors
            const existingCodes = new Set((item.colors || []).map(c => c.code));
            const mergedColors = [...(item.colors || [])];
            (def.colors || []).forEach(defColor => {
              if (!existingCodes.has(defColor.code)) {
                mergedColors.push(defColor);
                existingCodes.add(defColor.code);
              }
            });
            merged.colors = mergedColors;

            // Merge images
            merged.images = { ...(def.images || {}), ...(item.images || {}) };
            (def.colors || []).forEach(defColor => {
              if (!merged.images[defColor.code] || merged.images[defColor.code].length === 0) {
                if (def.images && def.images[defColor.code]) {
                  merged.images[defColor.code] = def.images[defColor.code];
                }
              }
            });

            // Synchronize colorway primary image with gallery image 1
            mergedColors.forEach(c => {
              if (merged.images && merged.images[c.code] && merged.images[c.code].length > 0) {
                c.image = merged.images[c.code][0];
              }
            });

            // Merge variants
            const existingVarKeys = new Set((item.variants || []).map(v => `${v.color}-${v.size}`));
            const mergedVariants = [...(item.variants || [])];
            (def.variants || []).forEach(defVar => {
              const key = `${defVar.color}-${defVar.size}`;
              if (!existingVarKeys.has(key)) {
                mergedVariants.push(defVar);
                existingVarKeys.add(key);
              }
            });
            merged.variants = mergedVariants;

            finalProducts.push(merged);
          });

          // 2. Append any default products not yet in localStorage
          defaultList.forEach(def => {
            if (def && def.id && !processedIds.has(def.id) && !DEPRECATED_IDS.has(def.id)) {
              finalProducts.push(def);
              processedIds.add(def.id);
            }
          });

          localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(finalProducts));
          return finalProducts;
        }
      }
    } catch (e) {
      console.warn("Error reading stored products:", e);
    }
    return window.DEFAULT_STORE_PRODUCTS || window.STORE_PRODUCTS || [];
  },

  saveProducts(products, deletedProductId = null) {
    let savedLocal = false;
    
    // Safety guard: merge any missing defaults before saving unless explicitly deleted
    const defaults = window.DEFAULT_STORE_PRODUCTS || [];
    if (Array.isArray(products) && defaults.length > 0) {
      const existingIds = new Set(products.map(p => p.id));
      defaults.forEach(d => {
        if (d && d.id && !existingIds.has(d.id) && d.id !== deletedProductId) {
          products.push(d);
          existingIds.add(d.id);
        }
      });
    }

    try {
      localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(this.KEYS.LAST_UPDATED, new Date().toISOString());
      savedLocal = true;
    } catch (e) {
      console.warn("Storage quota exceeded, attempting to prune base64 before re-saving:", e.message);
      try {
        // Strip or prune excessively large dataUrls to fit into quota
        const sanitized = products.map(p => {
          const clone = { ...p };
          if (clone.images) {
            clone.images = { ...clone.images };
            Object.keys(clone.images).forEach(k => {
              if (Array.isArray(clone.images[k])) {
                clone.images[k] = clone.images[k].filter(img => !img.startsWith('data:image/') || img.length < 500000);
              }
            });
          }
          return clone;
        });
        localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(sanitized));
        localStorage.setItem(this.KEYS.LAST_UPDATED, new Date().toISOString());
        savedLocal = true;
      } catch (e2) {
        console.error("Critical: Could not save products to localStorage:", e2);
      }
    }

    window.STORE_PRODUCTS = products;
    this.recalculateCategoryCounts();

    // Trigger automatic background sync to disk regardless of localStorage status
    this.syncAllToDisk(deletedProductId);

    return savedLocal;
  },

  getProductById(id) {
    const products = this.getProducts();
    let product = products.find(p => p.id === id || p.slug === id);
    if (!product) {
      // Alias mapping for merged items
      const ALIASES = {
        "vintage-washed-charcoal-tee": "graphic-tee-colored",
        "graphic-tee-colored-blue-dark": "graphic-tee-colored",
        "essential-tee-rose": "graphic-tee-colored",
        "essential-tee-indigo": "graphic-tee-colored",
        "heavyweight-boxy-tee-300": "essential-oversized-tee",
        "oversized-tee-big-white": "essential-oversized-tee",
        "essential-tee-blue-m": "minimal-embroidered-logo-tee",
        "atelier-studio-drop-tee": "minimal-embroidered-logo-tee",
        "relaxed-earth-tone-tee": "minimal-embroidered-logo-tee"
      };
      if (ALIASES[id]) {
        product = products.find(p => p.id === ALIASES[id] || p.slug === ALIASES[id]);
      }
    }
    return product || null;
  },

  saveProduct(productData) {
    const products = this.getProducts();
    const defaults = window.DEFAULT_STORE_PRODUCTS || [];
    const existingIds = new Set(products.map(p => p.id));
    defaults.forEach(d => {
      if (d && d.id && !existingIds.has(d.id)) {
        products.push(d);
        existingIds.add(d.id);
      }
    });

    const index = products.findIndex(p => p.id === productData.id);

    if (index >= 0) {
      products[index] = { ...products[index], ...productData };
    } else {
      products.unshift(productData);
    }

    return this.saveProducts(products);
  },

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    return this.saveProducts(filtered, id);
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  getCategories() {
    try {
      const stored = localStorage.getItem(this.KEYS.CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading stored categories:", e);
    }
    return window.DEFAULT_STORE_CATEGORIES || window.STORE_CATEGORIES || [];
  },

  saveCategories(categories) {
    try {
      localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(this.KEYS.LAST_UPDATED, new Date().toISOString());
      window.STORE_CATEGORIES = categories;
      this.syncAllToDisk();
      return true;
    } catch (e) {
      console.error("Error saving categories:", e);
      return false;
    }
  },

  saveCategory(catData) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === catData.id || c.slug === catData.slug);

    if (index >= 0) {
      categories[index] = { ...categories[index], ...catData };
    } else {
      categories.push(catData);
    }

    return this.saveCategories(categories);
  },

  deleteCategory(idOrSlug) {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== idOrSlug && c.slug !== idOrSlug);
    return this.saveCategories(filtered);
  },

  recalculateCategoryCounts() {
    const products = this.getProducts();
    const categories = this.getCategories();

    categories.forEach(cat => {
      const count = products.filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts' && (p.category === cat.slug || p.category === cat.id)).length;
      cat.itemCount = count;
    });

    try {
      localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
      window.STORE_CATEGORIES = categories;
    } catch (e) {
      console.warn("Could not recalculate category counts:", e);
    }
  },

  // --------------------------------------------------------------------------
  // COLORS
  // --------------------------------------------------------------------------
  getColors() {
    try {
      const stored = localStorage.getItem(this.KEYS.COLORS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingCodes = new Set(parsed.map(c => c.code));
          let changed = false;
          (this.DEFAULT_COLORS || []).forEach(defColor => {
            if (!existingCodes.has(defColor.code)) {
              parsed.push(defColor);
              existingCodes.add(defColor.code);
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem(this.KEYS.COLORS, JSON.stringify(parsed));
            window.STORE_COLORS = parsed;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading stored colors:", e);
    }

    return [...this.DEFAULT_COLORS];
  },

  saveColors(colors) {
    try {
      localStorage.setItem(this.KEYS.COLORS, JSON.stringify(colors));
      window.STORE_COLORS = colors;
      this.syncAllToDisk();
      return true;
    } catch (e) {
      console.error("Error saving colors:", e);
      return false;
    }
  },

  saveColor(colorData) {
    const colors = this.getColors();
    const index = colors.findIndex(c => c.code === colorData.code);

    if (index >= 0) {
      colors[index] = { ...colors[index], ...colorData };
    } else {
      colors.push(colorData);
    }

    return this.saveColors(colors);
  },

  deleteColor(code) {
    const colors = this.getColors();
    const filtered = colors.filter(c => c.code !== code);
    this.saveColors(filtered);

    // Clean up color reference from products if present
    const products = this.getProducts();
    let productsUpdated = false;
    products.forEach(p => {
      if (Array.isArray(p.colors) && p.colors.some(c => c.code === code)) {
        p.colors = p.colors.filter(c => c.code !== code);
        if (Array.isArray(p.variants)) {
          p.variants = p.variants.filter(v => v.color !== code);
        }
        if (p.images && p.images[code]) {
          delete p.images[code];
        }
        productsUpdated = true;
      }
    });

    if (productsUpdated) {
      this.saveProducts(products);
    }

    return true;
  },

  // --------------------------------------------------------------------------
  // INVENTORY & STOCK
  // --------------------------------------------------------------------------
  getAllVariants() {
    const products = this.getProducts();
    const variants = [];

    products.forEach(product => {
      if (Array.isArray(product.variants)) {
        product.variants.forEach(v => {
          const colorObj = Array.isArray(product.colors) ? product.colors.find(c => c.code === v.color) : null;
          variants.push({
            productId: product.id,
            productName: product.name,
            productCategory: product.category,
            productImage: (colorObj && colorObj.image) || (product.images && product.images[v.color] && product.images[v.color][0]) || (product.colors && product.colors[0] && product.colors[0].image) || "",
            variantId: v.id,
            sku: v.sku || `${product.id}-${v.color}-${v.size}`.toUpperCase(),
            color: v.color,
            colorName: (colorObj && colorObj.name) || v.color,
            colorHex: (colorObj && colorObj.hex) || "#111111",
            size: v.size,
            stock: typeof v.stock === "number" ? v.stock : 0,
            price: v.price || product.price || 0
          });
        });
      }
    });

    return variants;
  },

  updateVariantStock(productId, variantId, newStock) {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);

    if (!product || !Array.isArray(product.variants)) return false;

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.stock = Math.max(0, parseInt(newStock, 10) || 0);
    return this.saveProducts(products);
  },

  bulkUpdateStock(updates) {
    const products = this.getProducts();

    updates.forEach(u => {
      const product = products.find(p => p.id === u.productId);
      if (product && Array.isArray(product.variants)) {
        const variant = product.variants.find(v => v.id === u.variantId);
        if (variant) {
          variant.stock = Math.max(0, parseInt(u.stock, 10) || 0);
        }
      }
    });

    return this.saveProducts(products);
  },

  getInventoryStats() {
    const variants = this.getAllVariants();
    const products = this.getProducts();
    const categories = this.getCategories();

    let totalUnits = 0;
    let totalValueMAD = 0;
    let lowStockCount = 0; // < 5
    let outOfStockCount = 0; // 0

    variants.forEach(v => {
      totalUnits += v.stock;
      totalValueMAD += (v.stock * v.price);
      if (v.stock === 0) {
        outOfStockCount++;
      } else if (v.stock < 5) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalVariants: variants.length,
      totalCategories: categories.length,
      activeCategories: categories.filter(c => c.active).length,
      totalUnits,
      totalValueMAD,
      lowStockCount,
      outOfStockCount
    };
  },

  // --------------------------------------------------------------------------
  // BACKUP, EXPORT, IMPORT & RESET
  // --------------------------------------------------------------------------
  exportCatalogJSON() {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      categories: this.getCategories(),
      colors: this.getColors()
    };
    return JSON.stringify(data, null, 2);
  },

  importCatalogJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error("Format invalide : le tableau 'products' est obligatoire.");
      }

      if (data.categories && Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (data.colors && Array.isArray(data.colors)) {
        this.saveColors(data.colors);
      }
      this.saveProducts(data.products);
      this.recalculateCategoryCounts();

      return { success: true, count: data.products.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  resetToDefaults() {
    try {
      localStorage.removeItem(this.KEYS.PRODUCTS);
      localStorage.removeItem(this.KEYS.CATEGORIES);
      localStorage.removeItem(this.KEYS.COLORS);
      localStorage.removeItem(this.KEYS.LAST_UPDATED);

      window.STORE_PRODUCTS = window.DEFAULT_STORE_PRODUCTS || [];
      window.STORE_CATEGORIES = window.DEFAULT_STORE_CATEGORIES || [];
      window.STORE_COLORS = [...this.DEFAULT_COLORS];

      this.recalculateCategoryCounts();
      return true;
    } catch (e) {
      console.error("Error resetting defaults:", e);
      return false;
    }
  }
};

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5500;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const https = require('https');
const wholesaleServer = require('./wholesale-server');

// ----------------------------------------------------------------------------
// WHATSAPP BUSINESS CLOUD API HELPERS
// ----------------------------------------------------------------------------
function getWhatsAppConfig() {
  const configFile = path.join(ROOT_DIR, 'assets', 'js', 'data', 'whatsapp_config.json');
  try {
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
  } catch (e) {}
  return {
    enabled: false,
    phone_number_id: '',
    access_token: '',
    test_recipient: '',
    template_name: 'hello_world',
    language_code: 'en_US'
  };
}

function saveWhatsAppConfig(cfg) {
  const configFile = path.join(ROOT_DIR, 'assets', 'js', 'data', 'whatsapp_config.json');
  fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), 'utf8');
}

function formatWhatsAppPhoneNumber(phone) {
  const clean = String(phone || '').replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('0') && clean.length === 10) {
    return '212' + clean.slice(1);
  }
  if ((clean.startsWith('6') || clean.startsWith('7')) && clean.length === 9) {
    return '212' + clean;
  }
  return clean;
}

function sendWhatsAppMessageNode(toPhone, templateName = 'hello_world', languageCode = 'en_US', bodyParams = []) {
  return new Promise((resolve) => {
    const config = getWhatsAppConfig();
    const phoneNumberId = (config.phone_number_id || '').trim();
    const accessToken = (config.access_token || '').trim();

    if (!phoneNumberId || !accessToken) {
      return resolve({ success: false, error: 'Identifiants WhatsApp manquants (Phone Number ID ou Access Token non configurés).' });
    }

    const recipient = formatWhatsAppPhoneNumber(toPhone);
    if (!recipient) {
      return resolve({ success: false, error: 'Numéro destinataire invalide.' });
    }

    const templatePayload = {
      name: templateName,
      language: { code: languageCode }
    };

    if (bodyParams && bodyParams.length > 0) {
      templatePayload.components = [
        {
          type: 'body',
          parameters: bodyParams.map(p => ({ type: 'text', text: String(p) }))
        }
      ];
    }

    const postData = JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: templatePayload
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v20.0/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
            resolve({ success: true, statusCode: apiRes.statusCode, data: parsed, recipient });
          } else {
            resolve({ success: false, statusCode: apiRes.statusCode, error: parsed.error?.message || data, details: parsed });
          }
        } catch (e) {
          resolve({ success: false, statusCode: apiRes.statusCode, error: data });
        }
      });
    });

    apiReq.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    apiReq.setTimeout(8000, () => {
      apiReq.destroy();
      resolve({ success: false, error: 'Délai d\'attente dépassé (timeout 8s).' });
    });

    apiReq.write(postData);
    apiReq.end();
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Wholesale-Token, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // --------------------------------------------------------------------------
  // B2B & WHOLESALE API DISPATCHER
  // --------------------------------------------------------------------------
  if (pathname.startsWith('/api/wholesale')) {
    if (wholesaleServer.handleWholesaleRequest(req, res, pathname, parsedUrl)) {
      return;
    }
  }

  // --------------------------------------------------------------------------
  // API ENDPOINT: POST /api/upload-image
  // Saves uploaded image directly to product's physical folder on disk
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/upload-image') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 50MB max upload limit
      if (body.length > 50 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { productId, category, filename, dataUrl } = payload;

        if (!productId || !dataUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'productId and dataUrl are required' }));
          return;
        }

        // Clean and sanitize filename
        let cleanName = (filename || `image-${Date.now()}.png`).toLowerCase().replace(/[^a-z0-9._-]/g, '-');
        if (!path.extname(cleanName)) cleanName += '.png';

        const catDir = (category || 't-shirts').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const prodDir = productId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const targetDir = path.join(ROOT_DIR, 'assets', 'images', 'products', catDir, prodDir);

        // Ensure directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Extract base64 buffer
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const buffer = matches && matches[2] ? Buffer.from(matches[2], 'base64') : Buffer.from(dataUrl, 'base64');

        const finalFilePath = path.join(targetDir, cleanName);
        fs.writeFileSync(finalFilePath, buffer);

        const relativePath = `assets/images/products/${catDir}/${prodDir}/${cleanName}`;
        console.log(`[API Upload] Successfully saved image to: ${relativePath}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          path: relativePath,
          filename: cleanName,
          size: buffer.length
        }));
      } catch (err) {
        console.error('[API Upload Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ENDPOINT: GET /api/images
  // Dynamically scans assets/images/ directory on disk and returns all images
  // --------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/images') {
    try {
      const imagesDir = path.join(ROOT_DIR, 'assets', 'images');
      const results = [];

      function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (/\.(png|jpe?g|webp|svg)$/i.test(entry.name) && !entry.name.startsWith('.')) {
            const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
            const cleanLabel = entry.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[-_]+/g, ' ')
              .replace(/firefly|gemini|flash|create|realistic|lifestyle|ecommerce|mockup|using|the|uploaded|reference|images|as|th/gi, '')
              .trim() || entry.name;

            let colTag = 'default';
            if (/pink|rose/i.test(relPath)) colTag = 'pink';
            else if (/white|blanc/i.test(relPath)) colTag = 'white';
            else if (/black|noir/i.test(relPath)) colTag = 'black';
            else if (/navy|blue|marine/i.test(relPath)) colTag = 'navy';
            else if (/beige|sand/i.test(relPath)) colTag = 'beige';
            else if (/olive|green/i.test(relPath)) colTag = 'olive';
            else if (/charcoal|gris/i.test(relPath)) colTag = 'charcoal';
            else if (/terracotta/i.test(relPath)) colTag = 'terracotta';

            results.push({
              label: cleanLabel.length > 32 ? cleanLabel.slice(0, 32) + '...' : cleanLabel,
              filename: entry.name,
              url: relPath,
              color: colTag
            });
          }
        }
      }

      scanDir(imagesDir);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: results.length, images: results }));
    } catch (err) {
      console.error('[API List Images Error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --------------------------------------------------------------------------
  // API ENDPOINT: POST /api/save-products
  // Writes master products array directly to assets/js/data/products.js on disk
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/save-products') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { products } = payload;

        if (!products || !Array.isArray(products)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'products array is required' }));
          return;
        }

        const jsContent = `/**
 * Products Master Database
 * Fully data-driven, expandable apparel catalog.
 * Supports multi-colorways, multi-sizes, variant-specific SKUs, inventory counts,
 * multi-view photography, materials, sizing advice, and Moroccan pricing (MAD).
 * 
 * Organized with dedicated image folders for each product under:
 * assets/images/products/t-shirts/<product-id>/
 * - front-main.png (Visuel Principal / Face)
 * - back-hover.png (Visuel au Survol / Dos Mockup)
 * - lookbook.jpg (Lookbook / Lifestyle)
 * - hero.jpg (Drop Banner)
 */

window.DEFAULT_STORE_PRODUCTS = ${JSON.stringify(products, null, 2)};

// Deprecated product IDs from previous versions that should be pruned
window.DEPRECATED_PRODUCT_IDS = new Set([
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

// Product alias mapping for legacy bookmarks and query links
window.PRODUCT_ALIASES = {
  "vintage-washed-charcoal-tee": { targetId: "graphic-tee-colored", defaultColor: "black" },
  "graphic-tee-colored-blue-dark": { targetId: "graphic-tee-colored", defaultColor: "dark-blue" },
  "essential-tee-rose": { targetId: "graphic-tee-colored", defaultColor: "rose" },
  "essential-tee-indigo": { targetId: "graphic-tee-colored", defaultColor: "indigo" },
  "heavyweight-boxy-tee-300": { targetId: "essential-oversized-tee", defaultColor: "navy" },
  "oversized-tee-big-white": { targetId: "essential-oversized-tee", defaultColor: "white" },
  "essential-tee-blue-m": { targetId: "minimal-embroidered-logo-tee", defaultColor: "blue-m" },
  "atelier-studio-drop-tee": { targetId: "minimal-embroidered-logo-tee", defaultColor: "white" },
  "relaxed-earth-tone-tee": { targetId: "minimal-embroidered-logo-tee", defaultColor: "beige" },
  "classic-relaxed-tank-top": { targetId: "relaxed-tank-top-180gsm", defaultColor: "black" },
  "tshirt-boxy-inverted-label-grey": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "grey" },
  "tshirt-boxy-inverted-label-pink": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "pink" },
  "tshirt-boxy-inverted-label-black": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "black" },
  "tshirt-boxy-inverted-label": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "navy" }
};

// Initialize and reconcile STORE_PRODUCTS with localStorage and default master catalog
(function() {
  const defaults = window.DEFAULT_STORE_PRODUCTS || [];
  const deprecatedSet = window.DEPRECATED_PRODUCT_IDS || new Set();

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem("atelier_products_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(p => p && p.id && !deprecatedSet.has(p.id));
          const finalProducts = [];
          const processedIds = new Set();

          // 1. Reconcile stored items with master defaults
          cleaned.forEach(item => {
            if (!item || !item.id) return;
            processedIds.add(item.id);

            const def = defaults.find(d => d.id === item.id);
            if (!def) {
              finalProducts.push(item);
              return;
            }

            const merged = { ...def, ...item };

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

            // Merge variants
            const existingVarKeys = new Set((item.variants || []).map(v => (v.color + '-' + v.size)));
            const mergedVariants = [...(item.variants || [])];
            (def.variants || []).forEach(defVar => {
              const key = defVar.color + '-' + defVar.size;
              if (!existingVarKeys.has(key)) {
                mergedVariants.push(defVar);
                existingVarKeys.add(key);
              }
            });
            merged.variants = mergedVariants;

            finalProducts.push(merged);
          });

          // 2. Append any default products not yet in localStorage
          defaults.forEach(def => {
            if (def && def.id && !processedIds.has(def.id) && !deprecatedSet.has(def.id)) {
              finalProducts.push(def);
              processedIds.add(def.id);
            }
          });

          localStorage.setItem("atelier_products_v1", JSON.stringify(finalProducts));
          window.STORE_PRODUCTS = finalProducts;
          return;
        }
      }
    }
  } catch (e) {
    console.warn("Could not synchronize products with localStorage:", e);
  }

  window.STORE_PRODUCTS = defaults;
})();
`;

        const productsFilePath = path.join(ROOT_DIR, 'assets', 'js', 'data', 'products.js');
        fs.writeFileSync(productsFilePath, jsContent, 'utf8');
        console.log(`[API Sync] Successfully updated products.js with ${products.length} products`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: products.length }));
      } catch (err) {
        console.error('[API Sync Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ENDPOINT: POST /api/sync-all
  // Synchronizes full catalog (products, categories, colors) to disk files
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/sync-all') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { products, categories, colors } = payload;
        const synced = [];

        // 1. Sync Products
        if (products && Array.isArray(products)) {
          let mergedProducts = [...products];
          const productsFilePath = path.join(ROOT_DIR, 'assets', 'js', 'data', 'products.js');
          
          if (fs.existsSync(productsFilePath)) {
            try {
              const existingCode = fs.readFileSync(productsFilePath, 'utf8');
              const m = existingCode.match(/window\.DEFAULT_STORE_PRODUCTS\s*=\s*(\[[\s\S]*?\]);\s*\n/);
              if (m) {
                const diskProds = JSON.parse(m[1]);
                if (Array.isArray(diskProds) && diskProds.length > 0) {
                  const incById = new Map(products.map(p => [p.id, p]));
                  const result = [];
                  const seen = new Set();
                  const deletedId = payload.deletedProductId;

                  diskProds.forEach(dp => {
                    if (dp.id === deletedId) return;
                    if (incById.has(dp.id)) {
                      result.push(incById.get(dp.id));
                    } else {
                      result.push(dp);
                    }
                    seen.add(dp.id);
                  });

                  products.forEach(p => {
                    if (p.id && !seen.has(p.id) && p.id !== deletedId) {
                      result.push(p);
                      seen.add(p.id);
                    }
                  });

                  mergedProducts = result;
                }
              }
            } catch (err) {
              console.warn('[SyncAll] Error reading disk products for merge:', err.message);
            }
          }

          const jsContent = `/**
 * Products Master Database
 * Fully data-driven, expandable apparel catalog.
 * Supports multi-colorways, multi-sizes, variant-specific SKUs, inventory counts,
 * multi-view photography, materials, sizing advice, and Moroccan pricing (MAD).
 */

window.DEFAULT_STORE_PRODUCTS = ${JSON.stringify(mergedProducts, null, 2)};

// Deprecated product IDs from previous versions that should be pruned
window.DEPRECATED_PRODUCT_IDS = new Set([
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

// Product alias mapping for legacy bookmarks and query links
window.PRODUCT_ALIASES = {
  "vintage-washed-charcoal-tee": { targetId: "graphic-tee-colored", defaultColor: "black" },
  "graphic-tee-colored-blue-dark": { targetId: "graphic-tee-colored", defaultColor: "dark-blue" },
  "essential-tee-rose": { targetId: "graphic-tee-colored", defaultColor: "rose" },
  "essential-tee-indigo": { targetId: "graphic-tee-colored", defaultColor: "indigo" },
  "heavyweight-boxy-tee-300": { targetId: "essential-oversized-tee", defaultColor: "navy" },
  "oversized-tee-big-white": { targetId: "essential-oversized-tee", defaultColor: "white" },
  "essential-tee-blue-m": { targetId: "minimal-embroidered-logo-tee", defaultColor: "blue-m" },
  "atelier-studio-drop-tee": { targetId: "minimal-embroidered-logo-tee", defaultColor: "white" },
  "relaxed-earth-tone-tee": { targetId: "minimal-embroidered-logo-tee", defaultColor: "beige" },
  "classic-relaxed-tank-top": { targetId: "relaxed-tank-top-180gsm", defaultColor: "black" },
  "tshirt-boxy-inverted-label-grey": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "grey" },
  "tshirt-boxy-inverted-label-pink": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "pink" },
  "tshirt-boxy-inverted-label-black": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "black" },
  "tshirt-boxy-inverted-label": { targetId: "tshirt-boxy-inverted-label-navy", defaultColor: "navy" }
};

// Initialize and reconcile STORE_PRODUCTS with localStorage and default master catalog
(function() {
  const defaults = window.DEFAULT_STORE_PRODUCTS || [];
  const deprecatedSet = window.DEPRECATED_PRODUCT_IDS || new Set();

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem("atelier_products_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(p => p && p.id && !deprecatedSet.has(p.id));
          const finalProducts = [];
          const processedIds = new Set();

          // 1. Reconcile stored items with master defaults
          cleaned.forEach(item => {
            if (!item || !item.id) return;
            processedIds.add(item.id);

            const def = defaults.find(d => d.id === item.id);
            if (!def) {
              finalProducts.push(item);
              return;
            }

            const merged = { ...def, ...item };

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

            // Merge variants
            const existingVarKeys = new Set((item.variants || []).map(v => (v.color + '-' + v.size)));
            const mergedVariants = [...(item.variants || [])];
            (def.variants || []).forEach(defVar => {
              const key = defVar.color + '-' + defVar.size;
              if (!existingVarKeys.has(key)) {
                mergedVariants.push(defVar);
                existingVarKeys.add(key);
              }
            });
            merged.variants = mergedVariants;

            finalProducts.push(merged);
          });

          // 2. Append any default products not yet in localStorage
          defaults.forEach(def => {
            if (def && def.id && !processedIds.has(def.id) && !deprecatedSet.has(def.id)) {
              finalProducts.push(def);
              processedIds.add(def.id);
            }
          });

          localStorage.setItem("atelier_products_v1", JSON.stringify(finalProducts));
          window.STORE_PRODUCTS = finalProducts;
          return;
        }
      }
    }
  } catch (e) {
    console.warn("Could not synchronize products with localStorage:", e);
  }

  window.STORE_PRODUCTS = defaults;
})();
`;
          fs.writeFileSync(productsFilePath, jsContent, 'utf8');
          synced.push(`products (${products.length})`);
        }

        // 2. Sync Categories
        if (categories && Array.isArray(categories)) {
          const catContent = `/**
 * Categories Master Data
 * Scalable architecture: easily add Hoodies, Sweatshirts, Pants, etc.
 * Categories with active: false will automatically display with "Coming Soon" badges.
 */

window.DEFAULT_STORE_CATEGORIES = ${JSON.stringify(categories, null, 2)};

// Initialize STORE_CATEGORIES from localStorage if modified by Admin Dashboard
(function() {
  try {
    const saved = localStorage.getItem("atelier_categories_v1");
    if (saved) {
      window.STORE_CATEGORIES = JSON.parse(saved);
      return;
    }
  } catch (e) {
    console.warn("Could not load categories from localStorage:", e);
  }
  window.STORE_CATEGORIES = window.DEFAULT_STORE_CATEGORIES;
})();
`;
          const catFilePath = path.join(ROOT_DIR, 'assets', 'js', 'data', 'categories.js');
          fs.writeFileSync(catFilePath, catContent, 'utf8');
          synced.push(`categories (${categories.length})`);
        }

        // 3. Sync Colors in storeData.js
        if (colors && Array.isArray(colors)) {
          const storeDataPath = path.join(ROOT_DIR, 'assets', 'js', 'core', 'storeData.js');
          let storeDataCode = fs.readFileSync(storeDataPath, 'utf8');
          const colorsStr = JSON.stringify(colors, null, 4).replace(/\n/g, '\n  ');
          const newDefaultColorsBlock = `DEFAULT_COLORS: ${colorsStr},`;
          storeDataCode = storeDataCode.replace(/DEFAULT_COLORS:\s*\[[\s\S]*?\],/m, newDefaultColorsBlock);
          fs.writeFileSync(storeDataPath, storeDataCode, 'utf8');
          synced.push(`colors (${colors.length})`);
        }

        console.log(`[API Sync-All] Successfully updated on disk: ${synced.join(', ')}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, synced }));
      } catch (err) {
        console.error('[API Sync-All Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ENDPOINT: /api/orders
  // --------------------------------------------------------------------------
  if (pathname === '/api/orders') {
    const ordersFile = path.join(ROOT_DIR, 'assets', 'js', 'data', 'local_orders.json');
    const getLocalOrders = () => {
      try {
        if (fs.existsSync(ordersFile)) {
          return JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        }
      } catch (e) {}
      return [];
    };
    const saveLocalOrders = (orders) => {
      try {
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
      } catch (e) {
        console.error('Error saving local orders:', e);
      }
    };

    if (req.method === 'GET') {
      const orders = getLocalOrders();
      const status = parsedUrl.query.status;
      const filtered = (status && status !== 'all') ? orders.filter(o => o.status === status) : orders;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: filtered.length, orders: filtered }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          let orders = getLocalOrders();

          if (parsedUrl.query.action === 'update_status' || payload.action === 'update_status') {
            const { orderNumber, status } = payload;
            const idx = orders.findIndex(o => o.order_number === orderNumber || o.orderNumber === orderNumber);
            if (idx !== -1) {
              orders[idx].status = status;
              saveLocalOrders(orders);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, orderNumber, status }));
              return;
            }
          }

          const orderNumber = payload.orderNumber || ('MA-' + Math.floor(100000 + Math.random() * 900000));
          const newOrder = {
            id: Date.now(),
            order_number: orderNumber,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            customer_first_name: payload.customer?.firstName || '',
            customer_last_name: payload.customer?.lastName || '',
            customer_email: payload.customer?.email || '',
            customer_phone: payload.customer?.phone || '',
            shipping_address: payload.shippingAddress?.address || '',
            shipping_apartment: payload.shippingAddress?.apartment || '',
            shipping_city: payload.shippingAddress?.city || '',
            shipping_postal: payload.shippingAddress?.postal || '',
            shipping_country: payload.shippingAddress?.country || 'Maroc',
            payment_method: payload.paymentMethod || 'Paiement à la livraison (COD)',
            subtotal: payload.subtotal || 0,
            discount: payload.discount || 0,
            shipping_cost: payload.shipping || 0,
            total: payload.total || 0,
            order_note: payload.orderNote || '',
            status: 'pending',
            items: payload.items || []
          };

          orders.unshift(newOrder);
          saveLocalOrders(orders);

          // Automated WhatsApp Order Confirmation if configured
          const wsCfg = getWhatsAppConfig();
          if (wsCfg.enabled && newOrder.customer_phone) {
            const customerName = `${newOrder.customer_first_name} ${newOrder.customer_last_name}`.trim();
            const tpl = wsCfg.template_name || 'hello_world';
            const lang = wsCfg.language_code || 'en_US';
            const params = (tpl === 'hello_world') ? [] : [customerName || 'Client', orderNumber, String(newOrder.total)];
            sendWhatsAppMessageNode(newOrder.customer_phone, tpl, lang, params).then(res => {
              if (res.success) {
                console.log(`[WhatsApp Node] Confirmation envoyée à ${res.recipient} pour commande ${orderNumber}`);
              } else {
                console.warn(`[WhatsApp Node Warning] Échec d'envoi à ${newOrder.customer_phone}:`, res.error);
              }
            }).catch(e => console.error('[WhatsApp Node Error]', e));
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, orderNumber, id: newOrder.id, message: 'Commande enregistrée localement' }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

  // --------------------------------------------------------------------------
  // API ENDPOINTS: WhatsApp Cloud API Configuration & Test
  // --------------------------------------------------------------------------
  if (pathname === '/api/whatsapp/config') {
    if (req.method === 'GET') {
      const cfg = getWhatsAppConfig();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, config: cfg }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const current = getWhatsAppConfig();
          const updated = {
            enabled: !!payload.enabled,
            phone_number_id: (payload.phone_number_id !== undefined ? payload.phone_number_id : current.phone_number_id).trim(),
            access_token: (payload.access_token !== undefined ? payload.access_token : current.access_token).trim(),
            test_recipient: (payload.test_recipient !== undefined ? payload.test_recipient : current.test_recipient).trim(),
            template_name: (payload.template_name || current.template_name || 'hello_world').trim(),
            language_code: (payload.language_code || current.language_code || 'en_US').trim()
          };
          saveWhatsAppConfig(updated);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Configuration WhatsApp sauvegardée avec succès', config: updated }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

  if (pathname === '/api/whatsapp/test' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const cfg = getWhatsAppConfig();
        const targetPhone = payload.recipient || cfg.test_recipient;
        const tpl = payload.template_name || cfg.template_name || 'hello_world';
        const lang = payload.language_code || cfg.language_code || 'en_US';
        const params = payload.params || [];

        const result = await sendWhatsAppMessageNode(targetPhone, tpl, lang, params);
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ENDPOINT: /api/contact & /api/newsletter
  // --------------------------------------------------------------------------
  if (pathname === '/api/contact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Message reçu (serveur local)' }));
    });
    return;
  }

  if (pathname === '/api/newsletter' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Inscription confirmée (serveur local)' }));
    });
    return;
  }

  // --------------------------------------------------------------------------
  // STATIC FILE SERVING
  // --------------------------------------------------------------------------
  // Normalize root to /index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  let filePath = path.join(ROOT_DIR, pathname);

  // Check if direct file exists
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveStaticFile(filePath, res, req);
      return;
    }

    // Try appending .html (e.g. /shop -> /shop.html, /product -> /product.html)
    const htmlPath = filePath + '.html';
    fs.stat(htmlPath, (htmlErr, htmlStats) => {
      if (!htmlErr && htmlStats.isFile()) {
        serveStaticFile(htmlPath, res, req);
        return;
      }

      // If directory, look for index.html inside
      if (!err && stats && stats.isDirectory()) {
        const dirIndex = path.join(filePath, 'index.html');
        fs.stat(dirIndex, (dirErr, dirStats) => {
          if (!dirErr && dirStats.isFile()) {
            serveStaticFile(dirIndex, res, req);
            return;
          }
          send404(res);
        });
        return;
      }

      send404(res);
    });
  });
});

function serveStaticFile(filePath, res, req) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(data),
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(data);
    }
  });
}

function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><h1>404 - Page Non Trouvée</h1><p><a href="/">Retour à l\'accueil</a></p></body></html>');
}

server.listen(PORT, () => {
  console.log(`ATELIER High-Performance Local Dev Server running at: http://localhost:${PORT}`);
});

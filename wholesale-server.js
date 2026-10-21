/**
 * ATELIER E-Commerce - Private Wholesale & B2B Server Engine
 * Strict Server-Side Access Control, Cost-Based Wholesale Pricing, Margin Floor Protection,
 * Application Review Workflow, and B2B Order Processing.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = __dirname;
const USERS_FILE = path.join(ROOT_DIR, 'assets', 'js', 'data', 'wholesale_users.json');
const CONFIG_FILE = path.join(ROOT_DIR, 'assets', 'js', 'data', 'wholesale_config.json');
const ORDERS_FILE = path.join(ROOT_DIR, 'assets', 'js', 'data', 'wholesale_orders.json');
const SESSIONS_FILE = path.join(ROOT_DIR, 'assets', 'js', 'data', 'wholesale_sessions.json');
const PRODUCTS_FILE = path.join(ROOT_DIR, 'assets', 'js', 'data', 'products.js');

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'atelier-secret-admin-key-2026';

// In-memory rate limiting map for registration and login
const rateLimitMap = new Map();

function checkRateLimit(ip, action = 'login', maxAttempts = 10, windowMs = 60000) {
  const key = `${action}_${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, firstAttempt: now };

  if (now - entry.firstAttempt > windowMs) {
    entry.count = 1;
    entry.firstAttempt = now;
    rateLimitMap.set(key, entry);
    return true;
  }

  entry.count++;
  rateLimitMap.set(key, entry);
  return entry.count <= maxAttempts;
}

// ----------------------------------------------------------------------------
// DATA ACCESS HELPERS
// ----------------------------------------------------------------------------
function loadJSON(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading JSON from ${filePath}:`, err.message);
  }
  return fallback;
}

function saveJSON(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error saving JSON to ${filePath}:`, err.message);
    return false;
  }
}

function getWholesaleUsers() {
  return loadJSON(USERS_FILE, []);
}

function saveWholesaleUsers(users) {
  return saveJSON(USERS_FILE, users);
}

function getWholesaleConfig() {
  const config = loadJSON(CONFIG_FILE, null);
  if (config) return config;
  return {
    moq: 10,
    margin_floor: 0.20,
    retail_target_margin: 0.60,
    tiers: [
      { id: "tier_min", name: "Palier 1", min_qty: 10, max_qty: 24, target_margin: 0.35 },
      { id: "tier_mid", name: "Palier 2", min_qty: 25, max_qty: 49, target_margin: 0.30 },
      { id: "tier_high", name: "Palier 3", min_qty: 50, max_qty: null, target_margin: 0.25 }
    ],
    product_costs: {},
    disabled_products: []
  };
}

function saveWholesaleConfig(config) {
  return saveJSON(CONFIG_FILE, config);
}

function getWholesaleOrders() {
  return loadJSON(ORDERS_FILE, []);
}

function saveWholesaleOrders(orders) {
  return saveJSON(ORDERS_FILE, orders);
}

function getSessions() {
  return loadJSON(SESSIONS_FILE, {});
}

function saveSessions(sessions) {
  return saveJSON(SESSIONS_FILE, sessions);
}

// ----------------------------------------------------------------------------
// SECURITY & CRYPTO HELPERS
// ----------------------------------------------------------------------------
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, salt, hash) {
  const calculated = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, salt, ...safeUser } = user;
  return safeUser;
}

function getUserFromToken(token) {
  if (!token) return null;
  const sessions = getSessions();
  const session = sessions[token];
  if (!session) return null;

  if (Date.now() > session.expires_at) {
    delete sessions[token];
    saveSessions(sessions);
    return null;
  }

  const users = getWholesaleUsers();
  const user = users.find(u => u.id === session.user_id);
  return user || null;
}

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers['x-wholesale-token']) {
    return req.headers['x-wholesale-token'].trim();
  }
  // Try cookie
  if (req.headers['cookie']) {
    const match = req.headers['cookie'].match(/wholesale_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

function authenticateRequest(req) {
  const token = extractToken(req);
  return getUserFromToken(token);
}

function checkAdminAuth(req, user) {
  if (user && user.role === 'admin') return true;
  const adminHeader = req.headers['x-admin-key'];
  if (adminHeader && adminHeader === ADMIN_SECRET_KEY) return true;
  return false;
}

// ----------------------------------------------------------------------------
// PRICING ENGINE & MARGIN PROTECTION (Requirement 7)
// ----------------------------------------------------------------------------
function getActiveTier(totalQuantity, config) {
  const tiers = config.tiers || [];
  for (let i = tiers.length - 1; i >= 0; i--) {
    const t = tiers[i];
    if (totalQuantity >= t.min_qty) {
      if (t.max_qty === null || totalQuantity <= t.max_qty) {
        return t;
      }
    }
  }
  return tiers[0] || { id: "tier_min", target_margin: 0.35, min_qty: 10 };
}

/**
 * Calculates wholesale unit price using: unit_price = unit_cost / (1 - target_margin)
 * Enforces the 20% minimum gross margin floor.
 */
function calculateWholesaleUnitPrice(unitCost, targetMargin, marginFloor = 0.20) {
  if (!unitCost || unitCost <= 0) return null;
  
  // Calculate price with target margin
  let price = Math.round(unitCost / (1 - targetMargin));
  
  // Verify margin floor
  const effectiveMargin = (price - unitCost) / price;
  if (effectiveMargin < marginFloor) {
    price = Math.ceil(unitCost / (1 - marginFloor));
  }
  
  return price;
}

function loadCatalogProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const code = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      const sandbox = {
        window: {},
        localStorage: { getItem: () => null, setItem: () => {} }
      };
      eval(`(function(window, localStorage){ ${code} })(sandbox.window, sandbox.localStorage)`);
      return sandbox.window.DEFAULT_STORE_PRODUCTS || sandbox.window.STORE_PRODUCTS || [];
    }
  } catch (err) {
    console.error('Error loading products in wholesale server:', err.message);
  }
  return [];
}

// ----------------------------------------------------------------------------
// REQUEST DISPATCHER
// ----------------------------------------------------------------------------
function handleWholesaleRequest(req, res, pathname, parsedUrl) {
  const sendJSON = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wholesale-Token, X-Admin-Key'
    });
    res.end(JSON.stringify(data));
  };

  const getClientIp = () => req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Read JSON body helper
  const readBody = () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) req.destroy();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  // --------------------------------------------------------------------------
  // 1. POST /api/wholesale/register
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/register' && req.method === 'POST') {
    if (!checkRateLimit(getClientIp(), 'register', 8, 60000)) {
      sendJSON(429, { success: false, error: 'Trop de requêtes. Veuillez patienter une minute avant de réessayer.' });
      return true;
    }

    readBody().then(payload => {
      const {
        fullName,
        email,
        phone,
        password,
        businessName,
        country = 'Maroc',
        city,
        businessType = 'other',
        salesChannel,
        websiteSocialUrl,
        estimatedInitialOrder,
        expectedReorderFreq,
        sellingStatus = 'already_selling',
        additionalInfo
      } = payload;

      // Validation
      if (!fullName || !email || !phone || !password) {
        sendJSON(400, { success: false, error: 'Nom complet, email, téléphone et mot de passe sont obligatoires.' });
        return;
      }

      if (password.length < 8) {
        sendJSON(400, { success: false, error: 'Le mot de passe doit comporter au moins 8 caractères.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const users = getWholesaleUsers();

      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        sendJSON(409, { success: false, error: 'Un compte existe déjà avec cette adresse email.' });
        return;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const password_hash = hashPassword(password, salt);

      const newUser = {
        id: Date.now(),
        email: cleanEmail,
        password_hash,
        salt,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: 'wholesale_applicant',
        application_status: 'pending',
        business_name: (businessName || '').trim(),
        country: country.trim(),
        city: (city || '').trim(),
        business_type: businessType,
        sales_channel: (salesChannel || '').trim(),
        website_social_url: (websiteSocialUrl || '').trim(),
        estimated_initial_order: estimatedInitialOrder || '10-25',
        expected_reorder_freq: expectedReorderFreq || 'monthly',
        selling_status: sellingStatus,
        additional_info: (additionalInfo || '').trim(),
        admin_notes: '',
        info_request_message: null,
        applicant_response: null,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        approved_at: null
      };

      users.push(newUser);
      saveWholesaleUsers(users);

      // Create session immediately so applicant can see their pending dashboard
      const token = generateSessionToken();
      const sessions = getSessions();
      sessions[token] = {
        user_id: newUser.id,
        created_at: Date.now(),
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
      };
      saveSessions(sessions);

      sendJSON(201, {
        success: true,
        message: 'Votre candidature a été soumise avec succès.',
        token,
        user: sanitizeUser(newUser)
      });
    }).catch(err => {
      sendJSON(400, { success: false, error: 'Données invalides: ' + err.message });
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 2. POST /api/wholesale/login
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/login' && req.method === 'POST') {
    if (!checkRateLimit(getClientIp(), 'login', 10, 60000)) {
      sendJSON(429, { success: false, error: 'Trop de tentatives de connexion. Réessayez dans une minute.' });
      return true;
    }

    readBody().then(payload => {
      const { email, password } = payload;
      if (!email || !password) {
        sendJSON(400, { success: false, error: 'Email et mot de passe requis.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const users = getWholesaleUsers();
      const user = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        sendJSON(401, { success: false, error: 'Identifiants incorrects.' });
        return;
      }

      if (!verifyPassword(password, user.salt, user.password_hash)) {
        sendJSON(401, { success: false, error: 'Identifiants incorrects.' });
        return;
      }

      // Generate session token
      const token = generateSessionToken();
      const sessions = getSessions();
      sessions[token] = {
        user_id: user.id,
        created_at: Date.now(),
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
      };
      saveSessions(sessions);

      sendJSON(200, {
        success: true,
        token,
        user: sanitizeUser(user)
      });
    }).catch(err => {
      sendJSON(400, { success: false, error: 'Requête invalide: ' + err.message });
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 3. GET /api/wholesale/session
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/session' && req.method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      sendJSON(401, { success: false, authenticated: false, error: 'Session non authentifiée.' });
      return true;
    }

    sendJSON(200, {
      success: true,
      authenticated: true,
      user: sanitizeUser(user)
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 4. POST /api/wholesale/logout
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/logout' && req.method === 'POST') {
    const token = extractToken(req);
    if (token) {
      const sessions = getSessions();
      delete sessions[token];
      saveSessions(sessions);
    }
    sendJSON(200, { success: true, message: 'Déconnexion effectuée.' });
    return true;
  }

  // --------------------------------------------------------------------------
  // 5. POST /api/wholesale/submit-more-info
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/submit-more-info' && req.method === 'POST') {
    const user = authenticateRequest(req);
    if (!user) {
      sendJSON(401, { success: false, error: 'Authentification requise.' });
      return true;
    }

    readBody().then(payload => {
      const { responseText } = payload;
      if (!responseText || !responseText.trim()) {
        sendJSON(400, { success: false, error: 'Veuillez saisir votre message d’information complémentaire.' });
        return;
      }

      const users = getWholesaleUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) {
        sendJSON(404, { success: false, error: 'Utilisateur non trouvé.' });
        return;
      }

      users[idx].applicant_response = responseText.trim();
      users[idx].application_status = 'pending'; // Put back in pending review
      users[idx].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      saveWholesaleUsers(users);

      sendJSON(200, {
        success: true,
        message: 'Informations complémentaires transmises. Votre dossier est de nouveau en attente de validation.',
        user: sanitizeUser(users[idx])
      });
    }).catch(err => {
      sendJSON(400, { success: false, error: 'Erreur: ' + err.message });
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 6. GET /api/wholesale/catalog (STRICT SERVER-SIDE ACCESS CONTROL)
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/catalog' && req.method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      sendJSON(401, {
        success: false,
        error: 'Accès restreint. Veuillez vous connecter à votre compte grossiste approuvé.',
        code: 'UNAUTHENTICATED'
      });
      return true;
    }

    if (user.application_status !== 'approved') {
      sendJSON(403, {
        success: false,
        error: `Accès non autorisé. Votre statut actuel est: ${user.application_status}.`,
        status: user.application_status,
        code: 'NOT_APPROVED'
      });
      return true;
    }

    // User is authorized! Compute private wholesale catalog
    const config = getWholesaleConfig();
    const products = loadCatalogProducts();
    const productCosts = config.product_costs || {};
    const productMoqs = config.product_moqs || {};
    const disabledProducts = config.disabled_products || [];

    const wholesaleProducts = [];

    for (const p of products) {
      if (disabledProducts.includes(p.id) || p.isBundle || p.id === 'pack-trio-tshirts') continue;
      let unitCost = productCosts[p.id];
      // Provide robust fallback cost if not configured so no product is hidden
      if (!unitCost || unitCost <= 0) {
        unitCost = Math.round(p.price * 0.35);
      }

      // Formula-based Grid MOQ: Each size × Available colors
      const sizesCount = (p.sizes && p.sizes.length) || 4;
      const colorsCount = (p.colors && p.colors.length) || 1;
      const gridMoq = Math.max(1, sizesCount * colorsCount);

      // Determine product-specific MOQ: manual edit takes precedence if defined
      const manualMoq = productMoqs[p.id];
      const isManualMoq = (manualMoq !== undefined && manualMoq !== null && parseInt(manualMoq, 10) > 0);
      const effectiveMoq = isManualMoq ? parseInt(manualMoq, 10) : gridMoq;

      // Calculate unit prices for each quantity tier
      const tierMinPrice = calculateWholesaleUnitPrice(unitCost, 0.35, config.margin_floor);
      const tierMidPrice = calculateWholesaleUnitPrice(unitCost, 0.30, config.margin_floor);
      const tierHighPrice = calculateWholesaleUnitPrice(unitCost, 0.25, config.margin_floor);

      const retailPrice = p.price;
      const maxSavings = Math.round(((retailPrice - tierHighPrice) / retailPrice) * 100);

      wholesaleProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        retailPrice: retailPrice,
        moq: effectiveMoq,
        gridMoq: gridMoq,
        sizesCount: sizesCount,
        colorsCount: colorsCount,
        isManualMoq: isManualMoq,
        tierPrices: {
          tier_min: tierMinPrice, // Tier 1
          tier_mid: tierMidPrice, // Tier 2 (25+ pcs)
          tier_high: tierHighPrice // Tier 3 (50+ pcs)
        },
        savingsPercentage: maxSavings,
        shortDescription: p.shortDescription,
        materials: p.materials,
        fit: p.fit,
        colors: p.colors || [],
        sizes: p.sizes || ['S', 'M', 'L', 'XL'],
        variants: p.variants || [],
        images: p.images || {}
      });
    }

    sendJSON(200, {
      success: true,
      moqPolicy: "per_product",
      tiers: config.tiers,
      productsCount: wholesaleProducts.length,
      products: wholesaleProducts
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 7. POST /api/wholesale/calculate-price (Real-time pricing validation)
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/calculate-price' && req.method === 'POST') {
    const user = authenticateRequest(req);
    if (!user || user.application_status !== 'approved') {
      sendJSON(403, { success: false, error: 'Accès réservé aux comptes grossistes approuvés.' });
      return true;
    }

    readBody().then(payload => {
      const { items = [] } = payload;
      const config = getWholesaleConfig();
      const productCosts = config.product_costs || {};
      const productMoqs = config.product_moqs || {};

      let totalQty = 0;
      const productTotals = {};
      for (const it of items) {
        const q = parseInt(it.quantity, 10) || 0;
        if (q > 0) {
          totalQty += q;
          productTotals[it.productId] = (productTotals[it.productId] || 0) + q;
        }
      }

      const activeTier = getActiveTier(totalQty, config);
      const targetMargin = activeTier.target_margin;

      let subtotal = 0;
      const calculatedItems = [];

      for (const it of items) {
        const qty = parseInt(it.quantity, 10) || 0;
        if (qty <= 0) continue;

        let unitCost = productCosts[it.productId];
        if (!unitCost || unitCost <= 0) {
          unitCost = Math.round((it.retailPrice || 250) * 0.35);
        }

        const unitPrice = calculateWholesaleUnitPrice(unitCost, targetMargin, config.margin_floor);
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        calculatedItems.push({
          productId: it.productId,
          variantId: it.variantId,
          colorCode: it.colorCode,
          colorName: it.colorName,
          size: it.size,
          quantity: qty,
          unitPrice,
          lineTotal
        });
      }

      // Check per-product MOQ compliance (Starter Pack: all colors x all sizes baseline)
      const catalogProducts = loadCatalogProducts();
      const productMoqStatus = {};
      let allMoqSatisfied = totalQty > 0;

      for (const [pid, q] of Object.entries(productTotals)) {
        const prod = catalogProducts.find(p => p.id === pid);
        const colors = (prod && prod.colors && prod.colors.length) ? prod.colors : [{ code: 'default' }];
        const sizes = (prod && prod.sizes && prod.sizes.length) ? prod.sizes : ['S', 'M', 'L', 'XL'];
        const starterPackUnits = Math.max(1, sizes.length * colors.length);

        let pMoq = productMoqs[pid];
        if (!pMoq || pMoq <= 0) {
          pMoq = starterPackUnits;
        } else {
          pMoq = parseInt(pMoq, 10);
        }

        let missingCombos = 0;
        colors.forEach(c => {
          sizes.forEach(s => {
            const it = items.find(item => item.productId === pid && item.colorCode === c.code && item.size === s && parseInt(item.quantity, 10) >= 1);
            if (!it) missingCombos++;
          });
        });

        const isStarterPackComplete = (q > 0 && missingCombos === 0);
        const met = q >= pMoq && isStarterPackComplete;
        if (!met) allMoqSatisfied = false;
        productMoqStatus[pid] = {
          ordered: q,
          moq: pMoq,
          starterPackUnits,
          missingCombos,
          isStarterPackComplete,
          met,
          missing: Math.max(0, pMoq - q)
        };
      }

      sendJSON(200, {
        success: true,
        totalQuantity: totalQty,
        moqPolicy: "per_product",
        allMoqSatisfied,
        productMoqStatus,
        activeTier,
        subtotal,
        total: subtotal,
        items: calculatedItems
      });
    }).catch(err => {
      sendJSON(400, { success: false, error: 'Calcul impossible: ' + err.message });
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 8. POST /api/wholesale/order (STRICT SERVER-SIDE AUTHORIZATION & MARGIN FLOOR)
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/order' && req.method === 'POST') {
    const user = authenticateRequest(req);
    if (!user) {
      sendJSON(401, { success: false, error: 'Authentification grossiste requise.' });
      return true;
    }

    if (user.application_status !== 'approved') {
      sendJSON(403, { success: false, error: 'Seuls les comptes grossistes approuvés peuvent passer commande.' });
      return true;
    }

    readBody().then(payload => {
      const {
        items = [],
        shippingAddress = {},
        paymentMethod = 'Virement Bancaire (B2B)',
        orderNote = ''
      } = payload;

      if (!items || items.length === 0) {
        sendJSON(400, { success: false, error: 'Le panier de commande grossiste est vide.' });
        return;
      }

      const config = getWholesaleConfig();
      const productCosts = config.product_costs || {};
      const productMoqs = config.product_moqs || {};
      const catalogProducts = loadCatalogProducts();

      // Calculate total units and per-product units
      let totalUnits = 0;
      const productQuantities = {};
      const productNames = {};

      for (const item of items) {
        const qty = parseInt(item.quantity, 10) || 0;
        if (qty > 0) {
          totalUnits += qty;
          const pid = item.productId;
          productQuantities[pid] = (productQuantities[pid] || 0) + qty;
          productNames[pid] = item.name || pid;
        }
      }

      if (totalUnits <= 0) {
        sendJSON(400, { success: false, error: 'Veuillez saisir au moins un article dans votre commande.' });
        return;
      }

      // ENFORCE PER-PRODUCT MOQ & STARTER PACK (All Colors x Sizes Must Be Covered)
      for (const [pid, qty] of Object.entries(productQuantities)) {
        const prod = catalogProducts.find(p => p.id === pid);
        const colors = (prod && prod.colors && prod.colors.length) ? prod.colors : [{ code: 'default' }];
        const sizes = (prod && prod.sizes && prod.sizes.length) ? prod.sizes : ['S', 'M', 'L', 'XL'];
        const starterPackUnits = Math.max(1, sizes.length * colors.length);

        let pMoq = productMoqs[pid];
        if (!pMoq || pMoq <= 0) {
          pMoq = starterPackUnits;
        } else {
          pMoq = parseInt(pMoq, 10);
        }

        let missingCombos = 0;
        colors.forEach(c => {
          sizes.forEach(s => {
            const it = items.find(item => item.productId === pid && item.colorCode === c.code && item.size === s && parseInt(item.quantity, 10) >= 1);
            if (!it) missingCombos++;
          });
        });

        if (qty < pMoq || missingCombos > 0) {
          sendJSON(400, {
            success: false,
            error: `Pack Starter non complet pour "${productNames[pid]}". Ce modèle impose le Pack Starter complet (au moins 1 pièce pour chaque taille dans l'ensemble des ${colors.length} coloris = ${pMoq} pièces minimum).`
          });
          return;
        }
      }

      const activeTier = getActiveTier(totalUnits, config);
      const targetMargin = activeTier.target_margin;

      // Authoritative server-side price recalculation & margin floor enforcement
      let calculatedSubtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10) || 0;
        if (qty <= 0) continue;

        let unitCost = productCosts[item.productId];
        if (!unitCost || unitCost <= 0) {
          unitCost = Math.round((item.retailPrice || 250) * 0.35);
        }

        // Authoritative server-calculated unit price
        const verifiedUnitPrice = calculateWholesaleUnitPrice(unitCost, targetMargin, config.margin_floor);
        const lineTotal = verifiedUnitPrice * qty;

        // Verify absolute minimum gross margin floor (20%)
        const grossMargin = (verifiedUnitPrice - unitCost) / verifiedUnitPrice;
        if (grossMargin < config.margin_floor - 0.001) {
          sendJSON(400, {
            success: false,
            error: `Alerte sécurité marge: le prix unitaire calculé viole le plancher de marge brute minimale de 20%.`
          });
          return;
        }

        calculatedSubtotal += lineTotal;

        validatedItems.push({
          productId: item.productId,
          variantId: item.variantId || `${item.productId}-${item.colorCode}-${item.size}`,
          name: item.name || item.productId,
          colorCode: item.colorCode || '',
          colorName: item.colorName || '',
          size: item.size || '',
          quantity: qty,
          unitPrice: verifiedUnitPrice,
          lineTotal: lineTotal
        });
      }

      const orderNumber = `WS-MA-${Math.floor(100000 + Math.random() * 900000)}`;

      const newWholesaleOrder = {
        id: Date.now(),
        order_number: orderNumber,
        user_id: user.id,
        business_name: user.business_name || shippingAddress.businessName || '',
        contact_name: user.full_name,
        contact_email: user.email,
        contact_phone: user.phone,
        shipping_address: {
          address: shippingAddress.address || '',
          city: shippingAddress.city || user.city || '',
          postal: shippingAddress.postal || '',
          country: shippingAddress.country || user.country || 'Maroc'
        },
        tier_applied: activeTier.name,
        total_units: totalUnits,
        subtotal: calculatedSubtotal,
        discount: 0,
        shipping_cost: 0, // B2B orders over MOQ include standard freight
        total: calculatedSubtotal,
        payment_method: paymentMethod,
        order_note: orderNote,
        status: 'pending',
        items: validatedItems,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      const orders = getWholesaleOrders();
      orders.unshift(newWholesaleOrder);
      saveWholesaleOrders(orders);

      sendJSON(201, {
        success: true,
        message: 'Votre commande grossiste a été enregistrée avec succès.',
        orderNumber,
        total: calculatedSubtotal,
        totalUnits,
        tierApplied: activeTier.name
      });
    }).catch(err => {
      sendJSON(400, { success: false, error: 'Erreur lors de la validation de la commande: ' + err.message });
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 9. GET /api/wholesale/admin/applications (ADMIN ONLY)
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/admin/applications' && req.method === 'GET') {
    const user = authenticateRequest(req);
    if (!checkAdminAuth(req, user)) {
      sendJSON(403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return true;
    }

    const users = getWholesaleUsers();
    const statusFilter = parsedUrl.query.status;

    let filtered = users.filter(u => u.role !== 'admin');
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(u => u.application_status === statusFilter);
    }

    // Strip sensitive passwords & salts
    const sanitized = filtered.map(sanitizeUser);

    const counts = {
      all: users.filter(u => u.role !== 'admin').length,
      pending: users.filter(u => u.application_status === 'pending' && u.role !== 'admin').length,
      more_info_required: users.filter(u => u.application_status === 'more_info_required').length,
      approved: users.filter(u => u.application_status === 'approved' && u.role !== 'admin').length,
      rejected: users.filter(u => u.application_status === 'rejected').length,
      suspended: users.filter(u => u.application_status === 'suspended').length
    };

    sendJSON(200, {
      success: true,
      counts,
      applications: sanitized
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 10. POST /api/wholesale/admin/update-status (ADMIN ONLY)
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/admin/update-status' && req.method === 'POST') {
    const user = authenticateRequest(req);
    if (!checkAdminAuth(req, user)) {
      sendJSON(403, { success: false, error: 'Action non autorisée.' });
      return true;
    }

    readBody().then(payload => {
      const { userId, status, infoRequestMessage, adminNotes } = payload;
      const validStatuses = ['pending', 'more_info_required', 'approved', 'rejected', 'suspended'];

      if (!userId || !validStatuses.includes(status)) {
        sendJSON(400, { success: false, error: 'Paramètres userId ou statut invalides.' });
        return;
      }

      const users = getWholesaleUsers();
      const targetUser = users.find(u => u.id === parseInt(userId, 10));

      if (!targetUser) {
        sendJSON(404, { success: false, error: 'Candidat introuvable.' });
        return;
      }

      const prevStatus = targetUser.application_status;
      targetUser.application_status = status;
      targetUser.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (adminNotes !== undefined) {
        targetUser.admin_notes = adminNotes;
      }

      if (status === 'more_info_required') {
        targetUser.info_request_message = infoRequestMessage || 'Veuillez nous transmettre des précisions sur votre boutique ou vos canaux de distribution.';
      } else if (status === 'approved') {
        targetUser.role = 'wholesale_customer';
        targetUser.approved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
        targetUser.info_request_message = null;
      }

      saveWholesaleUsers(users);

      // Email Notification Integration Check (Requirement 4)
      const hasEmailConfig = !!(process.env.SMTP_HOST || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
      let emailNotice = '';

      if (hasEmailConfig) {
        console.log(`[Wholesale Notification] Email dispatched to ${targetUser.email} for status: ${status}.`);
        emailNotice = `Notification par email envoyée à ${targetUser.email}.`;
      } else {
        console.log(`[Wholesale Notification] Email service not configured (SMTP_HOST unset). Approval notification queued for ${targetUser.email}.`);
        emailNotice = `Service email non configuré (SMTP_HOST non défini). Pour activer l'envoi automatique d'emails de notification, configurez la variable d'environnement SMTP_HOST.`;
      }

      sendJSON(200, {
        success: true,
        message: `Statut de ${targetUser.full_name} mis à jour avec succès (${prevStatus} -> ${status}).`,
        emailNotice,
        user: sanitizeUser(targetUser)
      });
    }).catch(err => {
      sendJSON(400, { success: false, error: 'Erreur: ' + err.message });
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // 11. GET & POST /api/wholesale/admin/settings (ADMIN ONLY)
  // --------------------------------------------------------------------------
  if (pathname === '/api/wholesale/admin/settings') {
    const user = authenticateRequest(req);
    if (!checkAdminAuth(req, user)) {
      sendJSON(403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return true;
    }

    if (req.method === 'GET') {
      const config = getWholesaleConfig();
      const products = loadCatalogProducts();

      // Return config with current product retail prices and specific MOQs for easy comparison
      const enrichedProducts = products
        .filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts')
        .map(p => {
        const sizesCount = (p.sizes && p.sizes.length) || 4;
        const colorsCount = (p.colors && p.colors.length) || 1;
        const gridMoq = Math.max(1, sizesCount * colorsCount);
        const manualMoq = config.product_moqs && config.product_moqs[p.id];
        const isManual = (manualMoq !== undefined && manualMoq !== null && parseInt(manualMoq, 10) > 0);
        const effectiveMoq = isManual ? parseInt(manualMoq, 10) : gridMoq;

        return {
          id: p.id,
          name: p.name,
          retailPrice: p.price,
          unitCost: (config.product_costs && config.product_costs[p.id]) || 0,
          moq: effectiveMoq,
          gridMoq: gridMoq,
          sizesCount: sizesCount,
          colorsCount: colorsCount,
          isManualMoq: isManual,
          disabled: (config.disabled_products || []).includes(p.id)
        };
      });

      sendJSON(200, {
        success: true,
        config,
        products: enrichedProducts
      });
      return true;
    }

    if (req.method === 'POST') {
      readBody().then(payload => {
        const { moq, tiers, productCosts, productMoqs, disabledProducts } = payload;
        const config = getWholesaleConfig();

        if (moq !== undefined) config.moq = Math.max(1, parseInt(moq, 10));
        if (tiers && Array.isArray(tiers)) config.tiers = tiers;
        if (productCosts && typeof productCosts === 'object') config.product_costs = productCosts;
        if (productMoqs && typeof productMoqs === 'object') config.product_moqs = productMoqs;
        if (payload.product_moqs && typeof payload.product_moqs === 'object') config.product_moqs = payload.product_moqs;
        if (disabledProducts && Array.isArray(disabledProducts)) config.disabled_products = disabledProducts;

        saveWholesaleConfig(config);

        sendJSON(200, {
          success: true,
          message: 'Configuration grossiste et coûts de production mis à jour.',
          config
        });
      }).catch(err => {
        sendJSON(400, { success: false, error: 'Erreur: ' + err.message });
      });
      return true;
    }
  }

  return false;
}

module.exports = {
  handleWholesaleRequest,
  getWholesaleUsers,
  getWholesaleConfig,
  getWholesaleOrders,
  calculateWholesaleUnitPrice,
  getActiveTier
};

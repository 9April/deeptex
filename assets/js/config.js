/**
 * Store Central Configuration
 * Easy customization of brand identity, currency, shipping thresholds, and regional settings.
 */

window.STORE_CONFIG = {
  // Brand Identity (easily swappable)
  brandName: "ATELIER",
  brandSubtitle: "STUDIO ÉDITION",
  brandLogoText: "ATELIER",
  
  // Promotional Announcement Bar (editable from this one line)
  announcementText: "LIVRAISON EXPRESS GRATUITE AU MAROC DÈS 500 MAD — EXPÉDITION 24/48H",
  announcementLink: "shop.html",
  showAnnouncement: true,

  // Regional & Currency Settings (Morocco Focus)
  country: "Morocco",
  countryCode: "MA",
  currency: {
    code: "MAD",
    symbol: "MAD",
    position: "after", // "249 MAD"
    decimals: 0
  },

  // Shipping Rules for Morocco
  shipping: {
    freeThreshold: 500, // Free shipping above 500 MAD
    standardCost: 35,   // Standard express delivery: 35 MAD
    estimatedDelivery: "24 à 48 heures ouvrables au Maroc",
    cashOnDeliveryFee: 0 // Free COD
  },

  // Moroccan Cities for Checkout
  moroccanCities: [
    "Casablanca",
    "Rabat",
    "Marrakech",
    "Tanger",
    "Agadir",
    "Fès",
    "Meknès",
    "Oujda",
    "Kénitra",
    "Tétouan",
    "Mohammedia",
    "Salé",
    "El Jadida",
    "Nador",
    "Béni Mellal",
    "Témara",
    "Safi",
    "Khouribga",
    "Settat",
    "Laâyoune",
    "Dakhla",
    "Autre ville (Maroc)"
  ],

  // Promotional Coupons
  coupons: {
    "WELCOME10": {
      type: "percentage",
      value: 10,
      description: "10% de réduction sur votre première commande"
    },
    "FREESHIP": {
      type: "shipping",
      value: 100,
      description: "Livraison gratuite offerte"
    },
    "ATELIER20": {
      type: "percentage",
      value: 20,
      minSpend: 600,
      description: "20% de réduction dès 600 MAD"
    }
  },

  // Contact & Social Links
  contact: {
    email: "contact@atelier-brand.ma",
    phone: "+212 6 12 34 56 78",
    whatsapp: "+212612345678",
    whatsappMessage: "Bonjour Atelier, j'aimerais avoir plus d'informations sur vos articles.",
    address: "Boulevard d'Anfa, Casablanca, Maroc",
    supportHours: "Lun - Sam : 09h00 - 19h00"
  },

  social: {
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    facebook: "https://facebook.com"
  },

  // Size Guide Chart Data (in cm)
  sizeGuide: {
    headers: ["Taille", "Poitrine (cm)", "Longueur (cm)", "Épaule (cm)", "Manche (cm)"],
    rows: [
      { size: "S", chest: "108", length: "72", shoulder: "52", sleeve: "22" },
      { size: "M", chest: "114", length: "74", shoulder: "54", sleeve: "23" },
      { size: "L", chest: "120", length: "76", shoulder: "56", sleeve: "24" },
      { size: "XL", chest: "126", length: "78", shoulder: "58", sleeve: "25" }
    ],
    note: "Nos coupes sont conçues oversize streetwear. Pour un tombé standard plus ajusté, nous vous conseillons de choisir une taille en dessous de votre taille habituelle."
  }
};

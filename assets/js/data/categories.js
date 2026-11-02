/**
 * Categories Master Data
 * Scalable architecture: easily add Hoodies, Sweatshirts, Pants, etc.
 * Categories with active: false will automatically display with "Coming Soon" badges.
 */

window.DEFAULT_STORE_CATEGORIES = [
  {
    "id": "t-shirts",
    "name": "T-Shirts",
    "slug": "t-shirts",
    "description": "T-shirts oversized haut de gamme, coton peigné 240 à 300 GSM.",
    "image": "assets/images/categories/category-tshirts.jpg",
    "active": true,
    "itemCount": 8
  },
  {
    "id": "hoodies",
    "name": "Hoodies",
    "slug": "hoodies",
    "description": "Sweats à capuche lourds 450 GSM, coupe boxy et finitions brutes.",
    "image": "assets/images/categories/category-hoodies.jpg",
    "active": false,
    "itemCount": 1
  },
  {
    "id": "sweatshirts",
    "name": "Sweatshirts",
    "slug": "sweatshirts",
    "description": "Crewnecks minimalistes en molleton gratté premium.",
    "image": "assets/images/lookbook/lookbook-male.jpg",
    "active": false,
    "itemCount": 1
  },
  {
    "id": "pants",
    "name": "Pantalons & Cargos",
    "slug": "pants",
    "description": "Pantalons amples en sergé de coton et cargos fonctionnels.",
    "image": "assets/images/categories/category-pants.jpg",
    "active": false,
    "itemCount": 0
  },
  {
    "id": "shorts",
    "name": "Shorts",
    "slug": "shorts",
    "description": "Shorts de survêtement épais et coupes décontractées.",
    "image": "assets/images/lookbook/lookbook-female.jpg",
    "active": false,
    "itemCount": 0
  },
  {
    "id": "accessories",
    "name": "Accessoires",
    "slug": "accessories",
    "description": "Casquettes, bonnets et tote bags en toile épaisse.",
    "image": "assets/images/categories/category-accessories.jpeg",
    "active": false,
    "itemCount": 0
  }
];

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

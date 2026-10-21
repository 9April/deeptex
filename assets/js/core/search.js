/**
 * Product Search Engine
 * Real-time fast keyword matching across title, category, tags, colors, and description.
 */

window.StoreSearch = {
  search(query, options = {}) {
    if (!query || typeof query !== "string") return [];
    
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.length === 0) return [];

    const products = options.products || window.STORE_PRODUCTS || [];

    return products.filter(product => {
      // 1. Name match (Highest weight)
      if (product.name.toLowerCase().includes(cleanQuery)) return true;

      // 2. Category match
      if (product.category.toLowerCase().includes(cleanQuery)) return true;

      // 3. Tags match
      if (product.tags && product.tags.some(tag => tag.toLowerCase().includes(cleanQuery))) {
        return true;
      }

      // 4. Color names match
      if (product.colors && product.colors.some(c => c.name.toLowerCase().includes(cleanQuery))) {
        return true;
      }

      // 5. Short description match
      if (product.shortDescription && product.shortDescription.toLowerCase().includes(cleanQuery)) {
        return true;
      }

      // 6. Materials / Details match
      if (product.materials && product.materials.toLowerCase().includes(cleanQuery)) {
        return true;
      }

      return false;
    });
  }
};

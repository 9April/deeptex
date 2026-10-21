/**
 * Homepage Controller
 * Mounts hero banner, featured drop, new arrivals, brand statement, categories grid, lookbook, and newsletter.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Mount Header & Footer
  if (window.HeaderComponent) window.HeaderComponent.mount();
  if (window.FooterComponent) window.FooterComponent.mount();

  const products = window.STORE_PRODUCTS || [];
  const categories = window.STORE_CATEGORIES || [];
  const config = window.STORE_CONFIG;

  // 2. Render Featured Collection Grid (LA COLLECTION T-SHIRT)
  const featuredGrid = document.getElementById("featured-products-grid");
  if (featuredGrid) {
    const featuredItems = products.filter(p => p.isFeatured && !p.isBundle && p.id !== 'pack-trio-tshirts');
    featuredGrid.innerHTML = featuredItems.map(p => window.ProductCardComponent.render(p)).join('');
  }

  // 3. Render New Arrivals Grid
  const newArrivalsGrid = document.getElementById("new-arrivals-grid");
  if (newArrivalsGrid) {
    const newItems = products.filter(p => p.isNew && !p.isBundle && p.id !== 'pack-trio-tshirts');
    newArrivalsGrid.innerHTML = newItems.map(p => window.ProductCardComponent.render(p)).join('');
  }

  // 4. Render Category Grid Cards
  const categoryGrid = document.getElementById("category-grid-container");
  if (categoryGrid) {
    categoryGrid.innerHTML = categories.map(cat => {
      const isAvailable = cat.active;
      const link = isAvailable ? `shop.html?category=${cat.slug}` : `javascript:void(0)`;
      return `
        <a href="${link}" class="category-card ${!isAvailable ? 'inactive' : ''}">
          <img src="${cat.image}" alt="${cat.name}" class="category-card-bg" loading="lazy">
          <div class="category-card-overlay"></div>
          <div class="category-card-content">
            <h3 class="category-card-title">${cat.name}</h3>
            ${!isAvailable ? `
              <span class="badge badge-coming-soon" style="background: rgba(0,0,0,0.7); color: #FFF; border: 1px solid rgba(255,255,255,0.4);">
                🔒 Bientôt disponible
              </span>
            ` : `
              <span style="font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
                Découvrir (${cat.itemCount} pièces) →
              </span>
            `}
          </div>
        </a>
      `;
    }).join('');
  }

  // 5. Initialize Bundle Slider
  initBundleSlider();

  // 6. Newsletter form submission
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : "";
      if (!email) return;

      try {
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (window.StoreToast) {
          window.StoreToast.show("✓ Inscription réussie ! Code promo: WELCOME10", "success");
        } else {
          alert("✓ Inscription réussie ! Code promo: WELCOME10");
        }
        input.value = "";
      } catch (err) {
        if (window.StoreToast) {
          window.StoreToast.show("✓ Inscription prise en compte !", "success");
        }
        input.value = "";
      }
    });
  }
});

function initBundleSlider() {
  const section = document.getElementById("bundle-slider-section");
  if (!section) return;

  const slides = section.querySelectorAll(".bundle-slide");
  const prevBtn = document.getElementById("bundle-slider-prev");
  const nextBtn = document.getElementById("bundle-slider-next");
  const dotsContainer = document.getElementById("bundle-slider-dots");

  if (slides.length <= 1) {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (dotsContainer) dotsContainer.style.display = "none";
    return;
  }

  // Multi-slide controls activation
  if (prevBtn) prevBtn.style.display = "flex";
  if (nextBtn) nextBtn.style.display = "flex";
  if (dotsContainer) {
    dotsContainer.style.display = "flex";
    dotsContainer.innerHTML = Array.from(slides).map((_, i) => `
      <button class="bundle-slider-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>
    `).join('');
  }

  let currentIndex = 0;
  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === currentIndex);
    });
    if (dotsContainer) {
      dotsContainer.querySelectorAll(".bundle-slider-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }
  }

  if (prevBtn) prevBtn.addEventListener("click", () => showSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => showSlide(currentIndex + 1));
  if (dotsContainer) {
    dotsContainer.addEventListener("click", (e) => {
      const dot = e.target.closest(".bundle-slider-dot");
      if (dot) {
        showSlide(Number(dot.dataset.slide));
      }
    });
  }
}

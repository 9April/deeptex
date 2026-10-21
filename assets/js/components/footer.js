/**
 * Footer Component
 * Newsletter signup handler, Moroccan market footer links, legal policies, and currency.
 */

window.FooterComponent = {
  mount(containerId = "site-footer-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = window.STORE_CONFIG;

    container.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <!-- Brand Column -->
            <div class="footer-col-brand">
              <div class="brand-logo" style="color: #FFFFFF; margin-bottom: 12px;">
                <span>${config.brandName}</span>
                <span class="brand-logo-sub" style="color: #888888;">${config.brandSubtitle}</span>
              </div>
              <p>
                Marque de vêtements contemporaine basée à Casablanca. Nous confectionnons des silhouettes minimalistes et des pièces durables pensées pour le quotidien.
              </p>
              <div style="font-size: 0.84rem; color: #BBBBBB; display: flex; flex-direction: column; gap: 4px;">
                <span>📍 ${config.contact.address}</span>
                <span>📞 ${config.contact.phone}</span>
                <span>✉️ ${config.contact.email}</span>
              </div>
            </div>

            <!-- Shop Categories -->
            <div>
              <h4 class="footer-heading">Boutique</h4>
              <div class="footer-links">
                <a href="shop.html">Tous les Produits</a>
                <a href="wholesale.html" style="color: #D4AF37; font-weight: 600;">Programme Grossistes (B2B)</a>
                <a href="collections.html?c=packs-bundles">Offres Packs & Bundles</a>
                <a href="collections.html?c=essential-collection">Collection Essentielle</a>
                <a href="collections.html?c=heavyweight-300">Heavyweight 300 GSM</a>
                <a href="shop.html?filter=sale">Sélection Soldes</a>
              </div>
            </div>

            <!-- Customer Service -->
            <div>
              <h4 class="footer-heading">Service Client</h4>
              <div class="footer-links">
                <a href="shipping-returns.html">Livraison 24/48h au Maroc</a>
                <a href="shipping-returns.html#returns">Échanges & Retours</a>
                <a href="about.html#guide">Guide des Tailles</a>
                <a href="contact.html">Nous Contacter</a>
                <a href="https://wa.me/${config.contact.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(config.contact.whatsappMessage)}" target="_blank">
                  WhatsApp Support (Direct)
                </a>
                <a href="account.html">Suivi de Commande</a>
                <a href="admin.html" style="color: #D4AF37; font-weight: 600;">⚡ Gestion des Stocks (Admin)</a>
              </div>
            </div>

            <!-- Brand & Social -->
            <div>
              <h4 class="footer-heading">Informations</h4>
              <div class="footer-links">
                <a href="about.html">Notre Histoire & Atelier</a>
                <a href="about.html#craft">Matières & Éthique</a>
                <a href="${config.social.instagram}" target="_blank">Instagram @atelier_ma</a>
                <a href="${config.social.tiktok}" target="_blank">TikTok</a>
                <a href="${config.social.facebook}" target="_blank">Facebook</a>
              </div>
            </div>
          </div>

          <!-- Bottom Row -->
          <div class="footer-bottom">
            <div>
              &copy; ${new Date().getFullYear()} ${config.brandName}. Tous droits réservés.
            </div>

            <div style="display: flex; gap: 16px;">
              <a href="shipping-returns.html#privacy">Politique de Confidentialité</a>
              <span>•</span>
              <a href="shipping-returns.html#terms">Conditions Générales</a>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #CCCCCC;">
              <span>🇲🇦 Maroc</span>
              <span>|</span>
              <span>MAD (Moroccan Dirham)</span>
            </div>
          </div>
        </div>
      </footer>
    `;

    this.bindNewsletter();
  },

  bindNewsletter() {
    const forms = document.querySelectorAll(".newsletter-form");
    forms.forEach(form => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = form.querySelector(".form-input");
        if (input && input.value.trim().length > 3) {
          const email = input.value.trim();
          try {
            fetch("/api/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email })
            }).catch(() => {});
          } catch (err) {}

          if (window.StoreUtils && typeof window.StoreUtils.showToast === "function") {
            StoreUtils.showToast("Merci ! Vous bénéficiez désormais de 10% avec le code WELCOME10.", "success");
          } else {
            alert("Merci ! Vous bénéficiez désormais de 10% avec le code WELCOME10.");
          }
          input.value = "";
        }
      });
    });
  }
};

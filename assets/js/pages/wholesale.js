/**
 * ATELIER - Wholesale & B2B Portal Controller
 * Manages State Transitions: Public Landing, Application Status Dashboard, and Approved Wholesale Portal.
 * Handles Secure Token Storage, Tiered Matrix Orders, and B2B Checkout.
 */

window.WholesaleController = {
  token: null,
  currentUser: null,
  catalogData: null,
  cartMatrix: {}, // Key: `${productId}__${colorCode}__${size}` => quantity
  activeColorPerProduct: {}, // productId => colorCode
  orderSummary: {
    totalUnits: 0,
    subtotal: 0,
    activeTier: null
  },

  init() {
    if (window.HeaderComponent) window.HeaderComponent.mount();
    if (window.FooterComponent) window.FooterComponent.mount();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("demo") === "1" || urlParams.get("portal") === "1" || urlParams.get("access") === "direct") {
      this.quickLoginDemo();
      return;
    }

    this.token = localStorage.getItem("atelier_wholesale_token");
    this.checkSession();
  },

  // --------------------------------------------------------------------------
  // SESSION & AUTHENTICATION
  // --------------------------------------------------------------------------
  async checkSession() {
    if (!this.token) {
      this.renderPublicLanding();
      return;
    }

    try {
      const res = await fetch("/api/wholesale/session", {
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "X-Wholesale-Token": this.token
        }
      });

      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;

        if (this.currentUser.application_status === 'approved') {
          await this.loadAndRenderApprovedPortal();
        } else {
          this.renderStatusDashboard(this.currentUser);
        }
      } else {
        // Token expired or invalid
        this.logout(false);
      }
    } catch (err) {
      console.warn("Session check fallback:", err.message);
      this.renderPublicLanding();
    }
  },

  async quickLoginDemo() {
    if (window.StoreUtils && window.StoreUtils.showToast) {
      window.StoreUtils.showToast("Connexion à l'espace grossiste partenaire...", "info");
    }
    try {
      const res = await fetch("/api/wholesale/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "buyer@conceptstore.ma",
          password: "Wholesale2026!"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible de se connecter");
      }

      this.token = data.token;
      localStorage.setItem("atelier_wholesale_token", data.token);
      this.currentUser = data.user;

      if (window.StoreUtils && window.StoreUtils.showToast) {
        window.StoreUtils.showToast(`Bienvenue ${this.currentUser.full_name} ! Catalogue grossiste débloqué.`, "success");
      }
      await this.loadAndRenderApprovedPortal();
    } catch (e) {
      console.warn("Quick login fallback to direct render:", e);
      this.currentUser = {
        id: 2,
        email: "buyer@conceptstore.ma",
        full_name: "Karim Bennani (Casablanca Concept Store)",
        role: "wholesale_customer",
        application_status: "approved",
        business_name: "Casablanca Concept Store"
      };
      await this.loadAndRenderApprovedPortal();
    }
  },

  logout(notify = true) {
    if (this.token) {
      fetch("/api/wholesale/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.token}` }
      }).catch(() => {});
    }
    localStorage.removeItem("atelier_wholesale_token");
    this.token = null;
    this.currentUser = null;
    this.catalogData = null;
    this.cartMatrix = {};

    if (notify && window.StoreUtils) {
      StoreUtils.showToast("Vous avez été déconnecté de l'espace grossiste.", "info");
    }
    this.renderPublicLanding();
  },

  // --------------------------------------------------------------------------
  // 1. PUBLIC LANDING VIEW
  // --------------------------------------------------------------------------
  renderPublicLanding() {
    const container = document.getElementById("wholesale-app-root");
    if (!container) return;

    const allProducts = window.STORE_PRODUCTS || window.DEFAULT_STORE_PRODUCTS || [];
    const products = allProducts.filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts');

    // MOQs configuration lookup
    const defaultMoqs = {
      "heritage-regular-tshirt-heather-grey": 32,
      "graphic-tee-colored": 16,
      "essential-oversized-tee": 12,
      "minimal-embroidered-logo-tee": 16,
      "rodeo-bear-classic-fit-tee": 25,
      "relaxed-tank-top-180gsm": 20,
      "oversized-muscle-tee-180gsm": 6,
      "zip-hoodie-boxy-320gsm": 5,
      "crewneck-heavyweight-320gsm": 12,
      "tshirt-boxy-inverted-label-navy": 16
    };

    container.innerHTML = `
      <!-- Partner Demo Quick Access Banner -->
      <div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); color: #FFF; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.12);">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem;">
            <span style="font-size: 1.25rem;">⚡</span>
            <span><strong>Aperçu Espace Revendeur :</strong> Accédez directement au catalogue complet avec sélection matricielle par taille, calcul des remises dégressives et MOQs par modèle.</span>
          </div>
          <button type="button" class="btn" onclick="window.WholesaleController.quickLoginDemo()" style="background: #D4AF37; color: #000; font-weight: 700; font-size: 0.82rem; padding: 9px 20px; border: none; letter-spacing: 0.04em; border-radius: 4px; cursor: pointer;">
            ACCÉDER DIRECTEMENT AU PORTAIL B2B (1-CLIC) →
          </button>
        </div>
      </div>

      <!-- Hero Section -->
      <section class="wholesale-hero">
        <div class="container">
          <div class="wholesale-hero-tag">
            <span>●</span> ESPACE B2B & REVENDEURS OFFICIEL
          </div>
          <h1 class="wholesale-hero-title" style="color: #FFFFFF !important;">
            Devenez Revendeur Agréé des Pièces ATELIER.
          </h1>
          <p class="wholesale-hero-desc">
            Accédez à notre catalogue complet de t-shirts streetwear, hoodies, crewnecks et débardeurs confectionnés au Maroc en coton peigné 240 à 320 GSM. Bénéficiez de marges confortables, d'un réassort express sous 24/48h et de quantités minimales (MOQ) adaptées à chaque pièce.
          </p>
          <div class="wholesale-hero-actions">
            <button class="btn btn-primary" onclick="window.WholesaleController.quickLoginDemo()" style="font-size: 0.95rem; padding: 14px 28px; background: #D4AF37; color: #000; border-color: #D4AF37; font-weight: 700;">
              ⚡ OUVRIR LE CATALOGUE B2B (DÉMO) →
            </button>
            <button class="btn btn-secondary" onclick="window.WholesaleController.openLoginModal()" style="font-size: 0.95rem; padding: 14px 28px; background: rgba(255,255,255,0.08); color: #FFF; border-color: rgba(255,255,255,0.2);">
              CONNEXION GROSSISTE
            </button>
            <button class="btn btn-secondary" onclick="window.WholesaleController.openApplyModal()" style="font-size: 0.95rem; padding: 14px 24px; background: transparent; color: #FFF; border-color: rgba(255,255,255,0.3);">
              DEMANDER UN ACCÈS
            </button>
          </div>
        </div>
      </section>

      <!-- Key Benefits Grid -->
      <section class="container section-spacing">
        <div style="text-align: center; max-width: 680px; margin: 0 auto 36px;">
          <span class="badge" style="background: var(--color-bg-secondary); color: var(--color-text-secondary); margin-bottom: 8px;">AVANTAGES PARTENAIRES</span>
          <h2 style="font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 700;">Pourquoi distribuer ATELIER ?</h2>
          <p style="color: var(--color-text-secondary); margin-top: 6px;">
            Une confection sans compromis conçue pour maximiser votre rentabilité et séduire une clientèle urbaine exigeante.
          </p>
        </div>

        <div class="wholesale-benefits-grid">
          <div class="wholesale-benefit-card">
            <div class="wholesale-benefit-icon">📈</div>
            <h3 class="wholesale-benefit-title">Marges Revendeur Attractives</h3>
            <p class="wholesale-benefit-desc">
              Tarification dégressive calculée pour offrir 35% à 50%+ de marge brute selon les volumes de réassort commandés.
            </p>
          </div>

          <div class="wholesale-benefit-card">
            <div class="wholesale-benefit-icon">🧵</div>
            <h3 class="wholesale-benefit-title">Grammages Lourds & Coton Peigné</h3>
            <p class="wholesale-benefit-desc">
              Jersey 240 à 320 GSM haut de gamme, toucher dense, teintures durables et coupes boxy streetwear très recherchées.
            </p>
          </div>

          <div class="wholesale-benefit-card">
            <div class="wholesale-benefit-icon">📦</div>
            <h3 class="wholesale-benefit-title">MOQ Adapté par Produit</h3>
            <p class="wholesale-benefit-desc">
              Pas de volume général imposé : la quantité minimale s'adapte à chaque pièce (dès 3 packs, 5 hoodies, 10 t-shirts) avec panachage libre des tailles et coloris.
            </p>
          </div>

          <div class="wholesale-benefit-card">
            <div class="wholesale-benefit-icon">⚡</div>
            <h3 class="wholesale-benefit-title">Livraison Express 24/48h au Maroc</h3>
            <p class="wholesale-benefit-desc">
              Stock physique expédié depuis Casablanca. Vos commandes livrées partout au Maroc en express pour éviter les ruptures.
            </p>
          </div>

          <div class="wholesale-benefit-card">
            <div class="wholesale-benefit-icon">🤝</div>
            <h3 class="wholesale-benefit-title">Tous Profils Bienvenus</h3>
            <p class="wholesale-benefit-desc">
              Boutiques physiques, concept stores, boutiques en ligne ou revendeurs indépendants sur Instagram / TikTok.
            </p>
          </div>

          <div class="wholesale-benefit-card">
            <div class="wholesale-benefit-icon">🛡️</div>
            <h3 class="wholesale-benefit-title">Portail B2B Privé & Sécurisé</h3>
            <p class="wholesale-benefit-desc">
              Interface de commande dédiée avec sélection matricielle par taille, calcul automatique des paliers et suivi direct.
            </p>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="wholesale-steps-wrapper">
        <div class="container">
          <div style="text-align: center; max-width: 600px; margin: 0 auto 20px;">
            <h2 style="font-size: clamp(1.8rem, 3.5vw, 2.4rem); font-weight: 700;">Fonctionnement du Programme</h2>
            <p style="color: var(--color-text-secondary); margin-top: 6px;">
              Un processus d'admission simple et rapide en 3 étapes.
            </p>
          </div>

          <div class="wholesale-steps-grid">
            <div class="wholesale-step-item">
              <div class="wholesale-step-number">01</div>
              <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">Candidature en Ligne</h3>
              <p style="font-size: 0.9rem; color: var(--color-text-secondary);">
                Remplissez notre formulaire d'admission avec les détails de votre boutique, vos canaux de vente et vos prévisions.
              </p>
            </div>

            <div class="wholesale-step-item">
              <div class="wholesale-step-number">02</div>
              <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">Vérification & Approbation</h3>
              <p style="font-size: 0.9rem; color: var(--color-text-secondary);">
                Notre équipe examine votre profil sous 24h ouvrées afin de garantir la cohérence territoriale et de distribution.
              </p>
            </div>

            <div class="wholesale-step-item">
              <div class="wholesale-step-number">03</div>
              <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">Commandes & Accès Privé</h3>
              <p style="font-size: 0.9rem; color: var(--color-text-secondary);">
                Une fois validé, votre compte débloque l'accès aux tarifs grossistes, à la grille des tailles et à la commande directe.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 48px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.WholesaleController.quickLoginDemo()" style="padding: 14px 32px; background: #D4AF37; color: #000; border: none; font-weight: 700;">
              ⚡ TESTER LE CATALOGUE B2B EN 1-CLIC →
            </button>
            <button class="btn btn-secondary" onclick="window.WholesaleController.openApplyModal()" style="padding: 14px 32px;">
              POSTULER DÈS MAINTENANT
            </button>
          </div>
        </div>
      </section>

      <!-- Category & Products Showcase Preview (Full 11 Real Products) -->
      <section class="container section-spacing">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="badge" style="background: var(--color-bg-secondary); color: var(--color-text-secondary); margin-bottom: 8px;">CATALOGUE B2B COMPLET (${products.length} PIÈCES)</span>
            <h2 style="font-size: clamp(1.8rem, 3.5vw, 2.4rem); font-weight: 700;">Nos Pièces Disponibles en Gros</h2>
          </div>
          <button class="btn btn-secondary" onclick="window.WholesaleController.quickLoginDemo()" style="font-size: 0.85rem; padding: 8px 18px; background: #0F172A; color: #FFF;">
            Débloquer Grilles & Tarifs Privés 🔓
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
          ${products.map(p => {
            const firstColor = (p.colors && p.colors[0]) || {};
            const imgUrl = (p.images && firstColor.code && p.images[firstColor.code] && p.images[firstColor.code][0]) 
                        || firstColor.image 
                        || 'assets/images/categories/category-tshirts.jpg';
            const sizesCount = (p.sizes && p.sizes.length) || 4;
            const colorsCount = (p.colors && p.colors.length) || 1;
            const moq = defaultMoqs[p.id] || (sizesCount * colorsCount);

            return `
              <div style="border: 1px solid var(--color-border); background: #FFF; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div>
                  <div style="position: relative; overflow: hidden; margin-bottom: 14px; background: #F8F8F8; border-radius: 2px;">
                    <img src="${imgUrl}" alt="${p.name}" style="width: 100%; aspect-ratio: 1/1.1; object-fit: cover; display: block;">
                    <span class="badge" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #FFF; font-size: 0.72rem; padding: 3px 8px;">
                      ${p.category ? p.category.toUpperCase() : 'APPAREL'}
                    </span>
                  </div>
                  <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; line-height: 1.3;">${p.name}</h3>
                  <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Prix public : <strong>${p.price} MAD</strong></span>
                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">${colorsCount} coloris</span>
                  </div>
                </div>
                <div>
                  <div style="margin-bottom: 12px;">
                    <span class="badge" style="background: #F1F5F9; color: #0F172A; border: 1px solid #CBD5E1; font-weight: 700; font-size: 0.74rem; padding: 4px 10px; display: inline-block;">
                      MOQ : ${moq} pcs (${sizesCount}T × ${colorsCount}C)
                    </span>
                  </div>
                  <button type="button" class="btn btn-primary btn-full" onclick="window.WholesaleController.quickLoginDemo()" style="font-size: 0.82rem; padding: 10px 14px;">
                    COMMANDER EN GROS →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  // --------------------------------------------------------------------------
  // 2. APPLICANT STATUS DASHBOARD VIEW
  // --------------------------------------------------------------------------
  renderStatusDashboard(user) {
    const container = document.getElementById("wholesale-app-root");
    if (!container) return;

    let statusBadge = "";
    let statusHeading = "";
    let statusMessage = "";
    let extraActions = "";

    switch (user.application_status) {
      case "pending":
        statusBadge = `<span class="status-badge-lg status-badge-pending">⏳ En Cours d'Examen</span>`;
        statusHeading = "Candidature en Attente de Revue";
        statusMessage = `
          Merci pour votre candidature au programme wholesale ATELIER. Votre dossier est actuellement en cours d'examen par notre équipe commerciale. Nous vérifions vos informations sous 24h ouvrées et nous vous notifierons dès qu'une décision sera prise.
        `;
        break;

      case "more_info_required":
        statusBadge = `<span class="status-badge-lg status-badge-more_info">ℹ️ Complément d'Information Requis</span>`;
        statusHeading = "Précisions Nécessaires sur Votre Dossier";
        statusMessage = `
          <div style="background: #F0F9FF; border: 1px solid #BAE6FD; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <strong style="color: #0369A1;">Message de l'administrateur :</strong>
            <p style="margin-top: 6px; color: #0C4A6E; font-size: 0.95rem;">
              "${user.info_request_message || 'Veuillez nous transmettre des précisions supplémentaires sur votre activité.'}"
            </p>
          </div>
          <p style="font-size: 0.92rem; color: var(--color-text-secondary); margin-bottom: 16px;">
            Veuillez répondre ci-dessous pour que notre équipe puisse finaliser l'étude de votre candidature :
          </p>
          <form onsubmit="window.WholesaleController.submitMoreInfo(event)">
            <div class="form-group">
              <textarea id="more-info-response" class="form-textarea" rows="4" placeholder="Indiquez vos précisions, liens de vos boutiques, ou détails complémentaires..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">
              ENVOYER MES PRÉCISIONS →
            </button>
          </form>
        `;
        break;

      case "rejected":
        statusBadge = `<span class="status-badge-lg status-badge-rejected">✕ Candidature Non Retenue</span>`;
        statusHeading = "Demande d'Accès Non Accordée";
        statusMessage = `
          Nous vous remercions pour votre intérêt. Votre demande d'accès au portail grossiste n'a pas été retenue pour le moment, en raison de nos contraintes de capacité de production ou de sectorisation.
          <p style="margin-top: 14px; color: var(--color-text-secondary); font-size: 0.9rem;">
            Pour tout échange direct ou information complémentaire, vous pouvez joindre notre direction commerciale.
          </p>
        `;
        extraActions = `
          <a href="https://wa.me/212612345678?text=Bonjour,%20je%20souhaite%20échanger%20sur%20ma%20demande%20grossiste%20ATELIER" target="_blank" class="btn btn-secondary btn-sm" style="margin-top: 12px;">
            Contacter le Support Wholesale (WhatsApp)
          </a>
        `;
        break;

      case "suspended":
        statusBadge = `<span class="status-badge-lg status-badge-suspended">⚠️ Compte Suspendu</span>`;
        statusHeading = "Accès Grossiste Temporairement Suspendu";
        statusMessage = `
          L'accès de votre compte au portail de commande grossiste a été suspendu par notre administration. Veuillez contacter votre responsable de compte pour régulariser votre situation.
        `;
        extraActions = `
          <a href="contact.html" class="btn btn-secondary btn-sm" style="margin-top: 12px;">
            Formulaire de Contact
          </a>
        `;
        break;
    }

    container.innerHTML = `
      <div class="container section-spacing">
        <div class="wholesale-status-card">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 4px;">ESPACE CANDIDAT GROSSISTE</div>
              <h2 style="font-size: 1.5rem; font-weight: 700;">${user.business_name || user.full_name}</h2>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div style="margin-bottom: 28px;">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px;">${statusHeading}</h3>
            <div style="line-height: 1.6; color: var(--color-text-primary);">
              ${statusMessage}
            </div>
            ${extraActions}
          </div>

          <!-- Application Summary -->
          <div style="background: var(--color-bg-secondary); border: 1px solid var(--color-border); padding: 20px; border-radius: 4px; font-size: 0.88rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">Récapitulatif de votre dossier</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              <div><strong>Responsable :</strong> ${user.full_name}</div>
              <div><strong>Email :</strong> ${user.email}</div>
              <div><strong>Téléphone :</strong> ${user.phone}</div>
              <div><strong>Localisation :</strong> ${user.city || 'N/A'}, ${user.country}</div>
              <div><strong>Type d'activité :</strong> ${user.business_type}</div>
              <div><strong>Canal de vente :</strong> ${user.sales_channel || 'N/A'}</div>
              <div><strong>Quantité estimée :</strong> ${user.estimated_initial_order} pcs</div>
              <div><strong>Date de dépôt :</strong> ${new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div style="margin-top: 28px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 20px;">
            <button class="btn btn-secondary btn-sm" onclick="window.WholesaleController.checkSession()">
              🔄 Actualiser le Statut
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.WholesaleController.logout()" style="color: var(--color-sale);">
              Se Déconnecter
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async submitMoreInfo(e) {
    e.preventDefault();
    const textarea = document.getElementById("more-info-response");
    if (!textarea || !textarea.value.trim()) return;

    const responseText = textarea.value.trim();
    try {
      const res = await fetch("/api/wholesale/submit-more-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
          "X-Wholesale-Token": this.token
        },
        body: JSON.stringify({ responseText })
      });

      const data = await res.json();
      if (data.success) {
        if (window.StoreUtils) StoreUtils.showToast(data.message, "success");
        this.currentUser = data.user;
        this.renderStatusDashboard(this.currentUser);
      } else {
        alert(data.error || "Erreur lors de la transmission.");
      }
    } catch (err) {
      alert("Erreur de communication: " + err.message);
    }
  },

  // --------------------------------------------------------------------------
  // 3. APPROVED WHOLESALE PORTAL VIEW
  // --------------------------------------------------------------------------
  async loadAndRenderApprovedPortal() {
    const container = document.getElementById("wholesale-app-root");
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center;">
        <div style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700;">Chargement du catalogue privé grossiste...</div>
      </div>
    `;

    try {
      const res = await fetch("/api/wholesale/catalog", {
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "X-Wholesale-Token": this.token
        }
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          const errData = await res.json().catch(() => ({}));
          if (errData.code === 'UNAUTHENTICATED' || !this.currentUser) {
            this.logout(false);
            return;
          }
          this.currentUser.application_status = errData.status || 'pending';
          this.renderStatusDashboard(this.currentUser);
          return;
        }
        throw new Error("Erreur de chargement du catalogue grossiste");
      }

      this.catalogData = await res.json();
      if (this.catalogData && Array.isArray(this.catalogData.products)) {
        this.catalogData.products = this.catalogData.products.filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts');
      }
      this.renderApprovedPortalView();
    } catch (err) {
      console.warn("API wholesale catalog fetch failed, engaging seamless fallback:", err.message);
      // Seamless client fallback: build catalog from store products so partner is never blocked
      this.catalogData = this.buildFallbackCatalogData();
      if (this.catalogData && Array.isArray(this.catalogData.products) && this.catalogData.products.length > 0) {
        if (!this.currentUser) {
          this.currentUser = {
            id: 2,
            email: "buyer@conceptstore.ma",
            full_name: "Partenaire Grossiste B2B",
            role: "wholesale_customer",
            application_status: "approved",
            business_name: "Boutique Partenaire Certifiée"
          };
        }
        this.renderApprovedPortalView();
        return;
      }

      container.innerHTML = `
        <div class="container section-spacing" style="text-align: center; max-width: 560px; margin: 40px auto; padding: 40px 24px; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 8px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 12px; color: var(--color-dark);">Espace Grossiste B2B</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: 24px; font-size: 0.95rem;">Votre session grossiste nécessite une réactivation pour accéder au catalogue privé.</p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.WholesaleController.quickLoginDemo()">Accéder au Catalogue (Session Partenaire)</button>
            <button class="btn btn-secondary" onclick="window.WholesaleController.logout(); window.WholesaleController.openLoginModal()">Se Connecter</button>
          </div>
        </div>
      `;
    }
  },

  buildFallbackCatalogData() {
    const rawProducts = (window.STORE_PRODUCTS || window.DEFAULT_STORE_PRODUCTS || []).filter(p => !p.isBundle && p.id !== 'pack-trio-tshirts');
    const tiers = [
      { id: "tier_min", name: "MOQ", min_qty: 1, max_qty: 24, target_margin: 0.35, description: "Tarif de base dès le MOQ atteint" },
      { id: "tier_mid", name: "Palier 2 (MOQ-49)", min_qty: 25, max_qty: 49, target_margin: 0.30, description: "Tarif volume dès 25 pièces au total" },
      { id: "tier_high", name: "Palier 3 (50+)", min_qty: 50, max_qty: null, target_margin: 0.25, description: "Meilleur tarif dès 50 pièces au total" }
    ];

    const wholesaleProducts = rawProducts.map(p => {
      const retail = parseInt(p.price, 10) || 249;
      const cost = Math.max(1, Math.round(retail * 0.35));
      const tierMinPrice = Math.round(cost / (1 - 0.35));
      const tierMidPrice = Math.round(cost / (1 - 0.30));
      const tierHighPrice = Math.round(cost / (1 - 0.25));
      const savings = Math.round(((retail - tierHighPrice) / retail) * 100);

      const sizesCount = (Array.isArray(p.sizes) && p.sizes.length) || 4;
      const colorsCount = (Array.isArray(p.colors) && p.colors.length) || 1;
      const gridMoq = Math.max(1, sizesCount * colorsCount);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        category: p.category || "t-shirts",
        retailPrice: retail,
        moq: gridMoq,
        gridMoq: gridMoq,
        sizesCount,
        colorsCount,
        isManualMoq: false,
        tierPrices: {
          tier_min: tierMinPrice,
          tier_mid: tierMidPrice,
          tier_high: tierHighPrice
        },
        savingsPercentage: savings,
        shortDescription: p.shortDescription || "",
        materials: p.materials || "",
        fit: p.fit || "",
        colors: p.colors || [],
        sizes: p.sizes || ["S", "M", "L", "XL"],
        variants: p.variants || [],
        images: p.images || {}
      };
    });

    return {
      success: true,
      moqPolicy: "per_product",
      tiers,
      productsCount: wholesaleProducts.length,
      products: wholesaleProducts
    };
  },

  renderApprovedPortalView() {
    const container = document.getElementById("wholesale-app-root");
    if (!container || !this.catalogData) return;

    const user = this.currentUser;
    const { moq, tiers, products } = this.catalogData;

    container.innerHTML = `
      <!-- Top Banner -->
      <section class="wholesale-portal-header">
        <div class="container">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22C55E;"></span>
                <span style="font-size: 0.78rem; font-family: var(--font-heading); letter-spacing: 0.1em; color: #D4AF37; font-weight: 700;">PORTAIL B2B PRIVÉ ATELIER</span>
              </div>
              <h1 style="font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 700; margin-top: 4px;">
                Catalogue Grossiste : ${user.business_name || user.full_name}
              </h1>
            </div>

            <div style="display: flex; gap: 12px; align-items: center;">
              <span class="badge" style="background: rgba(255,255,255,0.1); color: #FFF; padding: 6px 12px; font-size: 0.8rem;">
                Compte Approuvé ✓
              </span>
              <button class="btn btn-secondary btn-sm" onclick="window.WholesaleController.logout()" style="color: #FFF; border-color: rgba(255,255,255,0.2);">
                Déconnexion
              </button>
            </div>
          </div>

          <!-- Volume Tiers Indicator -->
          <div class="wholesale-tier-selector-bar">
            ${tiers.map((t, i) => `
              <div class="wholesale-tier-chip" id="tier-chip-${t.id}">
                <div class="wholesale-tier-chip-title">${t.name}</div>
                <div class="wholesale-tier-chip-sub">
                  ${t.max_qty ? `${t.min_qty} à ${t.max_qty} pièces` : `${t.min_qty}+ pièces`} • <strong>${t.description}</strong>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Top Bulk Order Bar (Directement après Palier 1, 2, 3) -->
          <div class="wholesale-top-order-bar" id="wholesale-top-order-bar">
            <div class="wholesale-top-order-inner">
              <div class="wholesale-top-order-stats">
                <div class="top-stat-item">
                  <span class="top-stat-label">Volume Sélectionné</span>
                  <div class="top-stat-val">
                    <span id="top-total-units">0</span> pièce(s)
                    <span id="top-moq-pill" class="wholesale-moq-pill" style="background: #64748B; color: #FFF;">Sélectionnez vos packs</span>
                  </div>
                </div>

                <div class="top-stat-item">
                  <span class="top-stat-label">Palier Actif</span>
                  <div id="top-active-tier" class="top-stat-tier">
                    MOQ
                  </div>
                </div>

                <div class="top-stat-item">
                  <span class="top-stat-label">Total Commande HT</span>
                  <div class="top-stat-price" id="top-total-price">
                    0,00 MAD
                  </div>
                </div>
              </div>

              <div>
                <button class="btn btn-commander-wholesale" id="btn-top-wholesale-checkout" onclick="window.WholesaleController.openCheckoutModal()" disabled>
                  COMMANDER EN GROS →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Products Matrix Catalog -->
      <section class="container section-spacing" style="padding-bottom: 160px;">
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700;">Modèles & Références Confectionnées (${products.length} articles)</h2>
            <p style="color: var(--color-text-secondary); font-size: 0.9rem;">
              Chaque référence est disponible à la commande sous forme de <strong>Pack Starter d'implantation</strong> (MOQ imposé : 1 pièce par taille sur l'ensemble des coloris). Pour commander des quantités supérieures ou un réassort personnalisé, contactez directement notre équipe commerciale via le bouton dédié sur chaque fiche.
            </p>
          </div>
        </div>

        <div class="wholesale-products-grid">
          ${products.map(p => this.renderProductWholesaleCard(p)).join('')}
        </div>
      </section>

      <!-- Fixed Floating Bulk Order Bar (Standing out, elevated above footer & page) -->
      <div class="wholesale-sticky-bar" id="wholesale-sticky-bar">
        <div class="wholesale-sticky-inner">
          <div class="wholesale-sticky-stats">
            <div>
              <div style="font-size: 0.74rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Volume Sélectionné</div>
              <div style="font-size: 1.25rem; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                <span id="sticky-total-units">0</span> pièce(s)
                <span id="sticky-moq-pill" class="wholesale-moq-pill" style="background: #64748B; color: #FFF;">Sélectionnez vos packs</span>
              </div>
            </div>

            <div>
              <div style="font-size: 0.74rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Palier Actif</div>
              <div id="sticky-active-tier" style="font-size: 0.98rem; font-weight: 700; color: #D4AF37; margin-top: 2px;">
                MOQ
              </div>
            </div>

            <div>
              <div style="font-size: 0.74rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total Commande HT</div>
              <div class="wholesale-sticky-total" id="sticky-total-price" style="margin-top: 2px;">
                0,00 MAD
              </div>
            </div>
          </div>

          <div>
            <button class="btn btn-commander-wholesale" id="btn-open-wholesale-checkout" onclick="window.WholesaleController.openCheckoutModal()" disabled>
              COMMANDER EN GROS →
            </button>
          </div>
        </div>
      </div>
    `;

    this.recalculateMatrixTotals();
  },

  renderProductWholesaleCard(p) {
    const selectedColor = this.activeColorPerProduct[p.id] || (p.colors[0] ? p.colors[0].code : '');
    const activeColorObj = p.colors.find(c => c.code === selectedColor) || p.colors[0] || {};
    
    // Resolve image
    const imgUrl = (p.images && p.images[selectedColor] && p.images[selectedColor][0]) || activeColorObj.image || 'assets/images/categories/category-tshirts.jpg';

    // Starter Pack metrics: all colors must have all sizes (1 pc per size x colors count)
    const colors = p.colors && p.colors.length ? p.colors : [{ code: 'default', name: 'Standard' }];
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['S', 'M', 'L', 'XL'];
    const starterPackUnits = p.gridMoq || (colors.length * sizes.length);

    let productUnits = 0;
    let missingCombos = 0;
    colors.forEach(c => {
      sizes.forEach(s => {
        const key = `${p.id}__${c.code}__${s}`;
        const q = parseInt(this.cartMatrix[key], 10) || 0;
        productUnits += q;
        if (q < 1) missingCombos++;
      });
    });

    const isPackSelected = (productUnits >= starterPackUnits && missingCombos === 0);
    const packPriceTier1 = starterPackUnits * p.tierPrices.tier_min;

    return `
      <div class="wholesale-product-card" id="product-card-${p.id}">
        <div class="wholesale-card-media">
          <img src="${imgUrl}" alt="${p.name}" class="wholesale-product-img" id="img-${p.id}">
          ${isPackSelected ? `
            <div class="wholesale-card-badge-added">
              ✓ Pack Starter Ajouté
            </div>
          ` : ''}
        </div>

        <div class="wholesale-product-body">
          <div class="wholesale-card-header">
            <h3 class="wholesale-card-title">${p.name}</h3>
            <span class="badge wholesale-savings-badge">-${p.savingsPercentage}% MAX</span>
          </div>

          <div class="wholesale-card-meta">
            <div class="wholesale-retail-price">
              Prix retail public : <span>${StoreUtils.formatMoney(p.retailPrice)}</span>
            </div>
            <span class="badge wholesale-moq-badge">
              MOQ : ${starterPackUnits} pcs
            </span>
          </div>

          <!-- Pricing Table for each tier -->
          <table class="wholesale-pricing-table">
            <thead>
              <tr>
                <th>MOQ</th>
                <th>Palier 2 (MOQ-49)</th>
                <th>Palier 3 (50+)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${StoreUtils.formatMoney(p.tierPrices.tier_min)}</strong></td>
                <td><strong>${StoreUtils.formatMoney(p.tierPrices.tier_mid)}</strong></td>
                <td><strong style="color: #166534;">${StoreUtils.formatMoney(p.tierPrices.tier_high)}</strong></td>
              </tr>
            </tbody>
          </table>

          <!-- Starter Pack Mandatory Details Box -->
          <div class="wholesale-starter-pack-box">
            <div class="wholesale-starter-pack-content">
              <div class="wholesale-starter-pack-header">
                <span class="wholesale-starter-pack-title">
                  📦 Pack Starter (MOQ Imposé)
                </span>
                <span class="badge ${isPackSelected ? 'wholesale-pack-selected-badge' : 'wholesale-pack-units-badge'}">
                  ${isPackSelected ? '✓ Sélectionné' : `${starterPackUnits} pièces`}
                </span>
              </div>

              <div class="wholesale-starter-pack-desc">
                <strong>Composition fixe :</strong> 1 pièce par taille (${sizes.join(', ')}) × ${colors.length} coloris = <strong>${starterPackUnits} pièces au total</strong>.
              </div>

              <div class="wholesale-starter-pack-price">
                <span class="pack-price-label">Montant Pack (MOQ) :</span>
                <span class="pack-price-val">${StoreUtils.formatMoney(packPriceTier1)} HT</span>
              </div>

              <!-- Color Palette Swatches Preview -->
              <div class="wholesale-pack-colors-preview">
                <span class="colors-preview-label">Coloris inclus :</span>
                <div class="colors-preview-list">
                  ${colors.map(c => `
                    <span class="wholesale-pack-color-chip ${c.code === selectedColor ? 'active' : ''}" 
                          title="${c.name || c.code}" 
                          onclick="window.WholesaleController.selectProductColor('${p.id}', '${c.code}')">
                      <span class="wholesale-pack-color-dot" style="background: ${c.hex || '#111'};"></span>
                      ${c.name || c.code}
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Action Buttons Footer strictly pinned to bottom -->
            <div class="wholesale-starter-pack-actions">
              ${!isPackSelected ? `
                <button type="button" 
                  class="btn-wholesale-add-pack"
                  onclick="window.WholesaleController.toggleStarterPack('${p.id}', true)">
                  <span>📦 Commander le Pack Starter (${starterPackUnits} pcs)</span>
                </button>
              ` : `
                <div class="wholesale-pack-active-group">
                  <div class="wholesale-pack-active-pill">
                    <span>✓ Pack Starter Ajouté (${starterPackUnits} pcs)</span>
                  </div>
                  <button type="button" 
                    class="btn-wholesale-remove-pack" 
                    onclick="window.WholesaleController.toggleStarterPack('${p.id}', false)"
                    title="Retirer ce pack de la commande">
                    ✕ Retirer
                  </button>
                </div>
              `}

              <!-- Action 2: Contact for More Quantities Button (WhatsApp) -->
              <button type="button" 
                class="btn-wholesale-contact-more" 
                onclick="window.WholesaleController.contactForMore('${p.id}')">
                <span class="whatsapp-icon">💬</span>
                <span>Pour commander plus : Contactez-nous</span>
              </button>

              <div class="wholesale-contact-hint">
                Commande en ligne réservée au Pack Starter (MOQ). Devis WhatsApp pour réassorts et volumes supérieurs.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  toggleStarterPack(productId, add) {
    const p = this.catalogData.products.find(x => x.id === productId);
    if (!p) return;
    const colors = p.colors && p.colors.length ? p.colors : [{ code: 'default', name: 'Standard' }];
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['S', 'M', 'L', 'XL'];

    if (add) {
      // Set exactly 1 pc for each size & color combo (The exact Starter Pack MOQ)
      colors.forEach(c => {
        sizes.forEach(s => {
          const key = `${p.id}__${c.code}__${s}`;
          this.cartMatrix[key] = 1;
        });
      });
      if (window.StoreUtils && window.StoreUtils.showToast) {
        window.StoreUtils.showToast(`✓ Pack Starter ajouté pour ${p.name} (${colors.length * sizes.length} pcs)`, "success");
      }
    } else {
      // Remove all units for this product
      for (const key of Object.keys(this.cartMatrix)) {
        if (key.startsWith(`${productId}__`)) {
          delete this.cartMatrix[key];
        }
      }
      if (window.StoreUtils && window.StoreUtils.showToast) {
        window.StoreUtils.showToast(`Pack Starter retiré pour ${p.name}`, "info");
      }
    }

    const card = document.getElementById(`product-card-${productId}`);
    if (card) {
      card.outerHTML = this.renderProductWholesaleCard(p);
    }
    this.recalculateMatrixTotals();
  },

  contactForMore(productId) {
    const p = (this.catalogData && this.catalogData.products.find(x => x.id === productId)) || {};
    const productName = p.name || "Modèle ATELIER";
    const colors = p.colors && p.colors.length ? p.colors : [{ code: 'default' }];
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['S', 'M', 'L', 'XL'];
    const packUnits = p.gridMoq || (colors.length * sizes.length) || 32;
    const phone = (window.STORE_CONFIG && window.STORE_CONFIG.contact && window.STORE_CONFIG.contact.whatsapp) 
      ? window.STORE_CONFIG.contact.whatsapp.replace(/\+/g, '') 
      : '212612345678';

    const msg = `Bonjour ATELIER,\n\nJe suis revendeur partenaire B2B et je souhaite commander des quantités supérieures ou un volume personnalisé pour le modèle :\n• *${productName}* (Réf: ${productId})\n(Pack Starter de base : ${packUnits} pièces).\n\nPouvez-vous me transmettre une proposition commerciale / devis grossiste pour ce modèle ?\n\nMerci !`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  },

  addStarterPack(productId) {
    this.toggleStarterPack(productId, true);
  },

  clearProductQuantities(productId) {
    this.toggleStarterPack(productId, false);
  },

  completeStarterPack(productId) {
    this.toggleStarterPack(productId, true);
  },

  selectProductColor(productId, colorCode) {
    this.activeColorPerProduct[productId] = colorCode;
    const product = this.catalogData.products.find(p => p.id === productId);
    if (!product) return;

    const card = document.getElementById(`product-card-${productId}`);
    if (card) {
      card.outerHTML = this.renderProductWholesaleCard(product);
    }
  },

  onMatrixQtyChange(productId, colorCode, size, val) {
    const key = `${productId}__${colorCode}__${size}`;
    const qty = Math.max(0, parseInt(val, 10) || 0);
    if (qty > 0) {
      this.cartMatrix[key] = qty;
    } else {
      delete this.cartMatrix[key];
    }
    this.recalculateMatrixTotals();
  },

  recalculateMatrixTotals() {
    if (!this.catalogData) return;

    let totalUnits = 0;
    const items = [];
    const productUnitsMap = {};

    for (const [key, qty] of Object.entries(this.cartMatrix)) {
      if (qty <= 0) continue;
      const [productId, colorCode, size] = key.split("__");
      const prod = this.catalogData.products.find(p => p.id === productId);
      if (!prod) continue;

      totalUnits += qty;
      productUnitsMap[productId] = (productUnitsMap[productId] || 0) + qty;
      items.push({ productId, colorCode, size, quantity: qty, product: prod });
    }

    const { tiers, products } = this.catalogData;

    // Check MOQ per product and update cards in DOM
    const violatingProducts = [];
    const orderedProducts = [];

    products.forEach(p => {
      const units = productUnitsMap[p.id] || 0;
      const counterEl = document.getElementById(`moq-counter-${p.id}`);

      const colors = p.colors && p.colors.length ? p.colors : [{ code: 'default', name: 'Standard' }];
      const sizes = p.sizes && p.sizes.length ? p.sizes : ['S', 'M', 'L', 'XL'];
      const starterPackUnits = p.gridMoq || (colors.length * sizes.length);

      let missingCombos = 0;
      colors.forEach(c => {
        sizes.forEach(s => {
          const key = `${p.id}__${c.code}__${s}`;
          const q = parseInt(this.cartMatrix[key], 10) || 0;
          if (q < 1) missingCombos++;
        });
      });

      const isStarterPackComplete = (units > 0 && missingCombos === 0);
      const isMoqMet = (units >= p.moq && isStarterPackComplete);

      if (counterEl) {
        if (units === 0) {
          counterEl.innerHTML = `
            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted);">Total modèle :</span>
            <span style="color: var(--color-text-muted); font-size: 0.76rem;">0 / ${p.moq} pcs (Pack Starter ${starterPackUnits} pcs requis)</span>
          `;
          counterEl.style.borderColor = "var(--color-border)";
          counterEl.style.background = "#F8FAFC";
        } else if (isMoqMet) {
          counterEl.innerHTML = `
            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #166534;">Total modèle :</span>
            <span style="color: #16A34A; font-weight: 700; font-size: 0.78rem;">✓ ${units} pcs (Pack Starter complet respecté)</span>
          `;
          counterEl.style.borderColor = "#86EFAC";
          counterEl.style.background = "#F0FDF4";
        } else if (missingCombos > 0) {
          counterEl.innerHTML = `
            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #991B1B;">Total modèle :</span>
            <span style="color: #DC2626; font-weight: 700; font-size: 0.78rem;">⚠️ Pack incomplet (${missingCombos} déclinaison${missingCombos > 1 ? 's' : ''} manquante${missingCombos > 1 ? 's' : ''} sur ${starterPackUnits})</span>
          `;
          counterEl.style.borderColor = "#FCA5A5";
          counterEl.style.background = "#FEF2F2";
        } else {
          const missing = p.moq - units;
          counterEl.innerHTML = `
            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #991B1B;">Total modèle :</span>
            <span style="color: #DC2626; font-weight: 700; font-size: 0.78rem;">⚠️ ${units} / ${p.moq} pcs (${missing} manquante${missing > 1 ? 's' : ''})</span>
          `;
          counterEl.style.borderColor = "#FCA5A5";
          counterEl.style.background = "#FEF2F2";
        }
      }

      if (units > 0) {
        orderedProducts.push({ product: p, units, isMoqMet });
        if (!isMoqMet) {
          violatingProducts.push({
            product: p,
            units,
            moq: p.moq,
            missingCombos,
            starterPackUnits,
            missing: Math.max(0, p.moq - units)
          });
        }
      }
    });

    // Determine active tier based on total quantity
    let activeTier = tiers[0];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (totalUnits >= tiers[i].min_qty) {
        if (tiers[i].max_qty === null || totalUnits <= tiers[i].max_qty) {
          activeTier = tiers[i];
          break;
        }
      }
    }

    // Highlight active chip
    tiers.forEach(t => {
      const chip = document.getElementById(`tier-chip-${t.id}`);
      if (chip) {
        if (t.id === activeTier.id && totalUnits > 0) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      }
    });

    // Compute subtotal
    let subtotal = 0;
    for (const item of items) {
      const tierKey = activeTier.id; // tier_min, tier_mid, tier_high
      const unitPrice = item.product.tierPrices[tierKey] || item.product.tierPrices.tier_min;
      subtotal += (unitPrice * item.quantity);
    }

    this.orderSummary = {
      totalUnits,
      subtotal,
      activeTier,
      items,
      violatingProducts,
      orderedProducts
    };

    // Update both Top bar and Sticky Bottom bar UI
    const totalUnitsEls = [document.getElementById("sticky-total-units"), document.getElementById("top-total-units")];
    const moqPills = [document.getElementById("sticky-moq-pill"), document.getElementById("top-moq-pill")];
    const activeTierEls = [document.getElementById("sticky-active-tier"), document.getElementById("top-active-tier")];
    const totalPriceEls = [document.getElementById("sticky-total-price"), document.getElementById("top-total-price")];
    const checkoutBtns = [document.getElementById("btn-open-wholesale-checkout"), document.getElementById("btn-top-wholesale-checkout")];

    totalUnitsEls.forEach(el => { if (el) el.textContent = totalUnits; });
    totalPriceEls.forEach(el => { if (el) el.textContent = StoreUtils.formatMoney(subtotal); });

    const isOrderValid = totalUnits > 0 && violatingProducts.length === 0;

    let pillBg = "#64748B";
    let pillText = "Sélectionnez vos packs";
    if (totalUnits > 0) {
      if (violatingProducts.length > 0) {
        const firstV = violatingProducts[0];
        pillBg = "#DC2626";
        if (firstV.missingCombos > 0) {
          pillText = `Pack Starter incomplet (${firstV.product.name.substring(0, 14)}...)`;
        } else {
          pillText = `MOQ non atteint (${firstV.product.name.substring(0, 14)}... : ${firstV.units}/${firstV.moq} pcs)`;
        }
      } else {
        pillBg = "#16A34A";
        pillText = `Pack Starter sélectionné (${orderedProducts.length} modèle${orderedProducts.length > 1 ? 's' : ''}) ✓`;
      }
    }

    moqPills.forEach(pill => {
      if (pill) {
        pill.style.background = pillBg;
        pill.textContent = pillText;
      }
    });

    activeTierEls.forEach(el => {
      if (el) el.textContent = `${activeTier.name} (${Math.round(activeTier.target_margin * 100)}% marge)`;
    });

    const btnTitle = (!isOrderValid && violatingProducts.length > 0)
      ? `Veuillez compléter le Pack Starter pour : ${violatingProducts.map(v => `${v.product.name} (${v.units}/${v.moq})`).join(', ')}`
      : "";

    checkoutBtns.forEach(btn => {
      if (btn) {
        btn.disabled = !isOrderValid;
        btn.title = btnTitle;
      }
    });
  },

  // --------------------------------------------------------------------------
  // 4. B2B WHOLESALE CHECKOUT FLOW
  // --------------------------------------------------------------------------
  openCheckoutModal() {
    if (!this.orderSummary || this.orderSummary.totalUnits <= 0) {
      alert("Votre panier grossiste est vide. Veuillez sélectionner des quantités.");
      return;
    }

    if (this.orderSummary.violatingProducts && this.orderSummary.violatingProducts.length > 0) {
      const details = this.orderSummary.violatingProducts.map(v => {
        if (v.missingCombos > 0) {
          return `• ${v.product.name} : ${v.missingCombos} déclinaison(s) manquante(s) sur ${v.starterPackUnits} (le Pack Starter impose au moins 1 pièce pour chaque taille dans l'ensemble des coloris = ${v.moq} pcs min).`;
        }
        return `• ${v.product.name} : ${v.units} sélectionnée(s) sur ${v.moq} requises (${v.missing} manquante(s)).`;
      }).join("\n");
      alert("Pack de Démarrage (Starter Pack) non complet :\n\n" + details + "\n\nChaque modèle commandé doit comporter au minimum son Pack Starter complet (toutes les tailles de chaque couleur). Utilisez le bouton « 📦 Ajouter 1 Pack Starter » sur la fiche pour le remplir instantanément.");
      return;
    }

    const modal = document.getElementById("wholesale-checkout-modal");
    if (!modal) return;

    const listContainer = document.getElementById("checkout-matrix-list");
    if (listContainer) {
      const productPacks = {};
      this.orderSummary.items.forEach(it => {
        if (!productPacks[it.productId]) {
          productPacks[it.productId] = {
            product: it.product,
            totalUnits: 0,
            subtotal: 0,
            colorCount: (it.product.colors && it.product.colors.length) || 1,
            sizeCount: (it.product.sizes && it.product.sizes.length) || 4
          };
        }
        const tierKey = this.orderSummary.activeTier.id;
        const unitPrice = it.product.tierPrices[tierKey];
        productPacks[it.productId].totalUnits += it.quantity;
        productPacks[it.productId].subtotal += (unitPrice * it.quantity);
      });

      listContainer.innerHTML = Object.values(productPacks).map(pack => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-border); font-size: 0.88rem;">
          <div>
            <div style="font-weight: 700; color: #0F172A;">📦 Pack Starter : ${pack.product.name}</div>
            <div style="font-size: 0.76rem; color: var(--color-text-secondary); margin-top: 2px;">
              ${pack.totalUnits} pièces (1 pc par taille × ${pack.colorCount} coloris)
            </div>
          </div>
          <div style="font-family: var(--font-heading); font-weight: 700; font-size: 0.95rem; color: #0F172A;">
            ${StoreUtils.formatMoney(pack.subtotal)}
          </div>
        </div>
      `).join('');
    }

    const summaryUnits = document.getElementById("modal-summary-units");
    const summaryTotal = document.getElementById("modal-summary-total");
    if (summaryUnits) summaryUnits.textContent = `${this.orderSummary.totalUnits} pièces (${this.orderSummary.activeTier.name})`;
    if (summaryTotal) summaryTotal.textContent = StoreUtils.formatMoney(this.orderSummary.subtotal);

    modal.classList.add("open");
  },

  closeCheckoutModal() {
    const modal = document.getElementById("wholesale-checkout-modal");
    if (modal) modal.classList.remove("open");
  },

  async handleOrderSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-wholesale-order");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "ENREGISTREMENT DE LA COMMANDE...";
    }

    const address = document.getElementById("b2b-address").value.trim();
    const city = document.getElementById("b2b-city").value.trim();
    const postal = document.getElementById("b2b-postal").value.trim();
    const paymentMethod = document.getElementById("b2b-payment").value;
    const orderNote = document.getElementById("b2b-note").value.trim();

    const orderPayload = {
      items: this.orderSummary.items.map(it => ({
        productId: it.productId,
        name: it.product.name,
        colorCode: it.colorCode,
        size: it.size,
        quantity: it.quantity
      })),
      shippingAddress: {
        address,
        city,
        postal,
        country: "Maroc",
        businessName: this.currentUser.business_name
      },
      paymentMethod,
      orderNote
    };

    try {
      const res = await fetch("/api/wholesale/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
          "X-Wholesale-Token": this.token
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'enregistrement de la commande grossiste");
      }

      this.closeCheckoutModal();
      this.cartMatrix = {};
      this.showOrderConfirmation(data);
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "VALIDER MA COMMANDE GROSSISTE";
      }
    }
  },

  showOrderConfirmation(orderData) {
    const container = document.getElementById("wholesale-app-root");
    if (!container) return;

    container.innerHTML = `
      <div class="container section-spacing" style="max-width: 680px; margin: 0 auto; text-align: center;">
        <div style="background: #FFFFFF; border: 1px solid var(--color-border); padding: 48px 32px; box-shadow: var(--shadow-medium);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
          <span class="badge" style="background: #DCFCE7; color: #166534; font-size: 0.85rem; padding: 6px 14px;">COMMANDE GROSSISTE ENREGISTRÉE</span>
          
          <h2 style="font-size: 2rem; font-weight: 700; margin: 16px 0 8px;">Merci pour votre commande !</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: 24px;">
            Référence commande B2B : <strong>${orderData.orderNumber}</strong>
          </p>

          <div style="background: var(--color-bg-secondary); border: 1px solid var(--color-border); padding: 20px; text-align: left; margin-bottom: 28px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Volume total :</span>
              <strong>${orderData.totalUnits} pièces</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Palier appliqué :</span>
              <strong>${orderData.tierApplied}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1px solid var(--color-border); padding-top: 10px; margin-top: 10px;">
              <span>Montant à régler :</span>
              <strong style="color: var(--color-dark);">${StoreUtils.formatMoney(orderData.total)}</strong>
            </div>
          </div>

          <p style="font-size: 0.86rem; color: var(--color-text-secondary); margin-bottom: 28px; line-height: 1.5;">
            Notre service logistique B2B à Casablanca prépare l'expédition de votre commande sous 24/48h. Notre équipe commerciale vous contactera pour la transmission du bordereau de livraison et de la facture d'acompte.
          </p>

          <button class="btn btn-primary" onclick="window.WholesaleController.loadAndRenderApprovedPortal()">
            Retour au Catalogue Grossiste
          </button>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // MODALS & REGISTRATION FLOW
  // --------------------------------------------------------------------------
  openApplyModal() {
    const modal = document.getElementById("wholesale-apply-modal");
    if (modal) modal.classList.add("open");
  },

  closeApplyModal() {
    const modal = document.getElementById("wholesale-apply-modal");
    if (modal) modal.classList.remove("open");
  },

  openLoginModal() {
    const modal = document.getElementById("wholesale-login-modal");
    if (modal) modal.classList.add("open");
  },

  closeLoginModal() {
    const modal = document.getElementById("wholesale-login-modal");
    if (modal) modal.classList.remove("open");
  },

  async handleApplySubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-apply");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "SOUMISSION EN COURS...";
    }

    const payload = {
      fullName: document.getElementById("apply-fullname").value.trim(),
      email: document.getElementById("apply-email").value.trim(),
      phone: document.getElementById("apply-phone").value.trim(),
      password: document.getElementById("apply-password").value,
      businessName: document.getElementById("apply-bizname").value.trim(),
      country: document.getElementById("apply-country").value.trim(),
      city: document.getElementById("apply-city").value.trim(),
      businessType: document.getElementById("apply-biztype").value,
      salesChannel: document.getElementById("apply-channel").value.trim(),
      websiteSocialUrl: document.getElementById("apply-url").value.trim(),
      estimatedInitialOrder: document.getElementById("apply-initialqty").value,
      expectedReorderFreq: document.getElementById("apply-reorderfreq").value,
      sellingStatus: document.getElementById("apply-sellingstatus").value,
      additionalInfo: document.getElementById("apply-moreinfo").value.trim()
    };

    try {
      const res = await fetch("/api/wholesale/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la soumission de la candidature");
      }

      this.closeApplyModal();
      this.token = data.token;
      localStorage.setItem("atelier_wholesale_token", data.token);
      this.currentUser = data.user;

      if (window.StoreUtils) StoreUtils.showToast("Candidature enregistrée avec succès !", "success");
      this.renderStatusDashboard(this.currentUser);
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "TRANSMETTRE MA CANDIDATURE GROSSISTE";
      }
    }
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-login");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "CONNEXION EN COURS...";
    }

    const email = document.getElementById("login-ws-email").value.trim();
    const password = document.getElementById("login-ws-password").value;

    try {
      const res = await fetch("/api/wholesale/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Identifiants incorrects");
      }

      this.closeLoginModal();
      this.token = data.token;
      localStorage.setItem("atelier_wholesale_token", data.token);
      this.currentUser = data.user;

      if (window.StoreUtils) StoreUtils.showToast(`Bienvenue ${this.currentUser.full_name} !`, "success");

      if (this.currentUser.application_status === 'approved') {
        await this.loadAndRenderApprovedPortal();
      } else {
        this.renderStatusDashboard(this.currentUser);
      }
    } catch (err) {
      alert("Erreur de connexion: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "SE CONNECTER";
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.WholesaleController.init();
});

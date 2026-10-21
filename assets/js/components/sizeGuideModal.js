/**
 * Size Guide Modal Component
 * Displays measurement table and fitting recommendations.
 */

window.SizeGuideModalComponent = {
  container: null,

  init() {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "size-guide-modal-root";
    this.container.className = "modal-overlay";
    document.body.appendChild(this.container);

    const guide = window.STORE_CONFIG.sizeGuide;

    this.container.innerHTML = `
      <div class="modal-window">
        <button class="action-btn modal-close" onclick="window.SizeGuideModalComponent.close()" aria-label="Fermer le guide">✕</button>
        
        <h3 style="font-size: 1.4rem; margin-bottom: 6px;">GUIDE DES TAILLES (CM)</h3>
        <p style="font-size: 0.88rem; margin-bottom: 20px;">Toutes les mesures sont indiquées en centimètres à plat.</p>

        <div style="overflow-x: auto;">
          <table class="size-table">
            <thead>
              <tr>
                ${guide.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${guide.rows.map(row => `
                <tr>
                  <td><strong>${row.size}</strong></td>
                  <td>${row.chest} cm</td>
                  <td>${row.length} cm</td>
                  <td>${row.shoulder} cm</td>
                  <td>${row.sleeve} cm</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: var(--color-bg-secondary); padding: 16px; border-left: 3px solid var(--color-dark); margin-top: 16px;">
          <h5 style="font-size: 0.82rem; margin-bottom: 4px;">CONSEIL DE COUPE ATELIER</h5>
          <p style="font-size: 0.84rem; line-height: 1.5;">${guide.note}</p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <button class="btn btn-primary btn-full btn-sm" onclick="window.SizeGuideModalComponent.close()">
            COMPRIS, RETOUR AU PRODUIT
          </button>
        </div>
      </div>
    `;

    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) this.close();
    });
  },

  open() {
    this.init();
    this.container.classList.add("open");
    document.body.classList.add("overflow-locked");
  },

  close() {
    if (!this.container) return;
    this.container.classList.remove("open");
    document.body.classList.remove("overflow-locked");
  }
};

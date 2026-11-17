/**
 * Action d'actualisation des listes de documents et de tables Grist.
 * @param {Object} options Configuration du composant.
 * @param {Function} options.onRefresh Rappel déclenché au clic.
 */
const RefreshGristListsButton = function ({ onRefresh }) {
  const template = document.createElement("template");
  template.innerHTML = `
    <button type="button" class="btn btn-link p-0 border-0 text-decoration-none" data-refresh-grist-lists>
      <i class="ri-refresh-line me-1 fs-5 align-middle" aria-hidden="true"></i>
      ${mviewer.tr("grist.import.refresh")}
    </button>
  `;
  this.element = template.content.firstElementChild;
  this.element.addEventListener("click", () => onRefresh());
};

/**
 * Active ou désactive l'action pendant le chargement des listes.
 * @param {boolean} disabled État de désactivation du bouton.
 * @returns {void}
 */
RefreshGristListsButton.prototype.setDisabled = function (disabled) {
  this.element.disabled = disabled;
};

/**
 * Retourne le bouton en conservant son état et son écouteur de clic.
 * @returns {HTMLButtonElement} Bouton à insérer dans le pied de page.
 */
RefreshGristListsButton.prototype.render = function () {
  return this.element;
};

export default RefreshGristListsButton;

/**
 * Button used to refresh data from a Grist table.
 *
 * @param {Object} [options] Component options.
 * @param {Function} [options.onRefresh] Asynchronous data refresh callback.
 * @param {string} [options.loadingMessage] Message displayed while refreshing.
 * @param {string} [options.successMessage] Message displayed after refreshing.
 * @param {string} [options.errorMessage] Message displayed when refreshing fails.
 */
const RefreshGristDataBtn = function (options = {}) {
  this.onRefresh = options.onRefresh || (async () => {});
  this.loadingMessage = options.loadingMessage || "Actualisation des données...";
  this.successMessage = options.successMessage || "Données actualisées.";
  this.errorMessage =
    options.errorMessage || "Impossible d’actualiser les données.";
  this.element = document.createElement("div");
};

/**
 * Refresh Grist data and display its current state.
 *
 * @param {HTMLButtonElement} button Refresh button.
 * @param {HTMLElement} status Status message element.
 * @returns {Promise<void>}
 */
RefreshGristDataBtn.prototype.refresh = async function (button, status) {
  button.disabled = true;
  status.textContent = this.loadingMessage;

  try {
    await this.onRefresh();
    status.textContent = this.successMessage;
  } catch (error) {
    status.textContent = this.errorMessage;
  } finally {
    button.disabled = false;
  }
};

/**
 * Render the refresh button.
 *
 * @returns {HTMLElement} Rendered refresh action.
 */
RefreshGristDataBtn.prototype.render = function () {
  const button = document.createElement("button");
  const status = document.createElement("span");

  button.type = "button";
  button.className = "btn btn-outline-primary btn-sm mb-3";
  button.textContent = "Actualiser les données";
  button.addEventListener("click", () => this.refresh(button, status));

  status.className = "ms-2 text-muted";
  status.setAttribute("aria-live", "polite");

  this.element.replaceChildren(button, status);

  return this.element;
};

export default RefreshGristDataBtn;

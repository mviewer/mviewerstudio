/**
 * Button used to refresh data from a Grist table.
 *
 * @param {Object} [options] Component options.
 * @param {Function} [options.onRefresh] Asynchronous data refresh callback.
 * @param {string} [options.successMessage] Message displayed after refreshing.
 * @param {string} [options.errorMessage] Message displayed when refreshing fails.
 */
const RefreshGristDataBtn = function (options = {}) {
  this.onRefresh = options.onRefresh || (async () => {});
  this.successMessage = options.successMessage || "Données actualisées.";
  this.errorMessage =
    options.errorMessage || "Impossible d’actualiser les données.";
  this.element = document.createElement("div");
};

/**
 * Refresh Grist data and report the outcome through mviewerstudio alerts.
 *
 * @param {HTMLButtonElement} button Refresh button.
 * @returns {Promise<void>}
 */
RefreshGristDataBtn.prototype.refresh = async function (button) {
  button.disabled = true;
  button.replaceChildren("Actualiser les données", this.createSpinner());

  try {
    await this.onRefresh();
    alertCustom(this.successMessage, "success");
  } catch (error) {
    alertCustom(this.errorMessage, "danger");
  } finally {
    button.disabled = false;
    button.textContent = "Actualiser les données";
  }
};

/**
 * Create the loading indicator shown in the refresh button.
 *
 * @returns {HTMLSpanElement} Spinner element.
 */
RefreshGristDataBtn.prototype.createSpinner = function () {
  const spinner = document.createElement("span");

  spinner.className = "spinner-border spinner-border-sm";
  spinner.style.marginLeft = "2px";
  spinner.setAttribute("aria-hidden", "true");

  return spinner;
};

/**
 * Render the refresh button.
 *
 * @returns {HTMLElement} Rendered refresh action.
 */
RefreshGristDataBtn.prototype.render = function () {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "btn btn-outline-primary btn-sm mb-3";
  button.textContent = "Actualiser les données";
  button.addEventListener("click", () => this.refresh(button));

  this.element.replaceChildren(button);

  return this.element;
};

export default RefreshGristDataBtn;

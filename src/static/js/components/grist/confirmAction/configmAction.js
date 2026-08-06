/**
 * Confirmation message with yes and no actions.
 *
 * @param {Object} [options] Component options.
 * @param {string} [options.message] Message displayed to the user.
 * @param {string} [options.color="warning"] Bootstrap alert colour.
 * @param {Function} [options.onYes] Callback invoked on confirmation.
 * @param {Function} [options.onNo] Callback invoked on cancellation.
 */
const ConfirmAction = function (options = {}) {
  this.message = options.message || "";
  this.color = options.color || "warning";
  this.onYes = typeof options.onYes === "function" ? options.onYes : () => {};
  this.onNo = typeof options.onNo === "function" ? options.onNo : () => {};
  this.element = document.createElement("div");
};

/**
 * Return the result style matching the requested Bootstrap alert colour.
 *
 * @returns {string} Grist result type.
 */
ConfirmAction.prototype.getResultType = function () {
  if (this.color === "danger") {
    return "failure";
  }

  if (this.color === "success") {
    return "success";
  }

  return "partial";
};

/**
 * Render the confirmation action.
 *
 * @returns {HTMLElement} Rendered confirmation element.
 */
ConfirmAction.prototype.render = function () {
  const icon = document.createElement("div");
  const title = document.createElement("h6");
  const message = document.createElement("p");
  const actions = document.createElement("div");
  const yesButton = document.createElement("button");
  const noButton = document.createElement("button");

  this.element.className = `grist-geocoding-result grist-geocoding-result-${this.getResultType()}`;
  icon.className = "grist-geocoding-result-icon";
  icon.textContent = "!";
  title.className = "grist-geocoding-result-title";
  title.textContent = "Confirmation requise";
  message.className = "grist-geocoding-result-message";
  message.textContent = this.message;
  actions.className = "grist-geocoding-result-actions";

  yesButton.type = "button";
  yesButton.className = "btn grist-geocoding-result-primary-button";
  yesButton.textContent = "Oui";
  yesButton.addEventListener("click", this.onYes);

  noButton.type = "button";
  noButton.className = "btn grist-geocoding-result-secondary-button";
  noButton.textContent = "Non";
  noButton.addEventListener("click", this.onNo);

  actions.append(yesButton, noButton);
  this.element.replaceChildren(icon, title, message, actions);

  return this.element;
};

export { ConfirmAction };
export default ConfirmAction;

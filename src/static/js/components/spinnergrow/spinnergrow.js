/**
 * Bootstrap-compatible growing spinner component.
 *
 * Usage:
 * `const spinner = new SpinnerGrow({ label: "Chargement…" });`
 * `target.appendChild(spinner.render());`
 */
let spinnerGrowInstanceId = 0;

/**
 * Normalize classes provided as a string or an array.
 *
 * @param {string|string[]|undefined} classes Classes to normalize.
 * @returns {string[]} Individual class names.
 */
function normalizeClasses(classes) {
  if (Array.isArray(classes)) {
    return classes.filter(Boolean);
  }

  if (typeof classes === "string") {
    return classes.split(/\s+/).filter(Boolean);
  }

  return [];
}

/**
 * Create a growing spinner.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.id] Identifier of the spinner element.
 * @param {string} [options.label="Chargement…"] Text exposed to screen readers.
 * @param {boolean} [options.small=true] Whether to use Bootstrap's small spinner.
 * @param {string|string[]} [options.classes] Classes applied to the component container.
 * @param {string|string[]} [options.spinnerClasses] Additional classes applied to the spinner.
 * @param {boolean} [options.visible=true] Whether the spinner is initially visible.
 * @param {string} [options.color="primary"] The color of the spinner.
 * @returns {void}
 */
const SpinnerGrow = function (options = {}) {
  spinnerGrowInstanceId += 1;

  this.id = options.id || `spinner-grow-${spinnerGrowInstanceId}`;
  this.label = options.label === undefined ? "Chargement…" : options.label;
  this.small = options.small !== false;
  this.classes = normalizeClasses(options.classes);
  this.spinnerClasses = normalizeClasses(options.spinnerClasses);
  this.visible = options.visible !== false;
  this.color = options.color || "primary";
  this.spinner = null;

  this.element = document.createElement("div");
  this.element.classList.add("spinner-grow-container");
  this.element.classList.add(...this.classes);
};

/**
 * Return the spinner element after rendering.
 *
 * @returns {HTMLDivElement|null} Rendered spinner element, if available.
 */
SpinnerGrow.prototype.getSpinner = function () {
  return this.spinner;
};

/**
 * Update the text exposed to screen readers.
 *
 * @param {string} label Loading label.
 * @returns {HTMLElement} Component container.
 */
SpinnerGrow.prototype.setLabel = function (label) {
  this.label = label || "";

  const hiddenLabel = this.element.querySelector(".visually-hidden");
  if (hiddenLabel) {
    hiddenLabel.textContent = this.label;
  }

  return this.element;
};

/**
 * Show or hide the spinner component.
 *
 * @param {boolean} visible Whether the spinner must be visible.
 * @returns {HTMLElement} Component container.
 */
SpinnerGrow.prototype.setVisible = function (visible) {
  this.visible = Boolean(visible);
  this.element.classList.toggle("d-none", !this.visible);

  if (this.visible) {
    this.element.style.removeProperty("display");
  } else {
    this.element.style.setProperty("display", "none", "important");
  }

  return this.element;
};

/**
 * Return the current visibility state.
 *
 * @returns {boolean} Whether the spinner is visible.
 */
SpinnerGrow.prototype.getVisible = function () {
  return this.visible;
};

/**
 * Render the spinner.
 *
 * @returns {HTMLElement} Rendered component container.
 */
SpinnerGrow.prototype.render = function () {
  const spinner = document.createElement("div");
  spinner.id = this.id;
  spinner.className = "spinner-grow";
  spinner.setAttribute("role", "status");

  spinner.classList.add(`text-${this.color}`);

  if (this.small) {
    spinner.classList.add("spinner-grow-sm");
  }

  spinner.classList.add(...this.spinnerClasses);

  const hiddenLabel = document.createElement("span");
  hiddenLabel.className = "visually-hidden";
  hiddenLabel.textContent = this.label;

  this.element.replaceChildren(spinner, hiddenLabel);
  this.spinner = spinner;
  this.setVisible(this.visible);

  return this.element;
};

/**
 * Append the component to a target container.
 *
 * @param {HTMLElement|null|undefined} target Target container.
 * @returns {HTMLElement} Rendered component container.
 */
SpinnerGrow.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default SpinnerGrow;

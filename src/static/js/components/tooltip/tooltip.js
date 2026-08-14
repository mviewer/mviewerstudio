/**
 * Icon tooltip component.
 *
 * Usage:
 * `const tooltip = new mv.components.tooltip({ message: "Information" });`
 * `target.appendChild(tooltip.render());`
 */

/**
 * Add a Bootstrap tooltip when Bootstrap is available.
 *
 * @param {HTMLElement} element Tooltip trigger element.
 */
const initBootstrapTooltip = (element) => {
  if (window.bootstrap && window.bootstrap.Tooltip) {
    window.bootstrap.Tooltip.getOrCreateInstance(element);
  }
};

/**
 * Reusable icon tooltip.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.icon="bi-info-circle"] Bootstrap icon class.
 * @param {string} [options.message=""] Message displayed on hover.
 * @param {string} [options.color="primary"] Bootstrap color name.
 * @param {string} [options.classes] Additional classes for the trigger.
 */
const Tooltip = function (options = {}) {
  this.icon = options.icon || "bi-info-circle";
  this.message = options.message || "";
  this.color = options.color || "primary";
  this.classes = options.classes || "";
  this.element = document.createElement("button");
  this.element.className = `btn btn-link border-0 p-0 tooltip-icon ${this.classes}`.trim();
  this.element.type = "button";
};

/**
 * Render the tooltip trigger.
 *
 * @returns {HTMLButtonElement} Tooltip trigger element.
 */
Tooltip.prototype.render = function () {
  const icon = document.createElement("i");

  icon.className = `bi ${this.icon} text-${this.color}`;
  icon.setAttribute("aria-hidden", "true");

  this.element.replaceChildren(icon);
  this.element.setAttribute("data-bs-toggle", "tooltip");
  this.element.setAttribute("data-bs-title", this.message);
  this.element.setAttribute("aria-label", this.message);
  initBootstrapTooltip(this.element);

  return this.element;
};

/**
 * Append the component to a target container.
 *
 * @param {HTMLElement|null|undefined} target Target container.
 * @returns {HTMLButtonElement} Tooltip trigger element.
 */
Tooltip.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default Tooltip;

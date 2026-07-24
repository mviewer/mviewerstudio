/**
 * Step display component.
 *
 * Usage:
 * `loadComponents.js` automatically loads this file.
 * The component is then available through `mv.components.stepBadge`
 * for classic non-module project scripts.
 *
 * Example:
 * `const badge = new mv.components.stepBadge({ step: 1, maxSteps: 3, classes: "badge bg-primary" });`
 * `container.appendChild(badge.render());`
 * `badge.changeStep(2);`
 */

/**
 * Normalizes CSS classes provided to the component.
 *
 * @param {string|string[]|undefined} classes Classes to apply.
 * @returns {string[]} Normalized class list.
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
 * Returns the badge label with i18n when available.
 *
 * @param {number} step Current step.
 * @param {number} maxSteps Total number of steps.
 * @returns {string} Label to display.
 */
function translateStepLabel(step, maxSteps) {
  if (window.mviewer && typeof window.mviewer.tr === "function") {
    return window.mviewer.tr("components.step_badge.label", {
      current: step,
      max: maxSteps,
    });
  }

  return "Etape " + step + "/" + maxSteps + " :";
}

/**
 * Reusable step display component.
 *
 * @param {Object} [options] Initialization options.
 * @param {number} [options.step=1] Current step.
 * @param {number} [options.maxSteps=1] Total number of steps.
 * @param {string|string[]} [options.classes] Additional CSS classes.
 * @param {string} [options.tagName="span"] Root tag name of the component.
 */
function StepBadge(options) {
  var settings = options || {};

  this.maxSteps = Number(settings.maxSteps) || 1;
  this.step = Number(settings.step) || 1;
  this.classes = normalizeClasses(settings.classes);
  this.element = document.createElement(settings.tagName || "span");

  this.element.classList.add("step-badge");
  this.classes.forEach(function (className) {
    this.element.classList.add(className);
  }, this);

  this.changeStep(this.step);
}

/**
 * Updates the component rendering.
 *
 * @returns {HTMLElement} Component DOM element.
 */
StepBadge.prototype.render = function () {
  this.element.textContent = translateStepLabel(this.step, this.maxSteps);
  this.element.setAttribute("data-step", this.step);
  this.element.setAttribute("data-max-steps", this.maxSteps);

  return this.element;
};

/**
 * Updates the current step.
 *
 * @param {number} step New step value.
 * @returns {HTMLElement} Updated DOM element.
 */
StepBadge.prototype.changeStep = function (step) {
  var nextStep = Number(step);

  if (!Number.isFinite(nextStep)) {
    return this.render();
  }

  this.step = Math.min(Math.max(nextStep, 1), this.maxSteps);

  return this.render();
};

/**
 * Updates the total number of steps.
 *
 * @param {number} maxSteps New total number of steps.
 * @returns {HTMLElement} Updated DOM element.
 */
StepBadge.prototype.changeMaxSteps = function (maxSteps) {
  var nextMaxSteps = Number(maxSteps);

  if (!Number.isFinite(nextMaxSteps) || nextMaxSteps < 1) {
    return this.render();
  }

  this.maxSteps = nextMaxSteps;

  if (this.step > this.maxSteps) {
    this.step = this.maxSteps;
  }

  return this.render();
};

/**
 * Appends the component to a target container.
 *
 * @param {HTMLElement} target Target container.
 * @returns {HTMLElement} Component DOM element.
 */
StepBadge.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default StepBadge;

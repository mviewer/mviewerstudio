/**
 * Bootstrap-compatible select component.
 *
 * Usage:
 * `const select = new Select({ label: "Table", options: [{ label: "Table 1", value: "table-1" }] });`
 * `target.appendChild(select.render());`
 *
 * The optional `onLoad` callback receives the Select component instance after
 * its initial options have been rendered. It can fetch data and call
 * `setOptions` asynchronously.
 */
let selectInstanceId = 0;

/**
 * Create a Bootstrap-compatible select component.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.id] Identifier of the select element.
 * @param {string} [options.label] Visible select label.
 * @param {string} [options.value] Initially selected option value.
 * @param {string} [options.placeholder] Disabled placeholder label.
 * @param {Array<{label: string, value: string|number}>} [options.options=[]] Initial options.
 * @param {string} [options.classes] Classes applied to the component container.
 * @param {string} [options.labelClasses] Classes applied to the label.
 * @param {string} [options.selectClasses] Classes applied to the select.
 * @param {boolean} [options.disabled=false] Whether the select is disabled.
 * @param {Function} [options.onChange] Called with the selected value after a change.
 * @param {Function} [options.onLoad] Called with this component after rendering.
 * @returns {void}
 */
const Select = function (options = {}) {
  selectInstanceId += 1;

  this.id = options.id || `select-${selectInstanceId}`;
  this.label = options.label || "";
  this.value = options.value || "";
  this.placeholder = options.placeholder || "";
  this.options = options.options || [];
  this.classes = options.classes || "";
  this.labelClasses = options.labelClasses || "control-label";
  this.selectClasses = options.selectClasses || options.inputClasses || "";
  this.disabled = options.disabled || false;
  this.onChange = options.onChange || function () {};

  this.onLoad = options.onLoad || function () {};

  this.element = document.createElement("div");
  this.element.className = `form-group ${this.classes}`.trim();

  this.visible = options.visible || true;
};

/**
 * Return the underlying select element after rendering.
 *
 * @returns {HTMLSelectElement|null} Rendered select element, if available.
 */
Select.prototype.getSelect = function () {
  return this.element.querySelector(`#${this.id}`);
};

/**
 * Return the selected value.
 *
 * @returns {string} Current selected value.
 */
Select.prototype.getValue = function () {
  const select = this.getSelect();

  return select ? select.value : this.value;
};

/**
 * Update the selected value.
 *
 * @param {string|number} value Value to select.
 * @returns {HTMLElement} Component container.
 */
Select.prototype.setValue = function (value) {
  this.value = value || "";

  const select = this.getSelect();
  if (select) {
    select.value = this.value;
  }

  return this.element;
};

/**
 * Replace the available options while preserving the selected value when possible.
 *
 * @param {Array<{label: string, value: string|number}>} [options=[]] Options to display.
 * @returns {HTMLElement} Component container.
 */
Select.prototype.setOptions = function (options = []) {
  this.options = options;

  const select = this.getSelect();
  if (!select) {
    return this.element;
  }

  select.replaceChildren();

  if (this.placeholder) {
    const placeholder = new Option(this.placeholder, "");
    placeholder.disabled = true;
    select.appendChild(placeholder);
  }

  this.options.forEach((option) => {
    select.appendChild(new Option(option.label, option.value));
  });

  select.value = this.value;
  if (!select.value && this.placeholder) {
    select.value = "";
  }

  return this.element;
};

/**
 * Enable or disable the select.
 *
 * @param {boolean} disabled Whether the select must be disabled.
 * @returns {HTMLElement} Component container.
 */
Select.prototype.setDisabled = function (disabled) {
  this.disabled = disabled;

  const select = this.getSelect();
  if (select) {
    select.disabled = this.disabled;
  }

  return this.element;
};

Select.prototype.setVisible = function (visible) {
  const select = this.getSelect();
  visible ? select.remove("d-none") : select.add("d-none");
};

Select.prototype.getVisible = function () {
  const select = this.getSelect();
  return select ? select.visible : this.visible;
};

/**
 * Render the select and invoke the optional loading callback.
 *
 * @returns {HTMLElement} Rendered component container.
 */
Select.prototype.render = function (visible) {
  this.element.innerHTML = `
    ${
      this.label
        ? `<label class="${this.labelClasses}" for="${this.id}">${this.label}</label>`
        : ""
    }
    <select id="${this.id}" class="form-control ${this.selectClasses}"></select>
  `;

  const select = this.getSelect();
  select.disabled = this.disabled;
  select.addEventListener("change", () => {
    this.value = select.value;
    this.onChange(this.value);
  });
  this.setOptions(this.options);

  this.setVisible(visible !== undefined ? visible : this.visible);

  this.onLoad(this);

  return this.element;
};

/**
 * Append the component to a target then render it.
 *
 * @param {HTMLElement|null|undefined} target Target container.
 * @returns {HTMLElement} Rendered component container.
 */
Select.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default Select;

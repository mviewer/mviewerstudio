let multiselectInstanceId = 0;

/**
 * Reusable tag-based multiselect component.
 *
 * @param {Object} [options={}] Component options.
 * @param {string} [options.id] Select element id.
 * @param {string} [options.label] Visible field label.
 * @param {string} [options.placeholder="Sélectionner"] Placeholder option.
 * @param {Array<string|{label: string, value: string}>} [options.options=[]]
 * Available values.
 * @param {string[]} [options.values=[]] Initially selected values.
 * @param {string} [options.classes] Extra classes for the root element.
 * @param {Function} [options.onChange] Callback called with selected values.
 * @returns {void}
 */
const Multiselect = function (options = {}) {
  multiselectInstanceId += 1;

  this.id = options.id || `multiselect-${multiselectInstanceId}`;
  this.label = options.label || "";
  this.placeholder = options.placeholder || "Sélectionner";
  this.options = this.normalizeOptions(options.options || []);
  this.values = options.values || [];
  this.classes = options.classes || "";
  this.onChange = options.onChange || function () {};
  this.element = document.createElement("div");
  this.element.className = `multiselect ${this.classes}`.trim();
};

/**
 * Convert string options to `{ label, value }` objects and remove invalid items.
 *
 * @param {Array<string|{label: string, value: string}>} [options=[]] Raw options.
 * @returns {Array<{label: string, value: string}>} Normalized options.
 */
Multiselect.prototype.normalizeOptions = function (options = []) {
  return options
    .map((option) => {
      if (typeof option === "string") {
        return { label: option, value: option };
      }

      return option;
    })
    .filter((option) => option?.label && option?.value);
};

/**
 * Return the selected values.
 *
 * @returns {string[]} Selected values.
 */
Multiselect.prototype.getValues = function () {
  return [...this.values];
};

/**
 * Replace available options and keep only still-valid selected values.
 *
 * @param {Array<string|{label: string, value: string}>} [options=[]] New options.
 * @returns {HTMLElement} Component root element.
 */
Multiselect.prototype.setOptions = function (options = []) {
  this.options = this.normalizeOptions(options);
  this.values = this.values.filter((value) =>
    this.options.some((option) => option.value === value)
  );

  return this.render();
};

/**
 * Replace selected values with values that exist in current options.
 *
 * @param {string[]} [values=[]] Values to select.
 * @returns {HTMLElement} Component root element.
 */
Multiselect.prototype.setValues = function (values = []) {
  this.values = values.filter((value) =>
    this.options.some((option) => option.value === value)
  );

  return this.render();
};

/**
 * Add one selected value.
 *
 * @param {string} value Value to add.
 * @returns {HTMLElement} Component root element.
 */
Multiselect.prototype.addValue = function (value) {
  if (!value || this.values.includes(value)) {
    return this.element;
  }

  this.values.push(value);
  this.onChange(this.getValues());

  return this.render();
};

/**
 * Remove one selected value.
 *
 * @param {string} value Value to remove.
 * @returns {HTMLElement} Component root element.
 */
Multiselect.prototype.removeValue = function (value) {
  this.values = this.values.filter((currentValue) => currentValue !== value);
  this.onChange(this.getValues());

  return this.render();
};

/**
 * Render the multiselect control and selected tags.
 *
 * @returns {HTMLElement} Component root element.
 */
Multiselect.prototype.render = function () {
  const availableOptions = this.options.filter(
    (option) => !this.values.includes(option.value)
  );

  this.element.innerHTML = `
    ${this.label ? `<label class="multiselect-label" for="${this.id}">${this.label}</label>` : ""}
    <div class="multiselect-control">
      <div class="multiselect-tags" data-multiselect-tags></div>
      <select id="${this.id}" class="multiselect-select">
        <option value="">${this.placeholder}</option>
      </select>
    </div>
  `;

  const tagsContainer = this.element.querySelector("[data-multiselect-tags]");
  this.values.forEach((value) => {
    const option = this.options.find((item) => item.value === value);
    const tag = document.createElement("button");

    tag.type = "button";
    tag.className = "multiselect-tag";
    tag.textContent = `${option?.label || value} ×`;
    tag.addEventListener("click", () => this.removeValue(value));
    tagsContainer.appendChild(tag);
  });

  const select = this.element.querySelector(`#${this.id}`);
  availableOptions.forEach((option) => {
    select.appendChild(new Option(option.label, option.value));
  });
  select.addEventListener("change", () => {
    this.addValue(select.value);
  });

  return this.element;
};

/**
 * Append the component to a target and render it.
 *
 * @param {HTMLElement} target Target container.
 * @returns {HTMLElement} Component root element.
 */
Multiselect.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default Multiselect;

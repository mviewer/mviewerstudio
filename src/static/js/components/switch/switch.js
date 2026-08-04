/**
 * Card switch component.
 *
 * Usage:
 * `const item = new mv.components.switch({ label: "Option", checked: true });`
 * `target.appendChild(item.render());`
 */
let switchInstanceId = 0;

const Switch = function (options = {}) {
  switchInstanceId += 1;

  this.id = options.id || `switch-${switchInstanceId}`;
  this.name = options.name || "";
  this.label = options.label || "";
  this.description = options.description || "";
  this.checked = Boolean(options.checked);
  this.disabled = Boolean(options.disabled);
  this.classes = options.classes || "";
  this.onChange = options.onChange || function () {};

  this.element = document.createElement("div");
  this.element.className = `switch-card ${this.classes}`.trim();
};

Switch.prototype.getInput = function () {
  return this.element.querySelector(`#${this.id}`);
};

Switch.prototype.getChecked = function () {
  const input = this.getInput();

  return input ? input.checked : this.checked;
};

Switch.prototype.setChecked = function (checked, triggerChange = false) {
  this.checked = Boolean(checked);

  const input = this.getInput();
  if (input) {
    input.checked = this.checked;
  }

  this.element.classList.toggle("switch-card-active", this.checked);

  if (triggerChange) {
    this.onChange(this.checked, this);
  }

  return this.element;
};

Switch.prototype.setDisabled = function (disabled) {
  this.disabled = Boolean(disabled);

  const input = this.getInput();
  if (input) {
    input.disabled = this.disabled;
  }

  this.element.classList.toggle("switch-card-disabled", this.disabled);

  return this.element;
};

Switch.prototype.render = function () {
  this.element.innerHTML = `
    <div class="switch-card-text">
      <label class="switch-card-title" for="${this.id}">
        ${this.label}
        <i class="bi bi-info-circle switch-card-info" aria-hidden="true"></i>
      </label>
      ${this.description ? `<p class="switch-card-description">${this.description}</p>` : ""}
    </div>
    <label class="switch-card-control" for="${this.id}">
      <input
        id="${this.id}"
        class="switch-card-input"
        type="checkbox"
        role="switch"
        ${this.name ? `name="${this.name}"` : ""}
        ${this.checked ? "checked" : ""}
        ${this.disabled ? "disabled" : ""}
      >
      <span class="switch-card-slider" aria-hidden="true"></span>
    </label>
  `;

  const input = this.getInput();
  if (input) {
    input.addEventListener("change", () => {
      this.setChecked(input.checked);
      this.onChange(this.checked, this);
    });
  }

  this.setChecked(this.checked);
  this.setDisabled(this.disabled);

  return this.element;
};

Switch.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default Switch;

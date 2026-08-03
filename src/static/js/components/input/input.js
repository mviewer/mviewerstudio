/**
 * Bootstrap-compatible input component.
 *
 * Usage:
 * `const input = new mv.components.input({ label: "Nom", value: "table" });`
 * `target.appendChild(input.render());`
 */
let inputInstanceId = 0;

const Input = function (options = {}) {
  inputInstanceId += 1;

  this.id = options.id || `input-${inputInstanceId}`;
  this.type = options.type || "text";
  this.label = options.label || "";
  this.value = options.value || "";
  this.placeholder = options.placeholder || "";
  this.classes = options.classes || "";
  this.labelClasses = options.labelClasses || "";
  this.inputClasses = options.inputClasses || "";
  this.onChange = options.onChange || function () {};

  this.element = document.createElement("div");
  this.element.className = `form-group ${this.classes}`.trim();
};

Input.prototype.getValue = function () {
  const input = this.element.querySelector(`#${this.id}`);
  return input ? input.value : this.value;
};

Input.prototype.setValue = function (value) {
  this.value = value || "";

  const input = this.element.querySelector(`#${this.id}`);
  if (input) {
    input.value = this.value;
  }

  return this.element;
};

Input.prototype.render = function () {
  this.element.innerHTML = `
    ${
      this.label
        ? `<label class="${this.labelClasses}" for="${this.id}">${this.label}</label>`
        : ""
    }
    <input
      id="${this.id}"
      type="${this.type}"
      class="form-control ${this.inputClasses}"
      value=""
      placeholder="${this.placeholder}"
    >
  `;

  const input = this.element.querySelector(`#${this.id}`);
  if (input) {
    input.value = this.value;
    input.addEventListener("input", () => {
      this.value = input.value;
      this.onChange(input.value);
    });
  }

  return this.element;
};

Input.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default Input;

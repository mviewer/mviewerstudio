/**
 * URL input and action button using the same card layout as ButtonCard.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.buttonLabel] Button text.
 * @param {string} [options.placeholder] Input placeholder and accessible name.
 * @param {function(string): (void|Promise<void>)} [options.onClick] Action receiving the URL.
 */
const UrlCard = function (options = {}) {
  this.onClick = options.onClick || function () {};
  this.element = document.createElement("div");
  this.element.className = "url-card switch-card";
  this.input = document.createElement("input");
  this.input.type = "url";
  this.input.className = "form-control";
  this.input.placeholder = options.placeholder || "";
  this.input.setAttribute("aria-label", this.input.placeholder);
  this.button = document.createElement("button");
  this.button.type = "button";
  this.button.className = "btn btn-primary";
  this.button.textContent = options.buttonLabel || "";

  this.button.addEventListener("click", async () => {
    this.button.disabled = true;
    try {
      await this.onClick(this.input.value.trim());
    } finally {
      this.button.disabled = false;
    }
  });
  this.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.button.click();
    }
  });
};

/**
 * Render the URL card while preserving its input value and event handlers.
 *
 * @returns {HTMLDivElement} Card element.
 */
UrlCard.prototype.render = function () {
  const header = document.createElement("div");
  const content = document.createElement("div");
  header.className = "switch-card-header";
  content.className = "switch-card-text";
  content.appendChild(this.input);
  header.append(content, this.button);
  this.element.replaceChildren(header);
  return this.element;
};

export default UrlCard;

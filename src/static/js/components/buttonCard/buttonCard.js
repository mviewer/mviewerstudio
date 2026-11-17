/**
 * Card displaying descriptive text and a single action button.
 *
 * It reuses the switch-card CSS classes without rendering a switch control.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.title] Card title.
 * @param {string} [options.description] Card description.
 * @param {string} [options.tooltip] Information displayed next to the title.
 * @param {HTMLButtonElement} [options.button] Action button.
 * @param {string} [options.classes] Extra classes applied to the card.
 * @returns {void}
 */
const ButtonCard = function (options = {}) {
  this.title = options.title || "";
  this.description = options.description || "";
  this.tooltip = options.tooltip || "";
  this.button = options.button || null;
  this.classes = options.classes || "";
  this.element = document.createElement("div");
  this.element.className = `button-card switch-card ${this.classes}`.trim();
};

/**
 * Render the card content and append the configured action button.
 *
 * @returns {HTMLElement} Card element.
 */
ButtonCard.prototype.render = function () {
  const header = document.createElement("div");
  const content = document.createElement("div");
  const title = document.createElement("p");

  header.className = "switch-card-header";
  content.className = "switch-card-text";
  title.className = "switch-card-title";
  title.textContent = this.title;
  if (this.tooltip && mv.components.tooltip) {
    title.appendChild(
      new mv.components.tooltip({
        message: this.tooltip,
        color: "info",
        classes: "switch-card-info",
      }).render()
    );
  }
  content.appendChild(title);
  if (this.description) {
    const description = document.createElement("p");

    description.className = "switch-card-description";
    description.textContent = this.description;
    content.appendChild(description);
  }
  header.appendChild(content);
  if (this.button) {
    header.appendChild(this.button);
  }

  this.element.replaceChildren(header);

  return this.element;
};

export default ButtonCard;

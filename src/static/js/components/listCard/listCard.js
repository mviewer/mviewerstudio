/**
 * Card displaying a title, descriptive text and a list of items.
 *
 * It follows the visual structure of ButtonCard while allowing several
 * interactive or textual items to be grouped in one card.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.title] Card title.
 * @param {string} [options.description] Card description.
 * @param {string} [options.tooltip] Information displayed next to the title.
 * @param {Array<HTMLElement|string>} [options.items] Items displayed in the list.
 * @param {string} [options.classes] Extra classes applied to the card.
 * @returns {void}
 */
const ListCard = function (options = {}) {
  this.title = options.title || "";
  this.description = options.description || "";
  this.tooltip = options.tooltip || "";
  this.items = Array.isArray(options.items) ? options.items : [];
  this.classes = options.classes || "";
  this.element = document.createElement("div");
  this.element.className = `list-card switch-card ${this.classes}`.trim();
};

/**
 * Replace the list items displayed by the card.
 *
 * @param {Array<HTMLElement|string>} items Items displayed in the list.
 * @returns {HTMLElement} Card element.
 */
ListCard.prototype.setItems = function (items) {
  this.items = Array.isArray(items) ? items : [];

  return this.render();
};

/**
 * Add one item to the card list.
 *
 * @param {HTMLElement|string} item Item displayed in the list.
 * @returns {void}
 */
ListCard.prototype.addItem = function (item) {
  this.items.push(item);
};

/**
 * Render the card content and its list items.
 *
 * @returns {HTMLElement} Card element.
 */
ListCard.prototype.render = function () {
  const fragment = document.createDocumentFragment();

  if (this.title || this.description) {
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
    fragment.appendChild(header);
  }

  const list = document.createElement("ul");

  list.className = "list-card-list";
  this.items.forEach((item) => {
    const listItem = document.createElement("li");

    listItem.className = "list-card-item";
    if (item instanceof HTMLElement) {
      listItem.appendChild(item);
    } else {
      listItem.textContent = item;
    }
    list.appendChild(listItem);
  });
  fragment.appendChild(list);

  this.element.replaceChildren(fragment);

  return this.element;
};

export default ListCard;

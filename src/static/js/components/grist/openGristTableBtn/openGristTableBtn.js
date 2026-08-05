/**
 * Button that opens a Grist table in a new tab.
 *
 * @param {Object} [options] Component options.
 * @param {string} [options.url] Grist table URL.
 * @param {string|string[]} [options.classes] Extra CSS classes.
 * @param {Function} [options.open] Function used to open the URL.
 */
export function OpenGristTableBtn(options = {}) {
  this.url = options.url;
  this.classes = options.classes || [];
  this.element = document.createElement("button");

  this.element.type = "button";
  this.element.className = "btn btn-primary mt-3";
  this.element.classList.add(...this.classes);

  this.element.textContent = "Ouvrir dans Grist";
  this.element.disabled = !this.url;
  this.open = options.open || openTableIntoToGrist;
  this.element.addEventListener("click", () => this.open(this.url));
}

/**
 * Open a URL in a new browser tab.
 *
 * @param {string} url URL to open.
 * @returns {Window|null} The opened window, or null when blocked by the browser.
 */
const openTableIntoToGrist = (url) => {
  return window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Return the button element.
 *
 * @returns {HTMLButtonElement} Rendered button.
 */
OpenGristTableBtn.prototype.render = function () {
  return this.element;
};

export default OpenGristTableBtn;

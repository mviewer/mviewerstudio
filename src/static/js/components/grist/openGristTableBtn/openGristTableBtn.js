import { getDocTables } from "../../../utils/grist/requests.js";
import { getGristTableUrl } from "../../../utils/grist/utils.js";

/**
 * Button that opens a Grist table in a new tab.
 *
 * @param {Object} [options] Component options.
 * @param {string} [options.url] Grist table URL.
 * @param {string} [options.apiUrl] Grist REST API base URL.
 * @param {string} [options.apiKey] Grist API key.
 * @param {string} [options.instanceUrl] Grist interface base URL.
 * @param {string} [options.orgId] Grist organization id.
 * @param {string} [options.docId] Grist document id.
 * @param {string} [options.tableId] Grist table id.
 * @param {string} [options.label="Ouvrir dans Grist"] Button label.
 * @param {string|string[]} [options.classes] Extra CSS classes.
 * @param {Function} [options.open] Function used to open the URL.
 */
export function OpenGristTableBtn(options = {}) {
  this.url = options.url;
  this.apiUrl = options.apiUrl;
  this.apiKey = options.apiKey;
  this.instanceUrl = options.instanceUrl;
  this.orgId = options.orgId;
  this.docId = options.docId;
  this.tableId = options.tableId;
  this.label = options.label || "Ouvrir dans Grist";
  this.classes = options.classes || [];
  this.element = document.createElement("button");

  this.element.type = "button";
  this.element.className = "btn btn-primary mt-3";
  this.element.classList.add(...this.classes);

  this.element.textContent = this.label;
  this.element.disabled = !this.url && !this.hasTableTarget();
  this.open = options.open || openTableIntoToGrist;
  this.element.addEventListener("click", () => this.openTable());
}

/**
 * Return whether the component can resolve a Grist table URL.
 *
 * @returns {boolean} True when all table identifiers are available.
 */
OpenGristTableBtn.prototype.hasTableTarget = function () {
  return Boolean(
    this.apiUrl &&
      this.apiKey &&
      this.instanceUrl &&
      this.orgId &&
      this.docId &&
      this.tableId
  );
};

/**
 * Resolve the Grist table URL with the table reference returned by the API.
 *
 * @returns {Promise<string>} URL opening the selected table in Grist.
 */
OpenGristTableBtn.prototype.getTableUrl = function () {
  if (this.url) {
    return Promise.resolve(this.url);
  }

  return getDocTables(this.apiUrl, this.docId, this.apiKey)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Grist request failed with status ${response.status}`);
      }

      return response.json();
    })
    .then((payload) => {
      // Grist URLs target the internal table reference, not only its public id.
      const tables = payload.tables || [];
      const table = tables.find((item) => item.id === this.tableId);

      if (!table) {
        throw new Error("Grist table not found");
      }

      return getGristTableUrl(
        this.instanceUrl,
        this.orgId,
        this.docId,
        this.tableId,
        getGristTableRef(table)
      );
    });
};

/**
 * Resolve then open the configured Grist table.
 *
 * @returns {void}
 */
OpenGristTableBtn.prototype.openTable = function () {
  this.element.disabled = true;

  this.getTableUrl()
    .then((url) => this.open(url))
    .catch((error) => console.error("Error opening Grist table:", error))
    .finally(() => {
      this.element.disabled = false;
    });
};

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

const getGristTableRef = (table) => {
  if (table.fields && table.fields.tableRef) {
    return table.fields.tableRef;
  }

  return table.tableRef || table.id;
};

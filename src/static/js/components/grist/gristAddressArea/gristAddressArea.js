/**
 * Grist address geocoding field selector.
 *
 * @param {Object} [options={}] Component options.
 * @param {string[]} [options.fields=[]] Available table fields.
 * @param {string[]} [options.values=[]] Initially selected fields.
 * @param {string} [options.id] Multiselect identifier.
 * @param {Function} [options.onChange] Callback called with selected fields.
 * @returns {void}
 */
const GristAddressArea = function (options = {}) {
  this.fields = options.fields || [];
  this.element = document.createElement("div");
  this.element.className = "grist-address-area";
  this.multiselect = new mv.components.multiselect({
    id: options.id || "grist-address-fields",
    label: mviewer.tr("grist.address.fields"),
    placeholder: mviewer.tr("template.ph.add_field"),
    options: this.fields,
    values: options.values || [],
    onChange: options.onChange,
  });
};

/**
 * Render the address fields multiselect.
 *
 * @returns {HTMLElement} Component root element.
 */
GristAddressArea.prototype.render = function () {
  this.element.innerHTML = "";
  this.element.appendChild(this.multiselect.render());

  return this.element;
};

/**
 * Return selected fields used for address geocoding.
 *
 * @returns {string[]} Selected field names.
 */
GristAddressArea.prototype.getFields = function () {
  return this.multiselect.getValues();
};

/**
 * Replace available table fields.
 *
 * @param {string[]} [fields=[]] Available field names.
 * @returns {HTMLElement} Component root element.
 */
GristAddressArea.prototype.setFields = function (fields = []) {
  this.fields = fields;
  this.multiselect.setOptions(fields);

  return this.element;
};

export default GristAddressArea;

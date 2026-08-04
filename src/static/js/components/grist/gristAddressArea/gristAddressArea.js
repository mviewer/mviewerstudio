/**
 * Grist address geocoding field selector.
 *
 * @param {Object} [options={}] Component options.
 * @param {string[]} [options.fields=[]] Available table fields.
 * @param {string[]} [options.values=[]] Initially selected fields.
 * @returns {void}
 */
const GristAddressArea = function (options = {}) {
  this.fields = options.fields || [];
  this.element = document.createElement("div");
  this.element.className = "grist-address-area";
  this.multiselect = new mv.components.multiselect({
    id: "grist-address-fields",
    label: "Sélectionnez les champs à utiliser pour le géocodage",
    placeholder: "Ajouter un champ",
    options: this.fields,
    values: options.values || [],
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

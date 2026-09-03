import Select from "../../select/select.js";
const DEFAULT_REFERENTIALS = [{ label: "Communes" }];

/**
 * Grist geographic referential matching selector.
 *
 * @param {Object} [options={}] Component options.
 * @param {string[]} [options.fields=[]] Available table fields.
 * @param {string} [options.idPrefix] Prefix for select identifiers.
 * @param {string} [options.matchingField] Selected matching field.
 */
const GristRefGeoArea = function (options = {}) {
  this.fieldOptions = this.getFieldOptions(options.fields || []);
  const idPrefix = options.idPrefix || "grist-refgeo";

  this.referentialSelectId = `${idPrefix}-referential`;
  this.outputFormatSelectId = `${idPrefix}-output-format`;
  this.element = document.createElement("div");
  this.element.className = "grist-refgeo-area";

  this.matchingFieldSelect = new Select({
    id: `${idPrefix}-matching-field`,
    label: "Sélectionnez le champ de correspondance",
    placeholder: "Sélectionner un champ",
    options: this.fieldOptions,
    value: options.matchingField || "",
    classes: "grist-refgeo-field",
    labelClasses: "grist-refgeo-label",
    selectClasses: "grist-refgeo-select",
  });
};

/**
 * Read Grist referentials from the loaded app config.
 *
 * @returns {Array} Grist referentials.
 */
GristRefGeoArea.prototype.getReferentials = function () {
  if (!window._conf || !window._conf.grist) {
    return DEFAULT_REFERENTIALS;
  }

  const referentials = window._conf.grist.grist_referentials || [];
  const items = referentials.filter((referential) => referential && referential.label);

  if (!items.length) {
    return DEFAULT_REFERENTIALS;
  }

  return items;
};

/**
 * Fill the referential select with configured labels.
 *
 * @returns {void}
 */
GristRefGeoArea.prototype.renderReferentialOptions = function () {
  const select = this.element.querySelector(`#${this.referentialSelectId}`);
  if (!select) {
    return;
  }

  this.getReferentials().forEach((referential) => {
    select.appendChild(new Option(referential.label, referential.label));
  });
};

/**
 * Render the referential matching fields.
 *
 * @returns {HTMLElement} Component root element.
 */
GristRefGeoArea.prototype.render = function () {
  this.element.innerHTML = `
    <div class="grist-location-panel">
      <div class="grist-refgeo-fields">
        <div data-grist-refgeo-matching-field></div>
        <div class="form-group grist-refgeo-field">
          <label class="grist-refgeo-label" for="${this.referentialSelectId}">
            Sélectionnez le référentiel
          </label>
          <select id="${this.referentialSelectId}" class="form-control grist-refgeo-select"></select>
        </div>
        <div class="form-group grist-refgeo-field">
          <label class="grist-refgeo-label" for="${this.outputFormatSelectId}">
            Format de sortie
          </label>
          <select id="${this.outputFormatSelectId}" class="form-control grist-refgeo-select">
            <option value="geojson">GeoJSON</option>
            <option value="wkt">WKT</option>
          </select>
        </div>
      </div>
    </div>
  `;

  const matchingFieldContainer = this.element.querySelector(
    "[data-grist-refgeo-matching-field]"
  );
  matchingFieldContainer.append(this.matchingFieldSelect.render());
  this.renderReferentialOptions();

  return this.element;
};

/**
 * Return selected matching field.
 *
 * @returns {string} Selected table field.
 */
GristRefGeoArea.prototype.getMatchingField = function () {
  return this.matchingFieldSelect.getValue();
};

/**
 * Return selected referential.
 *
 * @returns {string} Selected referential.
 */
GristRefGeoArea.prototype.getReferential = function () {
  const select = this.element.querySelector(`#${this.referentialSelectId}`);
  if (!select) {
    return "";
  }

  return select.value;
};

/**
 * Return the selected geometry output format.
 *
 * @returns {string} Selected output format.
 */
GristRefGeoArea.prototype.getOutputFormat = function () {
  const select = this.element.querySelector(`#${this.outputFormatSelectId}`);
  if (!select) {
    return "geojson";
  }

  return select.value;
};

/**
 * Convert field names to Select options.
 *
 * @param {string[]} fields Available field names.
 * @returns {Array<{label: string, value: string}>} Select options.
 */
GristRefGeoArea.prototype.getFieldOptions = function (fields = []) {
  return fields
    .filter((field) => field)
    .map((field) => ({ label: field, value: field }));
};

/**
 * Replace available table fields.
 *
 * @param {string[]} [fields=[]] Available field names.
 * @returns {HTMLElement} Component root element.
 */
GristRefGeoArea.prototype.setFields = function (fields = []) {
  this.fieldOptions = this.getFieldOptions(fields);
  this.matchingFieldSelect.setOptions(this.fieldOptions);

  return this.element;
};

export default GristRefGeoArea;

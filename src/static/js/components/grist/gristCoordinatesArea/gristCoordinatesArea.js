import Select from "../../select/select.js";

/**
 * Find the field that most likely contains a coordinate.
 *
 * @param {string[]} columns Available field names.
 * @param {string} coordinate Coordinate name: x or y.
 * @returns {string} Matching field name, or an empty string.
 */
const getMatchingCoordinateField = (columns, coordinate) => {
  const exactNames = coordinate === "x" ? ["x", "X"] : ["y", "Y"];
  const keyword = coordinate === "x" ? "lon" : "lat";
  const exactField = columns.find((column) => exactNames.includes(column));

  if (exactField) {
    return exactField;
  }

  return columns.find((column) => column.toLowerCase().includes(keyword)) || "";
};

/**
 * Return the localized label for the projection selector.
 *
 * @returns {string} Projection selector label.
 */
const getProjectionLabel = () => {
  if (typeof mviewer !== "undefined" && mviewer.tr) {
    return mviewer.tr("modal.layer.grist.mode.coordinates.projection");
  }

  return "Projection (SRS)";
};

/**
 * Read the available coordinate projections from the loaded Grist config.
 *
 * @returns {Array<{label: string, value: string}>} Configured SRS options.
 */
const getProjectionOptions = () => {
  if (!window._conf || !window._conf.grist) {
    return [];
  }

  const projections = window._conf.grist.srs || [];
  return projections.map((projection) => ({ label: projection, value: projection }));
};

/**
 * Grist coordinate field selector.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string[]} [options.columns=[]] Available table columns.
 * @param {string} [options.idPrefix] Prefix for select identifiers.
 * @param {string} [options.xField] Selected X field.
 * @param {string} [options.yField] Selected Y field.
 * @param {string} [options.projection] Selected projection.
 * @param {boolean} [options.displayProjection=true] Whether the projection selector is displayed with the coordinate fields.
 * @param {Function} [options.onProjectionChange] Called when the selected projection changes.
 * @returns {void}
 */
const GristCoordinatesArea = function (options = {}) {
  this.columns = options.columns || [];
  this.columnOptions = this.getColumnOptions(this.columns);
  this.xField = options.xField || getMatchingCoordinateField(this.columns, "x");
  this.yField = options.yField || getMatchingCoordinateField(this.columns, "y");
  const projectionOptions = getProjectionOptions();
  this.projection = options.projection || "EPSG:4326";
  if (!projectionOptions.some((projection) => projection.value === this.projection)) {
    this.projection = "";
    if (projectionOptions.length) {
      this.projection = projectionOptions[0].value;
    }
  }
  this.displayProjection = options.displayProjection !== false;
  this.onProjectionChange = options.onProjectionChange || function () {};
  const idPrefix = options.idPrefix || "grist-coordinate";
  this.element = document.createElement("div");
  this.element.className = "grist-coordinates-area";

  this.xSelect = new Select({
    id: `${idPrefix}-x`,
    label: "X (longitude)",
    placeholder: "Sélectionner la colonne X",
    value: this.xField,
    options: this.columnOptions,
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
  });

  this.ySelect = new Select({
    id: `${idPrefix}-y`,
    label: "Y (latitude)",
    placeholder: "Sélectionner la colonne Y",
    value: this.yField,
    options: this.columnOptions,
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
  });

  this.projectionSelect = new Select({
    id: `${idPrefix}-projection`,
    label: getProjectionLabel(),
    value: this.projection,
    options: projectionOptions,
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
    onChange: (projection) => {
      this.projection = projection;
      this.onProjectionChange(projection);
    },
  });
};

GristCoordinatesArea.prototype.render = function () {
  this.element.innerHTML = `
    <div class="grist-location-panel">
      <div class="grist-coordinates-fields"></div>
    </div>
  `;
  const fieldsContainer = this.element.querySelector(".grist-coordinates-fields");
  fieldsContainer.append(this.xSelect.render(), this.ySelect.render());
  if (this.displayProjection) {
    fieldsContainer.appendChild(this.projectionSelect.render());
  }

  return this.element;
};

GristCoordinatesArea.prototype.getYField = function () {
  return this.ySelect.getValue();
};

GristCoordinatesArea.prototype.getXField = function () {
  return this.xSelect.getValue();
};

GristCoordinatesArea.prototype.getProjection = function () {
  return this.projectionSelect.getValue();
};

/**
 * Render the projection selector outside the coordinate fields card.
 *
 * @returns {HTMLElement} Projection selector element.
 */
GristCoordinatesArea.prototype.renderProjection = function () {
  return this.projectionSelect.render();
};

GristCoordinatesArea.prototype.getColumnOptions = function (columns = []) {
  return columns
    .filter((column) => column)
    .map((column) => ({ label: column, value: column }));
};

GristCoordinatesArea.prototype.setColumnOptions = function (columns = []) {
  this.columns = columns;
  this.columnOptions = this.getColumnOptions(columns);
  this.xField = getMatchingCoordinateField(columns, "x");
  this.yField = getMatchingCoordinateField(columns, "y");

  this.xSelect.setOptions(this.columnOptions);
  this.ySelect.setOptions(this.columnOptions);
  this.xSelect.setValue(this.xField);
  this.ySelect.setValue(this.yField);

  return this.element;
};

export default GristCoordinatesArea;

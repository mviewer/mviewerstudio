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

const GristCoordinatesArea = function (options = {}) {
  this.columns = options.columns || [];
  this.columnOptions = this.getColumnOptions(this.columns);
  this.xField = getMatchingCoordinateField(this.columns, "x");
  this.yField = getMatchingCoordinateField(this.columns, "y");
  this.element = document.createElement("div");
  this.element.className = "grist-coordinates-area";

  this.xSelect = new Select({
    id: "grist-coordinate-x",
    label: "X (longitude)",
    placeholder: "Sélectionner la colonne X",
    value: this.xField,
    options: this.columnOptions,
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
  });

  this.ySelect = new Select({
    id: "grist-coordinate-y",
    label: "Y (latitude)",
    placeholder: "Sélectionner la colonne Y",
    value: this.yField,
    options: this.columnOptions,
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
  });

  this.projectionSelect = new Select({
    id: "grist-coordinate-projection",
    label: "Projection (SRS)",
    value: "EPSG:4326",
    options: [
      { label: "EPSG:4326", value: "EPSG:4326" },
      { label: "EPSG:2154", value: "EPSG:2154" },
      { label: "EPSG:3857", value: "EPSG:3857" },
    ],
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
  });
};

GristCoordinatesArea.prototype.render = function () {
  this.element.innerHTML = `
    <div class="grist-location-panel">
      <div class="grist-coordinates-fields"></div>
    </div>
  `;
  const fieldsContainer = this.element.querySelector(".grist-coordinates-fields");
  fieldsContainer.append(
    this.xSelect.render(),
    this.ySelect.render(),
    this.projectionSelect.render()
  );

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

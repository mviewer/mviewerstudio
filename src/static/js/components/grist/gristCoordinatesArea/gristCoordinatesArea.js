import Select from "../../select/select.js";

const GristCoordinatesArea = function (options = {}) {
  this.columnOptions = this.getColumnOptions(options.columns || []);
  this.element = document.createElement("div");
  this.element.className = "grist-coordinates-area";

  this.xSelect = new Select({
    id: "grist-coordinate-x",
    label: "X (longitude)",
    placeholder: "Sélectionner la colonne X",
    options: this.columnOptions,
    classes: "grist-coordinates-field",
    labelClasses: "grist-coordinates-label",
    selectClasses: "grist-coordinates-select",
  });

  this.ySelect = new Select({
    id: "grist-coordinate-y",
    label: "Y (latitude)",
    placeholder: "Sélectionner la colonne Y",
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
    .map((column) => {
      if (typeof column === "string") {
        return { label: column, value: column };
      }

      return column;
    })
    .filter((column) => column?.label && column?.value);
};

GristCoordinatesArea.prototype.setColumnOptions = function (columns = []) {
  this.columnOptions = this.getColumnOptions(columns);

  this.xSelect.setOptions(this.columnOptions);
  this.ySelect.setOptions(this.columnOptions);

  return this.element;
};

export default GristCoordinatesArea;

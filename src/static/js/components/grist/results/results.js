/**
 * Common Grist result display.
 *
 * @param {Object} options Component options.
 * @param {string} options.type Result type: success, partial or failure.
 * @param {string} [options.title] Result title.
 * @param {string} [options.label] Deprecated result title alias.
 * @param {string} [options.message] Result message.
 * @param {string} [options.tableTitle="Lignes à vérifier"] Rows table title.
 * @param {number} [options.localizedRows=0] Number of localized rows.
 * @param {number} [options.totalRows=0] Number of total rows.
 * @param {Object[]} [options.ungeocodedRows=[]] Rows not localized.
 * @param {HTMLElement[]} [options.actions=[]] Action buttons.
 * @param {boolean} [options.displayCorrectionBtn=false] Display correction action.
 * @param {boolean} [options.displayTriggerProcessBtn=false] Display process retry action.
 * @param {Function} [options.onCorrection] Correction action callback.
 * @param {Function} [options.onTriggerProcess] Process retry callback.
 */
const GristResult = function (options = {}) {
  this.type = options.type || "failure";
  this.label = options.title || options.label || "";
  this.message = options.message || "";
  this.tableTitle = options.tableTitle || "Lignes à vérifier";
  this.localizedRows = options.localizedRows || 0;
  this.totalRows = options.totalRows || 0;
  this.ungeocodedRows = options.ungeocodedRows || [];
  this.actions = options.actions || [];
  this.displayCorrectionBtn = options.displayCorrectionBtn || false;
  this.displayTriggerProcessBtn = options.displayTriggerProcessBtn || false;
  this.onCorrection = options.onCorrection || function () {};
  this.onTriggerProcess = options.onTriggerProcess || function () {};
  this.element = document.createElement("div");
};

/**
 * Create an action button displayed in a Grist result.
 *
 * @param {string} label Button label.
 * @param {string} className Button CSS classes.
 * @param {Function} onClick Button click handler.
 * @returns {HTMLButtonElement} Action button.
 */
const createGristResultButton = (label, className, onClick) => {
  const button = document.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);

  return button;
};

/**
 * Return the icon matching the result type.
 *
 * @returns {string} Result icon.
 */
GristResult.prototype.getIcon = function () {
  if (this.type === "success") {
    return "✓";
  }

  if (this.type === "partial") {
    return "!";
  }

  return "×";
};

/**
 * Render non-localized rows table.
 *
 * @returns {HTMLElement|null} Rendered table or null.
 */
GristResult.prototype.renderUngeocodedRows = function () {
  let Table = null;

  if (mv.components) {
    Table = mv.components.table;
  }

  if (!Table || !this.ungeocodedRows.length) {
    return null;
  }

  const table = new Table({
    title: this.tableTitle,
    data: {
      data: this.ungeocodedRows,
      meta: { fields: Object.keys(this.ungeocodedRows[0] || {}) },
    },
    maxRows: 5,
    paginate: true,
    emptyMessage: "Aucune ligne à vérifier.",
  });

  return table.render();
};

/**
 * Render action buttons.
 *
 * @returns {HTMLElement|null} Rendered actions or null.
 */
GristResult.prototype.renderActions = function () {
  const actions = [...this.actions];

  if (this.displayCorrectionBtn) {
    actions.push(
      createGristResultButton(
        "Corriger dans Grist",
        "btn grist-geocoding-result-secondary-button",
        this.onCorrection
      )
    );
  }

  if (this.displayTriggerProcessBtn) {
    actions.push(
      createGristResultButton(
        "Relancer",
        "btn grist-geocoding-result-primary-button",
        this.onTriggerProcess
      )
    );
  }

  if (!actions.length) {
    return null;
  }

  const actionsContainer = document.createElement("div");
  actionsContainer.className = "grist-geocoding-result-actions";
  actionsContainer.append(...actions);

  return actionsContainer;
};

/**
 * Render the result.
 *
 * @returns {HTMLElement} Rendered result.
 */
GristResult.prototype.render = function () {
  const icon = document.createElement("div");
  const title = document.createElement("h6");
  const counter = document.createElement("p");
  const message = document.createElement("p");
  const rowsTable = this.renderUngeocodedRows();
  const actions = this.renderActions();

  this.element.className = `grist-geocoding-result grist-geocoding-result-${this.type}`;
  this.element.replaceChildren();

  icon.className = "grist-geocoding-result-icon";
  icon.textContent = this.getIcon();
  title.className = "grist-geocoding-result-title";
  title.textContent = this.label;
  counter.className = "grist-geocoding-result-counter";
  counter.innerHTML = `<strong>${this.localizedRows}/${this.totalRows}</strong> lignes localisées`;
  message.className = "grist-geocoding-result-message";
  message.textContent = this.message;

  this.element.append(icon, title, counter);

  if (this.message) {
    this.element.appendChild(message);
  }

  if (rowsTable) {
    this.element.appendChild(rowsTable);
  }

  if (actions) {
    this.element.appendChild(actions);
  }

  return this.element;
};

export { createGristResultButton };
export default GristResult;

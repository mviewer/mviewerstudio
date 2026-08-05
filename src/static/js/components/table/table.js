/**
 * Component that read papaparse data (entry props).
 * Many instances can be crated.
 * Display a limited number of rows (5 by default). Can display all paginated rows if paginate props is true and maxRow is null.
 * Display data header to get columns name.
 * Compliant with Bootstrap style.
 *
 * use case :
 *  - user import csv data from file or grist table
 *  - user can check data before import from this table
 */

const DEFAULT_MAX_ROWS = 5;

/**
 * Returns rows from either a raw array or a PapaParse result object.
 *
 * @param {Array|Object} data Data source.
 * @returns {Array} Table rows.
 */
function getRows(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/**
 * Resolves table headers from PapaParse metadata or from the first object row.
 * Array rows fallback to numeric column labels.
 *
 * @param {Array} rows Table rows.
 * @param {Object|Array} data Original data source.
 * @returns {string[]} Header labels.
 */
function getHeaders(rows, data) {
  if (Array.isArray(data?.meta?.fields) && data.meta.fields.length) {
    return data.meta.fields;
  }

  const firstRow = rows.find((row) => row && typeof row === "object");

  if (!firstRow) {
    return [];
  }

  return Array.isArray(firstRow)
    ? firstRow.map((_, index) => String(index + 1))
    : Object.keys(firstRow);
}

/**
 * Reads a displayable cell value from an array row, object row, or scalar row.
 *
 * @param {*} row Current row.
 * @param {string} header Current column header.
 * @param {number} index Current column index.
 * @returns {*} Cell value.
 */
function getCellValue(row, header, index) {
  if (Array.isArray(row)) {
    return row[index] ?? "";
  }

  if (row && typeof row === "object") {
    return row[header] ?? "";
  }

  return row ?? "";
}

/**
 * Normalizes optional classes before appending them to the Bootstrap table.
 *
 * @param {string|string[]} classes Classes provided by the caller.
 * @returns {string} Space-separated classes.
 */
function normalizeClasses(classes) {
  if (Array.isArray(classes)) {
    return classes.filter(Boolean).join(" ");
  }

  return classes || "";
}

/**
 * Bootstrap-compatible table component for previewing imported data.
 *
 * @param {Object} [options] Component options.
 * @param {Array|Object} [options.data=[]] Raw rows or PapaParse result.
 * @param {number|null} [options.maxRows=5] Number of rows displayed per page. Null displays every row.
 * @param {boolean} [options.paginate=false] Enables pagination when rows exceed maxRows.
 * @param {number} [options.page=1] Initial page.
 * @param {string} [options.title] Preview title.
 * @param {string} [options.subtitle] Preview subtitle.
 * @param {string} [options.emptyMessage] Message shown when data is empty.
 * @param {string|string[]} [options.classes] Extra CSS classes added to the table.
 */
function Table(options = {}) {
  this.data = options.data || [];
  this.maxRows = options.maxRows === undefined ? DEFAULT_MAX_ROWS : options.maxRows;
  this.paginate = Boolean(options.paginate);
  this.currentPage = Number(options.page) || 1;
  this.title = options.title || "";
  this.subtitle = options.subtitle || "";
  this.emptyMessage = options.emptyMessage || "Aucune donnee a afficher.";
  this.classes = normalizeClasses(options.classes);
  this.element = document.createElement("div");
  this.element.className = "table-preview";
}

/**
 * Replaces the component data and resets pagination to the first page.
 *
 * @param {Array|Object} data New raw rows or PapaParse result.
 * @returns {HTMLElement} Rendered component element.
 */
Table.prototype.setData = function (data) {
  this.data = data || [];
  this.currentPage = 1;
  return this.render();
};

/**
 * Updates preview title and subtitle.
 *
 * @param {string} title Preview title.
 * @param {string} subtitle Preview subtitle.
 * @returns {HTMLElement} Rendered component element.
 */
Table.prototype.setTitle = function (title, subtitle) {
  this.title = title || "";
  this.subtitle = subtitle || "";
  return this.render();
};

/**
 * Returns the effective page size. Null means every row is displayed.
 *
 * @returns {number|null} Page size.
 */
Table.prototype.getPageSize = function () {
  return this.maxRows === null
    ? null
    : Math.max(Number(this.maxRows) || DEFAULT_MAX_ROWS, 1);
};

/**
 * Computes the number of pages for the current display mode.
 *
 * @param {Array} rows Table rows.
 * @returns {number} Page count.
 */
Table.prototype.getPageCount = function (rows) {
  const pageSize = this.getPageSize();
  return pageSize && this.paginate ? Math.max(Math.ceil(rows.length / pageSize), 1) : 1;
};

/**
 * Returns the rows visible for the current page and pagination settings.
 *
 * @param {Array} rows Table rows.
 * @returns {Array} Visible rows.
 */
Table.prototype.getVisibleRows = function (rows) {
  const pageSize = this.getPageSize();

  if (!pageSize) {
    return rows;
  }

  if (!this.paginate) {
    return rows.slice(0, pageSize);
  }

  const pageCount = this.getPageCount(rows);
  this.currentPage = Math.min(Math.max(this.currentPage, 1), pageCount);

  return rows.slice((this.currentPage - 1) * pageSize, this.currentPage * pageSize);
};

/**
 * Renders Bootstrap pagination controls when pagination is enabled.
 *
 * @param {number} pageCount Total page count.
 */
Table.prototype.renderPagination = function (pageCount) {
  if (!this.paginate || pageCount <= 1) {
    return;
  }

  const nav = document.createElement("nav");
  const list = document.createElement("ul");
  nav.setAttribute("aria-label", "Pagination du tableau");
  list.className = "pagination pagination-sm table-preview__pagination mb-0";

  const addItem = (label, page, disabled, active) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    item.className = "page-item";
    button.type = "button";
    button.className = "page-link";
    button.textContent = label;
    item.classList.toggle("disabled", disabled);
    item.classList.toggle("active", active);
    button.disabled = disabled;
    button.addEventListener("click", () => {
      this.currentPage = page;
      this.render();
    });
    item.appendChild(button);
    list.appendChild(item);
  };

  addItem("‹ Précédent", this.currentPage - 1, this.currentPage === 1, false);

  for (let page = 1; page <= pageCount; page += 1) {
    addItem(String(page), page, false, page === this.currentPage);
  }

  addItem("Suivant ›", this.currentPage + 1, this.currentPage === pageCount, false);
  nav.appendChild(list);
  this.element.appendChild(nav);
};

/**
 * Renders the table, including headers, visible rows, and optional pagination.
 *
 * @returns {HTMLElement} Component DOM element.
 */
Table.prototype.render = function () {
  const rows = getRows(this.data);
  const headers = getHeaders(rows, this.data);
  const visibleRows = this.getVisibleRows(rows);
  const pageCount = this.getPageCount(rows);
  const tableScroller = document.createElement("div");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  this.element.replaceChildren();
  tableScroller.className = "table-preview__scroller";
  table.className = `table table-sm table-preview__table ${this.classes}`.trim();

  if (this.title || this.subtitle) {
    const header = document.createElement("div");
    header.className = "table-preview__header";

    if (this.title) {
      const title = document.createElement("h6");
      title.className = "table-preview__title";
      title.textContent = this.title;
      header.appendChild(title);
    }

    if (this.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "table-preview__subtitle";
      subtitle.textContent = this.subtitle;
      header.appendChild(subtitle);
    }

    this.element.appendChild(header);
  }

  if (!rows.length || !headers.length) {
    const message = document.createElement("p");
    message.className = "text-muted mb-0";
    message.textContent = this.emptyMessage;
    this.element.appendChild(message);
    return this.element;
  }

  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  visibleRows.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((header, index) => {
      const td = document.createElement("td");
      td.textContent = getCellValue(row, header, index);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tableScroller.appendChild(table);
  this.element.appendChild(tableScroller);
  this.renderPagination(pageCount);

  return this.element;
};

/**
 * Appends the component to a target container and renders it.
 *
 * @param {HTMLElement} target Target container.
 * @returns {HTMLElement} Component DOM element.
 */
Table.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default Table;

/**
 * Infer a Grist column type from nonempty source cells.
 * Mixed values and empty columns use Text to avoid losing source content.
 * @param {Array<*>} values Source column values.
 * @returns {string} Grist column type.
 */
export const getGristColumnType = (values) => {
  const cells = values.filter(
    (value) => value !== null && value !== undefined && value !== ""
  );
  if (!cells.length) {
    return "Text";
  }
  if (cells.every((value) => typeof value === "boolean")) {
    return "Bool";
  }
  if (cells.every((value) => typeof value === "number" && Number.isFinite(value))) {
    return "Numeric";
  }
  if (cells.every((value) => value instanceof Date && !Number.isNaN(value.getTime()))) {
    if (
      cells.every(
        (value) =>
          value.getUTCHours() === 0 &&
          value.getUTCMinutes() === 0 &&
          value.getUTCSeconds() === 0 &&
          value.getUTCMilliseconds() === 0
      )
    ) {
      return "Date";
    }
    return "DateTime:UTC";
  }
  return "Text";
};

/**
 * Serialize a source cell for the Grist REST API and its declared column type.
 * @param {*} value Source cell value.
 * @param {string} type Target Grist column type.
 * @returns {string|number|boolean|null} JSON-compatible cell value.
 */
export const getGristCellValue = (value, type) => {
  if (value === null || value === undefined || value === "") {
    if (type === "Text") {
      return "";
    }
    return null;
  }
  if (value instanceof Date) {
    if (type === "Text") {
      return value.toISOString();
    }
    return value.getTime() / 1000;
  }
  if (type === "Text") {
    return `${value}`;
  }
  return value;
};

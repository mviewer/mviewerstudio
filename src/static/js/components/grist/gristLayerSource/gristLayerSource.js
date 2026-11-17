import { createGristApiError, readGristResponse } from "../../../utils/grist/apiError.js";
import { getDocTables, getTableRecords } from "../../../utils/grist/requests.js";
import { getGristTableUrl } from "../../../utils/grist/utils.js";

/**
 * Adapter exposing an existing Grist table through the same interface as the
 * import area. It lets the localisation workflow process a saved Grist layer
 * without creating a second copy of the table.
 *
 * @param {Object} options Existing Grist table configuration.
 * @param {string} options.apiUrl Grist API URL.
 * @param {string} options.instanceUrl Grist application URL.
 * @param {string} options.orgId Grist organization identifier.
 * @param {string} options.docId Grist document identifier.
 * @param {string} options.tableId Grist table identifier.
 * @param {string} options.apiKey Grist API key.
 * @param {Object} [options.data] Initial CSV preview data.
 * @returns {void}
 */
const GristLayerSource = function (options) {
  Object.assign(this, options);
};

/**
 * Return the Grist table identity expected by shared localisation utilities.
 *
 * @returns {{docId: string, tableId: string}}
 */
GristLayerSource.prototype.getTargetTable = function () {
  return { docId: this.docId, tableId: this.tableId };
};

/**
 * Load live records so checks and geocoding use the same data as the import
 * workflow, rather than the static preview.
 *
 * @returns {Promise<{docId: string, tableId: string, fields: string[], rows: Object[], records: Object[]}>}
 */
GristLayerSource.prototype.getSourceData = async function () {
  const response = await getTableRecords(
    this.apiUrl,
    this.docId,
    this.tableId,
    this.apiKey
  );

  const payload = await readGristResponse(response);
  const records = payload.records || [];
  const rows = records.map((record) => record.fields || {});
  const fields = rows.length
    ? Object.keys(rows[0])
    : (this.data && this.data.meta.fields) || [];

  return { docId: this.docId, tableId: this.tableId, fields, rows, records };
};

/**
 * Resolve and return the canonical Grist table URL.
 *
 * @returns {Promise<string>}
 */
GristLayerSource.prototype.getTargetTableUrl = async function () {
  const response = await getDocTables(this.apiUrl, this.docId, this.apiKey);

  const payload = await readGristResponse(response);
  const table = (payload.tables || []).find((item) => item.id === this.tableId);
  const tableRef =
    table && ((table.fields && table.fields.tableRef) || table.tableRef || table.id);

  if (!tableRef) {
    throw await createGristApiError(new Error("Grist table reference not found"));
  }

  return getGristTableUrl(
    this.instanceUrl,
    this.orgId,
    this.docId,
    this.tableId,
    tableRef
  );
};

export default GristLayerSource;

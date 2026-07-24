import { getTableRecords } from "../../utils/grist/requests.js";
import { getGristConfig } from "../../utils/grist/utils.js";

/**
 * Parse a successful Grist API response as JSON.
 *
 * @param {Response} response Fetch response.
 * @returns {Promise<*>} Parsed JSON body.
 * @throws {Error} When the Grist API response is not successful.
 */
const readJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * Normalize Grist API list responses, which may be arrays or keyed objects.
 *
 * @param {*[]|Object|null|undefined} payload Grist API response payload.
 * @param {string} key Object property that contains the list.
 * @returns {*[]} Normalized list.
 */
const normalizeList = (payload, key) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.[key])) {
    return payload.data[key];
  }

  return [];
};

/**
 * Fetch preview rows from a selected Grist table and format them for the table
 * preview component.
 *
 * @param {Object|null} selectedTable Selected table entry from ListGristTables.
 * @param {string|number} selectedTable.docId Grist document id.
 * @param {string|number} selectedTable.tableId Grist table id.
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<{data: Object[], meta: {fields: string[]}}>} Preview data.
 */
export const gristTableToPreview = async (selectedTable, gristApiKey) => {
  if (!selectedTable?.docId || !selectedTable?.tableId || !gristApiKey) {
    return { data: [], meta: { fields: [] } };
  }

  const gristConfig = await getGristConfig();
  const payload = await getTableRecords(
    gristConfig.instanceUrl,
    selectedTable.docId,
    selectedTable.tableId,
    gristApiKey,
    { limit: 5 }
  ).then(readJson);
  const rows = normalizeList(payload, "records").map((record) => ({
    ...(record?.fields || record),
  }));
  const fields = rows.reduce((headers, row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });

    return headers;
  }, []);

  return { data: rows, meta: { fields } };
};

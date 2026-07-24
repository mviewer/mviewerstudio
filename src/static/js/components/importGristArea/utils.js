import {
  createWorkspaceDoc,
  getDocTables,
  getWorkspaceDocsList,
  postRecordsToTable,
  postTablesToDoc,
} from "../../utils/grist/requests.js";
import {
  getGristConfig,
  getOrCreateWorkspace,
} from "../../utils/grist/utils.js";

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
 * Read the most stable identifier exposed by a Grist entity.
 *
 * @param {*} item Grist entity.
 * @returns {string|number|undefined} Entity identifier.
 */
const getGristId = (item) => {
  if (typeof item === "string" || typeof item === "number") {
    return item;
  }

  return item?.id ?? item?.data?.id ?? item?.name ?? item?.domain;
};

/**
 * Read the display name exposed by a Grist entity.
 *
 * @param {*} item Grist entity.
 * @returns {string|number|undefined} Entity display name.
 */
const getGristName = (item) => item?.name ?? item?.title ?? item?.id;

/**
 * Normalize parsed file data to an array of rows.
 *
 * @param {Object|Array|null|undefined} data Parsed file data.
 * @returns {Array} Row list.
 */
const getRows = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

/**
 * Resolve column headers from parsed file metadata or the first data row.
 *
 * @param {Array} rows Parsed rows.
 * @param {Object|Array|null|undefined} data Original parsed file data.
 * @returns {string[]} Column headers.
 */
const getHeaders = (rows, data) => {
  if (Array.isArray(data?.meta?.fields) && data.meta.fields.length) {
    return data.meta.fields;
  }

  const firstRow = rows.find((row) => row && typeof row === "object");

  if (!firstRow) {
    return [];
  }

  return Array.isArray(firstRow)
    ? firstRow.map((_, index) => `column_${index + 1}`)
    : Object.keys(firstRow);
};

/**
 * Read a cell value from an object, array, or scalar row.
 *
 * @param {*} row Parsed row.
 * @param {string} header Column header.
 * @param {number} index Column index.
 * @returns {*} Cell value.
 */
const getCellValue = (row, header, index) => {
  if (Array.isArray(row)) {
    return row[index] ?? "";
  }

  if (row && typeof row === "object") {
    return row[header] ?? "";
  }

  return row ?? "";
};

/**
 * Convert a display value to a Grist-compatible identifier.
 *
 * @param {*} value Source value.
 * @param {string} fallback Fallback value when source is empty.
 * @returns {string} Grist-compatible identifier.
 */
const normalizeGristId = (value, fallback) => {
  const normalized = String(value || fallback || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return /^[A-Za-z]/.test(normalized) ? normalized : `Table_${normalized || "1"}`;
};

/**
 * Convert a display value to a Grist-compatible table identifier.
 *
 * @param {*} value Source value.
 * @param {string} fallback Fallback value when source is empty.
 * @returns {string} Grist-compatible table identifier.
 */
const normalizeGristTableId = (value, fallback) => {
  const tableId = normalizeGristId(value, fallback);

  return tableId.charAt(0).toUpperCase() + tableId.slice(1);
};

/**
 * Generate unique Grist-compatible identifiers for a list of values.
 *
 * @param {Array} values Source values.
 * @param {string} fallbackPrefix Prefix used when a source value is empty.
 * @returns {string[]} Unique Grist-compatible identifiers.
 */
const getUniqueGristIds = (values, fallbackPrefix) => {
  const used = new Set();

  return values.map((value, index) => {
    const baseId = normalizeGristId(value, `${fallbackPrefix}_${index + 1}`);
    let uniqueId = baseId;
    let suffix = 2;

    while (used.has(uniqueId)) {
      uniqueId = `${baseId}_${suffix}`;
      suffix += 1;
    }

    used.add(uniqueId);
    return uniqueId;
  });
};

/**
 * Read the current map title from the application form.
 *
 * @returns {string} Current map title or fallback name.
 */
const getCurrentMapTitle = () => {
  return document.querySelector("#opt-title")?.value?.trim() || "Carte";
};

/**
 * Read a document id from the different shapes returned by document creation.
 *
 * @param {*} doc Created Grist document response.
 * @returns {string|number|undefined} Document identifier.
 */
const getCreatedDocId = (doc) => {
  return getGristId(doc) ?? doc?.data ?? doc?.doc?.id;
};

/**
 * Return a document id from the configured workspace, creating the document
 * only when no existing document has the requested name.
 *
 * @param {string} gristApiKey Grist API key.
 * @param {string} documentName Document name.
 * @returns {Promise<string|number|undefined>} Grist document id.
 * @throws {Error} When document lookup or creation fails.
 */
const getOrCreateDocument = async (gristApiKey, documentName) => {
  const gristConfig = await getGristConfig();
  const workspaceId = await getOrCreateWorkspace(gristApiKey);
  const docs = await getWorkspaceDocsList(
    gristConfig.instanceUrl,
    workspaceId,
    gristApiKey
  );
  const existingDoc = docs.find((doc) => getGristName(doc) === documentName);

  if (existingDoc) {
    return getGristId(existingDoc);
  }

  const createdDoc = await createWorkspaceDoc(
    gristConfig.instanceUrl,
    workspaceId,
    documentName,
    gristApiKey
  ).then(readJson);

  return getCreatedDocId(createdDoc);
};

/**
 * Ensure that a table id does not already exist in a Grist document.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @param {string} tableId Table id to check.
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<string>} Checked table id.
 * @throws {Error} When the table already exists.
 */
const ensureTableDoesNotExist = async (
  instanceUrl,
  docId,
  tableId,
  gristApiKey
) => {
  const payload = await getDocTables(instanceUrl, docId, gristApiKey).then(
    readJson
  );
  const usedTableIds = new Set(
    (payload.tables || []).map((table) =>
      String(getGristId(table)).toLowerCase()
    )
  );

  if (usedTableIds.has(String(tableId).toLowerCase())) {
    throw new Error(`La table Grist "${tableId}" existe deja.`);
  }

  return tableId;
};

/**
 * Resolve the table id as stored by Grist.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @param {string} tableId Requested table id.
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<string>} Actual Grist table id.
 * @throws {Error} When the table cannot be found after creation.
 */
const getActualTableId = async (instanceUrl, docId, tableId, gristApiKey) => {
  const payload = await getDocTables(instanceUrl, docId, gristApiKey).then(
    readJson
  );
  const table = (payload.tables || []).find(
    (item) => String(getGristId(item)).toLowerCase() === tableId.toLowerCase()
  );
  const actualTableId = getGristId(table);

  if (!actualTableId) {
    throw new Error(`La table Grist "${tableId}" est introuvable apres creation.`);
  }

  return actualTableId;
};

/**
 * Reuse or create a Grist document for the current map and upload parsed file
 * data into a new table.
 *
 * @param {Object|Array} parsedData Parsed file data, usually a PapaParse result.
 * @param {string} tableName Grist table display name.
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<{docId: string|number, tableId: string, rowsCount: number}>} Upload result.
 */
export const sendParsedFileToGrist = async (
  parsedData,
  tableName,
  gristApiKey
) => {
  const rows = getRows(parsedData);
  const headers = getHeaders(rows, parsedData);

  if (!gristApiKey) {
    throw new Error("Missing Grist API key");
  }

  if (!rows.length || !headers.length) {
    throw new Error("No parsed data to send to Grist");
  }

  const gristConfig = await getGristConfig();
  const docId = await getOrCreateDocument(gristApiKey, getCurrentMapTitle());

  if (docId === undefined || docId === null || docId === "") {
    throw new Error("Grist document has no id");
  }

  const tableId = await ensureTableDoesNotExist(
    gristConfig.instanceUrl,
    docId,
    normalizeGristTableId(tableName, "Table_1"),
    gristApiKey
  );
  const columnIds = getUniqueGristIds(headers, "column");

  await postTablesToDoc(
    gristConfig.instanceUrl,
    docId,
    {
      tables: [
        {
          id: tableId,
          columns: columnIds.map((columnId, index) => ({
            id: columnId,
            fields: { label: headers[index] },
          })),
        },
      ],
    },
    gristApiKey
  ).then(readJson);

  const actualTableId = await getActualTableId(
    gristConfig.instanceUrl,
    docId,
    tableId,
    gristApiKey
  );

  await postRecordsToTable(
    gristConfig.instanceUrl,
    docId,
    actualTableId,
    {
      records: rows.map((row) => ({
        fields: columnIds.reduce((record, columnId, index) => {
          record[columnId] = getCellValue(row, headers[index], index);
          return record;
        }, {}),
      })),
    },
    gristApiKey
  ).then(readJson);

  return { docId, tableId: actualTableId, rowsCount: rows.length };
};

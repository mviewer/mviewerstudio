import {
  BAN_GEOCODING_FIELDS,
  GRIST_LOCATION_SWITCH_IDS,
  GRIST_RESULT_CONTAINER_ID,
} from "./const.js";
import { updateSelectLayersButtonForLocalizedRows } from "./validation.js";
import {
  patchRecordsToTable,
  postColumnsToTable,
  postCsvToBanGeocoding,
} from "./requests.js";
import { getGristConfig } from "./utils.js";
import GristResult, {
  createGristResultButton,
} from "../../components/grist/results/results.js";

let activeGeocodingTotalRows = 0;

/**
 * Escape a value for CSV output.
 *
 * @param {*} value Cell value.
 * @returns {string} CSV-safe value.
 */
const getCsvValue = (value) => {
  let text = "";

  if (value || value === 0) {
    text = `${value}`;
  }

  if (!/[",\n\r;]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const getRowFieldValue = (row, field, index) => {
  if (Array.isArray(row)) {
    return row[index];
  }

  return row[field];
};

/**
 * Convert row objects or arrays to CSV text using selected fields.
 *
 * @param {Array<Object|Array>} rows Source rows.
 * @param {string[]} fields Fields to include in the CSV.
 * @returns {string} CSV content.
 */
const rowsToCsv = (rows, fields) =>
  [
    fields.map(getCsvValue).join(","),
    ...rows.map((row) =>
      fields
        .map((field, index) => getCsvValue(getRowFieldValue(row, field, index)))
        .join(",")
    ),
  ].join("\n");

/**
 * Keep only the BAN geocoding result fields used by the UI and Grist update.
 *
 * @param {Object} row Parsed BAN CSV row.
 * @returns {Object} Simplified BAN geocoding row.
 */
const simplifyBanGeocodingRow = (row) =>
  BAN_GEOCODING_FIELDS.reduce((simplifiedRow, field) => {
    if (row && row[field] != null) {
      simplifiedRow[field] = row[field];
      return simplifiedRow;
    }

    simplifiedRow[field] = "";
    return simplifiedRow;
  }, {});

/**
 * Parse BAN CSV response rows.
 *
 * PapaParse is preferred when available because it correctly handles quoted CSV
 * values. The fallback parser covers simple comma-separated responses.
 *
 * @param {string} csvText CSV text returned by BAN.
 * @returns {Object[]} Parsed rows.
 */
const parseCsvRows = (csvText) => {
  if (window.Papa) {
    return Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    }).data.map(simplifyBanGeocodingRow);
  }

  const [headerLine, ...lines] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return lines
    .map((line) =>
      line.split(",").reduce((row, value, index) => {
        row[headers[index]] = value;
        return row;
      }, {})
    )
    .map(simplifyBanGeocodingRow);
};

const getGeocodedValue = (row, field) => {
  if (!row) {
    return "";
  }

  if (!row[field] && row[field] !== 0) {
    return "";
  }

  return row[field];
};

const isUngeocodedRow = (row, gristConfig) => {
  if (gristConfig.geocodingBanControlType === "type") {
    const minimalTypeIndex = gristConfig.geocodingBanTypeOrder.indexOf(
      gristConfig.geocodingBanMinimalType
    );
    const typeIndex = gristConfig.geocodingBanTypeOrder.indexOf(row.result_type);

    return !row.result_type || typeIndex < 0 || typeIndex > minimalTypeIndex;
  }

  if (!row.result_score) {
    return true;
  }

  const score = row.result_score.replace(",", ".");

  return !score || score < gristConfig.geocodingScoreThreshold;
};

const filterUngeocodedRows = (rows) => {
  const gristConfig = getGristConfig();

  return rows.filter((row) => isUngeocodedRow(row, gristConfig));
};

/**
 * Build the display status from BAN geocoding results.
 *
 * @param {Object[]} rows Parsed BAN CSV rows.
 * @returns {{type: string, label: string, message: string, localizedRows: number, totalRows: number, ungeocodedRows: Object[]}} Result status.
 */
const getBanGeocodingStatus = (rows) => {
  const ungeocodedRows = filterUngeocodedRows(rows);
  const localizedRows = rows.length - ungeocodedRows.length;

  if (localizedRows === 0) {
    return {
      type: "failure",
      label: "Import échoué",
      message: "Échec complet du géocodage",
      localizedRows: 0,
      totalRows: rows.length,
      ungeocodedRows,
    };
  }

  if (ungeocodedRows.length > 0) {
    return {
      type: "partial",
      label: "Import partiellement réussi",
      message: "Les lignes suivantes n'ont pas pu être localisées et nécessitent d'être corrigées dans Grist",
      localizedRows,
      totalRows: rows.length,
      ungeocodedRows,
    };
  }

  return {
    type: "success",
    label: "Import réussi",
    message: "",
    localizedRows: rows.length,
    totalRows: rows.length,
    ungeocodedRows: [],
  };
};

/**
 * Parse a successful Grist API response as JSON.
 *
 * @param {Response} response Fetch response.
 * @returns {Promise<*>} Parsed JSON body.
 * @throws {Error} When the Grist API response is not successful.
 */
const readGristJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * Create longitude and latitude columns in the Grist table when missing.
 *
 * @param {Object} gristConfig Grist configuration.
 * @param {Object} sourceData Source table data.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<void>}
 */
const ensureGristGeocodingColumns = async (gristConfig, sourceData, apiKey) => {
  const missingColumns = ["longitude", "latitude"].filter(
    (column) => !sourceData.fields.includes(column)
  );

  if (!missingColumns.length) {
    return;
  }

  for (const column of missingColumns) {
    const response = await postColumnsToTable(
      gristConfig.apiUrl,
      sourceData.docId,
      sourceData.tableId,
      {
        columns: [
          {
            id: column,
            fields: { label: column },
          },
        ],
      },
      apiKey
    );

    if (!response.ok && response.status !== 400) {
      throw new Error(`Impossible de créer la colonne ${column} (${response.status}).`);
    }
  }
};

/**
 * Update a Grist table with geocoded longitude and latitude values.
 *
 * @param {Object} sourceData Source table data and records.
 * @param {Object[]} geocodedRows BAN response rows.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<void>}
 */
const updateGristTableWithGeocoding = async (sourceData, geocodedRows, apiKey) => {
  if (
    !sourceData.docId ||
    !sourceData.tableId ||
    !sourceData.records ||
    !sourceData.records.length
  ) {
    throw new Error("Aucune table Grist cible à mettre à jour.");
  }

  const gristConfig = getGristConfig();
  await ensureGristGeocodingColumns(gristConfig, sourceData, apiKey);

  const records = sourceData.records
    .map((record, index) => {
      const geocodedRow = geocodedRows[index] || {};

      if (isUngeocodedRow(geocodedRow, gristConfig)) {
        return null;
      }

      return {
        id: record.id,
        fields: {
          longitude: getGeocodedValue(geocodedRow, "longitude"),
          latitude: getGeocodedValue(geocodedRow, "latitude"),
        },
      };
    })
    .filter((record) => record && record.id);

  if (!records.length) {
    return;
  }

  await patchRecordsToTable(
    gristConfig.apiUrl,
    sourceData.docId,
    sourceData.tableId,
    { records },
    apiKey
  ).then(readGristJson);
};

/**
 * Display the geocoding loading spinner in the Grist result step.
 *
 * @returns {void}
 */
const renderGristResultSpinner = (resultContainerId) => {
  const resultContainer = document.getElementById(
    resultContainerId || GRIST_RESULT_CONTAINER_ID
  );
  if (!resultContainer) {
    return;
  }

  resultContainer.innerHTML = `
    <div class="grist-geocoding-result grist-geocoding-result-loading">
      <div class="d-flex justify-content-center align-items-center">
        <div id="grist-geocoding-spinner" class="spinner-grow text-primary spinner-grow-sm" role="status" aria-label="Géocodage en cours"></div>
        <span class="grist-geocoding-loading-label">Géocodage en cours...</span>
      </div>
    </div>
  `;
};

/**
 * Open the current Grist target table in a new browser tab.
 *
 * @param {Object} importGristArea Active Grist import area component.
 * @returns {Promise<void>}
 */
const openCurrentGristTable = async (importGristArea) => {
  if (!importGristArea) {
    return;
  }

  const tableUrl = await importGristArea.getTargetTableUrl();

  if (tableUrl) {
    window.open(tableUrl, "_blank", "noopener,noreferrer");
  }
};

/**
 * Display the final geocoding status in the Grist result step.
 *
 * @param {{type: string, label: string, message: string, localizedRows: number, totalRows: number, ungeocodedRows: Object[]}} status Result status.
 * @param {Object} options Rendering options.
 * @param {Object} options.importGristArea Active Grist import area component.
 * @param {Function} options.getAddressFields Function returning selected address fields.
 * @param {Function} options.setWizardStep Function changing the Grist wizard step.
 * @returns {void}
 */
const renderGristGeocodingResult = (status, options) => {
  const resultContainer = document.getElementById(
    options.resultContainerId || GRIST_RESULT_CONTAINER_ID
  );
  if (!resultContainer) {
    return;
  }

  if (options.updateLayerSelection !== false) {
    updateSelectLayersButtonForLocalizedRows(
      status.localizedRows,
      GRIST_LOCATION_SWITCH_IDS.address
    );
  }

  const resultActions = [];

  if (status.ungeocodedRows && status.ungeocodedRows.length) {
    const editButton = createGristResultButton(
      "Corriger dans Grist",
      "btn grist-geocoding-result-secondary-button",
      () => openCurrentGristTable(options.importGristArea)
    );
    const retryButton = createGristResultButton(
      "Relancer",
      "btn grist-geocoding-result-primary-button",
      () => runGristAddressGeocoding({ ...options, triggerButton: retryButton })
    );

    resultActions.push(editButton, retryButton);
  } else if (status.type === "success") {
    const openButton = createGristResultButton(
      "Voir dans Grist",
      "btn grist-geocoding-result-primary-button",
      () => openCurrentGristTable(options.importGristArea)
    );

    resultActions.push(openButton);
  }

  resultContainer.replaceChildren(
    new GristResult({
      type: status.type,
      label: status.label,
      message: status.message,
      localizedRows: status.localizedRows,
      totalRows: status.totalRows,
      ungeocodedRows: status.ungeocodedRows,
      actions: resultActions,
    }).render()
  );
};

/**
 * Geocode the active source data through BAN using selected address fields.
 *
 * @param {Object} importGristArea Active Grist import area component.
 * @param {Function} getAddressFields Function returning selected address fields.
 * @returns {Promise<{type: string, label: string, message: string}>} Result status.
 * @throws {Error} When no source data is available or BAN returns an error.
 */
const geocodeAddressFieldsWithBan = async (importGristArea, getAddressFields) => {
  if (!importGristArea) {
    throw new Error("Aucune source de données Grist disponible.");
  }

  const sourceData = await importGristArea.getSourceData();
  const selectedFields = getAddressFields();
  let fields = selectedFields;

  if (!fields.length) {
    fields = sourceData.fields;
  }

  if (!sourceData.rows.length || !fields.length) {
    throw new Error("Aucune donnée à géocoder.");
  }
  activeGeocodingTotalRows = sourceData.rows.length;

  if (!sourceData.docId || !sourceData.tableId) {
    throw new Error("Envoyez d'abord la donnée dans Grist avant le géocodage.");
  }

  const response = await postCsvToBanGeocoding(rowsToCsv(sourceData.rows, fields));

  if (!response.ok) {
    throw new Error(`Erreur BAN ${response.status}`);
  }

  const geocodedRows = parseCsvRows(await response.text());
  const status = getBanGeocodingStatus(geocodedRows);

  await updateGristTableWithGeocoding(sourceData, geocodedRows, importGristArea.apiKey);

  return status;
};

/**
 * Run the address geocoding flow from the current Grist source.
 *
 * The source data is loaded again from Grist before calling BAN, then the
 * geocoded longitude/latitude values are written back to the same table.
 *
 * @param {Object} options Geocoding run options.
 * @param {Object} options.importGristArea Active Grist import area component.
 * @param {Function} options.getAddressFields Function returning selected address fields.
 * @param {Function} options.setWizardStep Function changing the Grist wizard step.
 * @param {HTMLButtonElement|null} [options.triggerButton] Button that started the flow.
 * @param {string} [options.resultContainerId] Target result container identifier.
 * @param {boolean} [options.updateLayerSelection=true] Whether to update layer creation state.
 * @returns {Promise<void>}
 */
const runGristAddressGeocoding = async ({
  importGristArea,
  getAddressFields,
  setWizardStep,
  triggerButton = null,
  resultContainerId,
  updateLayerSelection,
} = {}) => {
  const renderOptions = {
    importGristArea,
    getAddressFields,
    setWizardStep,
    resultContainerId,
    updateLayerSelection,
  };

  if (triggerButton) {
    triggerButton.disabled = true;
  }

  setWizardStep(4);
  renderGristResultSpinner(resultContainerId);

  try {
    const status = await geocodeAddressFieldsWithBan(importGristArea, getAddressFields);
    renderGristGeocodingResult(status, renderOptions);
  } catch (error) {
    console.error("Error geocoding with BAN:", error);
    renderGristGeocodingResult(
      {
        type: "failure",
        label: "Import échoué",
        message: error.message || "Aucune donnée n’a pu être localisée",
        localizedRows: 0,
        totalRows: activeGeocodingTotalRows,
        ungeocodedRows: [],
      },
      renderOptions
    );
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }
  }
};

export { getBanGeocodingStatus, runGristAddressGeocoding };

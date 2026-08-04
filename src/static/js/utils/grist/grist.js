import {
  getActiveGristLocationSwitchId,
  getGristAddressFields,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
} from "./locationFields.js";
import {
  patchRecordsToTable,
  postColumnsToTable,
  postCsvToBanGeocoding,
} from "./requests.js";
import { getGristConfig } from "./utils.js";

const GRIST_TAB_TARGET = "#newlayer-grist";
let activeImportGristArea = null;
let activeGeocodingTotalRows = 0;

/**
 * Return the Grist wizard content panels in display order.
 *
 * The footer is excluded because it is navigation, not a wizard step.
 *
 * @returns {HTMLElement[]} Ordered Grist wizard step containers.
 */
const getGristWizardContentSteps = () =>
  Array.from(document.querySelectorAll("#newLayerByGrist > div:not(#grist-footer)"));

/**
 * Escape a value for CSV output.
 *
 * @param {*} value Cell value.
 * @returns {string} CSV-safe value.
 */
const getCsvValue = (value) => {
  const text = value === undefined || value === null ? "" : String(value);

  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Convert row objects or arrays to CSV text using selected fields.
 *
 * @param {Array<Object|Array>} rows Source rows.
 * @param {string[]} fields Fields to include in the CSV.
 * @returns {string} CSV content.
 */
const rowsToCsv = (rows, fields) => [
  fields.map(getCsvValue).join(","),
  ...rows.map((row) =>
    fields
      .map((field) =>
        getCsvValue(
          Array.isArray(row) ? row[fields.indexOf(field)] : row?.[field]
        )
      )
      .join(",")
  ),
].join("\n");

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
    }).data;
  }

  const [headerLine, ...lines] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return lines.map((line) =>
    line.split(",").reduce((row, value, index) => {
      row[headers[index]] = value;
      return row;
    }, {})
  );
};

/**
 * Read a geocoding score from a BAN response row.
 *
 * @param {Object} row Parsed BAN CSV row.
 * @returns {number} Numeric geocoding score, or NaN when unavailable.
 */
const getGeocodingScore = (row) => {
  const score =
    row?.result_score ?? row?.score ?? row?._score ?? row?.geocoding_score;

  return Number(String(score ?? "").replace(",", "."));
};

const getGeocodingLatitude = (row) =>
  row?.latitude ?? row?.lat ?? row?.result_latitude ?? row?.result_lat ?? "";

const getGeocodingLongitude = (row) =>
  row?.longitude ??
  row?.lon ??
  row?.lng ??
  row?.result_longitude ??
  row?.result_lon ??
  row?.result_lng ??
  "";

/**
 * Build the display status from BAN geocoding results.
 *
 * @param {Object[]} rows Parsed BAN CSV rows.
 * @returns {{type: string, label: string, message: string}} Result status.
 */
const getBanGeocodingStatus = (rows) => {
  const scores = rows.map(getGeocodingScore).filter(Number.isFinite);
  const ungeocodedRows = rows.filter((row) => {
    const score = getGeocodingScore(row);

    return !Number.isFinite(score) || score < 0.8;
  });
  const lowScoreCount = ungeocodedRows.length;
  const localizedRows = Math.max(rows.length - lowScoreCount, 0);

  if (!rows.length || !scores.length) {
    return {
      type: "failure",
      label: "Import échoué",
      message: "Échec complet du géocodage",
      localizedRows: 0,
      totalRows: rows.length,
      ungeocodedRows: rows,
    };
  }

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

  if (lowScoreCount > 0) {
    return {
      type: "partial",
      label: "Import partiellement réussi",
      message: "Les lignes suivantes n'ont pas pu être localisées",
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

const readGristJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

const ensureGristGeocodingColumns = async (
  gristConfig,
  sourceData,
  apiKey
) => {
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

const updateGristTableWithGeocoding = async (sourceData, geocodedRows) => {
  if (!sourceData.docId || !sourceData.tableId || !sourceData.records?.length) {
    throw new Error("Aucune table Grist cible à mettre à jour.");
  }

  const gristConfig = await getGristConfig();
  await ensureGristGeocodingColumns(
    gristConfig,
    sourceData,
    activeImportGristArea.apiKey
  );

  const records = sourceData.records
    .map((record, index) => ({
      id: record.id,
      fields: {
        longitude: getGeocodingLongitude(geocodedRows[index]),
        latitude: getGeocodingLatitude(geocodedRows[index]),
      },
    }))
    .filter((record) => record.id !== undefined && record.id !== null);

  if (!records.length) {
    throw new Error("Aucun identifiant de ligne Grist disponible pour la mise à jour.");
  }

  await patchRecordsToTable(
    gristConfig.apiUrl,
    sourceData.docId,
    sourceData.tableId,
    { records },
    activeImportGristArea.apiKey
  ).then(readGristJson);
};

/**
 * Display the geocoding loading spinner in the Grist result step.
 *
 * @returns {void}
 */
const renderGristResultSpinner = () => {
  const resultContainer = document.getElementById("grist-result");
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
 * @returns {Promise<void>}
 */
const openCurrentGristTable = async () => {
  const tableUrl = await activeImportGristArea?.getTargetTableUrl?.();

  if (tableUrl) {
    window.open(tableUrl, "_blank", "noopener,noreferrer");
  }
};

/**
 * Display the final geocoding status in the Grist result step.
 *
 * @param {{type: string, label: string, message: string}} status Result status.
 * @returns {void}
 */
const renderGristGeocodingResult = (status) => {
  const resultContainer = document.getElementById("grist-result");
  if (!resultContainer) {
    return;
  }

  const wrapper = document.createElement("div");
  const icon = document.createElement("div");
  const title = document.createElement("h6");
  const counter = document.createElement("p");
  const message = document.createElement("p");
  const actions = document.createElement("div");

  wrapper.className = `grist-geocoding-result grist-geocoding-result-${status.type}`;
  icon.className = "grist-geocoding-result-icon";
  icon.textContent =
    status.type === "success" ? "✓" : status.type === "partial" ? "!" : "×";
  title.className = "grist-geocoding-result-title";
  title.textContent = status.label;
  counter.className = "grist-geocoding-result-counter";
  counter.innerHTML = `<strong>${status.localizedRows || 0}/${status.totalRows || 0}</strong> lignes localisées`;
  message.className = "grist-geocoding-result-message";
  message.textContent = status.message;

  wrapper.append(icon, title, counter);
  if (status.message) {
    wrapper.appendChild(message);
  }

  actions.className = "grist-geocoding-result-actions";

  if (status.ungeocodedRows?.length) {
    const Table = mv.components && mv.components.table;
    const tableTitle = document.createElement("h6");

    tableTitle.className = "grist-geocoding-preview-title";
    tableTitle.textContent = "Lignes non géocodées";
    wrapper.appendChild(tableTitle);

    if (Table) {
      const table = new Table({
        data: {
          data: status.ungeocodedRows,
          meta: { fields: Object.keys(status.ungeocodedRows[0] || {}) },
        },
        maxRows: 5,
        paginate: true,
        emptyMessage: "Aucune ligne non géocodée.",
      });
      wrapper.appendChild(table.render());
    }

    const editButton = document.createElement("button");
    const retryButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "btn grist-geocoding-result-secondary-button";
    editButton.textContent = "Corriger dans Grist";
    editButton.addEventListener("click", openCurrentGristTable);

    retryButton.type = "button";
    retryButton.className = "btn grist-geocoding-result-primary-button";
    retryButton.textContent = "Relancer le géocodage";
    retryButton.addEventListener("click", () => {
      runGristAddressGeocoding(retryButton);
    });

    actions.append(editButton, retryButton);
    wrapper.appendChild(actions);
  } else if (status.type === "success") {
    const openButton = document.createElement("button");

    openButton.type = "button";
    openButton.className = "btn grist-geocoding-result-primary-button";
    openButton.textContent = "Voir dans Grist";
    openButton.addEventListener("click", openCurrentGristTable);

    actions.appendChild(openButton);
    wrapper.appendChild(actions);
  }
  resultContainer.replaceChildren(wrapper);
};

/**
 * Geocode the active source data through BAN using selected address fields.
 *
 * @returns {Promise<{type: string, label: string, message: string}>} Result status.
 * @throws {Error} When no source data is available or BAN returns an error.
 */
const geocodeAddressFieldsWithBan = async () => {
  if (!activeImportGristArea) {
    throw new Error("Aucune source de données Grist disponible.");
  }

  const sourceData = await activeImportGristArea.getSourceData();
  const selectedFields = getGristAddressFields();
  const fields = selectedFields.length ? selectedFields : sourceData.fields;

  if (!sourceData.rows.length || !fields.length) {
    throw new Error("Aucune donnée à géocoder.");
  }
  activeGeocodingTotalRows = sourceData.rows.length;

  if (!sourceData.docId || !sourceData.tableId) {
    throw new Error("Envoyez d'abord la donnée dans Grist avant le géocodage.");
  }

  const response = await postCsvToBanGeocoding(
    rowsToCsv(sourceData.rows, fields)
  );

  if (!response.ok) {
    throw new Error(`Erreur BAN ${response.status}`);
  }

  const geocodedRows = parseCsvRows(await response.text());
  const status = getBanGeocodingStatus(geocodedRows);

  await updateGristTableWithGeocoding(sourceData, geocodedRows);

  return status;
};

/**
 * Run the address geocoding flow from the current Grist source.
 *
 * The source data is loaded again from Grist before calling BAN, then the
 * geocoded longitude/latitude values are written back to the same table.
 *
 * @param {HTMLButtonElement|null} [triggerButton] Button that started the flow.
 * @returns {Promise<void>}
 */
const runGristAddressGeocoding = async (triggerButton = null) => {
  if (triggerButton) {
    triggerButton.disabled = true;
  }

  setGristWizardStep(4);
  renderGristResultSpinner();

  try {
    const status = await geocodeAddressFieldsWithBan();
    renderGristGeocodingResult(status);
  } catch (error) {
    console.error("Error geocoding with BAN:", error);
    renderGristGeocodingResult({
      type: "failure",
      label: "Import échoué",
      message: error.message || "Aucune donnée n’a pu être localisée",
      localizedRows: 0,
      totalRows: activeGeocodingTotalRows,
      ungeocodedRows: [],
    });
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }
  }
};

/**
 * Render the Grist localization mode switches.
 *
 * Only one switch can be active at a time. If the current active switch is
 * toggled off, it is immediately re-enabled to keep one selected mode.
 *
 * @returns {void}
 */
const initGristLocationSwitches = () => {
  const Switch = mv.components && mv.components.switch;
  if (!Switch) {
    return;
  }

  const switchConfigs = [
    {
      targetId: "grist-location-address",
      id: "adresseSwitch",
      label: "À partir d’une adresse",
      description: "Géocodez vos données (adresse, ville...)",
      checked: true,
    },
    {
      targetId: "grist-location-ref",
      id: "refSwitch",
      label: "À partir d’un référentiel",
      description: "Associez vos données à un référentiel géographique",
      checked: false,
    },
    {
      targetId: "grist-location-xy",
      id: "xySwitch",
      label: "À partir de coordonnées X/Y",
      description: "Utilisez des colonnes de coordonnées existantes",
      checked: false,
    },
  ];
  const switches = [];
  setGristLocationSwitches(switches);
  const selectOnly = (activeSwitch) => {
    if (!activeSwitch.getChecked()) {
      activeSwitch.setChecked(true);
    }

    switches.forEach((switchItem) => {
      switchItem.setChecked(switchItem === activeSwitch);
    });
    renderGristLocationArea(activeSwitch.id);
  };

  switchConfigs.forEach((config) => {
    const target = document.getElementById(config.targetId);
    if (!target) {
      return;
    }

    target.replaceChildren();
    const switchItem = new Switch({
      id: config.id,
      name: "grist-location-mode",
      label: config.label,
      description: config.description,
      checked: config.checked,
      onChange: (checked, currentSwitch) => {
        if (checked || switches.every((item) => !item.getChecked())) {
          selectOnly(currentSwitch);
        }
      },
    });
    switches.push(switchItem);
    target.appendChild(switchItem.render());
  });

  const activeSwitch = switches.find((switchItem) => switchItem.getChecked());
  if (activeSwitch) {
    renderGristLocationArea(activeSwitch.id);
  }
};

/**
 * Display a Grist wizard step and update navigation button state.
 *
 * The requested step is clamped between the first and last available content
 * step. The "Suivant" button remains disabled when the current step requires
 * validated data that is not ready yet.
 *
 * @param {number|string} step Wizard step number to display, starting at 1.
 * @returns {void}
 */
const setGristWizardStep = (step) => {
  const steps = getGristWizardContentSteps();
  const importGristAreaContainer = document.getElementById("newLayerByGrist");
  const gristWizardContainer = document.getElementById("newlayer-grist-wizard");
  const backButton = document.getElementById("gristWizardBackButton");
  const nextButton = document.getElementById("gristWizardNextButton");
  const maxStep = steps.length || 1;
  const activeStep = Math.min(Math.max(Number(step) || 1, 1), maxStep);

  gristWizardContainer?._gristWizard?.changeStep(activeStep);
  steps.forEach((contentStep, index) => {
    contentStep.classList.toggle("d-none", index + 1 !== activeStep);
  });

  [backButton, nextButton].forEach((button) => {
    if (button) {
      button.dataset.step = activeStep;
    }
  });

  backButton?.classList.toggle(
    "d-none",
    activeStep <= 1 || !importGristAreaContainer
  );
  nextButton?.classList.toggle(
    "d-none",
    activeStep >= maxStep || !importGristAreaContainer
  );
  if (nextButton) {
    nextButton.disabled =
      (activeStep === 1 && nextButton.dataset.apiKeyReady !== "true") ||
      (activeStep === 2 && nextButton.dataset.ready !== "true");
  }
};

/**
 * Initialize the horizontal Grist wizard component at step 1.
 *
 * @returns {void}
 */
const initGristWizard = () => {
  const gristWizardContainer = document.getElementById("newlayer-grist-wizard");
  const GristWizard = mv.components && mv.components.grist && mv.components.grist.gristWizard;

  if (!gristWizardContainer || !GristWizard) {
    return;
  }

  gristWizardContainer.replaceChildren();
  const gristWizard = new GristWizard({
    step: 1,
  });
  gristWizard.appendTo(gristWizardContainer);
  gristWizardContainer._gristWizard = gristWizard;
};

/**
 * Render the Grist data import area after API key validation.
 *
 * @param {string} apiKey Valid Grist API key used by import components.
 * @returns {void}
 */
const initGristImportArea = (apiKey) => {
  const importGristAreaContainer = document.getElementById("newLayerByGrist");
  const gristDataContainer = document.getElementById("grist-data");
  const ImportGristArea = mv.components && mv.components.grist && mv.components.grist.importGristArea;

  if (!importGristAreaContainer || !gristDataContainer || !ImportGristArea) {
    return;
  }

  gristDataContainer.replaceChildren();
  const importGristArea = new ImportGristArea({
    apiKey,
    onColumnsChange: setGristLocationFields,
  });
  activeImportGristArea = importGristArea;
  gristDataContainer.appendChild(importGristArea.render());
  mv.utils?.grist?.validation?.disableGristWizardNextButton();
  const nextButton = document.getElementById("gristWizardNextButton");
  if (nextButton) {
    nextButton.dataset.apiKeyReady = "true";
  }
  setGristWizardStep(1);
};

/**
 * Clear the Grist data import area and mark the API key step as not ready.
 *
 * @returns {void}
 */
const hideGristImportArea = () => {
  const importGristAreaContainer = document.getElementById("newLayerByGrist");
  const gristDataContainer = document.getElementById("grist-data");

  if (!importGristAreaContainer || !gristDataContainer) {
    return;
  }

  gristDataContainer.replaceChildren();
  activeImportGristArea = null;
  setGristLocationFields([]);
  const nextButton = document.getElementById("gristWizardNextButton");
  if (nextButton) {
    nextButton.dataset.apiKeyReady = "false";
  }
  mv.utils?.grist?.validation?.disableGristWizardNextButton();
  setGristWizardStep(1);
};

/**
 * Render the Grist API key form and wire validation callbacks.
 *
 * @param {Object} [config] Application configuration.
 * @param {Object} [config.grist] Grist configuration.
 * @param {string} [config.grist.api_url] Grist API endpoint.
 * @param {string} [config.grist.instance_url] Grist instance endpoint fallback.
 * @returns {void}
 */
const initGristApiKey = (config) => {
  const gristAuthContainer = document.getElementById("grist-auth");
  const GristApiKey = mv.components && mv.components.grist && mv.components.grist.gristApiKey;

  if (!gristAuthContainer || !GristApiKey) {
    return;
  }

  gristAuthContainer.replaceChildren();
  const gristApiKey = new GristApiKey(
    config?.grist?.api_url || config?.grist?.instance_url,
    "https://grist.numerique.gouv.fr/account/developer",
    {
      onValidApiKey: initGristImportArea,
      onInvalidApiKey: hideGristImportArea,
    }
  );
  gristAuthContainer.appendChild(gristApiKey.render());
};

/**
 * Initialize all Grist-specific content inside the "new layer" modal.
 *
 * @param {Object} [config] Application configuration used by the API key form.
 * @returns {void}
 */
const initGristNewLayerModal = (config) => {
  initGristWizard();
  setGristLocationFields([]);
  initGristLocationSwitches();
  hideGristImportArea();
  initGristApiKey(config);
};

/**
 * Bind Grist-specific modal events once.
 *
 * Handles modal initialization, tab visibility, and wizard navigation for the
 * Grist import tab.
 *
 * @param {HTMLElement|null} [modal=document.getElementById("mod-layerNew")]
 * Modal element that contains the Grist tab.
 * @param {Function} [getConfig] Function returning the current app config.
 * @returns {void}
 */
const bindNewLayerModalGrist = (
  modal = document.getElementById("mod-layerNew"),
  getConfig = () =>
    window._conf || (typeof _conf !== "undefined" ? _conf : undefined)
) => {
  if (!modal || modal.dataset.gristBound === "true") {
    return;
  }

  modal.dataset.gristBound = "true";

  modal.addEventListener("show.bs.modal", () => {
    initGristNewLayerModal(getConfig());
  });

  modal.addEventListener("click", (event) => {
    const tab = event.target.closest('[data-bs-toggle="pill"]');
    const backButton = event.target.closest("#gristWizardBackButton");
    const nextButton = event.target.closest("#gristWizardNextButton");

    if (tab) {
      if (tab.getAttribute("data-bs-target") !== GRIST_TAB_TARGET) {
        document.getElementById("gristWizardBackButton")?.classList.add("d-none");
        document.getElementById("gristWizardNextButton")?.classList.add("d-none");
        return;
      }

      const currentStep =
        Number(document.getElementById("gristWizardNextButton")?.dataset.step) || 1;
      setGristWizardStep(currentStep);
    }

    if (backButton) {
      setGristWizardStep((Number(backButton.dataset.step) || 1) - 1);
    }

    if (nextButton) {
      const currentStep = Number(nextButton.dataset.step) || 1;
      if (currentStep === 3 && getActiveGristLocationSwitchId() === "adresseSwitch") {
        runGristAddressGeocoding(nextButton);
        return;
      }

      setGristWizardStep((Number(nextButton.dataset.step) || 1) + 1);
    }
  });
};

export {
  bindNewLayerModalGrist,
  getGristWizardContentSteps,
  hideGristImportArea,
  initGristApiKey,
  initGristImportArea,
  initGristLocationSwitches,
  initGristNewLayerModal,
  initGristWizard,
  setGristWizardStep,
};

export default {
  bindNewLayerModalGrist,
  getGristWizardContentSteps,
  hideGristImportArea,
  initGristApiKey,
  initGristImportArea,
  initGristLocationSwitches,
  initGristNewLayerModal,
  initGristWizard,
  setGristWizardStep,
};

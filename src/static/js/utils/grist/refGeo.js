import {
  GRIST_REF_GEO_MATCHING_FIELD_ID,
  GRIST_REF_GEO_REFERENTIAL_ID,
  GRIST_REF_GEO_OUTPUT_FORMAT_ID,
  GRIST_RESULT_CONTAINER_ID,
} from "./const.js";
import GristResult, {
  createGristResultButton,
} from "../../components/grist/results/results.js";

/**
 * Read a select value from the current page.
 *
 * @param {string} selectId Select element id.
 * @returns {string} Selected value.
 */
const getSelectValue = (selectId) => {
  const select = document.getElementById(selectId);

  if (!select) {
    return "";
  }

  return select.value;
};

/**
 * Read configured Grist referentials from the loaded app config.
 *
 * @returns {Array} Referential configurations.
 */
const getGristReferentials = () => {
  if (!window._conf || !window._conf.grist) {
    return [];
  }

  return window._conf.grist.grist_referentials || [];
};

/**
 * Return the selected matching field from grist-refgeo-matching-field.
 *
 * @returns {string} Selected table field.
 */
const getSelectedMatchingField = () => {
  return getSelectValue(GRIST_REF_GEO_MATCHING_FIELD_ID);
};

/**
 * Return the selected referential label from grist-refgeo-referential.
 *
 * @returns {string} Selected referential label.
 */
const getSelectedReferentialLabel = () => {
  return getSelectValue(GRIST_REF_GEO_REFERENTIAL_ID);
};

/**
 * Return the selected geometry output format.
 *
 * @returns {string} Selected output format.
 */
const getSelectedOutputFormat = () => {
  return getSelectValue(GRIST_REF_GEO_OUTPUT_FORMAT_ID);
};

/**
 * Return the referential config matching the selected referential label.
 *
 * @returns {Object|null} Selected referential config.
 */
const getSelectedReferentialConfig = () => {
  const selectedLabel = getSelectedReferentialLabel();
  const referentials = getGristReferentials();

  return (
    referentials.find(
      (referential) => referential && referential.label === selectedLabel
    ) || null
  );
};

/**
 * Display the referential join loading state.
 *
 * @returns {void}
 */
const renderGristRefGeoSpinner = () => {
  const resultContainer = document.getElementById(GRIST_RESULT_CONTAINER_ID);
  if (!resultContainer) {
    return;
  }

  resultContainer.innerHTML = `
    <div class="grist-geocoding-result grist-geocoding-result-loading">
      <div class="d-flex justify-content-center align-items-center">
        <div id="grist-refgeo-spinner" class="spinner-grow text-primary spinner-grow-sm" role="status" aria-label="Jointure en cours"></div>
        <span class="grist-geocoding-loading-label">Jointure en cours...</span>
      </div>
    </div>
  `;
};

/**
 * Prepare rows for table preview.
 *
 * @param {Object[]} rows Joined rows.
 * @returns {Object[]} Rows with displayable GeoJSON.
 */
const getPreviewRows = (rows = []) => {
  return rows.map((row) => {
    if (!row.geojson) {
      return row;
    }

    return {
      ...row,
      geojson: JSON.stringify(row.geojson),
    };
  });
};

/**
 * Convert backend join result to the common result status.
 *
 * @param {Object} result Backend join result.
 * @returns {Object} Common Grist result status.
 */
const getGristRefGeoStatus = (result) => {
  const totalRows = result.total_rows || 0;
  const localizedRows = result.matched_rows || 0;
  const ungeocodedRows = getPreviewRows(result.unmatched || []);

  if (localizedRows === 0) {
    return {
      type: "failure",
      label: "Import échoué",
      message: "Échec complet du géocodage",
      localizedRows,
      totalRows,
      ungeocodedRows,
    };
  }

  if (localizedRows < totalRows) {
    return {
      type: "partial",
      label: "Import partiellement réussi",
      message: "Les lignes suivantes n'ont pas pu être localisées",
      localizedRows,
      totalRows,
      ungeocodedRows,
    };
  }

  return {
    type: "success",
    label: "Import réussi",
    message: "",
    localizedRows,
    totalRows,
    ungeocodedRows: [],
  };
};

/**
 * Display the referential join result in the result step.
 *
 * @param {Object} result Backend join result.
 * @param {Object} importGristArea Active Grist import area component.
 * @param {Function} setWizardStep Function changing the Grist wizard step.
 * @returns {void}
 */
const renderGristRefGeoResult = (result, importGristArea, setWizardStep) => {
  const resultContainer = document.getElementById(GRIST_RESULT_CONTAINER_ID);
  if (!resultContainer) {
    return;
  }

  const status = getGristRefGeoStatus(result);
  const actions = getGristRefGeoActions(
    result,
    status,
    importGristArea,
    setWizardStep
  );

  resultContainer.replaceChildren(new GristResult({ ...status, actions }).render());
};

/**
 * Open the target Grist table in a new tab.
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
 * Create the available action buttons for a referential join result.
 *
 * @param {Object} result Backend join result.
 * @param {Object} status Result display status.
 * @param {Object} importGristArea Active Grist import area component.
 * @returns {HTMLButtonElement[]} Result action buttons.
 */
const getGristRefGeoActions = (
  result,
  status,
  importGristArea,
  setWizardStep
) => {
  if (!importGristArea) {
    return [];
  }

  if (status.type !== "success") {
    const editButton = createGristResultButton(
      "Corriger dans Grist",
      "btn grist-geocoding-result-secondary-button",
      () => openCurrentGristTable(importGristArea)
    );
    const retryButton = createGristResultButton(
      "Relancer",
      "btn grist-geocoding-result-primary-button",
      () =>
        runGristRefGeoJoin({
          importGristArea,
          setWizardStep,
          triggerButton: retryButton,
        })
    );

    return [editButton, retryButton];
  }

  return [
    createGristResultButton(
      "Voir dans Grist",
      "btn grist-geocoding-result-primary-button",
      () => openCurrentGristTable(importGristArea)
    ),
  ];
};

/**
 * Display a referential join error.
 *
 * @param {Error} error Join error.
 * @param {Object} importGristArea Active Grist import area component.
 * @param {Function} setWizardStep Function changing the Grist wizard step.
 * @returns {void}
 */
const renderGristRefGeoError = (error, importGristArea, setWizardStep) => {
  const resultContainer = document.getElementById(GRIST_RESULT_CONTAINER_ID);
  if (!resultContainer) {
    return;
  }

  const status = {
    type: "failure",
    label: "Import échoué",
    message: error.message || "Échec complet du géocodage",
    localizedRows: 0,
    totalRows: 0,
    ungeocodedRows: [],
  };
  const actions = getGristRefGeoActions(
    {},
    status,
    importGristArea,
    setWizardStep
  );

  resultContainer.replaceChildren(new GristResult({ ...status, actions }).render());
};

/**
 * Call the backend referential join route.
 *
 * @param {Object} targetTable Target Grist table.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Object>} Backend join result.
 */
const joinSourceDataWithReferential = async (targetTable, apiKey) => {
  const matchingField = getSelectedMatchingField();
  const referentialLabel = getSelectedReferentialLabel();
  const outputFormat = getSelectedOutputFormat();

  if (!matchingField) {
    throw new Error("Aucun champ de correspondance sélectionné.");
  }

  if (!referentialLabel) {
    throw new Error("Aucun référentiel sélectionné.");
  }

  if (!outputFormat) {
    throw new Error("Aucun format de sortie sélectionné.");
  }

  if (!targetTable || !targetTable.docId || !targetTable.tableId) {
    throw new Error("Aucune table Grist cible à mettre à jour.");
  }

  if (!apiKey) {
    throw new Error("Clé API Grist manquante.");
  }

  const response = await fetch("api/grist/refgeo/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      doc_id: targetTable.docId,
      table_id: targetTable.tableId,
      matching_field: matchingField,
      referential_label: referentialLabel,
      output_format: outputFormat,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur jointure référentiel (${response.status}).`);
  }

  return response.json();
};

/**
 * Run the referential join flow from the current Grist source.
 *
 * @param {Object} options Join run options.
 * @param {Object} options.importGristArea Active Grist import area component.
 * @param {Function} options.setWizardStep Function changing the Grist wizard step.
 * @param {HTMLButtonElement|null} [options.triggerButton] Button that started the flow.
 * @returns {Promise<void>}
 */
const runGristRefGeoJoin = async ({
  importGristArea,
  setWizardStep,
  triggerButton = null,
} = {}) => {
  if (triggerButton) {
    triggerButton.disabled = true;
  }

  setWizardStep(4);
  renderGristRefGeoSpinner();

  try {
    const targetTable = importGristArea.getTargetTable();
    const result = await joinSourceDataWithReferential(
      targetTable,
      importGristArea.apiKey
    );
    renderGristRefGeoResult(result, importGristArea, setWizardStep);
  } catch (error) {
    console.error("Error joining with referential:", error);
    renderGristRefGeoError(error, importGristArea, setWizardStep);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }
  }
};

export {
  getGristReferentials,
  getSelectedMatchingField,
  getSelectedOutputFormat,
  getSelectedReferentialConfig,
  getSelectedReferentialLabel,
  getGristRefGeoStatus,
  joinSourceDataWithReferential,
  runGristRefGeoJoin,
};

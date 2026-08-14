import { GRIST_LOCATION_SWITCH_IDS, GRIST_RESULT_CONTAINER_ID } from "./const.js";
import { updateSelectLayersButtonForLocalizedRows } from "./validation.js";
import GristResult, {
  createGristResultButton,
} from "../../components/grist/results/results.js";

/**
 * Return whether a coordinate value is missing.
 *
 * @param {*} value Coordinate value.
 * @returns {boolean} True when no coordinate is provided.
 */
const isMissingCoordinate = (value) => {
  if (!value || value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string" && !value.trim()) {
    return true;
  }

  return false;
};

/**
 * Return the rows which cannot be located from their X and Y coordinates.
 *
 * @param {Object[]} rows Source rows.
 * @param {string} xField X coordinate field name.
 * @param {string} yField Y coordinate field name.
 * @returns {Object[]} Rows with a missing X or Y coordinate.
 */
const getRowsWithoutCoordinates = (rows, xField, yField) =>
  rows.filter(
    (row) => isMissingCoordinate(row[xField]) || isMissingCoordinate(row[yField])
  );

/**
 * Display the result of a coordinate completeness check.
 *
 * @param {Object} sourceData Grist source data.
 * @param {string} xField X coordinate field name.
 * @param {string} yField Y coordinate field name.
 * @param {Object} importGristArea Active Grist import component.
 * @param {Function} onTriggerProcess Coordinate check callback.
 * @returns {void}
 */
const renderGristCoordinatesResult = (
  sourceData,
  xField,
  yField,
  importGristArea,
  onTriggerProcess
) => {
  const resultContainer = document.getElementById(GRIST_RESULT_CONTAINER_ID);

  if (!resultContainer) {
    return;
  }

  const rows = sourceData.rows || [];
  const rowsWithoutCoordinates = getRowsWithoutCoordinates(rows, xField, yField);
  let localizedRows = rows.length - rowsWithoutCoordinates.length;
  let status = {
    type: "success",
    label: "Import réussi",
    message: "Toutes les lignes disposent de coordonnées X et Y.",
  };

  if (!xField || !yField) {
    localizedRows = 0;
    status = {
      type: "failure",
      label: "Import échoué",
      message: "Sélectionnez les colonnes X et Y.",
    };
  } else if (localizedRows === 0) {
    status = {
      type: "failure",
      label: "Import échoué",
      message: "Aucune ligne ne dispose de coordonnées X et Y.",
    };
  } else if (rowsWithoutCoordinates.length) {
    status = {
      type: "partial",
      label: "Import partiellement réussi",
      message: "Les lignes suivantes ne disposent pas de coordonnées X ou Y.",
    };
  }

  updateSelectLayersButtonForLocalizedRows(
    localizedRows,
    GRIST_LOCATION_SWITCH_IDS.xy
  );

  const actions = [];
  if (status.type === "success" && importGristArea) {
    actions.push(
      createGristResultButton(
        "Voir dans Grist",
        "btn grist-geocoding-result-primary-button",
        async () => {
          const tableUrl = await importGristArea.getTargetTableUrl();

          if (tableUrl) {
            window.open(tableUrl, "_blank", "noopener,noreferrer");
          }
        }
      )
    );
  }

  resultContainer.replaceChildren(
    new GristResult({
      title: status.label,
      message: status.message,
      tableTitle: "Lignes à vérifier",
      localizedRows,
      totalRows: rows.length,
      ungeocodedRows: rowsWithoutCoordinates,
      actions,
      displayCorrectionBtn: status.type === "partial",
      displayTriggerProcessBtn: status.type === "partial",
      onCorrection: async () => {
        const tableUrl = await importGristArea.getTargetTableUrl();

        if (tableUrl) {
          window.open(tableUrl, "_blank", "noopener,noreferrer");
        }
      },
      onTriggerProcess,
      type: status.type,
    }).render()
  );
};

/**
 * Check that every source row has X and Y coordinates.
 *
 * @param {Object} options Coordinate check options.
 * @param {Object} options.importGristArea Active Grist import component.
 * @param {Function} options.setWizardStep Function changing the Grist wizard step.
 * @returns {Promise<void>}
 */
const runGristCoordinatesCheck = async ({ importGristArea, setWizardStep } = {}) => {
  const xSelect = document.getElementById("grist-coordinate-x");
  const ySelect = document.getElementById("grist-coordinate-y");
  const xField = xSelect ? xSelect.value : "";
  const yField = ySelect ? ySelect.value : "";

  setWizardStep(4);

  try {
    const sourceData = await importGristArea.getSourceData();

    renderGristCoordinatesResult(
      sourceData,
      xField,
      yField,
      importGristArea,
      () => runGristCoordinatesCheck({ importGristArea, setWizardStep })
    );
  } catch (error) {
    renderGristCoordinatesResult(
      { rows: [] },
      xField,
      yField,
      importGristArea,
      () => runGristCoordinatesCheck({ importGristArea, setWizardStep })
    );
  }
};

export { getRowsWithoutCoordinates, runGristCoordinatesCheck };

/**
 * Manage Grist import readiness and layer creation button state in the new layer modal.
 * @module utils/grist/validation
 */
import {
  GRIST_MODAL_ID,
  GRIST_TAB_TARGET,
  GRIST_WIZARD_NEXT_BUTTON_ID,
  SELECT_LAYERS_BUTTON_ID,
} from "./const.js";

/**
 * Find the shared layer creation button.
 * @returns {HTMLButtonElement|null} Button, or null when absent from the DOM.
 */
const getSelectLayersButton = () => document.getElementById(SELECT_LAYERS_BUTTON_ID);

/**
 * Find the Grist wizard next button.
 * @returns {HTMLButtonElement|null} Button, or null when absent from the DOM.
 */
const getGristWizardNextButton = () =>
  document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);

/** @type {boolean} Whether the latest Grist result contains localized rows. */
let hasLocalizedGristRows = false;

/**
 * Extract parsed rows from a file verification result.
 * @param {Object|null|undefined} verification File verification result.
 * @param {Object} [verification.parsedData] Parsed file content.
 * @param {Array} [verification.parsedData.data] Imported rows.
 * @returns {Array} Parsed rows, or an empty array when unavailable or invalid.
 */
const getParsedRows = (verification) => {
  if (!verification || !verification.parsedData) {
    return [];
  }

  const rows = verification.parsedData.data;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows;
};

/**
 * Set the shared layer creation button's disabled state when present.
 * @param {boolean} disabled Whether to disable the button.
 * @returns {void}
 */
const setSelectLayersButtonDisabled = (disabled) => {
  const button = getSelectLayersButton();

  if (button) {
    button.disabled = disabled;
  }
};

/**
 * Enable layer creation without changing the stored Grist localization state.
 * @returns {void}
 */
const enableSelectLayersButton = () => {
  setSelectLayersButtonDisabled(false);
};

/**
 * Disable layer creation and clear the stored localization result and mode.
 * @returns {void}
 */
const disableSelectLayersButton = () => {
  hasLocalizedGristRows = false;
  const button = getSelectLayersButton();

  if (button) {
    delete button.dataset.gristLocationMode;
  }
  setSelectLayersButtonDisabled(true);
};

/**
 * Check whether a valid file verification result contains imported rows.
 * @param {Object|null|undefined} verification File verification result.
 * @param {boolean} [verification.valid] Whether file verification succeeded.
 * @param {Object} [verification.parsedData] Parsed file content.
 * @param {Array} [verification.parsedData.data] Imported rows.
 * @returns {boolean} Whether the file is valid and contains at least one row.
 */
const hasImportedFileTable = (verification) => {
  if (!verification || !verification.valid) {
    return false;
  }

  return getParsedRows(verification).length > 0;
};

/**
 * Reset layer creation after a file import until localization succeeds.
 * Clears the previous localization result and mode and disables the button.
 * @returns {void}
 */
const updateSelectLayersButtonForImportedFile = () => {
  disableSelectLayersButton();
};

/**
 * Update the layer selection button from the latest Grist localization result.
 * Store localization readiness and set or clear the button's localization mode.
 *
 * @param {number} localizedRows Number of successfully localized rows.
 * @param {string} locationMode Grist localization mode used for the result.
 * @returns {void}
 */
const updateSelectLayersButtonForLocalizedRows = (localizedRows, locationMode) => {
  hasLocalizedGristRows = localizedRows > 0;
  const button = getSelectLayersButton();

  if (button && hasLocalizedGristRows) {
    button.dataset.gristLocationMode = locationMode;
  }

  if (button && !hasLocalizedGristRows) {
    delete button.dataset.gristLocationMode;
  }

  setSelectLayersButtonDisabled(!hasLocalizedGristRows);
};

/**
 * Store data readiness on the next button and update its disabled state.
 * Disable the button only when step 2 is active and the data is not ready.
 * @param {boolean|string|null|undefined} ready Truthy when data is ready;
 * callers may also pass the document/table identifier expression directly.
 * @returns {void}
 */
const setGristWizardNextButtonReady = (ready) => {
  const button = getGristWizardNextButton();

  if (!button) {
    return;
  }

  button.dataset.ready = "false";

  if (ready) {
    button.dataset.ready = "true";
  }
  button.disabled = button.dataset.step === "2" && !ready;
};

/**
 * Mark Grist data as not ready and disable the next button if step 2 is active.
 * @returns {void}
 */
const disableGristWizardNextButton = () => {
  setGristWizardNextButtonReady(false);
};

/**
 * Update next button readiness according to the presence of a selected table.
 * @param {Object|null|undefined} selectedTable Selected Grist table.
 * @returns {void}
 */
const updateGristWizardNextButtonForSelectedTable = (selectedTable) => {
  if (!selectedTable) {
    setGristWizardNextButtonReady(false);
    return;
  }

  setGristWizardNextButtonReady(true);
};

/**
 * Update next button readiness from a table upload result.
 * Data is ready only when both document and table identifiers are present.
 * @param {Object|null|undefined} result Grist table upload result.
 * @param {string} [result.docId] Destination document identifier.
 * @param {string} [result.tableId] Uploaded table identifier.
 * @returns {void}
 */
const updateGristWizardNextButtonForSentTable = (result) => {
  if (!result) {
    setGristWizardNextButtonReady(false);
    return;
  }

  setGristWizardNextButtonReady(result.docId && result.tableId);
};

/**
 * Check whether an element targets the Grist import tab.
 * @param {Element|null|undefined} target Tab trigger to inspect.
 * @returns {boolean} Whether the trigger targets the Grist tab.
 */
const isGristTab = (target) => {
  if (!target) {
    return false;
  }

  return target.getAttribute("data-bs-target") === GRIST_TAB_TARGET;
};

/**
 * Bind validation handlers once to the new layer modal.
 * Synchronize layer creation with Grist localization when opening or switching
 * tabs, and enable the shared button on other tabs or when closing the modal.
 * Mark the modal as bound to prevent duplicate event listeners.
 * @param {HTMLElement|null} [modal=document.getElementById(GRIST_MODAL_ID)]
 * Modal containing the Grist import tab.
 * @returns {void}
 */
const bindNewLayerModalValidation = (modal = document.getElementById(GRIST_MODAL_ID)) => {
  if (!modal || modal.dataset.gristValidationBound === "true") {
    return;
  }

  modal.dataset.gristValidationBound = "true";

  modal.addEventListener("click", (event) => {
    const tab = event.target.closest('[data-bs-toggle="pill"]');
    const closeButton = event.target.closest(".close, [i18n='close']");

    if (tab) {
      if (isGristTab(tab)) {
        setSelectLayersButtonDisabled(!hasLocalizedGristRows);
        return;
      }

      enableSelectLayersButton();
    }

    if (closeButton) {
      enableSelectLayersButton();
    }
  });

  modal.addEventListener("show.bs.modal", () => {
    const activeTab = modal.querySelector('[data-bs-toggle="pill"].active');

    if (isGristTab(activeTab)) {
      setSelectLayersButtonDisabled(!hasLocalizedGristRows);
      return;
    }

    enableSelectLayersButton();
  });

  modal.addEventListener("hidden.bs.modal", enableSelectLayersButton);
};

export {
  bindNewLayerModalValidation,
  disableGristWizardNextButton,
  disableSelectLayersButton,
  enableSelectLayersButton,
  hasImportedFileTable,
  setGristWizardNextButtonReady,
  setSelectLayersButtonDisabled,
  updateGristWizardNextButtonForSelectedTable,
  updateGristWizardNextButtonForSentTable,
  updateSelectLayersButtonForImportedFile,
  updateSelectLayersButtonForLocalizedRows,
};

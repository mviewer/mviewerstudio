import {
  GRIST_MODAL_ID,
  GRIST_TAB_TARGET,
  GRIST_WIZARD_NEXT_BUTTON_ID,
  SELECT_LAYERS_BUTTON_ID,
} from "./const.js";

const getSelectLayersButton = () => document.getElementById(SELECT_LAYERS_BUTTON_ID);

const getGristWizardNextButton = () =>
  document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);

let hasLocalizedGristRows = false;

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

const setSelectLayersButtonDisabled = (disabled) => {
  const button = getSelectLayersButton();

  if (button) {
    button.disabled = disabled;
  }
};

const enableSelectLayersButton = () => {
  setSelectLayersButtonDisabled(false);
};

const disableSelectLayersButton = () => {
  hasLocalizedGristRows = false;
  const button = getSelectLayersButton();

  if (button) {
    delete button.dataset.gristLocationMode;
  }
  setSelectLayersButtonDisabled(true);
};

const hasImportedFileTable = (verification) => {
  if (!verification || !verification.valid) {
    return false;
  }

  return getParsedRows(verification).length > 0;
};

const updateSelectLayersButtonForImportedFile = () => {
  // A valid import still needs a successful localization before it can become
  // a layer.
  disableSelectLayersButton();
};

/**
 * Update the layer selection button from the latest Grist localization result.
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

const disableGristWizardNextButton = () => {
  setGristWizardNextButtonReady(false);
};

const updateGristWizardNextButtonForSelectedTable = (selectedTable) => {
  if (!selectedTable) {
    setGristWizardNextButtonReady(false);
    return;
  }

  setGristWizardNextButtonReady(true);
};

const updateGristWizardNextButtonForSentTable = (result) => {
  if (!result) {
    setGristWizardNextButtonReady(false);
    return;
  }

  setGristWizardNextButtonReady(result.docId && result.tableId);
};

const isGristTab = (target) => {
  if (!target) {
    return false;
  }

  return target.getAttribute("data-bs-target") === GRIST_TAB_TARGET;
};

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

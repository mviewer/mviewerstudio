import {
  GRIST_MODAL_ID,
  GRIST_TAB_TARGET,
  GRIST_WIZARD_NEXT_BUTTON_ID,
  SELECT_LAYERS_BUTTON_ID,
} from "./const.js";

const getSelectLayersButton = () => document.getElementById(SELECT_LAYERS_BUTTON_ID);

const getGristWizardNextButton = () =>
  document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);

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
  setSelectLayersButtonDisabled(true);
};

const hasImportedFileTable = (verification) => {
  if (!verification || !verification.valid) {
    return false;
  }

  return getParsedRows(verification).length > 0;
};

const updateSelectLayersButtonForImportedFile = (verification) => {
  setSelectLayersButtonDisabled(!hasImportedFileTable(verification));
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
        disableSelectLayersButton();
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
      disableSelectLayersButton();
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
};

import {
  getActiveGristLocationSwitchId,
  getGristAddressFields,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
} from "./locationModeManagement.js";
import { runGristAddressGeocoding } from "./geocoding.js";
import { runGristCoordinatesCheck } from "./coordinates.js";
import {
  getGristWizardContentSteps,
  initGristWizard,
  setGristWizardStep,
} from "./wizard.js";
import { runGristRefGeoJoin } from "./refGeo.js";
import {
  GRIST_AUTH_CONTAINER_ID,
  GRIST_DATA_CONTAINER_ID,
  GRIST_GEOMETRY_FIELD,
  GRIST_LOCATION_SWITCH_IDS,
  GRIST_LOCATION_TARGET_IDS,
  GRIST_MODAL_ID,
  GRIST_RESULT_CONTAINER_ID,
  GRIST_TAB_TARGET,
  GRIST_WIZARD_BACK_BUTTON_ID,
  GRIST_WIZARD_NEXT_BUTTON_ID,
} from "./const.js";

// Instance kept for the lifetime of the modal. It stores the selected table or
// the file to send during the next wizard steps.
let activeImportGristArea = null;

const getGristComponent = (componentName) => {
  if (!mv.components || !mv.components.grist) {
    return null;
  }

  return mv.components.grist[componentName];
};

const disableWizardButton = (buttonId) => {
  const button = document.getElementById(buttonId);

  if (button) {
    button.classList.add("d-none");
  }
};

const getCurrentWizardStep = () => {
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);

  if (!nextButton) {
    return 1;
  }

  return nextButton.dataset.step || 1;
};

/**
 * Return whether the selected Grist table already contains the geometry field.
 *
 * @returns {Promise<boolean>} True when the field exists.
 */
const hasGristGeometryField = async () => {
  if (!activeImportGristArea) {
    return false;
  }

  try {
    const sourceData = await activeImportGristArea.getSourceData();

    return sourceData.fields.includes(GRIST_GEOMETRY_FIELD);
  } catch (error) {
    return false;
  }
};

/**
 * Ask permission to overwrite the geometry field before the referential join.
 *
 * @param {HTMLButtonElement} nextButton Wizard next button.
 * @returns {void}
 */
const confirmGristGeometryOverwrite = (nextButton) => {
  const resultContainer = document.getElementById(GRIST_RESULT_CONTAINER_ID);
  const ConfirmAction = getGristComponent("confirmAction");

  if (!resultContainer || !ConfirmAction) {
    runGristRefGeoJoin({
      importGristArea: activeImportGristArea,
      setWizardStep: setGristWizardStep,
      triggerButton: nextButton,
    });
    return;
  }

  setGristWizardStep(4);
  resultContainer.replaceChildren(
    new ConfirmAction({
      message:
        'Voulez-vous écraser le contenu de la colonne existante "geometry" ?',
      color: "warning",
      onYes: () =>
        runGristRefGeoJoin({
          importGristArea: activeImportGristArea,
          setWizardStep: setGristWizardStep,
          triggerButton: nextButton,
        }),
      onNo: () => {
        resultContainer.replaceChildren();
        setGristWizardStep(3);
        nextButton.disabled = false;
      },
    }).render()
  );
};

/**
 * Clear the current result content before returning to localization.
 *
 * @param {string} currentStep Active wizard step.
 * @returns {void}
 */
const clearGristCurrentStep = (currentStep) => {
  if (currentStep !== "4") {
    return;
  }

  const resultContainer = document.getElementById(GRIST_RESULT_CONTAINER_ID);
  if (resultContainer) {
    resultContainer.replaceChildren();
  }
};

/**
 * Refresh the location fields from the current Grist table.
 *
 * @returns {Promise<void>}
 */
const refreshGristLocationFields = async () => {
  if (!activeImportGristArea) {
    throw new Error("Aucune table Grist sélectionnée.");
  }

  const sourceData = await activeImportGristArea.getSourceData();

  setGristLocationFields(sourceData.fields);
};

/**
 * Render the Grist table refresh action in the localization step.
 *
 * @returns {void}
 */
const initGristLocationRefreshButton = () => {
  const container = document.getElementById("grist-location-preview");
  const RefreshGristDataBtn = getGristComponent("refreshGristDataBtn");

  if (!container || !RefreshGristDataBtn) {
    return;
  }

  container.replaceChildren(
    new RefreshGristDataBtn({ onRefresh: refreshGristLocationFields }).render()
  );
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
  let Switch = null;

  if (mv.components) {
    Switch = mv.components.switch;
  }
  if (!Switch) {
    return;
  }

  const switchConfigs = [
    {
      targetId: GRIST_LOCATION_TARGET_IDS.address,
      id: GRIST_LOCATION_SWITCH_IDS.address,
      label: "À partir d’une adresse",
      description: "Géocodez vos données (adresse, ville...)",
      checked: true,
    },
    {
      targetId: GRIST_LOCATION_TARGET_IDS.ref,
      id: GRIST_LOCATION_SWITCH_IDS.ref,
      label: "À partir d’un référentiel",
      description: "Associez vos données à un référentiel géographique",
      checked: false,
    },
    {
      targetId: GRIST_LOCATION_TARGET_IDS.xy,
      id: GRIST_LOCATION_SWITCH_IDS.xy,
      label: "À partir de coordonnées X/Y",
      description: "Utilisez des colonnes de coordonnées existantes",
      checked: false,
    },
  ];
  const switches = [];
  setGristLocationSwitches(switches);
  initGristLocationRefreshButton();

  // Only one localization mode can be active. Re-enabling the last selected
  // switch prevents the localization form from disappearing entirely.
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
 * Render the Grist data import area after API key validation.
 *
 * @param {string} apiKey Valid Grist API key used by import components.
 * @returns {void}
 */
const initGristImportArea = (apiKey) => {
  const gristDataContainer = document.getElementById(GRIST_DATA_CONTAINER_ID);
  const ImportGristArea = getGristComponent("importGristArea");

  if (!gristDataContainer || !ImportGristArea) {
    return;
  }

  gristDataContainer.replaceChildren();
  const importGristArea = new ImportGristArea({
    apiKey,
    onColumnsChange: setGristLocationFields,
  });
  activeImportGristArea = importGristArea;
  gristDataContainer.appendChild(importGristArea.render());
  mv.utils.grist.validation.disableGristWizardNextButton();
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);
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
  const gristDataContainer = document.getElementById(GRIST_DATA_CONTAINER_ID);

  if (!gristDataContainer) {
    return;
  }

  gristDataContainer.replaceChildren();
  activeImportGristArea = null;
  setGristLocationFields([]);
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);
  if (nextButton) {
    nextButton.dataset.apiKeyReady = "false";
  }
  mv.utils.grist.validation.disableGristWizardNextButton();
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
  const gristAuthContainer = document.getElementById(GRIST_AUTH_CONTAINER_ID);
  const GristApiKey = getGristComponent("gristApiKey");
  let gristConfig = {};

  if (config && config.grist) {
    gristConfig = config.grist;
  }

  if (!gristAuthContainer || !GristApiKey) {
    return;
  }

  gristAuthContainer.replaceChildren();
  const gristApiKey = new GristApiKey(
    gristConfig.api_url || gristConfig.instance_url,
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
 * @param {HTMLElement|null} [modal=document.getElementById(GRIST_MODAL_ID)]
 * Modal element that contains the Grist tab.
 * @param {Function} [getConfig] Function returning the current app config.
 * @returns {void}
 */
const bindNewLayerModalGrist = (
  modal = document.getElementById(GRIST_MODAL_ID),
  getConfig = () => {
    if (window._conf) {
      return window._conf;
    }

    if (typeof _conf !== "undefined") {
      return _conf;
    }

    return undefined;
  }
) => {
  if (!modal || modal.dataset.gristBound === "true") {
    return;
  }

  modal.dataset.gristBound = "true";

  modal.addEventListener("show.bs.modal", () => {
    // Each opening starts with a clean wizard and no previous selection.
    initGristNewLayerModal(getConfig());
  });

  modal.addEventListener("click", (event) => {
    const tab = event.target.closest('[data-bs-toggle="pill"]');
    const backButton = event.target.closest(`#${GRIST_WIZARD_BACK_BUTTON_ID}`);
    const nextButton = event.target.closest(`#${GRIST_WIZARD_NEXT_BUTTON_ID}`);

    if (tab) {
      if (tab.getAttribute("data-bs-target") !== GRIST_TAB_TARGET) {
        disableWizardButton(GRIST_WIZARD_BACK_BUTTON_ID);
        disableWizardButton(GRIST_WIZARD_NEXT_BUTTON_ID);
        return;
      }

      setGristWizardStep(getCurrentWizardStep());
    }

    if (backButton) {
      let previousStep = backButton.dataset.step || 1;
      clearGristCurrentStep(previousStep);
      previousStep--;
      setGristWizardStep(previousStep);
    }

    if (nextButton) {
      let currentStep = nextButton.dataset.step || 1;

      if (currentStep === "2") {
        // The Data step can only be left after sending the file, when needed,
        // and reading back the created or selected table.
        nextButton.disabled = true;

        activeImportGristArea
          .prepareForLocationStep()
          .then(() => {
            alertCustom("La table Grist a été importée avec succès.", "success");
            setGristWizardStep(3);
          })
          .catch((error) => {
            alertCustom(error.message || "Impossible de préparer la table Grist.", "danger");
            console.error("Error preparing Grist table:", error);
            nextButton.disabled = false;
          });
        return;
      }

      if (
        currentStep === "3" &&
        getActiveGristLocationSwitchId() === GRIST_LOCATION_SWITCH_IDS.address
      ) {
        // Geocoding processes addresses directly and displays its result.
        runGristAddressGeocoding({
          importGristArea: activeImportGristArea,
          getAddressFields: getGristAddressFields,
          setWizardStep: setGristWizardStep,
          triggerButton: nextButton,
        });
        return;
      }

      if (
        currentStep === "3" &&
        getActiveGristLocationSwitchId() === GRIST_LOCATION_SWITCH_IDS.ref
      ) {
        // An existing geometry column must be confirmed before it is overwritten.
        nextButton.disabled = true;
        hasGristGeometryField().then((hasGeometryField) => {
          if (hasGeometryField) {
            confirmGristGeometryOverwrite(nextButton);
            return;
          }

          runGristRefGeoJoin({
            importGristArea: activeImportGristArea,
            setWizardStep: setGristWizardStep,
            triggerButton: nextButton,
          });
        });
        return;
      }

      if (
        currentStep === "3" &&
        getActiveGristLocationSwitchId() === GRIST_LOCATION_SWITCH_IDS.xy
      ) {
        // Coordinates are checked before the result step is displayed.
        runGristCoordinatesCheck({
          importGristArea: activeImportGristArea,
          setWizardStep: setGristWizardStep,
        });
        return;
      }

      currentStep++;
      setGristWizardStep(currentStep);
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

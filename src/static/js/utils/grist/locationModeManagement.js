import { GRIST_LOCATION_SWITCH_IDS, GRIST_LOCATION_TARGET_IDS } from "./const.js";
import {
  updateGristWizardNextButton,
  updateGristWizardNextButtonForAddressFields,
} from "./validation.js";
import { getGristGeocodingConfig } from "./utils.js";

const gristLocationState = {
  activeArea: null,
  coordinatesArea: null,
  fields: [],
  switches: [],
};

const getGristComponent = (componentName) => {
  if (!mv.components || !mv.components.grist) {
    return null;
  }

  return mv.components.grist[componentName];
};

/**
 * Initialize coordinate controls with their projection selector.
 *
 * @returns {void}
 */
const initGristLocationProjection = () => {
  const coordinatesTarget = document.getElementById(GRIST_LOCATION_TARGET_IDS.xy);
  const GristCoordinatesArea = getGristComponent("gristCoordinatesArea");
  if (!coordinatesTarget || !GristCoordinatesArea) {
    return;
  }

  const coordinatesArea = new GristCoordinatesArea({
    columns: gristLocationState.fields,
    idPrefix: "newlayer-grist-coordinate",
    displayProjection: true,
  });
  gristLocationState.coordinatesArea = coordinatesArea;
};

/**
 * Return the currently active Grist localization switch id.
 *
 * @returns {string} Active localization switch id, or an empty string.
 */
const getActiveGristLocationSwitchId = () => {
  const activeSwitch = document.querySelector(
    'input[name="newlayer-grist-location-mode"]:checked'
  );

  if (!activeSwitch) {
    return "";
  }

  return activeSwitch.id;
};

/**
 * Return selected address fields.
 *
 * @returns {string[]} Field names selected for address geocoding.
 */
const getGristAddressFields = () => {
  if (!gristLocationState.activeArea) {
    return [];
  }

  return gristLocationState.activeArea.getFields();
};

/**
 * Store available field names for Grist location controls.
 *
 * @param {string[]} fields Field names from the selected/imported table.
 * @returns {void}
 */
const setGristLocationFields = (fields = []) => {
  gristLocationState.fields = fields.filter(Boolean);
  if (gristLocationState.coordinatesArea) {
    gristLocationState.coordinatesArea.setColumnOptions(gristLocationState.fields);
  }

  const activeSwitchId = getActiveGristLocationSwitchId();
  if (activeSwitchId) {
    renderGristLocationArea(activeSwitchId);
  }
};

/**
 * Render the localization configuration area matching the selected mode.
 *
 * @param {string} selectedSwitchId Identifier of the active localization switch.
 * @returns {void}
 */
const renderGristLocationArea = (selectedSwitchId) => {
  gristLocationState.switches.forEach((switchItem) => {
    switchItem.setContent(null);
  });
  gristLocationState.activeArea = null;
  updateGristWizardNextButtonForAddressFields([], selectedSwitchId);

  const selectedSwitch = gristLocationState.switches.find(
    (switchItem) => switchItem.id === selectedSwitchId
  );

  if (!selectedSwitch) {
    return;
  }

  if (selectedSwitchId === GRIST_LOCATION_SWITCH_IDS.address) {
    if (gristLocationState.coordinatesArea) {
      gristLocationState.coordinatesArea.setProjection(getGristGeocodingConfig().srs);
    }
    const GristAddressArea = getGristComponent("gristAddressArea");
    if (!GristAddressArea) {
      return;
    }

    const addressArea = new GristAddressArea({
      fields: gristLocationState.fields,
      id: "newlayer-grist-address-fields",
      onChange: updateGristWizardNextButtonForAddressFields,
    });
    gristLocationState.activeArea = addressArea;
    selectedSwitch.setContent(addressArea.render());
  }

  if (selectedSwitchId === GRIST_LOCATION_SWITCH_IDS.ref) {
    const GristRefGeoArea = getGristComponent("gristRefGeoArea");
    if (!GristRefGeoArea) {
      return;
    }

    const refGeoArea = new GristRefGeoArea({
      fields: gristLocationState.fields,
      idPrefix: "newlayer-grist-refgeo",
    });
    gristLocationState.activeArea = refGeoArea;
    selectedSwitch.setContent(refGeoArea.render());
  }

  if (selectedSwitchId === GRIST_LOCATION_SWITCH_IDS.xy) {
    const coordinatesArea = gristLocationState.coordinatesArea;
    if (!coordinatesArea) {
      return;
    }
    gristLocationState.activeArea = coordinatesArea;
    selectedSwitch.setContent(coordinatesArea.render());
  }

  updateGristWizardNextButton();
};

/**
 * Store rendered Grist localization switch component instances.
 *
 * @param {Array} switches Rendered switch component instances.
 * @returns {void}
 */
const setGristLocationSwitches = (switches = []) => {
  gristLocationState.switches = switches;
};

export {
  initGristLocationProjection,
  getGristAddressFields,
  getActiveGristLocationSwitchId,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
};

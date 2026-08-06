import { GRIST_LOCATION_SWITCH_IDS } from "./const.js";

const gristLocationState = {
  activeArea: null,
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
 * Return the currently active Grist localization switch id.
 *
 * @returns {string} Active localization switch id, or an empty string.
 */
const getActiveGristLocationSwitchId = () => {
  const activeSwitch = document.querySelector(
    'input[name="grist-location-mode"]:checked'
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

  const selectedSwitch = gristLocationState.switches.find(
    (switchItem) => switchItem.id === selectedSwitchId
  );

  if (!selectedSwitch) {
    return;
  }

  if (selectedSwitchId === GRIST_LOCATION_SWITCH_IDS.address) {
    const GristAddressArea = getGristComponent("gristAddressArea");
    if (!GristAddressArea) {
      return;
    }

    const addressArea = new GristAddressArea({
      fields: gristLocationState.fields,
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
    });
    gristLocationState.activeArea = refGeoArea;
    selectedSwitch.setContent(refGeoArea.render());
  }

  if (selectedSwitchId === GRIST_LOCATION_SWITCH_IDS.xy) {
    const GristCoordinatesArea = getGristComponent("gristCoordinatesArea");
    if (!GristCoordinatesArea) {
      return;
    }

    const coordinatesArea = new GristCoordinatesArea({
      columns: gristLocationState.fields,
    });
    gristLocationState.activeArea = coordinatesArea;
    selectedSwitch.setContent(coordinatesArea.render());
  }
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
  getGristAddressFields,
  getActiveGristLocationSwitchId,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
};

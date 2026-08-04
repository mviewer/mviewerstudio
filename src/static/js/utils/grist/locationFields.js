const gristLocationState = {
  activeArea: null,
  fields: [],
  switches: [],
};

/**
 * Return the currently active Grist localization switch id.
 *
 * @returns {string} Active localization switch id, or an empty string.
 */
const getActiveGristLocationSwitchId = () =>
  document.querySelector('input[name="grist-location-mode"]:checked')?.id || "";

/**
 * Return selected address fields.
 *
 * @returns {string[]} Field names selected for address geocoding.
 */
const getGristAddressFields = () =>
  typeof gristLocationState.activeArea?.getFields === "function"
    ? gristLocationState.activeArea.getFields()
    : [];

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

  if (selectedSwitchId === "adresseSwitch") {
    const GristAddressArea =
      mv.components && mv.components.grist && mv.components.grist.gristAddressArea;
    if (!GristAddressArea) {
      return;
    }

    const addressArea = new GristAddressArea({
      fields: gristLocationState.fields,
    });
    gristLocationState.activeArea = addressArea;
    selectedSwitch.setContent(addressArea.render());
  }

  if (selectedSwitchId === "xySwitch") {
    const GristCoordinatesArea =
      mv.components && mv.components.grist && mv.components.grist.gristCoordinatesArea;
    if (!GristCoordinatesArea) {
      return;
    }

    const coordinatesArea = new GristCoordinatesArea({
      columns: gristLocationState.fields,
    });
    gristLocationState.activeArea = coordinatesArea;
    selectedSwitch.setContent(
      typeof coordinatesArea.render === "function"
        ? coordinatesArea.render()
        : coordinatesArea.element
    );
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

export default {
  getGristAddressFields,
  getActiveGristLocationSwitchId,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
};

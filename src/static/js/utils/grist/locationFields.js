const gristLocationState = {
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
 * Store available field names for Grist location controls.
 *
 * @param {string[]} fields Field names from the selected/imported table.
 * @returns {void}
 */
const setGristLocationFields = (fields = []) => {
  gristLocationState.fields = fields.filter(Boolean);

  if (getActiveGristLocationSwitchId() === "xySwitch") {
    renderGristLocationArea("xySwitch");
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

  if (selectedSwitchId !== "xySwitch") {
    return;
  }

  const GristCoordinatesArea =
    mv.components && mv.components.grist && mv.components.grist.gristCoordinatesArea;
  if (!GristCoordinatesArea) {
    return;
  }

  const coordinatesArea = new GristCoordinatesArea({
    columns: gristLocationState.fields,
  });
  const xySwitch = gristLocationState.switches.find(
    (switchItem) => switchItem.id === "xySwitch"
  );

  if (!xySwitch) {
    return;
  }

  xySwitch.setContent(
    typeof coordinatesArea.render === "function"
      ? coordinatesArea.render()
      : coordinatesArea.element
  );
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
  getActiveGristLocationSwitchId,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
};

export default {
  getActiveGristLocationSwitchId,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
};

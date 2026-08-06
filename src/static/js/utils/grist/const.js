const SELECT_LAYERS_BUTTON_ID = "selectLayersButton";
const GRIST_WIZARD_NEXT_BUTTON_ID = "gristWizardNextButton";
const GRIST_WIZARD_BACK_BUTTON_ID = "gristWizardBackButton";
const GRIST_TAB_TARGET = "#newlayer-grist";
const GRIST_MODAL_ID = "mod-layerNew";
const GRIST_AUTH_CONTAINER_ID = "grist-auth";
const GRIST_DATA_CONTAINER_ID = "grist-data";
const GRIST_FOOTER_ID = "grist-footer";
const GRIST_RESULT_CONTAINER_ID = "grist-result";
const GRIST_WIZARD_CONTAINER_ID = "newlayer-grist-wizard";
const NEW_LAYER_BY_GRIST_ID = "newLayerByGrist";
const GRIST_REF_GEO_MATCHING_FIELD_ID = "grist-refgeo-matching-field";
const GRIST_REF_GEO_REFERENTIAL_ID = "grist-refgeo-referential";
const GRIST_REF_GEO_OUTPUT_FORMAT_ID = "grist-refgeo-output-format";

const GRIST_LOCATION_SWITCH_IDS = {
  address: "adresseSwitch",
  ref: "refSwitch",
  xy: "xySwitch",
};

const GRIST_LOCATION_TARGET_IDS = {
  address: "grist-location-address",
  ref: "grist-location-ref",
  xy: "grist-location-xy",
};

const BAN_GEOCODING_FIELDS = [
  "longitude",
  "latitude",
  "result_score",
  "result_score_next",
  "result_label",
  "result_type",
  "result_id",
  "result_banId",
  "result_housenumber",
  "result_name",
  "result_street",
  "result_postcode",
  "result_city",
  "result_context",
  "result_citycode",
  "result_oldcitycode",
  "result_oldcity",
  "result_district",
  "result_status",
];

export {
  BAN_GEOCODING_FIELDS,
  GRIST_AUTH_CONTAINER_ID,
  GRIST_DATA_CONTAINER_ID,
  GRIST_FOOTER_ID,
  GRIST_LOCATION_SWITCH_IDS,
  GRIST_LOCATION_TARGET_IDS,
  GRIST_MODAL_ID,
  GRIST_REF_GEO_MATCHING_FIELD_ID,
  GRIST_REF_GEO_REFERENTIAL_ID,
  GRIST_REF_GEO_OUTPUT_FORMAT_ID,
  GRIST_RESULT_CONTAINER_ID,
  GRIST_TAB_TARGET,
  GRIST_WIZARD_BACK_BUTTON_ID,
  GRIST_WIZARD_CONTAINER_ID,
  GRIST_WIZARD_NEXT_BUTTON_ID,
  NEW_LAYER_BY_GRIST_ID,
  SELECT_LAYERS_BUTTON_ID,
};

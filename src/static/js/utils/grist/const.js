const SELECT_LAYERS_BUTTON_ID = "selectLayersButton";
const GRIST_WIZARD_NEXT_BUTTON_ID = "newlayer-grist-next";
const GRIST_WIZARD_BACK_BUTTON_ID = "newlayer-grist-back";
const GRIST_TAB_TARGET = "#newlayer-grist";
const GRIST_MODAL_ID = "mod-layerNew";
const GRIST_AUTH_CONTAINER_ID = "newlayer-grist-auth";
const GRIST_DATA_CONTAINER_ID = "newlayer-grist-data";
const GRIST_FOOTER_ID = "newlayer-grist-footer";
const GRIST_RESULT_CONTAINER_ID = "newlayer-grist-result";
const GRIST_GEOMETRY_FIELD = "geometry";
const GRIST_WIZARD_CONTAINER_ID = "newlayer-grist-wizard";
const NEW_LAYER_BY_GRIST_ID = "newlayer-grist-workflow";
const GRIST_REF_GEO_MATCHING_FIELD_ID = "newlayer-grist-refgeo-matching-field";
const GRIST_REF_GEO_REFERENTIAL_ID = "newlayer-grist-refgeo-referential";
const GRIST_REF_GEO_OUTPUT_FORMAT_ID = "newlayer-grist-refgeo-output-format";

const GRIST_LOCATION_SWITCH_IDS = {
  address: "adresseSwitch",
  ref: "refSwitch",
  xy: "xySwitch",
};

const GRIST_LOCATION_TARGET_IDS = {
  address: "newlayer-grist-location-address",
  ref: "newlayer-grist-location-ref",
  xy: "newlayer-grist-location-xy",
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
  GRIST_GEOMETRY_FIELD,
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

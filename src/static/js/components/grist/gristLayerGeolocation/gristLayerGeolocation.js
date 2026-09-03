import { getGristCsvTableInfo } from "../../../utils/grist/utils.js";

/**
 * Open the geolocation workflow for an existing Grist layer.
 *
 * @param {Object} options Workflow configuration.
 * @param {Object} options.layer Grist layer being edited.
 * @param {Object} options.mvInstance Application component registry and utilities.
 * @param {Object} options.appConfig Application configuration.
 * @param {Object} options.translator Translation service.
 * @returns {void}
 */
export const openGristLayerGeolocation = ({
  layer,
  mvInstance,
  appConfig,
  translator,
}) => {
  if (!layer.isGrist) {
    return;
  }

  const previewContainer = document.getElementById("layer-grist-data-preview");
  const layerDataContainer = document.getElementById("layer_conf7");
  const workflowContainer = document.getElementById("layer-grist-geolocation-content");
  const GristContent = mvInstance.components.grist.gristContent;
  const hasApiKey = window.sessionStorage.getItem("mviewerstudio.grist.apiKey");
  const gristFields = previewContainer._gristLayerData.meta.fields || [];
  const gristTableInfo = getGristCsvTableInfo(layer.url);
  const gristConfig = appConfig.grist || {};

  if (!gristTableInfo) {
    return;
  }

  const gristSource = new mvInstance.components.grist.gristLayerSource({
    apiUrl: gristConfig.api_url || gristConfig.instance_url,
    instanceUrl: gristConfig.instance_url || gristConfig.api_url,
    orgId: gristConfig.org_id || "Personal",
    docId: gristTableInfo.docId,
    tableId: gristTableInfo.tableId,
    apiKey: hasApiKey,
    data: previewContainer._gristLayerData,
  });
  let addressArea;
  const coordinatesArea = new mvInstance.components.grist.gristCoordinatesArea({
    idPrefix: "layer-grist-geolocation-coordinate",
    columns: gristFields,
    xField: layer.xfield,
    yField: layer.yfield,
    projection: layer.srs,
    displayProjection: false,
    onProjectionChange: (projection) => {
      layer.srs = projection;
    },
  });
  const projectionListCard = new mvInstance.components.listCard({
    title: translator.tr("modal.layer.grist.mode.coordinates.projection"),
    items: [coordinatesArea.renderProjection()],
  });
  const updateGristLayerGeolocation = (geolocType) => {
    layer.geolocType = geolocType;

    if (geolocType === "referential") {
      layer.geojsonField = "geometry";
      delete layer.xfield;
      delete layer.yfield;
      return;
    }

    delete layer.geojsonField;
    layer.xfield = "longitude";
    layer.yfield = "latitude";
    if (geolocType === "coordinates") {
      layer.srs = coordinatesArea.getProjection();
      return;
    }
    layer.srs = "EPSG:4326";
  };
  let gristContent;
  const setWorkflowStep = (step) => gristContent.setStep(step === 4 ? 3 : step);

  gristContent = new GristContent({
    idPrefix: "layer-grist-geolocation",
    hideData: true,
    managedNavigation: true,
    state: {
      step: hasApiKey ? 2 : 1,
      apiKeyReady: Boolean(hasApiKey),
      fields: gristFields,
      geolocType: layer.geolocType,
      locationListCard: true,
      locationCards: [projectionListCard.render()],
      locationModes: [
        {
          value: "address",
          label: translator.tr("modal.layer.grist.mode.address.title"),
          description: translator.tr("modal.layer.grist.mode.address.description"),
          createContent: () => {
            addressArea = new mvInstance.components.grist.gristAddressArea({
              id: "layer-grist-geolocation-address-fields",
              fields: gristFields,
            });
            return addressArea.render();
          },
        },
        {
          value: "referential",
          label: translator.tr("modal.layer.grist.mode.referential.title"),
          description: translator.tr("modal.layer.grist.mode.referential.description"),
          createContent: () =>
            new mvInstance.components.grist.gristRefGeoArea({
              idPrefix: "layer-grist-geolocation-ref",
              fields: gristFields,
              matchingField: layer.geojsonField,
            }).render(),
        },
        {
          value: "coordinates",
          label: translator.tr("modal.layer.grist.mode.coordinates.title"),
          description: translator.tr("modal.layer.grist.mode.coordinates.description"),
          createContent: () => coordinatesArea.render(),
        },
      ],
      onLocationChange: (geolocType) => {
        updateGristLayerGeolocation(geolocType);
      },
    },
    onNext: ({ gristContent: content, currentStep, nextButton }) => {
      if (currentStep === 1) {
        return;
      }

      const resultContainerId = content.ids.result;
      if (content.state.geolocType === "address") {
        mvInstance.utils.grist.geocoding.runGristAddressGeocoding({
          importGristArea: gristSource,
          getAddressFields: () => (addressArea ? addressArea.getFields() : []),
          setWizardStep: setWorkflowStep,
          triggerButton: nextButton,
          resultContainerId,
          updateLayerSelection: false,
        });
        return;
      }

      if (content.state.geolocType === "coordinates") {
        const xField = document.getElementById("layer-grist-geolocation-coordinate-x");
        const yField = document.getElementById("layer-grist-geolocation-coordinate-y");
        const projection = document.getElementById(
          "layer-grist-geolocation-coordinate-projection"
        );

        layer.xfield = xField ? xField.value : "";
        layer.yfield = yField ? yField.value : "";
        layer.srs = projection ? projection.value : "EPSG:4326";
        mvInstance.utils.grist.coordinates.runGristCoordinatesCheck({
          importGristArea: gristSource,
          setWizardStep: setWorkflowStep,
          xFieldId: "layer-grist-geolocation-coordinate-x",
          yFieldId: "layer-grist-geolocation-coordinate-y",
          resultContainerId,
          updateLayerSelection: false,
        });
        return;
      }

      if (content.state.geolocType === "referential") {
        mvInstance.utils.grist.refGeo.runGristRefGeoJoin({
          importGristArea: gristSource,
          setWizardStep: setWorkflowStep,
          triggerButton: nextButton,
          resultContainerId,
          matchingFieldId: "layer-grist-geolocation-ref-matching-field",
          referentialId: "layer-grist-geolocation-ref-referential",
          outputFormatId: "layer-grist-geolocation-ref-output-format",
          updateLayerSelection: false,
        });
      }
    },
  });
  const GristApiKey = mvInstance.components.grist.gristApiKey;
  const authContent = new GristApiKey(
    gristConfig.api_url || gristConfig.instance_url,
    "https://grist.numerique.gouv.fr/account/developer",
    {
      idPrefix: "layer-grist-geolocation-api-key",
      onValidApiKey: (apiKey) => {
        gristSource.apiKey = apiKey;
        gristContent.state.apiKeyReady = true;
        gristContent.setStep(2);
      },
    }
  ).render();

  gristContent.state.auth = authContent;
  const backButton = document.createElement("button");

  backButton.type = "button";
  backButton.className = "btn btn-link mb-3";
  backButton.innerHTML =
    '<i class="ri-arrow-left-line"></i> Annuler et revenir aux données';
  backButton.addEventListener("click", () => {
    workflowContainer.replaceChildren();
    workflowContainer.classList.add("d-none");
    layerDataContainer.classList.remove("d-none");
  });

  layerDataContainer.classList.add("d-none");
  workflowContainer.replaceChildren(backButton, gristContent.render());
  workflowContainer.classList.remove("d-none");
};

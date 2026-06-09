const qgisToMviewer = (function () {
  const DEFAULT_THEME_ID = "qgis";
  const DEFAULT_THEME_NAME = "Projet QGIS";

  const padding = function (n) {
    return "\r\n" + " ".repeat(n);
  };

  const text = function (parent, selector) {
    const node = parent ? parent.querySelector(selector) : null;
    return node && node.textContent ? node.textContent.trim() : "";
  };

  const attr = function (element, name, fallback) {
    return element && element.hasAttribute(name) ? element.getAttribute(name) : fallback;
  };

  const normalizedTitle = function (value, fallback = DEFAULT_THEME_NAME) {
    const title = String(value || "")
      .replace(/\s+/g, " ")
      .trim();
    return title || fallback;
  };

  const escapeXml = function (value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const slugify = function (value, fallback) {
    const slug = String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return slug || fallback;
  };

  const parseQgs = function (content) {
    const xmlDoc = new DOMParser().parseFromString(content, "text/xml");
    const parserError = xmlDoc.querySelector("parsererror");

    if (parserError) {
      throw new Error("Invalid QGIS project XML");
    }

    return xmlDoc;
  };

  const parseXmlDocument = function (content) {
    const xmlDoc = new DOMParser().parseFromString(content, "text/xml");
    const parserError = xmlDoc.querySelector("parsererror");

    if (parserError) {
      throw new Error("Invalid XML document");
    }

    return xmlDoc;
  };

  const sourceParams = function (datasource) {
    return new URLSearchParams(String(datasource || "").replace(/&amp;/g, "&"));
  };

  const layerVisibilityById = function (xmlDoc) {
    const visibility = {};
    xmlDoc.querySelectorAll("legend legendlayer").forEach((legendLayer) => {
      const layerFile = legendLayer.querySelector("legendlayerfile[layerid]");
      if (!layerFile) {
        return;
      }
      visibility[layerFile.getAttribute("layerid")] =
        attr(legendLayer, "checked", "Qt::Checked") !== "Qt::Unchecked" &&
        attr(layerFile, "visible", "1") !== "0";
    });
    return visibility;
  };

  const layerOrder = function (xmlDoc) {
    const customOrder = Array.from(
      xmlDoc.querySelectorAll("layer-tree-group custom-order item")
    ).map((item) => item.textContent.trim());

    if (customOrder.length > 0) {
      return customOrder;
    }

    return Array.from(xmlDoc.querySelectorAll("layer-tree-layer[id]")).map((layer) =>
      layer.getAttribute("id")
    );
  };

  const mapOptions = function (xmlDoc) {
    const qgis = xmlDoc.querySelector("qgis");
    const projectTitle = text(xmlDoc, "title") || attr(qgis, "projectname", "");
    const srs = text(xmlDoc, "projectCrs authid") || "EPSG:3857";
    const extentNode = xmlDoc.querySelector("mapcanvas > extent");
    const extent = extentNode
      ? [
          text(extentNode, "xmin"),
          text(extentNode, "ymin"),
          text(extentNode, "xmax"),
          text(extentNode, "ymax"),
        ]
          .filter(Boolean)
          .join(",")
      : "";

    const extentValues = extent ? extent.split(",").map(Number) : [];
    const center =
      extentValues.length === 4
        ? [
            (extentValues[0] + extentValues[2]) / 2,
            (extentValues[1] + extentValues[3]) / 2,
          ].join(",")
        : "0,0";

    return {
      title: normalizedTitle(projectTitle),
      projection: srs,
      center: center,
      extent: extent,
      zoom: "8",
      maxzoom: "19",
    };
  };

  const qgsLayerToMviewer = function (mapLayer, visibility) {
    const provider = text(mapLayer, "provider");
    const datasource = text(mapLayer, "datasource");
    const params = sourceParams(datasource);
    const id = text(mapLayer, "id");
    const title = text(mapLayer, "layername") || id;

    if (provider !== "wms" || params.get("type") === "xyz") {
      return null;
    }

    const layerName = params.get("layers") || title;
    const style = params.get("styles") || "";
    const format = params.get("format") || "image/png";

    if (!params.get("url") || !layerName) {
      return null;
    }

    return {
      id: layerName,
      name: title,
      visible: visibility[id] === true,
      tiled: "false",
      queryable: "true",
      searchable: "false",
      url: params.get("url"),
      layers: layerName,
      style: style,
      format: format,
      opacity: attr(mapLayer, "opacity", "1"),
      featurecount: params.get("featureCount") || "10",
      infoformat: "text/html",
    };
  };

  const qgsLayerToGeojson = function (mapLayer, visibility) {
    const provider = text(mapLayer, "provider");
    const datasource = text(mapLayer, "datasource");
    const id = text(mapLayer, "id");
    const title = text(mapLayer, "layername") || id;
    const cleanDatasource = datasource.split("|")[0];

    if (provider !== "ogr" || !/\.(geojson|json)(\?|#|$)/i.test(cleanDatasource)) {
      return null;
    }

    console.log({
      id: slugify(title, slugify(id, "qgis_geojson")),
      name: title,
      type: "geojson",
      url: cleanDatasource,
      visible: visibility[id] === true,
      queryable: "true",
      searchable: "false",
      opacity: attr(mapLayer, "opacity", "1"),
    });

    return {
      id: slugify(title, slugify(id, "qgis_geojson")),
      name: title,
      type: "geojson",
      url: cleanDatasource,
      visible: visibility[id] === true,
      queryable: "true",
      searchable: "false",
      opacity: attr(mapLayer, "opacity", "1"),
    };
  };

  const qgsLayerToBaselayer = function (mapLayer, visibility) {
    const provider = text(mapLayer, "provider");
    const datasource = text(mapLayer, "datasource");
    const params = sourceParams(datasource);
    const id = text(mapLayer, "id");
    const title = text(mapLayer, "layername") || id;

    if (provider !== "wms" || params.get("type") !== "xyz" || !params.get("url")) {
      return null;
    }

    return {
      id: slugify(title, slugify(id, "qgis_baselayer")),
      label: title,
      title: title,
      type: "XYZ",
      url: params.get("url"),
      thumbgallery: "img/basemap/osm.png",
      visible: visibility[id] === true,
      maxzoom: params.get("zmax") || "19",
      minzoom: params.get("zmin") || "0",
    };
  };

  const layerXml = function (layer) {
    const attributes = [
      padding(8) + "<layer",
      `id="${escapeXml(layer.id)}"`,
      `name="${escapeXml(layer.name)}"`,
      `type="${escapeXml(layer.type || "wms")}"`,
      `url="${escapeXml(layer.url)}"`,
      `visible="${layer.visible}"`,
      `queryable="${layer.queryable}"`,
      `searchable="${layer.searchable}"`,
      `opacity="${escapeXml(layer.opacity)}"`,
    ];

    if (layer.type !== "geojson") {
      attributes.push(
        `layers="${escapeXml(layer.layers)}"`,
        `tiled="${layer.tiled}"`,
        `format="${escapeXml(layer.format)}"`,
        `style="${escapeXml(layer.style)}"`,
        `featurecount="${escapeXml(layer.featurecount)}"`,
        `infoformat="${escapeXml(layer.infoformat)}"`
      );
    }

    attributes.push("/>");
    return attributes.join(" ");
  };

  const baselayerXml = function (baselayer) {
    return [
      padding(4) + "<baselayer",
      `type="${escapeXml(baselayer.type)}"`,
      `id="${escapeXml(baselayer.id)}"`,
      `label="${escapeXml(baselayer.label)}"`,
      `title="${escapeXml(baselayer.title)}"`,
      `url="${escapeXml(baselayer.url)}"`,
      `thumbgallery="${escapeXml(baselayer.thumbgallery)}"`,
      `visible="${baselayer.visible}"`,
      `maxzoom="${escapeXml(baselayer.maxzoom)}"`,
      `minzoom="${escapeXml(baselayer.minzoom)}"`,
      "/>",
    ].join(" ");
  };

  const xmlRootName = function (xmlDoc) {
    return xmlDoc && xmlDoc.documentElement
      ? xmlDoc.documentElement.localName || xmlDoc.documentElement.nodeName || ""
      : "";
  };

  const firstMatchingChild = function (parent, tagNames) {
    if (!parent) {
      return null;
    }

    return Array.from(parent.children || []).find((child) =>
      tagNames.includes(child.localName || child.nodeName)
    );
  };

  const directChildrenByTagName = function (parent, tagName) {
    return Array.from(parent.children || []).filter(
      (child) => (child.localName || child.nodeName) === tagName
    );
  };

  const directChildText = function (parent, tagNames) {
    const node = firstMatchingChild(parent, tagNames);
    return node && node.textContent ? node.textContent.trim() : "";
  };

  const firstDescendantByTagName = function (parent, tagNames) {
    if (!parent) {
      return null;
    }

    const queue = Array.from(parent.children || []);
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) {
        continue;
      }

      if (tagNames.includes(node.localName || node.nodeName)) {
        return node;
      }

      queue.push(...Array.from(node.children || []));
    }

    return null;
  };

  const findProjectionFromLayer = function (layerNode) {
    if (!layerNode) {
      return "EPSG:3857";
    }

    const crsNode =
      firstMatchingChild(layerNode, ["CRS"]) || firstMatchingChild(layerNode, ["SRS"]);
    const projection = crsNode && crsNode.textContent ? crsNode.textContent.trim() : "";

    return projection || "EPSG:3857";
  };

  const parseBoundingBox = function (layerNode, projection) {
    if (!layerNode) {
      return "";
    }

    const bboxNodes = directChildrenByTagName(layerNode, "BoundingBox");
    const matchingBbox =
      bboxNodes.find((node) => {
        const nodeProjection = node.getAttribute("CRS") || node.getAttribute("SRS") || "";
        return nodeProjection === projection;
      }) || bboxNodes[0];

    if (!matchingBbox) {
      return "";
    }

    const minx = matchingBbox.getAttribute("minx");
    const miny = matchingBbox.getAttribute("miny");
    const maxx = matchingBbox.getAttribute("maxx");
    const maxy = matchingBbox.getAttribute("maxy");

    return [minx, miny, maxx, maxy].every(Boolean)
      ? [minx, miny, maxx, maxy].join(",")
      : "";
  };

  const mapOptionsFromCapabilities = function (xmlDoc) {
    const serviceNode = firstDescendantByTagName(xmlDoc.documentElement, ["Service"]);
    const capabilityNode = firstDescendantByTagName(xmlDoc.documentElement, [
      "Capability",
      "capability",
    ]);
    const rootLayer = capabilityNode ? firstMatchingChild(capabilityNode, ["Layer"]) : null;
    const serviceTitle = directChildText(serviceNode, ["Title"]);
    const rootTitle = directChildText(rootLayer, ["Title"]);
    const projection = findProjectionFromLayer(rootLayer);
    const extent = parseBoundingBox(rootLayer, projection);
    const extentValues = extent ? extent.split(",").map(Number) : [];
    const center =
      extentValues.length === 4 && extentValues.every((value) => !Number.isNaN(value))
        ? [
            (extentValues[0] + extentValues[2]) / 2,
            (extentValues[1] + extentValues[3]) / 2,
          ].join(",")
        : "0,0";

    return {
      title: normalizedTitle(serviceTitle || rootTitle),
      projection: projection,
      center: center,
      extent: extent,
      zoom: "8",
      maxzoom: "19",
    };
  };

  const cleanServiceUrl = function (sourceUrl) {
    const requestUrl = new URL(sourceUrl, window.location.href);
    const requestParamsToDrop = new Set([
      "service",
      "request",
      "version",
      "layers",
      "styles",
      "format",
      "transparent",
      "crs",
      "srs",
      "bbox",
      "width",
      "height",
      "dpi",
      "map_resolution",
    ]);

    Array.from(requestUrl.searchParams.keys()).forEach((key) => {
      if (requestParamsToDrop.has(key.toLowerCase())) {
        requestUrl.searchParams.delete(key);
      }
    });

    return requestUrl.toString();
  };

  const layerStyleName = function (layerNode) {
    const styleNode = firstMatchingChild(layerNode, ["Style"]);
    if (!styleNode) {
      return "";
    }

    return text(styleNode, "Name");
  };

  const capabilitiesLayerToMviewerLayer = function (layerNode, serviceUrl, visible) {
    const layerName = directChildText(layerNode, ["Name"]);
    const layerTitle = directChildText(layerNode, ["Title"]) || layerName;
    const queryable = attr(layerNode, "queryable", "0") !== "0";

    if (!layerName) {
      return null;
    }

    return {
      id: slugify(layerName, slugify(layerTitle, "qgis_layer")),
      name: layerTitle,
      type: "wms",
      url: serviceUrl,
      visible: visible,
      queryable: queryable ? "true" : "false",
      searchable: "false",
      tiled: "false",
      layers: layerName,
      style: layerStyleName(layerNode),
      format: "image/png",
      opacity: "1",
      featurecount: "10",
      infoformat: "text/html",
    };
  };

  const buildMviewerXmlFromCapabilities = function (xmlDoc, sourceUrl) {
    const options = mapOptionsFromCapabilities(xmlDoc);
    const serviceUrl = cleanServiceUrl(sourceUrl);
    const capabilityNode =
      xmlDoc.querySelector("Capability") || xmlDoc.querySelector("capability");
    const rootLayer = capabilityNode ? capabilityNode.querySelector("Layer") : null;
    const layers = [];

    const collectNamedLayers = function (layerNode) {
      return directChildrenByTagName(layerNode, "Layer").reduce((result, childLayer) => {
        if (directChildText(childLayer, ["Name"])) {
          result.push(childLayer);
        }
        return result.concat(collectNamedLayers(childLayer));
      }, []);
    };

    if (rootLayer) {
      collectNamedLayers(rootLayer).forEach((layerNode, index) => {
        const layer = capabilitiesLayerToMviewerLayer(layerNode, serviceUrl, index === 0);
        if (layer) {
          layers.push(layer);
        }
      });
    }

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<config>",
      padding(4) +
        `<application title="${escapeXml(options.title)}" mouseposition="false" measuretools="true" mapprint="true" exportpng="true" togglealllayersfromtheme="true"/>`,
      padding(4) +
        `<mapoptions maxzoom="${escapeXml(options.maxzoom)}" projection="${escapeXml(options.projection)}" center="${escapeXml(options.center)}" zoom="${escapeXml(options.zoom)}"${options.extent ? ` extent="${escapeXml(options.extent)}"` : ""}/>`,
      padding(4) + '<baselayers style="gallery"></baselayers>',
      padding(4) + '<proxy url=""/>',
      padding(4) +
        '<searchparameters bbox="false" localities="false" features="false" static="false"/>',
      padding(4) + "<themes>",
      padding(8) +
        `<theme name="${escapeXml(options.title)}" collapsed="false" id="${DEFAULT_THEME_ID}" icon="fas fa-map">`,
      layers.map(layerXml).join(""),
      padding(8) + "</theme>",
      padding(4) + "</themes>",
      padding(0) + "</config>",
    ].join("");
  };

  const buildMviewerXml = function (xmlDoc) {
    const options = mapOptions(xmlDoc);
    const visibility = layerVisibilityById(xmlDoc);
    const mapLayersById = {};
    const usedBaselayerIds = new Set();

    xmlDoc.querySelectorAll("projectlayers > maplayer").forEach((mapLayer) => {
      mapLayersById[text(mapLayer, "id")] = mapLayer;
    });

    const baselayers = [];
    const layers = [];

    layerOrder(xmlDoc).forEach((id) => {
      const mapLayer = mapLayersById[id];
      if (!mapLayer) {
        return;
      }

      const baselayer = qgsLayerToBaselayer(mapLayer, visibility);
      if (baselayer) {
        baselayer.id = uniqueId(baselayer.id, usedBaselayerIds);
        baselayers.push(baselayer);
        return;
      }

      const layer = qgsLayerToMviewer(mapLayer, visibility);
      if (layer) {
        layers.push(layer);
        return;
      }

      const geojsonLayer = qgsLayerToGeojson(mapLayer, visibility);
      if (geojsonLayer) {
        layers.push(geojsonLayer);
      }
    });

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<config>",
      padding(4) +
        `<application title="${escapeXml(options.title)}" mouseposition="false" measuretools="true" mapprint="true" exportpng="true" togglealllayersfromtheme="true"/>`,
      padding(4) +
        `<mapoptions maxzoom="${escapeXml(options.maxzoom)}" projection="${escapeXml(options.projection)}" center="${escapeXml(options.center)}" zoom="${escapeXml(options.zoom)}"${options.extent ? ` extent="${escapeXml(options.extent)}"` : ""}/>`,
      padding(4) + '<baselayers style="gallery">',
      baselayers.map(baselayerXml).join(""),
      padding(4) + "</baselayers>",
      padding(4) + '<proxy url=""/>',
      padding(4) +
        '<searchparameters bbox="false" localities="false" features="false" static="false"/>',
      padding(4) + "<themes>",
      padding(8) +
        `<theme name="${escapeXml(options.title)}" collapsed="false" id="${DEFAULT_THEME_ID}" icon="fas fa-map">`,
      layers.map(layerXml).join(""),
      padding(8) + "</theme>",
      padding(4) + "</themes>",
      padding(0) + "</config>",
    ].join("");
  };

  const uniqueId = function (id, usedIds) {
    let candidate = id;
    let index = 2;

    while (usedIds.has(candidate)) {
      candidate = `${id}_${index}`;
      index += 1;
    }

    usedIds.add(candidate);
    return candidate;
  };

  return {
    /**
     * Converts raw QGIS `.qgs` XML content to a mviewer XML configuration.
     *
     * @param {string} content Raw QGIS project XML content.
     * @returns {string} mviewer XML configuration.
     */
    convertQgsContentToMviewerXml: function (content) {
      return buildMviewerXml(parseQgs(content));
    },

    /**
     * Reads a QGIS project File object and converts it to mviewer XML.
     *
     * @param {File} file QGIS project file.
     * @returns {Promise<string>} mviewer XML configuration.
     */
    readQgsFileAsMviewerXml: function (file) {
      if (!file) {
        return Promise.reject(new Error("Missing QGIS project file"));
      }

      return file.text().then((content) => this.convertQgsContentToMviewerXml(content));
    },

    /**
     * Fetches a QGIS project URL and converts it to mviewer XML.
     *
     * @param {string} url URL of a `.qgs` file.
     * @returns {Promise<string>} mviewer XML configuration.
     */
    fetchQgsAsMviewerXml: function (url) {
      return fetch(url)
        .then((response) => (response.ok ? response.text() : Promise.reject(response)))
        .then((content) => this.convertQgsContentToMviewerXml(content));
    },

    /**
     * Tells whether the provided XML document is a QGIS project document.
     *
     * @param {Document} xmlDoc Parsed XML document.
     * @returns {boolean} `true` when the XML root is `<qgis>`.
     */
    isQgisProjectDocument: function (xmlDoc) {
      return xmlRootName(xmlDoc).toLowerCase() === "qgis";
    },

    /**
     * Tells whether the provided XML document is a WMS capabilities document.
     *
     * @param {Document} xmlDoc Parsed XML document.
     * @returns {boolean} `true` when the XML root is a capabilities document.
     */
    isWmsCapabilitiesDocument: function (xmlDoc) {
      const rootName = xmlRootName(xmlDoc).toLowerCase();
      return rootName === "wms_capabilities" || rootName === "wmt_ms_capabilities";
    },

    /**
     * Parses a raw XML string and returns a document.
     *
     * @param {string} content Raw XML content.
     * @returns {Document} Parsed XML document.
     */
    parseXmlDocument: function (content) {
      return parseXmlDocument(content);
    },

    /**
     * Converts QGIS server capabilities to a mviewer XML configuration.
     *
     * @param {Document} xmlDoc Parsed WMS capabilities document.
     * @param {string} sourceUrl Original QGIS server URL.
     * @returns {string} mviewer XML configuration.
     */
    convertQgisServerCapabilitiesToMviewerXml: function (xmlDoc, sourceUrl) {
      return buildMviewerXmlFromCapabilities(xmlDoc, sourceUrl);
    },
  };
})();

export default qgisToMviewer;

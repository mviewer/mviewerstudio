var mv = (function () {
  var _wmsLayerProperties = {
    layerType: "wms",
    tiled: true,
    url: "",
    infoFormat: "text/html",
  };

  function uuid() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
  }

  var _userInfo = {
    userName: "",
    name: "",
    groupSlugName: "",
    groupFullName: "",
  };

  return {
    getLayerById: (layerid = null) => {
      if (!layerid) {
        var el = $(".layers-list-item.active");
        layerid = el.attr("data-layerid");
      }
      var themeid = $("#theme-edit").attr("data-themeid");
      return config.themes[themeid].layers.find((l) => l.id === layerid);
    },

    uuid: uuid,

    setDefaultLayerProperties: function (defaultParams) {
      if (defaultParams.info_format)
        _wmsLayerProperties.infoFormat = defaultParams.info_format;
      if (defaultParams.layer_tiled) _wmsLayerProperties.tiled = defaultParams.tiled;
      if (defaultParams.layer_type)
        _wmsLayerProperties.layerType = defaultParams.layer_type;
    },

    showCSWResults: function (results) {
      var html = [];
      $.each(results, function (index, result) {
        var _abstract =
          result.abstract.length > 200
            ? result.abstract.substring(0, 200) + "..."
            : result.abstract;
        var div = [];
        div.push(
          '<div class="ogc-result csw-result col-sm-12 col-md-12" data-title="' +
            result.title +
            '"'
        );
        div.push(' data-layerid="' + result.layerid + '"');
        if (result.metadata) {
          div.push(' data-metadata="' + result.metadata + '"');
        }
        if (result["metadata-csw"]) {
          div.push(' data-metadata-csw="' + result["metadata-csw"] + '"');
        }
        if (result.wms) {
          div.push(' data-url="' + result.wms + '"');
        }
        if (result.attribution) {
          div.push(' data-type="wms"');
        }
        div.push(">");
        div.push(
          '<div class="checkbox list-group-item">',
          '<div class="custom-control custom-checkbox">',
          '<input type="checkbox" class="custom-control-input" id="' +
            result.layerid +
            '-ck">',
          '<label class="custom-control-label" for="' + result.layerid + '-ck">',
          '<span style="font-weight:600;">' + result.title + "</span></br>",
          "<span>" + _abstract + "</span>",
          "</label>",
          "</div>",
          "</div>"
        );
        html.push(div.join(""));
      });
      $("#csw-results").append(html).show();

      if (results.length > 0) {
        $("#search-message").text("");
        $("#search-message").hide();
      } else {
        $("#search-message").text(mviewer.tr("msg.no.search.result"));
      }
    },

    addBaseLayer: () => {
      let baseLayer = {
        label: formCustomBaseLabel.value,
        thumbgallery: formCustomBaseThumb.value,
        title: formCustomBaseTitle.value,
        id: formCustomBaseId.value,
        styleurl: formCustomBaseStyleUrl.value,
        style: formCustomBaseStyle.value,
        layers: formCustomBaseNameLayers.value,
        attribution: formCustomBaseAttribution.value,
        format: formCustomBaseFormat.value,
        url: formCustomBaseUrl.value,
        type: frmBlCustomType.value,
        matrixset: formCustomBaseMatrixset.value,
      };
      baseLayer.type =
        baseLayer.type != "vector-tms" ? baseLayer.type.toUpperCase() : baseLayer.type;
      mv.showBaseLayers({ [baseLayer.id]: baseLayer }, "custom-bl");
      setConf("customBaseLayers", {
        ...getConf("customBaseLayers"),
        [baseLayer.id]: baseLayer,
      });
    },

    validateFormBaseLayer: () => {
      let isInvalid = false;

      // Test input value
      [
        ...appCustomBackgroundBlock.querySelectorAll(
          "div:not(.d-none) > div > input[required]"
        ),
      ].forEach(function (x) {
        if (!x.value) {
          x.classList.add("is-invalid");
          isInvalid = true;
        }
      });

      if (isInvalid) {
        alertCustom(mviewer.tr("msg.missing.infos"), "danger");
        return;
      }

      // Add basemap
      mv.addBaseLayer();
      alertCustom(mviewer.tr("msg.basemap.new"), "info");
      // Reset input
      [...appCustomBackgroundBlock.querySelectorAll("input")].forEach(function (x) {
        x.value = "";
        x.classList.remove("is-invalid");
      });
    },

    showBaseLayers: function (data, classe) {
      var html = [];
      var html2 = [];
      $.each(data, function (index, l) {
        var div = [
          '<li class="' +
            classe +
            ' bl list-group-item list-flex" data-title="' +
            l.label +
            '" data-layerid="' +
            l.id +
            '">',
          '<div class="list-flex">',
          '<img src="' +
            l.thumbgallery +
            '" alt="' +
            l.label +
            '" class="img-BackgroundMap">',
          "<div><span>" + l.label + "</span><br><span>" + l.title + "</span></div>",
          "</div>",
          '<div class="custom-control custom-checkbox">',
          '<input type="checkbox" class="custom-control-input" id="' + l.id + '-bl">',
          '<label class="custom-control-label" for="' + l.id + '-bl"></label>',
          "</div>",
          "</li>",
        ].join("");
        html.push(div);
        html2.push(
          '<option disabled value="' +
            l.id +
            '" >' +
            l.label +
            " - " +
            l.title +
            "</option>"
        );
      });
      $("#frm-bl").append(html);
      $("#frm-bl-visible").append(html2);
      $(".bl." + classe + " input").bind("change", function (e) {
        var id = $(this).parent().parent().attr("data-layerid");
        var value = $(e.currentTarget).prop("checked");
        if (value === true) {
          $("#frm-bl-visible option[value='" + id + "']").removeAttr("disabled");
        } else {
          $("#frm-bl-visible option[value='" + id + "']").attr("disabled", "disabled");
        }
      });
    },

    showStyles: function (styles, layerid) {
      $("#frm-lis-styles .layer-style").remove();
      $("#frm-sld").val("");
      var themeid = $("#theme-edit").attr("data-themeid");
      function getLayerbyId(l) {
        return l.id === layerid;
      }
      var layer = config.themes[themeid].layers.find(getLayerbyId);
      if (layer.sld) {
        $("#frm-sld").val(layer.sld);
      }
      var html = [];
      $(styles).each(function (id, style) {
        var div = [
          '<div class="layer-style col-sm-6 col-md-4" name="' +
            style.name +
            '" data-legendurl="' +
            style.src +
            '" data-stylename="' +
            style.name +
            '" data-layerid="' +
            layerid +
            '" >',
          '<div class="layer-style-block">',
          '<div class="custom-control custom-checkbox">',
          '<input type="checkbox" onchange="mv.changeLayerLegendInput(this)" class="custom-control-input" id="' +
            style.name +
            '-style-selection">',
          '<label class="custom-control-label" for="' +
            style.name +
            '-style-selection">' +
            style.name +
            "</label>",
          "</div>",
          '<img class="my-3" src="' + style.src + '">',
          '<div class="input-group input-group-sm">',
          '<div class="input-group-prepend">',
          '<span class="input-group-text"><i class="bi bi-pencil"></i></span>',
          "</div>",
          '<input id="' +
            style.name +
            '-style-alias" class="form-control" type="text" value="' +
            style.name +
            '" ></input>',
          "</div>",
          "</div>",
        ].join("");
        html.push(div);
      });
      $("#frm-lis-styles").append(html);
      if (layer.style && layer.style != "") {
        var styles = layer.style.split(",");
        var aliases;
        switch (styles.length) {
          case 1:
            $(".layer-style[name='" + layer.style + "'] input[type='checkbox']").prop(
              "checked",
              "checked"
            );
            break;
          default:
            aliases = layer.stylesalias.split(",");
            for (var i = 0; i <= styles.length; i++) {
              $(".layer-style[name='" + styles[i] + "'] input[type='checkbox']").prop(
                "checked",
                "checked"
              );
              $(".layer-style[name='" + styles[i] + "'] input[type='text']").val(
                aliases[i]
              );
            }
        }
      }
    },

    showDistinctValues: function (values, option) {
      console.log("showDistinctValues option: %s", option);
      var html = [];
      $.each(values, function (id, value) {
        html.push(
          '<a onclick="$(this).toggleClass(\'active\');" class="list-group-item">' +
            value +
            "</a>"
        );
      });
      $("#distinct_values a").remove();
      $("#distinct_values").append(html.join(" "));
      $("#mod-featuresview").modal("show");
      $("#mod-featuresview").attr("data-bs-target", option);
    },

    saveSourceAttributeFilter: function () {
      var values = [];
      var layerid = $(".layers-list-item.active").attr("data-layerid");
      var fld = $("#attribute_filter_fields").val();
      var operator = $("#attribute_filter_operators").val();
      var selected = $("#source_fields_tags").tagsinput("items");
      var type = config.temp.layers[layerid].fields[fld].type;

      $.each(selected, function (id, value) {
        if (type === "string") {
          values.push("'" + value + "'");
        } else {
          values.push(value);
        }
      });
      var expression = "";
      if (operator === "=") {
        expression = values[0];
      } else {
        expression = "(" + values.join(",") + ")";
      }
      filter = fld + " " + operator + " " + expression;
      $("#frm-filter").val(filter);
      $("#filter_wizard").hide();
    },

    showFields: function (fields, layerid) {
      $("#frm-lis-fields .row.fld").remove();
      $("#attribute_filter_fields option").remove();
      $("#opt-attributefield option").remove();
      var themeid = $("#theme-edit").attr("data-themeid");
      function getLayerbyId(l) {
        return l.id === layerid;
      }
      var layer = config.themes[themeid].layers.find(getLayerbyId);
      //re-order fields if they have been ordered, putting unused ones to the end
      if (layer.fields) {
        var sortedFields = layer.fields.split(",");
        fields.sort(function (a, b) {
          var index1 = sortedFields.indexOf(a);
          var index2 = sortedFields.indexOf(b);
          return (index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity);
        });
      }
      $(fields).each(function (id, fld) {
        if (config.temp.layers[layerid].fields[fld]) {
          $("#attribute_filter_fields, #opt-attributefield").append(
            '<option value="' + fld + '">' + fld + "</option>"
          );
        }
        //name, alias, type
        var alias = "";
        var selected = "";
        if (layer.fieldsoptions && layer.fieldsoptions[fld]) {
          alias = layer.fieldsoptions[fld].alias;
          selected = "selected";
        } else {
          alias = fld;
          selected = "";
        }
      });
      if (layer.attributefilter && layer.attributefield) {
        $("#opt-attributefield").val(layer.attributefield);
      }
      if (layer.usetemplate && layer.template) {
        mv.parseTemplate(
          layer.template.split("{{#features}}")[1].split("{{/features}}")[0]
        );
      }
    },

    showWMSResults: function (results) {
      var html = [];
      var nb_results = 0;

      $.each(results, function (index, result) {
        // Only layers with :
        // - a name
        // - a bbox
        // - a parent layer
        // should be displayed (those with no name should not be used by client applications)
        if (
          result.layerid !== undefined &&
          result.bbox &&
          result.bbox.length > 0 &&
          result.parentLayerId !== undefined
        ) {
          var _abstract =
            result.abstract.length > 200
              ? result.abstract.substring(0, 200) + "..."
              : result.abstract;
          var div = [];
          div.push(
            '<div class="ogc-result wms-result col-sm-12 col-md-12" data-title="' +
              result.title +
              '"'
          );
          div.push(' data-layerid="' + result.layerid + '"');
          if (result.metadata) {
            div.push(' data-metadata="' + result.metadata + '"');
          }
          if (result["metadata-csw"]) {
            div.push(' data-metadata-csw="' + result["metadata-csw"] + '"');
          }
          if (result.wms) {
            div.push(' data-url="' + result.wms + '"');
          }
          if (result.attribution) {
            div.push(' data-type="wms"');
          }
          div.push(">");
          div.push(
            '<div class="checkbox list-group-item">',
            '<div class="custom-control custom-checkbox">',
            '<input type="checkbox" class="custom-control-input" id="' +
              result.layerid +
              '-ck">',
            '<label class="custom-control-label" for="' + result.layerid + '-ck">',
            '<span style="font-weight:600;">' + result.extTitle + "</span></br>",
            "<span>" + _abstract + "</span>",
            "</label>",
            "</div>",
            "</div>"
          );
          html.push(div.join(""));
          nb_results++;
        }
      });
      $("#wms-results").append(html).show();

      if (nb_results > 0) {
        $("#search-message").text("");
        $("#search-message").hide();
      } else {
        $("#search-message").text(mviewer.tr("msg.no.search.result"));
      }
    },

    getConfLayers: function () {
      // CAS 2 : Ajout d'une couche via ces paramètres
      if (document.getElementById("newlayer-type").value != "") {
        // Récupère les valeurs des paramètres communs saisis
        var layertype = document.getElementById("newlayer-type").value;
        var layerid = document.getElementById("newlayer-id").value;
        var layername = document.getElementById("newlayer-name").value;
        var layerurl = document.getElementById("newlayer-url").value;

        // Test si valeur nulle
        let isInvalid = false;
        [...commonParamType.querySelectorAll("input")].forEach(function (x) {
          if (!x.value) {
            x.classList.add("is-invalid");
            isInvalid = true;
          }
        });
        if (isInvalid) {
          alertCustom(mviewer.tr("msg.missing.infos"), "danger");
          return;
        }
        // Ajoute les paramètres communs à la nouvelle couche
        $(".layers-list-item.active")
          .attr("data-type", layertype)
          .attr("data-url", layerurl)
          .attr("data-layerid", layerid)
          .attr("data-title", layername)
          .attr("visible", true)
          .attr("tiled", true)
          .attr("queryable", true)
          .find(".layer-name")
          .text(layername);
        var layer = {
          id: layerid,
          title: layername,
          name: layername,
          type: layertype,
          url: layerurl,
          visible: true,
          tiled: true,
          queryable: true,
        };

        // Paramètres supplémentaires si Vector-TMS
        if (document.getElementById("newlayer-type").value == "vector-tms") {
          var layerstyleurl = document.getElementById("newlayer-tms-styleurl").value;
          var layerstylename = document.getElementById("newlayer-tms-style").value;
          layer.styleurl = layerstyleurl;
          layer.style = layerstylename;
        }

        config.themes[$("#theme-edit").attr("data-themeid")].layers.push(layer);

        $("#mod-layerNew").modal("hide");
        $("#mod-themeOptions").modal("show");

        mv.resetConfLayer();
        return;
      }
      // CAS 1 : Ajout d'une couche via un catalogue
      var selected_layers = $(".ogc-result input[type='checkbox']:checked");
      var counter = 0;
      var ogc_type = "";
      selected_layers.each(function (i, ctl) {
        if (ctl.checked) {
          var conf = $(ctl).closest(".ogc-result").data();
          if (counter > 0) {
            addLayer(mviewer.tr("title.new.layer"));
            $(".list-group-item.layers-list-item")
              .removeClass("active")
              .last()
              .addClass("active");
          }
          $(".layers-list-item.active")
            .attr("data-type", _wmsLayerProperties.layerType)
            .attr("data-url", conf.url)
            .attr("data-layerid", conf.layerid)
            .attr("data-title", conf.title)
            .attr("data-queryable", "true")
            .attr("infoformat", _wmsLayerProperties.infoFormat)
            .attr("data-metadata", conf.metadata)
            .attr("data-metadata-csw", conf.metadataCsw)
            .attr("visible", true)
            .attr("data-attribution", conf.attribution)
            .find(".layer-name")
            .text(conf.title);

          var layer = {
            id: conf.layerid,
            title: conf.title,
            name: conf.title,
            type: _wmsLayerProperties.layerType,
            url: conf.url,
            queryable: true,
            attribution: conf.attribution,
            infoformat: _wmsLayerProperties.infoFormat,
            tiled: _wmsLayerProperties.tiled,
            metadata: conf.metadata,
            "metadata-csw": conf.metadataCsw,
            visible: true,
          };

          config.themes[$("#theme-edit").attr("data-themeid")].layers.push(layer);
        }
        counter += 1;
      });
      $("#mod-layerNew").modal("hide");
      $("#mod-themeOptions").modal("show");
      //remove selection from results
      $(".ogc-result input[type='checkbox']:checked").prop("checked", false);
    },

    resetConfLayer: function () {
      // Reset input
      document.getElementById("newlayer-type").value = "";
      [...document.querySelectorAll(".param-type")].forEach((e) =>
        e.classList.add("d-none")
      );
      [...document.querySelectorAll("#commonParamType >div")].forEach((e) =>
        e.classList.add("d-none")
      );
      [...newLayerByParam.querySelectorAll("input")].forEach(function (x) {
        x.value = "";
        x.classList.remove("is-invalid");
      });
    },

    resetSearch: function () {
      $("#csw-results .ogc-result").remove();
      $("#wms-results .ogc-result").remove();
      $("#wfs-results .ogc-result").remove();
    },

    fieldTypeSelectionChange: function (select) {
      if ($(select).val() === "false") {
        $(select).closest(".fld").removeClass("selected");
      } else {
        $(select).closest(".fld").addClass("selected");
      }
    },

    showLayerOptions: function (el) {
      // Init params display
      [...document.querySelectorAll("#mod-layerOptions .layerOption-wms")].forEach((e) =>
        e.classList.add("d-none")
      );
      [...document.querySelectorAll("#mod-layerOptions .layerOption-tms")].forEach((e) =>
        e.classList.add("d-none")
      );
      document.getElementById("layerTypeLabel").innerHTML = "";
      //clear forms
      $("#layer_conf1 form").trigger("reset");
      $("#layer_conf2 form").trigger("reset");
      $("#frm-lis-fields").empty();
      $("#layer_conf3 form").trigger("reset");
      $("#frm-lis-styles").empty();
      $("#layer_conf4 form").trigger("reset");
      $("#layer_conf5 form").trigger("reset");
      $("#layer_conf6 form").trigger("reset");
      $("input[data-role='tagsinput']").tagsinput("removeAll");
      $("#layer_sections>.tab-pane").removeClass("active").first().addClass("active");
      $("#layer_sections_menu li").removeClass("active").first().addClass("active");

      var layerid = el.attr("data-layerid");
      //var layertype = el.attr("data-type");
      var themeid = $("#theme-edit").attr("data-themeid");

      function getLayerbyId(l) {
        return l.id === layerid;
      }
      var layer = config.themes[themeid].layers.find(getLayerbyId);

      document.getElementById("layerTypeLabel").append(layer.type);

      $("#frm-type").val(layer.type).trigger("change");
      $("#frm-layer-title").val(layer.title);
      if (layer.opacity) {
        $("#frm-opacity").val(layer.opacity);
      } else {
        $("#frm-opacity").val("1");
      }
      // set legendurl theme
      $("#frm-legendurl").val(layer.legendurl);
      // set legend type selector
      document.querySelector("#frm-legend").value = layer?.legendurl
        ? "custom"
        : "default";
      $("#frm-layerid").val(layer.id);
      $("#frm-url").val(layer.url);
      $("#frm-queryable").prop("checked", layer.queryable);
      $("#frm-featurecount").val(layer.featurecount);
      $("#frm-infopanel option[value='" + layer.infopanel + "']").prop("selected", true);
      $("#frm-secure").val(layer.secure);
      $("#frm-useproxy").prop("checked", layer.useproxy);
      $("#frm-searchable").prop("checked", layer.searchable);
      $("#frm-searchengine").val(layer.searchengine).trigger("change");
      $("#frm-fusesearchkeys").val(layer.fusesearchkeys);
      $("#frm-fusesearchresult").val(layer.fusesearchresult);
      $("#frm-infoformat option[value='" + layer.infoformat + "']")
        .prop("selected", true)
        .trigger("change");
      if (layer.metadata) {
        $("#frm-metadata").val(layer.metadata);
      }
      if (layer["metadata-csw"]) {
        $("#frm-metadata-csw").val(layer["metadata-csw"]);
      }
      $("#frm-visible").prop("checked", layer.visible);
      $("#frm-tiled").prop("checked", layer.tiled);
      $("#frm-attribution").val(layer.attribution);
      // new
      $("#frm-layer-index").val(layer.index || null);
      $("#frm-layer-exclusive").prop("checked", layer.exclusive);
      $("#frm-layer-toplayer").prop("checked", layer.toplayer);
      $("#frm-layer-expanded").prop("checked", layer.expanded);
      let showintoc = !(layer?.showintoc || layer?.showintoc == undefined);
      $("#frm-layer-showintoc").prop("checked", showintoc);

      if (layer.useexternaltemplate && layer.templateurl) {
        $("#frm-template").prop("checked", true);
        $("#frm-template-url").val(layer.templateurl);
      }
      $("#mod-layerOptions .checkedurl").trigger("change");

      if (layer.type === "wms") {
        [...document.querySelectorAll("#mod-layerOptions .layerOption-wms")].forEach(
          (e) => e.classList.remove("d-none")
        );
        $("#frm-scalemin").val(layer.scalemin);
        $("#frm-scalemax").val(layer.scalemax);
        $("#frm-filter").val(layer.filter);
        $("#frm-layer-styletitle").val(layer.styletitle || "");
        $("#frm-layer-dynamiclegend").prop("checked", layer.dynamiclegend);
        if (layer.attributefilter) {
          $("#frm-attributelabel").val(layer.attributelabel);
          layer.attributevalues.split(",").forEach(function (value, id) {
            $("#control_fields_tags").tagsinput("add", value);
          });
        }
        ogc
          .getWfsInfosFromWms(layer.url, layerid)
          .then(({ describeLayer }) => {
            ogc.getFieldsFromWMS(describeLayer, layerid);
            return describeLayer;
          })
          .then(({ wfs_url }) =>
            ogc.getFeatures(wfs_url, { TYPENAME: layerid, MAXFEATURES: 1 }, (data) => {
              if (config.temp.layers[layerid]) {
                config.temp.layers[layerid].features = data?.features || [];
                mv.createDispatchEvent("wfsFeaturesReady", {
                  features: config.temp.layers[layerid].features,
                });
              }
            })
          )
          .then(() => ogc.getStylesFromWMS(layer.url, layerid));
      }

      if (layer.type === "vector-tms") {
        [...document.querySelectorAll("#mod-layerOptions .layerOption-tms")].forEach(
          (e) => e.classList.remove("d-none")
        );
        $("#frm-layertms-styleurl").val(layer.styleurl);
        $("#frm-layertms-stylename").val(layer.style);
        $("#frm-layertms-filterstyle").val(layer.filterstyle);
      }
    },

    /**
     * TODO : control if always use
     */
    writeFieldsOptions: function (layer) {
      var aliases = [];
      var fields = [];
      var template = { title: "", text: [], photo: [], link: [], template: [] };

      $.each(layer.fieldsoptions, function (index, options) {
        if (layer.useexternaltemplate) {
          switch (options.type) {
            case "title":
              template.title = '<h3 class="title-feature">{{' + options.name + "}}</h3>";
              break;
            case "text":
              template.text.push(
                '<div class="feature-text"><span>' +
                  options.alias +
                  ":</span> {{" +
                  options.name +
                  "}}</div><br/>"
              );
              break;
            case "image":
              template.photo.push(
                '<img src="{{' +
                  options.name +
                  '}}" class="img-responsive" style="margin-top:5%;" />'
              );
              break;
            case "link":
              template.link.push(
                '<a href="{{' +
                  options.name +
                  '}}" target="_blank">' +
                  options.alias +
                  "</a>"
              );
              break;
          }
        } else {
          if (options.type === "title") {
            fields.unshift(options.name);
            aliases.unshift(options.alias);
          } else {
            fields.push(options.name);
            aliases.push(options.alias);
          }
        }
      });
      if (layer.useexternaltemplate && !layer.templateurl) {
        template.template.push("{{#features}}");
        template.template.push('<li class="item" style="width:238px;">');
        template.template.push(template.title);
        template.template.push('<p class="text-feature">');
        $(template.text).each(function (index, text) {
          template.template.push(text);
        });
        template.template.push("</p>");
        $(template.photo).each(function (index, image) {
          template.template.push(image);
        });
        $(template.link).each(function (index, link) {
          template.template.push(link);
        });
        template.template.push("</li>");
        template.template.push("{{/features}}");
        layer.template = template.template.join(" \n");
      } else {
        layer.fields = fields.join(",");
        layer.aliases = aliases.join(",");
      }
      console.groupEnd("writeFieldsOptions");
    },

    saveLayerOptions: function (layerid = null) {
      let layer = mv.getLayerById(layerid);

      // Commons params
      layer.type = $("#frm-type").val();
      layer.title = $("#frm-layer-title").val();
      layer.name = $("#frm-layer-title").val();
      layer.id = $("#frm-layerid").val();
      layer.url = $("#frm-url").val();
      layer.legendurl = $("#frm-legendurl").val();
      layer.queryable = $("#frm-queryable").prop("checked") === true;
      layer.secure = $("#frm-secure").val();
      layer.useproxy = $("#frm-useproxy").prop("checked") === true;
      layer.searchable = $("#frm-searchable").prop("checked") === true;
      layer.searchengine = $("#frm-searchengine").val();
      layer.fusesearchkeys = $("#frm-fusesearchkeys").val();
      layer.fusesearchresult = $("#frm-fusesearchresult").val();
      layer.infoformat = $("#frm-infoformat").val();
      layer.featurecount = $("#frm-featurecount").val();
      layer.infopanel = $("#frm-infopanel").val();
      layer.metadata = $("#frm-metadata").val();
      layer["metadata-csw"] = $("#frm-metadata-csw").val();
      layer["attribution"] = $("#frm-attribution").val();
      layer["index"] = $("#frm-layer-index").val() || "";
      layer["dynamiclegend"] = $("#frm-layer-dynamiclegend").prop("checked") === true;
      layer["exclusive"] = $("#frm-layer-exclusive").prop("checked") === true;
      layer["toplayer"] = $("#frm-layer-toplayer").prop("checked") === true;
      layer["expanded"] = $("#frm-layer-expanded").prop("checked") === true;
      layer["showintoc"] = $("#frm-layer-showintoc").prop("checked") !== true;
      layer.visible = $("#frm-visible").prop("checked") === true;
      layer.opacity = $("#frm-opacity").val();
      layer.tiled = $("#frm-tiled").prop("checked") === true;
      layer.useexternaltemplate = $("#frm-template").prop("checked") === true;
      layer.templateurl =
        $("#frm-template-url").val() == "" ? false : $("#frm-template-url").val();
      // lines useless - but usefull to track and debug
      // layer.jsonfields = layer.jsonfields;
      // layer.useGeneratorTemplate = layer.useGeneratorTemplate
      // TMS params
      if (layer.type == "vector-tms") {
        layer.style = $("#frm-layertms-stylename").val();
        layer.styleurl = $("#frm-layertms-styleurl").val();
        layer.filterstyle = $("#frm-layertms-filterstyle").val();
      }

      //WMS params
      if (layer.type == "wms") {
        layer["styletitle"] = $("#frm-layer-styletitle").val();
        layer.sld = $("#frm-sld").val();
        if ($("#frm-scalemin").val() >= 0 && $("#frm-scalemax").val() > 0) {
          layer.scalemin = $("#frm-scalemin").val();
          layer.scalemax = $("#frm-scalemax").val();
        } else {
          delete layer.scalemin;
          delete layer.scalemax;
        }
        layer.filter = $("#frm-filter").val();
        //Controle FilterAttributes
        var fld = $("#opt-attributefield").val();
        var values = $("#control_fields_tags").val();
        var label = $("#frm-attributelabel").val();
        if (values.split(",").length > 1) {
          layer.attributefilter = true;
          layer.attributefield = fld;
          layer.attributevalues = values;
          layer.attributelabel = label;
        }
        //Styles
        var selected_styles = $("#frm-lis-styles input[type='checkbox']:checked");
        var style_names = [];
        var style_alias = [];
        switch (selected_styles.length) {
          case 0:
            layer.style = "";
            layer.stylesalias = "";
            break;
          case 1:
            layer.style = $(selected_styles)
              .first()
              .closest(".layer-style")
              .attr("data-stylename");
            layer.stylesalias = "";
            break;
          default:
            selected_styles.each(function (index, style) {
              var name = $(style).closest(".layer-style").attr("data-stylename");
              var alias = $(style)
                .closest(".layer-style")
                .find("input[type='text']")
                .val();
              style_names.push(name);
              style_alias.push(alias);
            });
            layer.style = style_names.join(",");
            layer.stylesalias = style_alias.join(",");
        }
      }

      //Fields
      layer.fieldsoptions = {};
      $("#frm-lis-fields option[value!='false']:selected").each(function (index, option) {
        var type = option.value;
        var field = $(option).closest(".fld").attr("data-field");
        var alias = $(option).closest(".fld").find(".fld-alias input").val();
        layer.fieldsoptions[field] = { name: field, alias: alias, type: type };
      });
      mv.writeFieldsOptions(layer);
    },

    form2xml: function () {
      var el = $(".layers-list-item.active");
      var layerid = el.attr("data-layerid");
      var themeid = $("#theme-edit").attr("data-themeid");
      function getLayerbyId(l) {
        return l.id === layerid;
      }
      var layer = config.themes[themeid].layers.find(getLayerbyId);
      var xml = mv.writeLayerNode(layer);
      $("#mod-codeview pre").text(xml);
    },

    writeLayerNode: function (l) {
      var padding = function (n) {
        return "\r\n" + " ".repeat(n);
      };
      var layer_parameters = {};
      //require parameters
      var require_parameters = ["id", "name", "type", "url"];
      require_parameters.forEach(function (p, i) {
        var value = l[p];
        if (p == "url") {
          value = mv.escapeXml(value);
        }
        layer_parameters[p] = [p, '="', value, '"'].join("");
      });
      //optional parameters
      var optional_parameters = [
        "tiled",
        "visible",
        "infoformat",
        "fields",
        "aliases",
        "style",
        "stylesalias",
        "styleurl",
        "filterstyle",
        "metadata",
        "metadata-csw",
        "attribution",
        "queryable",
        "searchable",
        "searchengine",
        "fusesearchkeys",
        "fusesearchresult",
        "secure",
        "useproxy",
        "filter",
        "sld",
        "legendurl",
        "scalemin",
        "scalemax",
        "featurecount",
        "infopanel",
        "opacity",
        "index",
        "styletitle",
        "dynamiclegend",
        "toplayer",
        "expanded",
        "exclusive",
        "showintoc",
        "index",
        "jsonfields",
      ];
      optional_parameters.forEach((param) => {
        if (l[param] == undefined) return;
        let value = l[param];

        if (["metadata", "metadata-csw", "legendurl"].includes(param)) {
          value = mv.escapeXml(value);
        }
        layer_parameters[param] = `${param}="${value}"`;
      });

      //more complexes parameters
      var attributefilter = "";
      if (l.attributefilter) {
        attributefilter = [
          'attributefilter="true"',
          'attributefield="' + l.attributefield + '"',
          'attributevalues="' + l.attributevalues + '"',
          'attributelabel="' + l.attributelabel + '"',
        ].join(" ");
        layer_parameters.attributefilter = attributefilter;
      }
      //template exception
      var template = "";
      if (l.useexternaltemplate && l.template) {
        template = "<template><![CDATA[" + l.template + "]]></template>";
      }
      if (l.templateurl && l.useexternaltemplate) {
        template = '<template url="' + l.templateurl + '" ></template>';
      } else if (l.useGeneratorTemplate && l.generatorTemplateUrl) {
        template = `<template url="${_conf.mviewer_instance}${_conf.conf_path_from_mviewer}${l.generatorTemplateUrl}"></template>`;
      } else if (l.useGeneratorTemplate && l.templateurl) {
        template = `<template url="${l.templateurl}"></template>`;
      } else if (!template && l.templateFromGenerator) {
        template = "<template><![CDATA[" + l.templateFromGenerator + "]]></template>";
      }

      var layer = [padding(8) + "<layer "];
      $.each(layer_parameters, function (prop, parameter) {
        layer.push(padding(12) + parameter);
      });
      layer.push(">");
      layer.push(template);
      layer.push(padding(8) + "</layer>");

      return layer.join("");
    },

    escapeXml: function (unsafe) {
      var rep = "";
      if (unsafe) {
        rep = unsafe.replace(/[<>&"]/g, function (c) {
          switch (c) {
            case "<":
              return "&lt;";
            case ">":
              return "&gt;";
            case "&":
              return "&amp;";
            case "'":
              return "&apos;";
            case '"':
              return "&quot;";
          }
        });
      }
      return rep;
    },

    search: function () {
      $("#search-message").text(mviewer.tr("msg.wait.search"));
      $("#search-message").show();

      mv.resetSearch();
      var providerType = $(".dropdown-menu li.active>a").attr("data-providertype");
      var url = $(".dropdown-menu li.active>a").attr("data-provider");
      var keyword = $("#input-ogc-filter").val();
      switch (providerType) {
        case "csw":
          var metadata_baseref = $(".dropdown-menu li.active>a").attr(
            "data-metadata-app"
          );
          ogc.cswSearch(url, keyword, metadata_baseref);
          break;

        case "wms":
          ogc.wmsSearch(url, keyword);
          break;

        case "wfs":
          //fdff
          break;
      }
    },

    parseTemplate: function (tpl) {
      var title = $(tpl).find(".title-feature").text().match("{{(.*)}}")[1];
      $("#frm-lis-fields .fld[data-field='" + title + "'] .fld-option select")
        .val("title")
        .trigger("change");
      var texts = [];
      var photos = [];
      var links = [];
      $(tpl)
        .find(".feature-text")
        .each(function (i, t) {
          var text = $(t).text().match("{{(.*)}}")[1];
          var alias = $(t).find("span").text().split(":")[0];
          texts.push({ text: text, alias: alias });
          $("#frm-lis-fields .fld[data-field='" + text + "'] .fld-option select")
            .val("text")
            .trigger("change");
          $("#frm-lis-fields .fld[data-field='" + text + "'] .fld-alias input").val(
            alias
          );
        });
      $(tpl)
        .find("img")
        .each(function (i, img) {
          var photo = $(img).attr("src").match("{{(.*)}}")[1];
          photos.push(photo);
          $("#frm-lis-fields .fld[data-field='" + photo + "'] .fld-option select")
            .val("image")
            .trigger("change");
        });
      $(tpl)
        .find("a")
        .each(function (i, a) {
          var link = $(a).attribute("href").match("{{(.*)}}")[1];
          var alias = $(a).text();
          links.push({ link: link, alias: alias });
          $("#frm-lis-fields .fld[data-field='" + link + "'] .fld-alias input").val(
            alias
          );
          $("#frm-lis-fields .fld[data-field='" + link + "'] .fld-option select")
            .val("link")
            .trigger("change");
        });
    },

    showHideQueryParameters: function (value) {
      if (value === "application/vnd.ogc.gml") {
        $("#query-parameters").addClass("visible");
      } else {
        $("#query-parameters").removeClass("visible");
      }
    },

    changeVisibleBaseLayer: function (visibleBaselayer) {
      $(".bl").removeClass("visible");
      $(".bl[data-layerid='" + visibleBaselayer + "']").addClass("visible");
    },

    changeGlobalSearch: function (value) {
      switch (value) {
        case "false":
          $("#searchelasticsearch_options").hide();
          break;
        case "elasticsearch":
          $("#searchelasticsearch_options").show();
          break;
      }
    },

    changeKeyWords: ({ value }) => {
      detailArea.innerHTML = value;
    },

    changeSearchLocalities: function (value) {
      switch (value) {
        case "false":
          $("#opt-searchl-url").hide();
          $("#opt-searchl-attribution").hide();
          $("#opt-searchlocalities-url").val("");
          $("#opt-searchlocalities-attribution").val("");
          break;
        case "ban":
          $("#opt-searchl-url").show();
          $("#opt-searchl-attribution").show();
          // TODO : need to get values from config
          $("#opt-searchlocalities-url").val("https://api-adresse.data.gouv.fr/search/");
          $("#opt-searchlocalities-attribution").val("Base adresse nationale (BAN)");
          break;
        case "custom":
          $("#opt-searchlocalities-url").val("");
          $("#opt-searchl-url").show();
          $("#opt-searchl-attribution").show();
          $("#opt-searchlocalities-attribution").val("");
          break;
      }
    },

    changeSearchEngine: function (value) {
      if (value === "fuse") {
        $("#fuse_options").show();
      } else {
        $("#fuse_options").hide();
      }
    },

    changeBaseMapType: ({ checked = false }) => {
      [...document.querySelectorAll(".custom-bg-type")].forEach((e) =>
        e.classList.add("d-none")
      );
      customBgCommons.classList.add("d-none");
      frmBlCustomType.value = "";
      if (checked) {
        appCustomBackgroundBlock.classList.remove("d-none");
      } else {
        appCustomBackgroundBlock.classList.add("d-none");
      }
    },

    selectBaseMapTypeValue: ({ value = "" }) => {
      // commons
      const commonsClass = customBgCommons.classList;
      [...document.querySelectorAll(".custom-bg-type")].forEach((e) =>
        e.classList.add("d-none")
      );
      if (value) {
        commonsClass.remove("d-none");
        $("#formCustomBaseThumb").value = "/img/basemaps/default.png";
        [...document.querySelectorAll(`.${value}`)].forEach((e) =>
          e.classList.remove("d-none")
        );
        addCustomBl.classList.remove("d-none");
        addCustomBl.classList.remove("d-none");
      } else {
        commonsClass.add("d-none");
        addCustomBl.classList.add("d-none");
      }
    },

    selectNewDataTypeValue: ({ value = "" }) => {
      [...document.querySelectorAll(".param-type")].forEach((e) =>
        e.classList.add("d-none")
      );
      if (value) {
        [...document.querySelectorAll("#commonParamType > div")].forEach((e) =>
          e.classList.remove("d-none")
        );
        [...document.querySelectorAll(`.${value}-type`)].forEach((e) =>
          e.classList.remove("d-none")
        );
      } else {
        [...document.querySelectorAll("#commonParamType > div")].forEach((e) =>
          e.classList.add("d-none")
        );
      }
    },

    changeLayerLegendInput: () => {
      var selected_styles = $("#frm-lis-styles input[type='checkbox']:checked").length;
      if (selected_styles > 1) {
        formLayerStyleTitle.classList.remove("d-none");
      } else {
        formLayerStyleTitle.classList.add("d-none");
        document.querySelectorAll("#frm-layer-styletitle").value = "";
      }
    },

    changeLayerLegend: function (value) {
      defaultClass = document.querySelector("#group-legend-default").classList;
      customClass = document.querySelector("#group-legend-custom").classList;
      switch (value) {
        case "custom":
          defaultClass.add("d-none");
          customClass.remove("d-none");
          document.querySelector("#frm-layer-dynamiclegend").checked = false;
          break;
        default:
          defaultClass.remove("d-none");
          customClass.add("d-none");
          document.querySelector("#frm-legendurl").value = "";
      }
    },

    changeLayerType: function (value) {
      switch (value) {
        case "wms":
          $("#frm-searchengine option[value='fuse']").attr("disabled", "disabled");
          break;
        case "geojson":
          $("#frm-searchengine option[value='fuse']").removeAttr("disabled");
          break;
      }
    },

    ajaxURL: function (url, el) {
      if (url.indexOf("&amp;") > 0) {
        url = $.parseHTML(url)[0].nodeValue;
      }
      var _proxy = _conf.proxy;
      // relative path
      if (url.indexOf("http") != 0) {
        return _conf.mviewer_instance + url;
      }
      // same domain
      else if (url.indexOf(location.protocol + "//" + location.host) === 0) {
        return url;
      } else if (_proxy) {
        return _proxy + encodeURIComponent(url);
      } else {
        return url;
      }
    },
    /**
     * Clean load application input file value
     * @param {any} element from HTML DOM
     */
    cleanLocalFileField: (element) => {
      document.getElementById("filebutton").value = "";
    },

    checkURL: function (e) {
      var ctrl = e.currentTarget;
      var url = ctrl.value;
      var expression =
        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
      var regexp = new RegExp(expression);
      if (regexp.test(url)) {
        $(this).css("color", "#009688");
      } else {
        $(this).css("color", "#ff9085");
      }
      return regexp.test(url);
    },

    createDublinCore(data) {
      let dataDate = data.date ? data.date : new Date().toISOString();

      var themes = [];
      var creator = _userInfo?.userName || "anonymous";
      var publisher = _userInfo?.groupSlugName || "anonymous";
      var description =
        document.querySelector("#createVersionInput")?.value || data.description;
      let relation = data?.relation || "";
      const UUID = data.id;
      const keyworkds = document.querySelector("#optKeywords")?.value;

      $.each(data.themes, function (id, theme) {
        themes.push(`<dc:subject>${theme.title}</dc:subject>`);
      });

      return `
                <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
                    <rdf:Description rdf:about="http://www.ilrt.bristol.ac.uk/people/cmdjb/">
                        <dc:title>${data.title}</dc:title>
                        <dc:creator>${creator}</dc:creator>
                        <dc:identifier>${UUID}</dc:identifier>
                        <dc:keywords>${keyworkds}</dc:keywords>
                        <dc:publisher>${publisher}</dc:publisher>
                        <dc:description>${description}</dc:description>
                        <dc:date>${dataDate}</dc:date>
                        <dc:relation>${relation}</dc:relation>
                        ${themes.length ? themes.join("\r\n") : ""}
                    </rdf:Description>
                </rdf:RDF>`;
    },

    parseWMC(xml) {
      newConfiguration();
      var wmc = $("ViewContext", xml);
      var themeid = createId("theme");
      var wmc_extent = {};
      wmc_extent.srs = $(wmc).find("General > BoundingBox").attr("SRS");
      wmc_extent.minx = parseInt($(wmc).find("General > BoundingBox").attr("minx"));
      wmc_extent.miny = parseInt($(wmc).find("General > BoundingBox").attr("miny"));
      wmc_extent.maxx = parseInt($(wmc).find("General > BoundingBox").attr("maxx"));
      wmc_extent.maxy = parseInt($(wmc).find("General > BoundingBox").attr("maxy"));
      var map_extent = ol.proj.transformExtent(
        [wmc_extent.minx, wmc_extent.miny, wmc_extent.maxx, wmc_extent.maxy],
        wmc_extent.srs,
        "EPSG:3857"
      );
      var title = $(wmc).find("General > Title").text() || $(wmc).attr("id");
      $("#opt-title").val(title).trigger("change");
      map.getView().fit(map_extent, { size: map.getSize() });
      addTheme(title, false, themeid, "fas fa-angle-right");
      $(wmc)
        .find("LayerList > Layer")
        .each(function () {
          // we only consider queryable layers
          if ($(this).attr("queryable") == "1") {
            var layer = {
              id: $(this).children("Name").text(),
              type: "wms",
              tiled: false,
              title: $(this).children("Name").text(),
              name: $(this).children("Name").text(),
              url: mv.escapeXml(
                $(this).find("Server > OnlineResource").attr("xlink:href")
              ),
              queryable: true,
              featurecount: 10,
              infopanel: "right-panel",
              infoformat: "text/html",
              metadata: mv.escapeXml(
                $(this).find("MetadataURL > OnlineResource").attr("xlink:href")
              ),
              "metadata-csw": mv.escapeXml(
                mv.gessCSW(
                  $(this).find("MetadataURL > OnlineResource").attr("xlink:href")
                )
              ),
              attribution: $(this).find("attribution").find("Title").text() || "",
              visible: $(this).attr("hidden") === "0" ? true : false,
              opacity: parseFloat($(this).find("opacity").text() || "1"),
              style: $(this).find("StyleList  > Style[current='1'] > Name").text(),
              sld: mv.escapeXml(
                $(this)
                  .find("StyleList  > Style[current='1'] > SLD > OnlineResource")
                  .attr("xlink:href")
              ),
            };
            var minscale = parseFloat($(this).find("MinScaleDenominator").text());
            var maxscale = parseFloat($(this).find("MaxScaleDenominator").text());
            if (!isNaN(minscale) || !isNaN(maxscale)) {
              layer.scale = {};
              if (!isNaN(minscale)) {
                layer.scale.min = minscale;
              }
              if (!isNaN(maxscale)) {
                layer.scale.max = maxscale;
              }
            }
            if (!layer.sld && $(this).find("StyleList  > Style > Name").length > 1) {
              layer.styles = $(this)
                .find("StyleList  > Style > Name")
                .map(function (id, name) {
                  return $(name).text();
                })
                .toArray()
                .join(",");
              layer.stylesalias = layer.styles;
            }
            config.themes[themeid].layers.push(layer);
          }
          var nb_layers = $(wmc).find("LayerList > Layer").length;
          $('.themes-list-item[data-themeid="' + themeid + '"]')
            .find(".theme-infos-layer")
            .text(nb_layers);
        });
    },

    manageDraftBadge(isPublish) {
      if (isPublish) {
        document.querySelector("#toolsbarStudio-unpublish").classList.remove("d-none");
        document.querySelector(".badge-publish").classList.remove("d-none");
        document.querySelector(".badge-draft").classList.add("d-none");
      } else {
        document.querySelector("#toolsbarStudio-unpublish").classList.add("d-none");
        document.querySelector(".badge-publish").classList.add("d-none");
        document.querySelector(".badge-draft").classList.remove("d-none");
      }
    },

    parseApplication(xml, idRecognized) {
      const app_identifier = idRecognized
        ? xml.getElementsByTagName("dc:identifier")[0]?.innerHTML
        : "";
      const app_keywords = xml.getElementsByTagName("dc:keywords")[0]?.innerHTML;
      const dateXml = idRecognized
        ? xml.getElementsByTagName("dc:date")[0]?.innerHTML
        : "";
      const relation = idRecognized
        ? xml.getElementsByTagName("dc:relation")[0]?.innerHTML
        : "";

      mv.manageDraftBadge(relation);

      let onlineCard = document.getElementById("onlineCard");
      if (_conf.is_php && onlineCard) {
        onlineCard.classList.add("d-none");
      }

      newConfiguration({
        id: app_identifier,
        isFile: true,
        date: dateXml,
        relation: relation,
      });
      var olscompletion = $(xml).find("olscompletion");
      // read xml proxy value
      var proxy = $(xml).find("proxy")[0] || "";
      optProxyUrl.value = proxy && proxy?.getAttribute ? proxy?.getAttribute("url") : "";
      [proxy].forEach(function (param, id) {
        // this parameters are not yet supported but must be saved for later
        if (param.length > 0) {
          savedParameters[param.selector] = param[0].outerHTML;
        }
      });
      if (olscompletion && olscompletion.attr("type")) {
        $("#frm-searchlocalities").val(olscompletion.attr("type")).trigger("change");
      }
      if (olscompletion && olscompletion.attr("url")) {
        $("#opt-searchlocalities-url").val(olscompletion.attr("url"));
      }
      if (olscompletion && olscompletion.attr("attribution")) {
        $("#opt-searchlocalities-attribution").val(olscompletion.attr("attribution"));
      }
      var elasticsearch = $(xml).find("elasticsearch");
      if (elasticsearch && elasticsearch.attr("url")) {
        $("#frm-globalsearch").val("elasticsearch").trigger("change");
        ["url", "geometryfield", "linkid", "doctype", "mode", "version"].forEach(
          function (param, id) {
            $("#opt-elasticsearch-" + param).val(elasticsearch.attr(param));
          }
        );
      }
      var searchparameters = $(xml).find("searchparameters");
      if (searchparameters && searchparameters.attr("bbox")) {
        $("#opt-elasticsearch-bbox").prop(
          "checked",
          searchparameters.attr("bbox") === "true"
        );
      }
      if (searchparameters && searchparameters.attr("features")) {
        $("#opt-searchfeatures").prop(
          "checked",
          searchparameters.attr("features") === "true"
        );
      }
      //Application
      var application = $(xml).find("application");

      // Add name app to wizard
      var title = application.attr("title");
      $("#nameAppBlock").empty();
      $("#nameAppBlock").append(title);

      // keywords

      detailArea.innerHTML = app_keywords;
      optKeywords.value = app_keywords;

      ["stats", "statsurl"].forEach(function (param, id) {
        // this parameters are not yet supported but must be saved for later
        var parameter = new Object();
        if (application.attr(param)) {
          parameter[param] = application.attr(param);
          savedParameters.application.push(parameter);
        }
      });
      [
        "title",
        "logo",
        "help",
        "style",
        "home",
        "favicon",
        "icon-help",
        "studio",
      ].forEach(function (value, id) {
        if (application.attr(value)) {
          $("#opt-" + value)
            .val(application.attr(value))
            .trigger("change");
        }
        if (value === "style") {
          updateTheme($("#opt-" + value)[0]);
        }
        if (value === "studio" && application.attr(value) != "false") {
          $("#opt-studio").prop("checked", true);
        }
      });

      [
        "exportpng",
        "zoomtools",
        "measuretools",
        "showhelp",
        "coordinates",
        "mouseposition",
        "geoloc",
        "initialextenttool",
        "togglealllayersfromtheme",
      ].forEach(function (value, id) {
        if (application.attr(value) && application.attr(value) === "true") {
          $("#opt-" + value).prop("checked", true);
        }
      });
      //Mapoptions
      var mapoptions = $(xml).find("mapoptions");
      ["projection", "maxzoom"].forEach(function (value, id) {
        if (mapoptions.attr(value)) {
          $("#opt-" + value).val(mapoptions.attr(value));
        }
      });
      map.getView().setCenter(mapoptions.attr("center").split(",").map(Number));
      map.getView().setZoom(parseInt(mapoptions.attr("zoom")));
      //BaseLayers
      var baseLayersMode = $(xml).find("baselayers").attr("style") || "default";
      $("#frm-bl-mode option[value='" + baseLayersMode + "']").prop("selected", true);
      var baselayers = $(xml).find("baselayer");
      //Reinitialisation
      $(".bl input").prop("checked", false);
      $("#frm-bl-visible option").attr("disabled", "disabled");
      baselayers.each(function (i, bl) {
        var id = $(bl).attr("id");
        var savedBaselayer = {};
        $.each(bl.attributes, function (i, attr) {
          if (attr.name !== "visible") {
            savedBaselayer[attr.name] = attr.nodeValue;
          }
        });
        if (_conf.baselayers[id]) {
          $("#frm-bl .bl[data-layerid='" + id + "'] input")
            .prop("checked", true)
            .trigger("change");
        } else {
          savedParameters.baselayers[id] = savedBaselayer;
          console.log("baselayer " + id + ": unknown");
        }
      });
      mv.showBaseLayers(savedParameters.baselayers, "custom-bl");
      $("#frm-bl .custom-bl input").prop("checked", true).trigger("change");
      var visibleBaselayer = $(xml).find('baselayer[visible="true"]').attr("id");
      $("#frm-bl-visible").val(visibleBaselayer).trigger("change");
      //tHEMES & layers
      var themePanel = $(xml).find("themes");
      if (themePanel.attr("mini") === "true") {
        $("#opt-mini").prop("checked", true);
      }
      var themes = $(xml).find("theme");
      themes.each(function (id, th) {
        addTheme(
          $(th).attr("name"),
          $(th).attr("collapsed") || true,
          $(th).attr("id"),
          $(th).attr("icon"),
          $(th).attr("url"),
          $(th).attr("layersvisibility")
        );
        var layers = $(th).find("layer");
        var counter = 0;
        layers.each(function (id, l) {
          counter += 1;
          var layer = {
            id: $(l).attr("id"),
            type: $(l).attr("type") || "wms",
            tiled: $(l).attr("tiled") === "true",
            scalemin: $(l).attr("scalemin"),
            scalemax: $(l).attr("scalemax"),
            title: $(l).attr("name"),
            name: $(l).attr("name"),
            url: $(l).attr("url"),
            queryable: $(l).attr("queryable") === "true",
            featurecount: $(l).attr("featurecount"),
            infopanel: $(l).attr("infopanel") || "right-panel",
            searchable: $(l).attr("searchable") === "true",
            searchengine: $(l).attr("searchengine"),
            fusesearchkeys: $(l).attr("fusesearchkeys"),
            fusesearchresult: $(l).attr("fusesearchresult"),
            secure: $(l).attr("secure") || "public",
            useproxy: $(l).attr("useproxy") === "true",
            infoformat: $(l).attr("infoformat"),
            metadata: $(l).attr("metadata"),
            "metadata-csw": $(l).attr("metadata-csw"),
            attribution: $(l).attr("attribution"),
            filter: $(l).attr("filter"),
            visible: $(l).attr("visible") === "true",
            opacity: $(l).attr("opacity"),
            template: $(l).find("template").text(),
            useexternaltemplate:
              ($(l).find("template") && $(l).find("template").text().length > 3) ||
              ($(l).find("template").attr("url") &&
                $(l).find("template").attr("url").length > 1),
            templateurl: false,
            fields: $(l).attr("fields"),
            fieldsoptions: false,
            aliases: $(l).attr("aliases"),
            style: $(l).attr("style"),
            styleurl: $(l).attr("styleurl"),
            filterstyle: $(l).attr("filterstyle"),
            stylesalias: $(l).attr("stylesalias"),
            sld: $(l).attr("sld"),
            legendurl: $(l).attr("legendurl"),
            attributefilter: $(l).attr("attributefilter") === "true",
            showintoc: $(l).attr("showintoc") === "true",
            exclusive: $(l).attr("exclusive") === "true",
            toplayer: $(l).attr("toplayer") === "true",
            expanded: $(l).attr("expanded") === "true",
            dynamiclegend: $(l).attr("dynamiclegend") === "true",
            styletitle: $(l).attr("styletitle"),
            index: $(l).attr("index"),
            jsonfields: $(l).attr("jsonfields"),
          };
          if (layer.attributefilter) {
            layer.attributefield = $(l).attr("attributefield");
            layer.attributelabel = $(l).attr("attributelabel");
            layer.attributevalues = $(l).attr("attributevalues");
          }
          if (layer.useexternaltemplate === true && $(l).find("template").attr("url")) {
            layer.templateurl = $(l).find("template").attr("url");
          }
          $("#frm-template").prop("checked", layer.useexternaltemplate);
          if (layer.fields && layer.aliases) {
            layer.fieldsoptions = {};
            $(layer.fields.split(",")).each(function (index, fld) {
              var type = "text";
              var alias = layer.aliases.split(",")[index];
              layer.fieldsoptions[fld] = { name: fld, alias: alias, type: type };
            });
          }
          config.themes[$(th).attr("id")].layers.push(layer);
        });
        if ($(th).attr("url")) {
          $(
            ".themes-list-item[data-themeid='" +
              $(th).attr("id") +
              "'] .theme-infos-layer"
          ).text("Ext.");
          var layersvisibility = $(th).attr("layersvisibility");
          $(".themes-list-item[data-themeid='" + $(th).attr("id") + "']").attr(
            "data-theme-layersvisibility",
            layersvisibility
          );
        } else {
          $(
            ".themes-list-item[data-themeid='" +
              $(th).attr("id") +
              "'] .theme-infos-layer"
          ).text(counter);
        }
      });

      $("#mod-importfile").modal("hide");
      console.groupEnd("parseApplication");
    },
    getVersionsByApp() {
      const id = config.id;
      fetch(`${_conf.api}/${id}/versions`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data) => {
          mv.getAppsTable(data);
        })
        .catch((err) => console.log(err));
    },
    showListApplications(data, search) {
      document.querySelector("#liste_applications").innerHTML = "";
      $("#liste_applications a").remove();
      var applications = [];
      var groups = [];
      var creators = [];

      // Get list of groups
      data.forEach(function (app) {
        if (app.group && groups.indexOf(app.group) == -1) {
          groups.push(app.group);
        }
      });

      $("#apps_group_list option").remove();
      $("#apps_group_list").append("<option>Tous</option>");
      $("#apps_group_list")
        .parent()
        .toggle(groups.length > 1);

      groups.forEach(function (group) {
        $("#apps_group_list").append("<option>" + group + "</option>");
      });

      // Get list of creators)
      data.forEach(function (app) {
        if (app.creator && creators.indexOf(app.creator) == -1) {
          creators.push(app.creator);
        }
      });
      // create Author select list
      if (apps_creator_list && !apps_creator_list.value) {
        $("#apps_creator_list option").remove();
        $("#apps_creator_list").append('<option value="">Tous</option>');
        $("#apps_creator_list")
          .parent()
          .toggle(creators.length > 1);
        let optionsAuthors = creators.map((creator) => `<option>${creator}</option>`);
        $("#apps_creator_list").append(optionsAuthors);
      }

      data
        .sort(function (map1, map2) {
          return map1.title > map2.title ? 1 : -1;
        })
        .forEach((app) => {
          // allow to filter according to PHP or Python backend
          let previewUrl = "";
          if (app.relation) {
            let filePath = `${mv.getAuthentUserInfos("groupSlugName")}/${app.relation}`;
            previewUrl = mv.produceUrl(filePath, true);
          } else {
            previewUrl = mv.produceUrl(app.url);
          }

          const navButtons = [
            {
              show: !_conf.is_php,
              html: `
                <li class="nav-item">
                    <a class="nav-link" href="#" data-id="${app.id}" data-url="${
                      app.url
                    }" onclick="window.open('${previewUrl}','mvs_vizualize')">${mviewer.tr(
                      "preview"
                    )}</a>
              </li>`,
            },
            {
              show: !_conf.is_php ? app.creator == _userInfo.userName : true,
              html: `
                <li class="nav-item">
                    <a class="nav-link" href="#" data-url="${
                      _conf.mviewer_instance + (app.link || app.url)
                    }" data-group="${
                      app.group
                    }" onclick="loadApplicationParametersFromRemoteFile(this.attributes[\'data-url\'].value)">${mviewer.tr(
                      "modify"
                    )}</a>
                </li>`,
            },
            {
              show: !_conf.is_php && app.creator == _userInfo.userName,
              html: `
                <li class="nav-item">
                    <a class="nav-link" href="#" data-id="${
                      app.id
                    }" data-bs-dismiss="modal" onclick="showAlertDelAppFromList(this.attributes[\'data-id\'].value)">${mviewer.tr(
                      "delete"
                    )}</a>
                </li>`,
            },
          ];

          let badgeLabel = app.relation ? mviewer.tr("publish") : mviewer.tr("draft");
          let badgeColor = app.relation ? "badge-publish" : "badge-draft";
          let badge = _conf.is_php
            ? ""
            : `<span class="badge ${badgeColor}">${badgeLabel}</span>`;
          const items = `
                    <div class="list-group-item">
                            <div class="row">
                            <div class="col-md-6 liste_applications_info">
                                <h5 class="list-group-item-heading">${
                                  app.title
                                } ${badge} </h5> 
                                <div class="app-subjects ${
                                  !app.subjects ? "d-none" : ""
                                }">Thématiques&nbsp;: ${app.subjects}</div>
                                <div class="app-group ${
                                  !app.group ? "d-none" : ""
                                }">Groupe&nbsp;: ${app.group}</div>
                                <div class="app-subjects ${
                                  !app.id ? "d-none" : ""
                                }">Identifiant&nbsp;: ${app.id}</div>
                                <div class="app-subjects ${
                                  !app.subjects ? "d-none" : ""
                                }">Mots clés&nbsp;: ${app.keywords}</div>
                                <div class="app-creator ${
                                  !app.creator ? "d-none" : ""
                                }">Auteur&nbsp;: ${app.creator}</div>
                                <div class="app-date">Date&nbsp;: ${app.date}</div>
                            </div>
                            <div class="col-md-6 d-flex align-items-center">
                                <ul class="nav">
                                    ${navButtons
                                      .filter((x) => x.show)
                                      .map((x) => x.html)
                                      .join("")}
                                </ul>
                            </div>
                        </div>
                    </div>`;
          applications.push(items);
        });
      if (!applications.length && search) {
        document.querySelector("#liste_applications").innerHTML = `
            <div class="text-center p-5">
                <h3>
                    <i class="ri-emotion-sad-line"></i>
                    <p>${mviewer.tr("noresult")}</p>
                </h3>
            </div>`;
      }
      if (!applications.length && !search) {
        document.querySelector("#liste_applications").innerHTML =
          `<div class="text-center p-5">
                    <h3>
                        <i class="ri-eye-off-line"></i>
                        <p>${mviewer.tr("load.app.any")}</p>
                    </h3>
                </div>`;
      }
      $("#liste_applications").append(applications);
      // can't delete all with Python backend
      // delete all is available with first PHP backend only
      if (_conf.is_php) {
        document.querySelector("#deleteAllBtn").classList.remove("d-none");
      } else {
        document.querySelector("#deleteAllBtn").classList.add("d-none");
      }
    },
    getListeApplications(search = "") {
      // default python backend
      let url = `${_conf.api}?search=${search}`;
      // if backend is PHP
      if (_conf?.is_php && _conf?.php?.list_service) {
        if (document.querySelector("#searchBydescriptionInput")) {
          document.querySelector("#searchBydescriptionInput").remove();
        }
        // use php url file
        url = _conf.php.list_service;
      }
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .catch((detail) => {
          console.error("map files list retrieval from mviewerstudio backend failed", {
            detail: detail,
          });
        })
        .then((data) => {
          mv.showListApplications(data, search);
        });
    },

    gessCSW(metadata_url) {
      if (metadata_url && metadata_url.search("geonetwork") > 1) {
        var mdid = metadata_url.split("#/metadata/")[1];
        return (
          metadata_url.substring(0, metadata_url.search("geonetwork")) +
          "geonetwork/srv/eng/csw?SERVICE=CSW&VERSION=2.0.2&REQUEST=GetRecordById&elementSetName=full&ID=" +
          mdid
        );
      }
    },

    cleanURL(url) {
      var url2 = decodeURIComponent(url).split("?")[0];
      return url2;
    },

    filterApplications() {
      var filter_groups = $("#apps_group_list").prop("selectedIndex") > 0;
      var filter_creators = $("#apps_creator_list").prop("selectedIndex") > 0;
      var group = $("#apps_group_list option:selected").text();
      var creator = $("#apps_creator_list option:selected").text();

      $("#liste_applications a").each(function (index, el) {
        var app_creator = $(this).attr("data-creator");
        var app_group = $(this).attr("data-group");

        var app_group_ok = !filter_groups || app_group == group;
        var app_creator_ok = !filter_creators || app_creator == creator;

        $(this).toggle(app_group_ok && app_creator_ok);
      });
    },

    validateXML(value) {
      var isXml;
      try {
        xml = $.parseXML(value);
        isXml = true;
      } catch (e) {
        isXml = false;
      }
      return isXml;
    },

    updateUserGroupList(data) {
      var userGroups = data.user_groups;
      var userGroupsAsHtml = [];

      userGroups.forEach(function (userGroup, index) {
        var _userRole = userGroup.user_role;
        switch (_userRole) {
          case "referent":
            _userRole = "auth.group.type";
            break;
          case "contributor":
            _userRole = "auth.group.role";
            break;
        }

        const userFullName = `${data.first_name} ${data.last_name}`;

        var items = `
                <a href="#" class="list-group-item"
                    onclick="$(\'#mod-groupselection\').modal(\'hide\');
                        mv.updateUserInfo({
                            userName: ${data.user_name},
                            name: ${userFullName},
                            groupSlugName: ${userGroup.slug_name},
                            groupFullName: ${userGroup.full_name.replace(/\'/g, "\\'")}
                        });">
                    <h4 class="list-group-item-heading">${userGroup.full_name}</h4>
                    <div class="row small">
                        <div class="col-md-6">${mviewer.tr("auth.group.type")}&nbsp;: ${
                          userGroup.group_type
                        }</div>
                        <div class="col-md-6">${"auth.group.role"}&nbsp;: ${mviewer.tr(
                          _userRole
                        )}</div>
                    </div>
                </a>`;

        userGroupsAsHtml.push(items.join(" "));
      });

      $("#user_group_list").append(userGroupsAsHtml);
    },

    /**
     *
     * @param {object} infos with keys userName, name, groupSlugName, groupFullName
     */
    updateUserInfo(infos) {
      _userInfo = { ..._userInfo, ...infos };
    },

    getAuthentUserInfos(key) {
      return key ? _userInfo[key] : _userInfo;
    },

    onInputVersion: (el) => {
      if (el.value) {
        document
          .querySelector("#mod-appversions .modal-footer")
          .classList.remove("d-none");
        document.querySelector("#createVersionInput").classList.remove("is-invalid");
        document.querySelector("#createVersionInput").classList.add("is-valid");
      } else {
        document.querySelector("#mod-appversions .modal-footer").classList.add("d-none");
        document.querySelector("#createVersionInput").classList.add("is-invalid");
        document.querySelector("#createVersionInput").classList.remove("is-valid");
      }
    },

    showCreateVersionInput: () => {
      document.querySelector("#appsListTable").innerHTML = "";
      $("#appsListTable").append(
        `<div class="col-md-12" id="groupVersionInput">
                    <div class="form-group">
                        <label for="createVersionInput" i18n="version.comment" class="form-label">${mviewer.tr(
                          "version.comment"
                        )}</label>
                        <input required oninput="mv.onInputVersion(this)" class="form-control is-invalid" id="createVersionInput" type="text" placeholder="${mviewer.tr(
                          "version.comment.ph"
                        )}">
                    </div>
                </div>`
      );
    },
    cleanVersionHistoryUI: () => {
      document.querySelector("#appsListTable").innerHTML = "";
    },
    showAlertChangeVersion: (id, version) => {
      genericModalContent.innerHTML = "";
      genericModalContent.innerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title" i18n="modal.exit.title">Attention</h5>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <p i18n="modal.restore.explain">${mviewer.tr(
                      modal.restore.explain
                    )}</p>
                    <p><strong>${mviewer.tr("modal.restore.confirm")}</strong></p>
                    <a class="cardsClose save-close zoomCard" data-bs-dismiss="modal" onclick="mv.changeVersion('${id}', '${version}', true)">
                        <i class="ri-save-line"></i>
                        <span i18n="modal.exit.save">${mviewer.tr(
                          "modal.restore.app"
                        )}</span>
                    </a>
                    <a class="cardsClose notsave-close zoomCard" data-bs-target="#mod-appversions" data-bs-toggle="modal">
                        <i class="bi bi-x-circle"></i>
                        <span i18n="modal.restore.continue">${mviewer.tr(
                          "modal.restore.continue"
                        )} </span>
                    </a>
                    <a class="returnConf-close" data-bs-target="#mod-appversions" data-bs-toggle="modal" aria-label="Close">
                      <i class="ri-arrow-left-line"></i>
                        <span>${mviewer.tr("modal.restore.back")}
                        </span>
                    </a>
                </div>
            `;
    },
    createVersion: (id) => {
      id = id || config?.id;
      if (!id) return;

      const conf = getConfig();
      document.querySelector("#appsListTable").innerHTML = "";
      fetch(`${_conf.api}`, {
        method: "PUT",
        headers: {
          "Content-Type": "text/xml",
        },
        body: conf.join(""),
      })
        .then((r) => {
          if (!r.ok) {
            return Promise.reject(r);
          } else {
            fetch(`${_conf.api}/${id}/version`, { method: "POST" })
              .then((r) => {
                return r.ok ? r.json() : Promise.reject(r);
              })
              .then((r) => {
                console.log(r);
                mv.refreshTable();
              })
              .catch((err) => alertCustom(mviewer.tr("alert.create.state"), "danger"));
          }
        })
        .catch((err) => alertCustom(mviewer.tr("alert.create.save"), "danger"));
      document.querySelector("#mod-appversions .modal-footer").classList.add("d-none");
    },
    changeVersion: (id, version, asNew = false) => {
      fetch(`${_conf.api}/${id}/version/${version}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ as_new: asNew }),
      })
        .catch((err) => console.log(err))
        .then((r) => r.json())
        .then((r) => {
          document.querySelector("#mod-appversions .modal-header .close").click();
          showHome();
          // display
          const url = `${_conf.mviewer_instance}${_conf.conf_path_from_mviewer}${
            mv.getApps().config.url
          }`;
          loadApplicationParametersFromRemoteFile(url);
        });
    },
    previewVersion: (id, version) => {
      fetch(`${_conf.api}/${id}/version/${version}/preview`, { method: "GET" })
        .catch((err) => console.log(err))
        .then((r) => r.json())
        .then((r) => {
          const url = mv.produceUrl(r.file);
          window.open(url, "mvs_vizualize");
        });
    },
    formatDate: (value) =>
      moment(value, "YYYY-MM-DD-HH-mm-ss").format("DD/MM/YYYY - HH:mm:ss"),
    formatPublishText: (value, row) => {
      let badge = "";
      if (row.isPublish) {
        badge = `<span class="badge badge-publish">${mviewer.tr("publish")}</span>`;
      }
      if (row.isAfterPublish || !config.relation) {
        badge = `<span class="badge badge-draft">${mviewer.tr("draft")}</span>`;
      }

      let contentText = value.includes("publication")
        ? mviewer.tr("publish.message")
        : value;
      contentText = value.includes("draft") ? mviewer.tr("unpublish.message") : value;
      return `${badge} ${contentText}`;
    },
    actionVersionFormatter: (value, row, index) => {
      const flag = `<a id="versionVersionIcon"><i class="ri-price-tag-3-line"></i></a>`;
      return `
                <a id="versionPreviewLink" onclick="mv.previewVersion('${config.id}', '${
                  row.id
                }')"><span class="custom-tooltip-table"><i class="ri-eye-line"></i><span>${mviewer.tr(
                  "release.preview"
                )}</span></span></a>
                <a id="versionAsNewLink" data-bs-target="#genericModal" data-bs-toggle="modal" onclick="mv.showAlertChangeVersion('${
                  config.id
                }', '${
                  row.id
                }', true)"><span class="custom-tooltip-table"><i class="ri-arrow-go-back-fill"></i><span>${mviewer.tr(
                  "release.restore"
                )}</span></span></a>
                ${row?.version ? flag : ""}
            `;
    },
    appsTableToolbar: () => {
      const toolbar = document.querySelector(".toolbar");
      if (toolbar) toolbar.remove();
      const btns = [
        {
          text: mviewer.tr("Marquer cette version"),
          icon: "bi bi-plus-lg",
          btnClass: "btn btn-info",
          id: "createVersionBtn",
          click: "mv.showCreateVersionInput()",
        },
        {
          text: mviewer.tr("modal.release.reload"),
          icon: "ri-refresh-line",
          btnClass: "btn btn-info",
          id: "createVersionBtn",
          click: "mv.refreshTable()",
        },
      ];
      return `
            <div class="toolbar" style="display:inline-flex">
                ${btns
                  .map(
                    (b) => `
                    <button id="${b.id}" class="${b.btnClass} ml-2" onclick="${
                      b.click || ""
                    }">
                        <i class="${b.icon}"></i>
                        <span>${b.text}</span>
                    </button>
                `
                  )
                  .join("")}
                <div class="custom-control custom-switch mt-2 ml-2" id="btnSwitchHistoryTagsOnly">
                    <input type="checkbox" onchange="mv.showTagsOnly(this)" class="custom-control-input" id="inputSwitchHistoryTagsOnly" ${
                      config?.showTags ? "checked" : ""
                    }>
                    <label class="custom-control-label" for="inputSwitchHistoryTagsOnly"><span>${mviewer.tr(
                      "release.show.tags"
                    )}</span></label>
                </div>
            </div>
            `;
    },
    showTagsOnly: (el) => {
      config.showTags = el.checked;
      mv.refreshTable();
    },
    refreshTable: () => {
      document.querySelector("#appsListTable").innerHTML = "";
      mv.getVersionsByApp();
    },
    currentCommitStyle: (row) => {
      return {
        classes: config.relation && row.publishedCommit && "publishedVersion",
      };
    },
    currentPublishedStyle: (row) => {
      return {
        classes: row.current && "currentVersion",
      };
    },
    getAppsTable: (apps) => {
      if (document.querySelector("#tableVersions")) {
        document.querySelector("#appsListTable").innerHTML = "";
      }
      let data = apps.versions.commits;
      if (config.showTags) {
        data = data.filter((d) => d.tag);
      }
      const lastPublished = data.filter((v) => v.publication == "true")[0];
      data = data.map((v, i) => {
        let rowsData = {
          number: i,
          id: v.id,
          version: v?.tag,
          description: v.message,
          author: v.author,
          date: v.date,
          isPublish: false,
          isAfterPublish: false,
          publishedCommit: false,
          current: v.current
            ? '<i class="ri-check-line" style="font-size: 20px"></i>'
            : "",
        };
        if (config.relation && lastPublished) {
          const lastPublish = moment(lastPublished.date, "YYYY-MM-DD-HH-mm-ss");
          const toCompareDate = moment(rowsData.date, "YYYY-MM-DD-HH-mm-ss");
          rowsData.isPublish = toCompareDate.isSame(lastPublish);
          rowsData.isAfterPublish = toCompareDate.isAfter(lastPublish);
          rowsData.publishedCommit = rowsData.id === lastPublished.id;
        }
        return rowsData;
      });
      mv.getApps = () => apps;
      const tableDom = `
                ${mv.appsTableToolbar()}
                <table
                    id="tableVersions"
                    data-toggle="table"
                    data-search="true"
                    data-pagination="true"
                    data-toolbar=".toolbar"
                    data-silent-sort="false"
                    data-row-style="mv.currentCommitStyle"
                >
                    <thead>
                        <tr>
                        <th data-field="current">${mviewer.tr("release.active")}</th>
                        <th
                            data-field="description"
                            data-formatter="mv.formatPublishText"
                        >Description</th>
                        <th
                            data-field="date"
                            data-formatter="mv.formatDate"
                            data-sortable="true"
                        >
                            ${mviewer.tr("release.date")}
                        </th>
                        <th 
                            class="versionActionsCol"
                            data-field="version"
                            data-formatter="mv.actionVersionFormatter"
                        >
                        ${mviewer.tr("release.actions")}
                        </th>
                        </tr>
                    </thead>
                </table>
            `;
      $("#appsListTable").append(tableDom);
      const $table = $("#tableVersions");
      $table.bootstrapTable({ data: data });
    },
    onSearchApp: ({ value }) => {
      document.getElementById("liste_applications").innerHTML = "";
      if (value) {
        return mv.getListeApplications(value);
      }
      return mv.getListeApplications(value);
    },
    // Thematic layers providers
    getThemeTable: function (theme) {
      if (document.querySelector("#tableTheme")) {
        document.querySelector("#themesListTable").innerHTML = "";
      }
      let data = theme;
      function filterThema(obj) {
        if (obj.observations === "OK" && obj.id !== "") {
          return true;
        }
        return false;
      }
      data = data.filter(filterThema);
      data = data.map((v, i) => ({
        number: i,
        id: v.id,
        title: v.title,
        description: v.description,
        publisher: v.publisher,
        xml: v.xml,
      }));
      mv.getApps = () => theme;
      const tableDom = `                
                <table
                    id="tableThemaExt"
                    data-toggle="table"
                    data-search="true"
                    data-pagination="true"
                    data-click-to-select="true"
                    data-page-size="5"
                    data-row-attributes="mv.rowAttributesThematicExt"
                >
                    <thead>
                        <tr class="paddingTable">
                            <th data-field="state" data-checkbox="true" class="checkCustom custom-control custom-checkbox"></th>
                            <th data-field="title" class="titleThema">${mviewer.tr(
                              "table.title"
                            )}</th>
                            <th data-field="description" class="descriptionThema">${mviewer.tr(
                              "table.description"
                            )}</th>
                            <th data-field="publisher" class="publisherThema">${mviewer.tr(
                              "table.publisher"
                            )}</th>
                            <th data-field="identifier" class="urlThema">${mviewer.tr(
                              "table.identify"
                            )}</th>
                            <th data-field="id" class="idThema">${mviewer.tr(
                              "table.id"
                            )}</th>
                        </tr>
                    </thead>
                </table>
            `;
      $("#themesListTable").append(tableDom);
      const $table = $("#tableThemaExt");
      $table.bootstrapTable({ data: data });
    },
    rowAttributesThematicExt: (row) => {
      return {
        "data-theme-id": row.id,
        "data-theme-label": row.title,
        "data-url": row.xml,
      };
    },
    nameNormalizer: (str = "") => {
      // return str.replace(/[^A-Z0-9]/ig, "_").toLowerCase()
      // Remplacer les accents
      str = str.replace(/[àáâãäå]/g, "a");
      str = str.replace(/[ç]/g, "c");
      str = str.replace(/[èéêë]/g, "e");
      str = str.replace(/[ìíîï]/g, "i");
      str = str.replace(/[ñ]/g, "n");
      str = str.replace(/[òóôõö]/g, "o");
      str = str.replace(/[ùúûü]/g, "u");
      str = str.replace(/[ýÿ]/g, "y");

      // Remplacer les caractères spéciaux et les espaces par un tiret bas (_)
      str = str.replace(/[^a-zA-Z0-9_]/g, "_");
      return str.toLowerCase();
    },
    showNamePublishModal: (id, name = "", conflict = false) => {
      if (config.relation) {
        return mv.publish(config.id, config.relation);
      }
      const defaultName = name
        ? mv.nameNormalizer(name)
        : mv.nameNormalizer(document.querySelector("#opt-title").value);
      const publishAppModal = new bootstrap.Modal("#genericModal");
      const question = conflict
        ? mviewer.tr("publish.name.exist")
        : mviewer.tr("publish.name.wich");
      genericModalContent.innerHTML = "";
      genericModalContent.innerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title">${mviewer.tr("publish.custom")}</h5>
                    <button type="button" onclick="" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <p>
                        <strong>${question}</strong>
                    </p>
                    <!-- input-->
                    <div class="form-group">
                        <label for="relationPublishName">${mviewer.tr(
                          "publish.name.new"
                        )}</label>
                        <input maxlength="20" minlength="3" value="${defaultName}" type="text" class="form-control" id="relationPublishName">
                    </div>
                    <!-- buttons-->
                    <p><strong>${mviewer.tr("modal.publish.action.request")}</strong></p>
                    <a id="sendPublishApp" class="cardsClose save-close zoomCard" data-bs-dismiss="modal" onclick="mv.publish('${id}', mv.nameNormalizer(document.getElementById('relationPublishName')?.value))">
                        <i class="ri-tools-fill"></i>
                        <span i18n="tabs.publication.publish_title">${mviewer.tr(
                          conflict
                            ? "tabs.publication.publish_retry"
                            : "tabs.publication.publish_title"
                        )}</span>
                    </a>
                    <a class="cardsClose notsave-close zoomCard" onclick="" data-bs-dismiss="modal">
                        <i class="ri-home-2-line"></i>
                        <span i18n="close">${mviewer.tr("close")}</span>
                    </a>
                    <a class="returnConf-close" data-bs-target="#genericModal" data-bs-toggle="modal" aria-label="Close"><i class="ri-arrow-left-line"></i> <span i18n="modal.exit.previous">${mviewer.tr(
                      "modal.exit.previous"
                    )}</span></a>                    
                </div>
            `;
      publishAppModal.show();
    },
    showPublishModal: (shareLink = "", iframeLink = "", draftLink = "") => {
      const publishModal = new bootstrap.Modal("#genericModal");
      genericModalContent.innerHTML = "";
      genericModalContent.innerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title" i18n="modal.publish.title">${mviewer.tr(
                      "modal.publish.title"
                    )}</h5>
                    <button type="button" onclick="mv.refreshOnPublish('${draftLink}')" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <p>
                        <strong>
                            ${mviewer.tr("publish.available.app")}
                        </strong>    
                    </p>
                    <!-- input-->
                    <div class="form-group">
                        <label for="publishShareLink">${mviewer.tr(
                          "publish.available.share"
                        )}</label>
                        <input readonly value="${shareLink}" type="text" class="form-control" id="publishShareLink">
                    </div>
                    <div class="form-group">
                        <label for="publishIframeLink">${mviewer.tr(
                          "publish.iframe"
                        )}</label>
                        <input readonly value='${iframeLink}' type="text" class="form-control" id="publishIframeLink">
                    </div>
                    <!-- buttons-->
                    <p><strong>${mviewer.tr("publish.choice")}</strong></p>
                    <a class="cardsClose save-close zoomCard" data-bs-dismiss="modal" onclick="mv.refreshOnPublish('${draftLink}')">
                        <i class="ri-tools-fill"></i>
                        <span i18n="modal.exit.nextChange">${mviewer.tr(
                          "modal.exit.nextChange"
                        )}</span>
                    </a>
                    <a class="cardsClose notsave-close zoomCard" onclick="showHome()" data-bs-dismiss="modal">
                        <i class="ri-home-2-line"></i>
                        <span i18n="modal.exit.goHome">${mviewer.tr(
                          "modal.exit.goHome"
                        )}</span>
                    </a>
                    <a class="returnConf-close" onclick="mv.refreshOnPublish('${draftLink}')" data-bs-target="#genericModal" data-bs-toggle="modal" aria-label="Close"><i class="ri-arrow-left-line"></i> <span i18n="modal.exit.previous">${mviewer.tr(
                      "modal.exit.previous"
                    )}</span></a>                    
                </div>
            `;
      publishModal.show();
    },
    publish: (id, name = "", message = "") => {
      const conf = getConfig();
      if (!conf || !mv.validateXML(conf.join(""))) {
        return alertCustom(mviewer.tr("msg.xml_doc_invalid"), "danger");
      }
      if (!id) {
        return alertCustom(mviewer.tr("publis.alert.id"), "danger");
      }
      if (!config.isFile) {
        return alertCustom(mviewer.tr("publish.save.first"), "danger");
      }
      let url = `${_conf.api}/${id}/publish/${name}`;
      let params = new URLSearchParams();
      if (!message) {
        params.set("message", message || mviewer.tr("publish.message"));
      }
      params.set("instance", _conf.mviewer_instance);

      fetch(`${url}?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: conf.join(""),
      })
        .then((r) => {
          return r.ok ? r.json() : Promise.reject(r);
        })
        .then((data) => {
          if (!_conf?.publish_url) {
            return alertCustom(
              mviewer.tr(
                "Configuration manquante pour la publication. Veuillez contacter un administrateur."
              ),
              "danger"
            );
          }
          if (!data.online_file) {
            return alertCustom(mviewer.tr("publish.config.missing"), "danger");
          }
          return data;
        })
        .then((data) => {
          const shareLink = mv.produceUrl(data.online_file, true);
          const iframeLink = `<iframe allowFullScreen style="border: none;" height="600" width="800" src="${shareLink}"></iframe>`;
          mv.showPublishModal(shareLink, iframeLink, data.draft_file);
          alertCustom(mviewer.tr("publish.alert.success"), "success");
        })
        .catch((err) => {
          if (err.status == 409) {
            mv.showNamePublishModal(id, name, true);
          } else {
            alertCustom(mviewer.tr("publish.alert.error"), "danger");
          }
        });
    },
    refreshOnPublish: (file) => {
      const url = _conf.mviewer_instance + file;
      loadApplicationParametersFromRemoteFile(url);
    },
    unpublish: (id) => {
      fetch(`${_conf.api}/${id}/publish/${config.relation}`, { method: "DELETE" })
        .then((r) => {
          return r.ok ? r.json() : Promise.reject(r);
        })
        .then((r) => {
          alertCustom(mviewer.tr("modal.unpublish.title"), "warning");
          mv.refreshOnPublish(r?.draft_file);
          document.querySelector("#toolsbarStudio-unpublish").classList.add("d-none");
          [".badge-publish", "#toolsbarStudio-unpublish"].forEach((e) => {
            document.querySelector(e).classList.add("d-none");
          });
          [".badge-draft"].forEach((e) => {
            document.querySelector(e).classList.remove("d-none");
          });
        })
        .catch((err) => alertCustom(mviewer.tr("publish.alert.error"), "danger"));
    },
    /**
     * Will be usefull to create short or long URL from file path and config
     * @param {string} filepath path from org directory (e.g [org]/[file_name].xml)
     * @param {boolean} isPublish set true if application was publish
     * @param {any} newConf object to override _conf.mviewer_short_url params
     * @returns
     */
    produceUrl: (filepath, isPublish = false, newConf = {}) => {
      let url = "";
      // override config from params
      let params = _conf?.mviewer_short_url || {};
      params = { ...params, ...newConf };

      if (params && params?.used) {
        var filePathWithNoXmlExtension = "";
        //Get path from mviewer/apps e.g store for mviewer/apps/store
        const target = isPublish ? params.public_folder : params.apps_folder;
        if (target) {
          filePathWithNoXmlExtension = [target, filepath].join("/");
        } else {
          filePathWithNoXmlExtension = filepath;
        }
        if (filePathWithNoXmlExtension.endsWith(".xml")) {
          filePathWithNoXmlExtension = filePathWithNoXmlExtension.substring(
            0,
            filePathWithNoXmlExtension.length - 4
          );
        }
        return (url = `${_conf.mviewer_instance}#${filePathWithNoXmlExtension}`);
      }
      // Build a classic URL for the map
      if (isPublish) {
        if (filepath.endsWith(".xml")) {
          // to avoid useless .xml
          filepath = filepath.substring(0, filepath.length - 4);
        }
        return _conf.publish_url.replace("{{config}}", filepath);
      } else {
        return (
          _conf.mviewer_instance + "?config=" + _conf.conf_path_from_mviewer + filepath
        );
      }
    },
    openTemplateGenerator: () => {
      // not compliant with php backend
      if (_conf?.is_php) {
        liTemplateArea.classList.add("d-none");
        dismissTemplateGeneratorMsg.classList.remove("d-none");
        return;
      }
      if (mv.templateGenerator) {
        mv.destroyTemplateGenerator();
      }
      let layerId = $(".layers-list-item.active").attr("data-layerid");
      const data = config.temp.layers[layerId]?.features;
      if (!data) {
        document.getElementById("templateGeneratorEdit").classList.add("d-none");
        document.addEventListener("wfsFeaturesReady", () => {
          mv.templateGenerator = new mv.templateGeneratorComponent(
            config.temp.layers[layerId]?.features
          );
          document.getElementById("templateGeneratorEdit").classList.remove("d-none");
        });
      } else {
        mv.templateGenerator = new mv.templateGeneratorComponent(data);
        document.getElementById("templateGeneratorEdit").classList.remove("d-none");
      }
    },
    createDispatchEvent: (name, detail) => {
      const newEvent = new CustomEvent(name, {
        detail: detail,
      });
      document.dispatchEvent(newEvent);
    },
    destroyTemplateGenerator: () => {
      mv.templateGenerator.clean();
      mv.templateGenerator = undefined;
      delete mv.templateGenerator;
    },

    /**
     * source : https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
     * @returns uuid
     */
    uuidv4: () => {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(
          16
        )
      );
    },

    saveTemplate: (layerId, content) => {
      const url = `${_conf.api}/${config.id}/template/${layerId}`;
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: content,
      });
    },
    appExists: (id, cb) => {
      // control if ID already exists in studio register
      fetch(`${_conf.api}/${id}/exists`)
        .then((r) => r.json())
        .then((r) => cb(r));
    },
    saveIfPossible: () => {
      let appTitle = document.getElementById("opt-title").value;
      if (appTitle) {
        // save
        saveStudio();
      } else if (!appTitle) {
        document.getElementById("appWizzardTab").click();
        $("#opt-title").addClass("is-invalid");
        alertCustom(mviewer.tr("msg.preview_no_title"), "danger");
      }
    },
    saveIfNecessary: () => {
      mv.appExists(config.id, (r) => {
        if (!r.exists) {
          mv.saveIfPossible();
        }
      });
    },
    saveAllThemes: () => {
      saveTheme();
      saveStudio();
    },
  };
})();

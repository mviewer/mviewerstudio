var mv = (function () {

    var _wmsLayerProperties = {
        "layerType": "wms",
        "tiled": true,
        "url": "",
        "infoFormat": "text/html"
    };

    function uuid(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    var _userInfo = {
        userName: "",
        name: "",
        groupSlugName: "",
        groupFullName: ""
    };

    _layerProperties =  function (wms_capabilities) {
           //todo
    };

    const getLayerById = (layerid = null) => {
        if (!layerid) {
            var el = $(".layers-list-item.active");
            layerid = el.attr("data-layerid");
        }
        var themeid = $("#theme-edit").attr("data-themeid");   
        return config.themes[themeid].layers.find(l => l.id === layerid);
    }

    return {

        uuid: uuid,

        setDefaultLayerProperties: function (defaultParams) {
            if (defaultParams.info_format)
                _wmsLayerProperties.infoFormat = defaultParams.info_format;
            if (defaultParams.layer_tiled)
                _wmsLayerProperties.tiled = defaultParams.tiled;
            if (defaultParams.layer_type)
                _wmsLayerProperties.layerType = defaultParams.layer_type;

        },

        showCSWResults: function (results) {
            var html = [];
            $.each(results, function (index, result) {
                var _abstract =
                    (result.abstract.length > 200) ? result.abstract.substring(0, 200) + '...' : result.abstract;
                var div = [];
                div.push('<div class="ogc-result csw-result col-sm-12 col-md-12" data-title="' + result.title + '"');
                div.push(' data-layerid="' + result.layerid + '"');
                if (result.metadata) {
                    div.push(' data-metadata="' + result.metadata + '"');
                }
                if (result['metadata-csw']) {
                    div.push(' data-metadata-csw="' + result['metadata-csw'] + '"');
                }
                if (result.wms) {
                    div.push(' data-url="' + result.wms + '"');
                }
                if (result.attribution) {
                    div.push(' data-type="wms"');
                }
                div.push('>');
                div.push(
                    '<div class="checkbox list-group-item">',
                    '<div class="custom-control custom-checkbox">',
                    '<input type="checkbox" class="custom-control-input" id="' + result.layerid + '-ck">',
                    '<label class="custom-control-label" for="' + result.layerid + '-ck">',
                    '<span style="font-weight:600;">' + result.title + '</span></br>',
                    '<span>' + _abstract + '</span>',
                    '</label>',
                    '</div>',
                    '</div>');
                html.push(div.join(""));
            });
            $("#csw-results").append(html).show();

            if (results.length > 0) {
                $("#search-message").text("");
                $("#search-message").hide();
            } else {
                $("#search-message").text("Aucun résultat pour cette recherche");
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
                fromcapacity: formCustomBaseFromcapacity.value
            };
            baseLayer.type = baseLayer.type != "vector-tms" ? baseLayer.type.toUpperCase() : baseLayer.type;
            mv.showBaseLayers({ [baseLayer.id]: baseLayer }, "custom-bl");
            setConf("customBaseLayers", {
                ...getConf("customBaseLayers"),
                [baseLayer.id]: baseLayer
            });
        },

        validateFormBaseLayer: () => {
            let isInvalid = false;

            // Test input value
            [...appCustomBackgroundBlock.querySelectorAll("div:not(.d-none) > div > input[required]")].forEach(function(x){
                if (!x.value) {
                    x.classList.add("is-invalid");   
                    isInvalid = true;                 
                }
            });

            if (isInvalid){
                alertCustom('Veuillez renseigner les informations manquantes', 'danger');
                return;
            }    
            
            // Add basemap
            mv.addBaseLayer();  
            alertCustom('Nouveau fond de plan ajouté avec succès ! Activez-le dans la liste des fonds de plan.', 'info');
            // Reset input      
            [...appCustomBackgroundBlock.querySelectorAll("input")].forEach(function(x){
                x.value = "";
                x.classList.remove("is-invalid");
            });
        },

        showBaseLayers: function (data, classe) {
            var html = [];
            var html2 = [];
            $.each(data, function (index, l) {
                var div = [
                    '<li class="' + classe + ' bl list-group-item list-flex" data-title="' + l.label + '" data-layerid="' + l.id + '">',
                    '<div class="list-flex">',
                    '<img src="' + l.thumbgallery + '" alt="' + l.label + '" class="img-BackgroundMap">',
                    '<div><span>' + l.label + '</span><br><span>' + l.title + '</span></div>',
                    '</div>',
                    '<div class="custom-control custom-checkbox">',
                    '<input type="checkbox" class="custom-control-input" id="' + l.id + '-bl">',
                    '<label class="custom-control-label" for="' + l.id + '-bl"></label>',
                    '</div>',
                    '</li>'].join("");
                html.push(div);
                html2.push('<option disabled value="' + l.id + '" >' + l.label + ' - ' + l.title + '</option>');
            });
            $("#frm-bl").append(html);
            $("#frm-bl-visible").append(html2);
            $(".bl." + classe + " input").bind("change", function (e) {
                var id = $(this).parent().parent().attr("data-layerid");
                var value = $(e.currentTarget).prop('checked');
                if (value === true) {
                    $("#frm-bl-visible option[value='" + id + "']").removeAttr('disabled');
                } else {
                    $("#frm-bl-visible option[value='" + id + "']").attr('disabled', 'disabled');
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
                    '<div class="layer-style col-sm-6 col-md-4" name="' + style.name + '" data-legendurl="' + style.src + '" data-stylename="' + style.name + '" data-layerid="' + layerid + '" >',
                    '<div class="layer-style-block">',
                    '<div class="custom-control custom-checkbox">',
                    '<input type="checkbox" onchange="mv.changeLayerLegendInput(this)" class="custom-control-input" id="' + style.name + '-style-selection">',
                    '<label class="custom-control-label" for="' + style.name + '-style-selection">' + style.name + '</label>',
                    '</div>',
                    '<img class="my-3" src="' + style.src + '">',
                    '<div class="input-group input-group-sm">',
                    '<div class="input-group-prepend">',
                    '<span class="input-group-text"><i class="bi bi-pencil"></i></span>',
                    '</div>',
                    '<input id="' + style.name + '-style-alias" class="form-control" type="text" value="' + style.name + '" ></input>',
                    '</div>',
                    '</div>'].join("");
                html.push(div);
            });
            $("#frm-lis-styles").append(html);
            if (layer.style && layer.style != "") {
                var styles = layer.style.split(",");
                var aliases;
                switch (styles.length) {
                    case 1:
                        $(".layer-style[name='" + layer.style + "'] input[type='checkbox']").prop("checked", "checked");
                        break;
                    default:
                        aliases = layer.stylesalias.split(",");
                        for (var i = 0; i <= styles.length; i++) {
                            $(".layer-style[name='" + styles[i] + "'] input[type='checkbox']").prop("checked", "checked");
                            $(".layer-style[name='" + styles[i] + "'] input[type='text']").val(aliases[i]);
                        }

                }
            }
        },

        showDistinctValues: function (values, option) {
            console.log("showDistinctValues option: %s", option);
            var html = [];
            $.each(values, function (id, value) {
                html.push('<a onclick="$(this).toggleClass(\'active\');" class="list-group-item">' + value + '</a>');
            });
            $("#distinct_values a").remove();
            $("#distinct_values").append(html.join(" "));
            $("#mod-featuresview").modal('show');
            $("#mod-featuresview").attr("data-bs-target", option);
        },

        saveSourceAttributeFilter: function () {
            var values = [];
            var layerid = $(".layers-list-item.active").attr("data-layerid");
            var fld = $("#attribute_filter_fields").val();
            var operator = $("#attribute_filter_operators").val();
            var selected = $("#source_fields_tags").tagsinput('items');
            var type = config.temp.layers[layerid].fields[fld].type;

            $.each(selected, function (id, value) {
                if (type === 'string') {
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
                    return ((index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity));
                })
            }
            $(fields).each(function (id, fld) {
                if (config.temp.layers[layerid].fields[fld]) {
                    $("#attribute_filter_fields, #opt-attributefield").append('<option value="' + fld + '">' + fld + '</option>');
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
                var item = [
                    '<div class="list-group-item fld ' + selected + '" data-field="' + fld + '" >',
                    '<i class="bi bi-arrows-move"></i>',
                    '<div class="col-md-3 fld-name">' + fld + '</div>',
                    '<div class="col-md-4 fld-alias">',
                    '<div class="input-group input-group-sm">',
                    '<div class="input-group-prepend">',
                    '<span class="input-group-text"><i class="bi bi-pencil"></i></span>',
                    '</div>',
                    '<input class="form-control" type="text" value="' + alias + '" ></input>',
                    '</div>',
                    '</div>',
                    '<div class="col-md-3 fld-option">',
                    '<select class="form-control form-control-sm" onchange="mv.fieldTypeSelectionChange(this)">',
                    '<option value="false">Non utilisé</option>',
                    '<option value="title">Titre</option>',
                    '<option value="link">Lien</option>',
                    '<option value="image">Image</option>',
                    '<option value="text">Texte</option>',
                    '</select>',
                    '</div>',
                    '</div>'].join("");

                $("#frm-lis-fields").append(item);
                if (layer.fieldsoptions && layer.fieldsoptions[fld]) {
                    $("#frm-lis-fields .fld[data-field='" + fld + "'] option[value='" + layer.fieldsoptions[fld].type + "']").prop("selected", "selected");
                }
            });
            if (layer.attributefilter && layer.attributefield) {
                $("#opt-attributefield").val(layer.attributefield);
            }
            if (layer.usetemplate && layer.template) {
                mv.parseTemplate(layer.template.split("{{#features}}")[1].split("{{/features}}")[0]);
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
                if (result.layerid !== undefined && result.bbox && result.bbox.length > 0 && result.parentLayerId !== undefined) {
                    var _abstract =
                        (result.abstract.length > 200) ? result.abstract.substring(0, 200) + '...' : result.abstract;
                    var div = [];
                    div.push('<div class="ogc-result wms-result col-sm-12 col-md-12" data-title="' + result.title + '"');
                    div.push(' data-layerid="' + result.layerid + '"');
                    if (result.metadata) {
                        div.push(' data-metadata="' + result.metadata + '"');
                    }
                    if (result['metadata-csw']) {
                        div.push(' data-metadata-csw="' + result['metadata-csw'] + '"');
                    }
                    if (result.wms) {
                        div.push(' data-url="' + result.wms + '"');
                    }
                    if (result.attribution) {
                        div.push(' data-type="wms"');
                    }
                    div.push('>');
                    div.push(
                        '<div class="checkbox list-group-item">',
                        '<div class="custom-control custom-checkbox">',
                        '<input type="checkbox" class="custom-control-input" id="' + result.layerid + '-ck">',
                        '<label class="custom-control-label" for="' + result.layerid + '-ck">',
                        '<span style="font-weight:600;">' + result.extTitle + '</span></br>',
                        '<span>' + _abstract + '</span>',
                        '</label>',
                        '</div>',
                        '</div>');
                    html.push(div.join(""));
                    nb_results++;
                }
            });
            $("#wms-results").append(html).show();

            if (nb_results > 0) {
                $("#search-message").text("");
                $("#search-message").hide();
            } else {
                $("#search-message").text("Aucun résultat pour cette recherche.");
            }
        },       

        getConfLayers: function () {
            // CAS 2 : Ajout d'une couche via ces paramètres
            if (document.getElementById('newlayer-type').value != ''){                
                // Récupère les valeurs des paramètres communs saisis 
                var layertype = document.getElementById('newlayer-type').value;
                var layerid = document.getElementById('newlayer-id').value;
                var layername = document.getElementById('newlayer-name').value;
                var layerurl = document.getElementById('newlayer-url').value;                

                // Test si valeur nulle
                let isInvalid = false;
                [...commonParamType.querySelectorAll("input")].forEach(function(x){
                    if (!x.value) {
                        x.classList.add("is-invalid");   
                        isInvalid = true;                 
                    }
                });
                if (isInvalid){
                    alertCustom('Veuillez renseigner les informations manquantes', 'danger');
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
                        .find(".layer-name").text(layername);
                var layer = {
                    "id": layerid,
                    "title": layername,
                    "name": layername,
                    "type": layertype,
                    "url": layerurl,
                    "visible": true,
                    "tiled": true,
                    "queryable": true
                };

                // Paramètres supplémentaires si Vector-TMS
                if (document.getElementById('newlayer-type').value == 'vector-tms'){
                    var layerstyleurl = document.getElementById('newlayer-tms-styleurl').value;
                    var layerstylename = document.getElementById('newlayer-tms-style').value;
                    layer.styleurl = layerstyleurl;
                    layer.style = layerstylename;
                }

                config.themes[$("#theme-edit").attr("data-themeid")].layers.push(layer);

                $("#mod-layerNew").modal('hide');
                $("#mod-themeOptions").modal('show');

                mv.resetConfLayer(); 
                return
            }
            // CAS 1 : Ajout d'une couche via un catalogue
            var selected_layers = $(".ogc-result input[type='checkbox']:checked");
            var counter = 0;
            var ogc_type = "";
            selected_layers.each(function (i, ctl) {
                if (ctl.checked) {
                    var conf = $(ctl).closest(".ogc-result").data();
                    if (counter > 0) {
                        addLayer('Nouvelle couche');
                        $(".list-group-item.layers-list-item").removeClass("active").last().addClass("active");
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
                        .find(".layer-name").text(conf.title);

                    var layer = {
                        "id": conf.layerid,
                        "title": conf.title,
                        "name": conf.title,
                        "type": _wmsLayerProperties.layerType,
                        "url": conf.url,
                        "queryable": true,
                        "attribution": conf.attribution,
                        "infoformat": _wmsLayerProperties.infoFormat,
                        "tiled": _wmsLayerProperties.tiled,
                        "metadata": conf.metadata,
                        "metadata-csw": conf.metadataCsw,
                        "visible": true
                    };

                    config.themes[$("#theme-edit").attr("data-themeid")].layers.push(layer);
                }
                counter += 1;
            });
            $("#mod-layerNew").modal('hide');
            $("#mod-themeOptions").modal('show');
            //remove selection from results
            $(".ogc-result input[type='checkbox']:checked").prop("checked", false);
        },        

        resetConfLayer: function () {
            // Reset input      
            document.getElementById('newlayer-type').value = '';
            [...document.querySelectorAll(".param-type")].forEach(e => e.classList.add("d-none"));
            [...document.querySelectorAll("#commonParamType >div")].forEach(e => e.classList.add("d-none"));
            [...newLayerByParam.querySelectorAll("input")].forEach(function(x){
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
            [...document.querySelectorAll("#mod-layerOptions .layerOption-wms")].forEach(e => e.classList.add("d-none"));
            [...document.querySelectorAll("#mod-layerOptions .layerOption-tms")].forEach(e => e.classList.add("d-none"));
            document.getElementById("layerTypeLabel").innerHTML="";
            //clear forms
            $("#layer_conf1 form").trigger('reset');
            $("#layer_conf2 form").trigger('reset');
            $("#frm-lis-fields").empty();
            $("#layer_conf3 form").trigger('reset');
            $("#frm-lis-styles").empty();
            $("#layer_conf4 form").trigger('reset');
            $("#layer_conf5 form").trigger('reset');
            $("#layer_conf6 form").trigger('reset');
            $("input[data-role='tagsinput']").tagsinput('removeAll');
            $("#layer_sections>.tab-pane").removeClass('active').first().addClass('active');
            $("#layer_sections_menu li").removeClass('active').first().addClass('active');


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
            $("#frm-legendurl").val(layer.legendurl);
            $("#frm-layerid").val(layer.id);
            $("#frm-url").val(layer.url);
            $("#frm-queryable").prop("checked", (layer.queryable));
            $("#frm-featurecount").val(layer.featurecount);
            $("#frm-infopanel option[value='" + layer.infopanel + "']").prop("selected", true);
            $("#frm-secure").val(layer.secure);
            $("#frm-useproxy").prop("checked", (layer.useproxy));
            $("#frm-searchable").prop("checked", (layer.searchable));
            $("#frm-searchengine").val(layer.searchengine).trigger("change");
            $("#frm-fusesearchkeys").val(layer.fusesearchkeys);
            $("#frm-fusesearchresult").val(layer.fusesearchresult);
            $("#frm-infoformat option[value='" + layer.infoformat + "']").prop("selected", true).trigger("change");
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
            $("#frm-layer-showintoc").prop("checked", layer.showintoc == false ? true : false);       

            if (layer.usetemplate && layer.templateurl) {
                $("#frm-template").prop("checked", true);
                $("#frm-template-url").val(layer.templateurl);
                console.log("referenced template from layer %s: %s", layer.id, layer.templateurl);
            }
            $("#mod-layerOptions .checkedurl").trigger("change");

            if (layer.type === "wms") {
                [...document.querySelectorAll("#mod-layerOptions .layerOption-wms")].forEach(e => e.classList.remove("d-none"));
                $("#frm-scalemin").val(layer.scalemin);
                $("#frm-scalemax").val(layer.scalemax);
                $("#frm-filter").val(layer.filter);
                $("#frm-layer-styletitle").val(layer.styletitle || "");
                $("#frm-layer-dynamiclegend").prop("checked", layer.dynamiclegend);
                if (layer.attributefilter) {
                    $("#frm-attributelabel").val(layer.attributelabel);
                    layer.attributevalues.split(",").forEach(function (value, id) {
                        $("#control_fields_tags").tagsinput('add', value);
                    });
                }
                ogc.getFieldsFromWMS(layer.url, layerid);
                ogc.getStylesFromWMS(layer.url, layerid);
            } 

            if (layer.type === "vector-tms") {
                [...document.querySelectorAll("#mod-layerOptions .layerOption-tms")].forEach(e => e.classList.remove("d-none"));
                $("#frm-layertms-styleurl").val(layer.styleurl);
                $("#frm-layertms-stylename").val(layer.style);
                $("#frm-layertms-filterstyle").val(layer.filterstyle);
            } 
        },

        writeFieldsOptions: function (layer) {
            console.groupCollapsed("writeFieldsOptions");
            var aliases = [];
            var fields = [];
            var template = { "title": "", "text": [], "photo": [], "link": [], "template": [] };

            $.each(layer.fieldsoptions, function (index, options) {
                if (layer.usetemplate) {
                    switch (options.type) {
                        case "title":
                            template.title = '<h3 class="title-feature">{{' + options.name + '}}</h3>';
                            break;
                        case "text":
                            template.text.push('<div class="feature-text"><span>' + options.alias + ':</span> {{' + options.name + '}}</div><br/>');
                            break;
                        case "image":
                            template.photo.push('<img src="{{' + options.name + '}}" class="img-responsive" style="margin-top:5%;" />');
                            break;
                        case "link":
                            template.link.push('<a href="{{' + options.name + '}}" target="_blank">' + options.alias + '</a>');
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
            if (layer.usetemplate && !layer.templateurl) {
                template.template.push('{{#features}}');
                template.template.push('<li class="item" style="width:238px;">');
                template.template.push(template.title);
                template.template.push('<p class="text-feature">');
                $(template.text).each(function (index, text) {
                    template.template.push(text);
                });
                template.template.push('</p>');
                $(template.photo).each(function (index, image) {
                    template.template.push(image);
                });
                $(template.link).each(function (index, link) {
                    template.template.push(link);
                });
                template.template.push('</li>');
                template.template.push('{{/features}}');
                layer.template = template.template.join(" \n");
                console.log("layer.template:", layer.template);
            } else {
                layer.fields = fields.join(",");
                layer.aliases = aliases.join(",");
            }
            console.groupEnd("writeFieldsOptions");
        },

        saveLayerOptions: function (layerid = null) {
            let layer = getLayerById(layerid);

            // Commons params            
            layer.type =  $("#frm-type").val();            
            layer.title =  $("#frm-layer-title").val();
            layer.name =  $("#frm-layer-title").val();
            layer.id = $("#frm-layerid").val();
            layer.url =  $("#frm-url").val();
            layer.legendurl =  $("#frm-legendurl").val();
            layer.queryable = ($("#frm-queryable").prop("checked") === true);
            layer.secure = $("#frm-secure").val();
            layer.useproxy = ($("#frm-useproxy").prop("checked") === true);
            layer.searchable = ($("#frm-searchable").prop("checked") === true);
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
            layer["showintoc"] = $("#frm-layer-showintoc").prop("checked") !== true;
            layer.visible = ($("#frm-visible").prop("checked") === true);
            layer.opacity = $("#frm-opacity").val();            
            layer.tiled = ($("#frm-tiled").prop("checked") === true);
            layer.usetemplate = ($("#frm-template").prop("checked") === true);
            layer.templateurl = ($("#frm-template-url").val() == "")?false:$("#frm-template-url").val();

            // TMS params
            if (layer.type == "vector-tms"){
                layer.style = $("#frm-layertms-stylename").val();
                layer.styleurl = $("#frm-layertms-styleurl").val();
                layer.filterstyle = $("#frm-layertms-filterstyle").val();
            }

            //WMS params
            if (layer.type == "wms"){
                layer["styletitle"] = $("#frm-layer-styletitle").val();
                layer.sld = $("#frm-sld").val();
                if ($("#frm-scalemin").val()>= 0 && $("#frm-scalemax").val()> 0) {
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
                var label =  $("#frm-attributelabel").val();
                if (values.split(",").length>1) {
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
                        layer.style = $(selected_styles).first().closest(".layer-style").attr("data-stylename");
                        layer.stylesalias = "";
                        break;
                    default:
                        selected_styles.each(function (index, style) {
                            var name = $(style).closest(".layer-style").attr("data-stylename");
                            var alias = $(style).closest(".layer-style").find("input[type='text']").val();
                            style_names.push(name);
                            style_alias.push(alias);
                        });
                        layer.style = style_names.join(",");
                        layer.stylesalias = style_alias.join(",");
                }
            };
            
            //Fields
            layer.fieldsoptions = {};
            $("#frm-lis-fields option[value!='false']:selected").each(function (index, option) {
                var type = option.value;
                var field = $(option).closest(".fld").attr("data-field");
                var alias = $(option).closest(".fld").find(".fld-alias input").val();
                layer.fieldsoptions[field] = {"name": field, "alias": alias, "type": type};
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
            /*var reg = reg = /" /g;
            xml = xml.replace(reg, '" \r\n    ').replace('</layer>', '\r\n</layer>');*/            
            $("#mod-codeview pre").text(xml);
        },

        writeLayerNode: function (l) {
            var padding = function (n) {
                return '\r\n' + " ".repeat(n);
            };
            var layer_parameters = {};
                //require parameters
                var require_parameters = [
                    "id",
                    "name",
                    "type",
                    "url"
                ];
                require_parameters.forEach(function(p,i) {
                    var value = l[p];
                    if (p == 'url') {
                        value = mv.escapeXml(value);
                    }
                    layer_parameters[p] = [p, '="', value, '"'].join('');
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
                    "exclusive",
                    "showintoc",
                    "index"
                ];           
                optional_parameters.forEach(param => {
                    if (l[param] == undefined) return;
                    let value = l[param];

                    if (['metadata', 'metadata-csw', 'legendurl'].includes(param)) {
                        value = mv.escapeXml(value);
                    }
                    layer_parameters[param] = `${ param }="${ value}"`;
                })
            
                //more complexes parameters
                var attributefilter ="";
                if (l.attributefilter) {
                    attributefilter = [
                        'attributefilter="true"',
                        'attributefield="'+l.attributefield+'"',
                        'attributevalues="'+l.attributevalues+'"',
                        'attributelabel="'+l.attributelabel+'"',
                    ]. join(" ");
                    layer_parameters.attributefilter = attributefilter;
                }
                //template exception
                var template = "";
                if (l.usetemplate && l.template) {
                    template = '<template><![CDATA['+ l.template+']]></template>';
                }
                if (l.usetemplate && l.templateurl) {
                    template = '<template url="'+ l.templateurl+'" ></template>';
                }
                var layer = [padding(8) +'<layer '];
                $.each(layer_parameters, function (prop, parameter) {
                    layer.push(padding(12) + parameter);
                });
                layer.push('>');
                layer.push(template);
                layer.push(padding(8)+'</layer>');

            return layer.join("");
        },

        escapeXml: function (unsafe) {
            var rep = "";
            if (unsafe) {
                rep = unsafe.replace(/[<>&"]/g, function (c) {
                    switch (c) {
                        case '<': return '&lt;';
                        case '>': return '&gt;';
                        case '&': return '&amp;';
                        case '\'': return '&apos;';
                        case '"': return '&quot;';
                    }
                });
            }
            return rep;
        },

        search : function () {
            $("#search-message").text("Recherche en cours...");
            $("#search-message").show();

            mv.resetSearch();
            var providerType = $(".dropdown-menu li.active>a").attr("data-providertype");
            var url = $(".dropdown-menu li.active>a").attr("data-provider");
            var keyword = $("#input-ogc-filter").val();
            switch (providerType) {
                case "csw":
                    var metadata_baseref = $(".dropdown-menu li.active>a").attr("data-metadata-app");
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
            $("#frm-lis-fields .fld[data-field='"+title+"'] .fld-option select").val("title").trigger("change");
            var texts = [];
            var photos = [];
            var links = [];
            $(tpl).find(".feature-text").each(function (i, t) {
                var text = $(t).text().match("{{(.*)}}")[1];
                var alias = $(t).find("span").text().split(":")[0];
                texts.push({"text": text, "alias": alias});
                $("#frm-lis-fields .fld[data-field='"+text+"'] .fld-option select").val("text").trigger("change");
                $("#frm-lis-fields .fld[data-field='"+text+"'] .fld-alias input").val(alias);
            });
            $(tpl).find("img").each(function (i, img) {
                var photo = $(img).attr("src").match("{{(.*)}}")[1];
                photos.push(photo);
                $("#frm-lis-fields .fld[data-field='"+photo+"'] .fld-option select").val("image").trigger("change");
            });
            $(tpl).find("a").each(function (i, a) {
                var link = $(a).attribute("href").match("{{(.*)}}")[1];
                var alias = $(a).text();
                links.push({"link": link, "alias": alias});
                $("#frm-lis-fields .fld[data-field='"+link+"'] .fld-alias input").val(alias);
                $("#frm-lis-fields .fld[data-field='"+link+"'] .fld-option select").val("link").trigger("change");
            });

            console.log("parseTemplate:", {
                title: title,
                texts: texts,
                photos: photos,
                links: links
            });
        },

        showHideQueryParameters : function (value) {
            if (value === "application/vnd.ogc.gml") {
                $("#query-parameters").addClass("visible");
            } else {
                $("#query-parameters").removeClass("visible");
            }
        },

        changeVisibleBaseLayer: function (visibleBaselayer) {
            $(".bl").removeClass("visible");
            $(".bl[data-layerid='"+visibleBaselayer+"']").addClass("visible");
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
                    $("#opt-searchlocalities-attribution").val('');
                    break;
                case "ban":
                    $("#opt-searchl-url").show();
                    $("#opt-searchl-attribution").show();
                    $("#opt-searchlocalities-url").val('https://api-adresse.data.gouv.fr/search/');
                    $("#opt-searchlocalities-attribution").val('Base adresse nationale (BAN)');
                    break;
                case  "custom":
                    $("#opt-searchlocalities-url").val("");
                    $("#opt-searchl-url").show();
                    $("#opt-searchl-attribution").show();
                    $("#opt-searchlocalities-attribution").val('');
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
            [...document.querySelectorAll(".custom-bg-type")].forEach(e => e.classList.add("d-none"));
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
            [...document.querySelectorAll(".custom-bg-type")].forEach(e => e.classList.add("d-none"))
            if (value) {
                commonsClass.remove("d-none");
                [...document.querySelectorAll(`.${ value }`)].forEach(e => e.classList.remove("d-none"))
                addCustomBl.classList.remove("d-none");
                addCustomBl.classList.remove("d-none");
            } else {
                commonsClass.add("d-none");
                addCustomBl.classList.add("d-none");
            }
        },

        selectNewDataTypeValue: ({ value = "" }) => {
            [...document.querySelectorAll(".param-type")].forEach(e => e.classList.add("d-none"))
            if (value) {
                [...document.querySelectorAll("#commonParamType > div")].forEach(e => e.classList.remove("d-none"));
                [...document.querySelectorAll(`.${ value }-type`)].forEach(e => e.classList.remove("d-none"))
            } else {
                [...document.querySelectorAll("#commonParamType > div")].forEach(e => e.classList.add("d-none"));
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
            defaultClass = document.querySelector("#group-legend-default").classList
            customClass = document.querySelector("#group-legend-custom").classList
            switch (value) {
                case "custom":
                    defaultClass.add("d-none");
                    customClass.remove("d-none");
                    document.querySelector("#frm-layer-legend-dynamic").checked = false;
                    break;
                default:
                    defaultClass.remove("d-none");
                    customClass.add("d-none");
                    document.querySelector("#frm-layer-legendurl-url").value = "";
            }
        },
        
        changeLayerType: function (value) {
           switch (value) {
            case "wms":
                $("#frm-searchengine option[value='fuse']").attr("disabled","disabled");
                break;
            case "geojson":
                $("#frm-searchengine option[value='fuse']").removeAttr('disabled');
                break;
           }
        },

        ajaxURL: function (url, el) {
            if (url.indexOf("&amp;")>0) {
                url = $.parseHTML(url)[0].nodeValue;
            }
            var _proxy = _conf.proxy;
            // relative path
            if (url.indexOf('http')!=0) {
                return _conf.mviewer_instance + url;
            }
            // same domain
            else if (url.indexOf(location.protocol + '//' + location.host)===0) {
                return url;
            }
            else if (_proxy) {
                return  _proxy + encodeURIComponent(url);
            }
            else {
                return  url;
            }
        },

        checkURL: function (e) {
            var ctrl = e.currentTarget;          
            var url = ctrl.value;
            var expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
            var regexp = new RegExp(expression);
            if (regexp.test(url)){
                $(this).css("color", "#009688");
            }
            else{
                $(this).css("color", "#ff9085");
            }               
            return regexp.test(url);
        },

        createDublinCore(data) {
            let dataDate = data.date ? data.date : new Date().toISOString();

            var themes = [];
            var creator = "anonymous";
            var publisher = "anonymous";
            var organisation = _userInfo?.groupFullName || "";
            var description = document.querySelector("#createVersionInput")?.value || data.description
            const UUID = data.id;
            const keyworkds = document.querySelector("#optKeywords")?.value;

            if (_userInfo.groupSlugName) {
                publisher = _userInfo.groupSlugName;
            }

            $.each(data.themes, function (id, theme) {
                themes.push(`<dc:subject>${theme.title}</dc:subject>`)
            });

            return `
                <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
                    <rdf:Description rdf:about="http://www.ilrt.bristol.ac.uk/people/cmdjb/">
                        <dc:title>${ data.title }</dc:title>
                        <dc:creator>${ creator }</dc:creator>
                        <dc:identifier>${ UUID }</dc:identifier>
                        <dc:keywords>${ keyworkds }</dc:keywords>
                        <dc:publisher>${ publisher }</dc:publisher>
                        <dc:description>${ description }</dc:description>
                        <dc:date>${ dataDate }</dc:date>
                        <dc:organisation>${ organisation }</dc:organisation>
                        ${ themes.length ? themes.join('\r\n') : ''}
                    </rdf:Description>
                </rdf:RDF>`;
        },

        parseWMC(xml) {
            newConfiguration();
            var wmc = $('ViewContext', xml);
            var themeid = createId("theme");
            var wmc_extent = {};
            wmc_extent.srs=$(wmc).find('General > BoundingBox').attr('SRS');
            wmc_extent.minx = parseInt($(wmc).find('General > BoundingBox').attr('minx'));
            wmc_extent.miny = parseInt($(wmc).find('General > BoundingBox').attr('miny'));
            wmc_extent.maxx = parseInt($(wmc).find('General > BoundingBox').attr('maxx'));
            wmc_extent.maxy = parseInt($(wmc).find('General > BoundingBox').attr('maxy'));
            var map_extent = ol.proj.transformExtent([wmc_extent.minx, wmc_extent.miny, wmc_extent.maxx,
                wmc_extent.maxy], wmc_extent.srs, "EPSG:3857");
            var title = $(wmc).find('General > Title').text() ||  $(wmc).attr('id');
            $("#opt-title").val(title).trigger("change");
            map.getView().fit(map_extent, { size: map.getSize() });
            addTheme (title, false, themeid, "fas fa-angle-right");
            $(wmc).find('LayerList > Layer').each(function() {
                // we only consider queryable layers
                if ($(this).attr('queryable')=='1') {
                    var layer = {
                        id: $(this).children('Name').text(),
                        type: "wms",
                        tiled: false,
                        title: $(this).children('Name').text(),
                        name: $(this).children('Name').text(),
                        url: mv.escapeXml($(this).find('Server > OnlineResource').attr('xlink:href')),
                        queryable: true,
                        featurecount: 10,
                        infopanel: 'right-panel',
                        infoformat: "text/html",
                        metadata: mv.escapeXml($(this).find('MetadataURL > OnlineResource').attr('xlink:href')),
                        "metadata-csw": mv.escapeXml(mv.gessCSW($(this).find('MetadataURL > OnlineResource').attr('xlink:href'))),
                        attribution: $(this).find("attribution").find("Title").text() || "",
                        visible: ($(this).attr('hidden')==='0')?true:false,
                        opacity:  parseFloat($(this).find("opacity").text() || "1"),
                        style: $(this).find("StyleList  > Style[current='1'] > Name").text(),
                        sld: (mv.escapeXml($(this).find("StyleList  > Style[current='1'] > SLD > OnlineResource").attr('xlink:href')))
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
                        layer.styles = $(this).find("StyleList  > Style > Name").map(function (id,name) { return $(name).text(); }).toArray().join(",");
                        layer.stylesalias = layer.styles;
                    }
                    config.themes[themeid].layers.push(layer);
                }
                var nb_layers = $(wmc).find('LayerList > Layer').length;
                $('.themes-list-item[data-themeid="'+themeid+'"]').find(".theme-infos-layer").text(nb_layers);
            });
        },

        parseApplication(xml) {
            const app_identifier = xml.getElementsByTagName("dc:identifier")[0]?.innerHTML
            const app_keywords = xml.getElementsByTagName("dc:keywords")[0]?.innerHTML;
            const dateXml = xml.getElementsByTagName("dc:date")[0]?.innerHTML;

            const isPublish = xml.getElementsByTagName("config")[0].getAttribute("publish") == "true";

            if (isPublish) {
                document.querySelector("#toolsbarStudio-unpublish").classList.remove("d-none");
                document.querySelector(".badge-publish").classList.remove("d-none");
                document.querySelector(".badge-draft").classList.add("d-none");
            } else {
                document.querySelector("#toolsbarStudio-unpublish").classList.add("d-none");
                document.querySelector(".badge-publish").classList.add("d-none");
                document.querySelector(".badge-draft").classList.remove("d-none");
            }
            if (_conf.is_php && onlineCard) {
                onlineCard.classList.add("d-none")
            }

            newConfiguration({id: app_identifier, isFile: true, date: dateXml, publish: isPublish});
            var proxy = $(xml).find("proxy");
            var olscompletion = $(xml).find("olscompletion");
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
                ["url", "geometryfield", "linkid", "doctype", "mode", "version"].forEach(function(param,id) {
                    $("#opt-elasticsearch-"+param).val(elasticsearch.attr(param));
                });
            }
            var searchparameters = $(xml).find("searchparameters");
            if (searchparameters && searchparameters.attr("bbox") ) {
                $("#opt-elasticsearch-bbox").prop("checked", (searchparameters.attr("bbox") === "true"));
            }
            if (searchparameters && searchparameters.attr("features") ) {
                $("#opt-searchfeatures").prop("checked", (searchparameters.attr("features") === "true"));
            }
            [proxy].forEach(function(param,id) {
                // this parameters are not yet supported but must be saved for later
                if (param.length>0) {
                    savedParameters[param.selector] = param[0].outerHTML;
                }
            });
            //Application
            var application = $(xml).find("application");

            // Add name app to wizard
            var title = application.attr("title");
            $("#nameAppBlock").empty();
            $("#nameAppBlock").append(title);

            // keywords

            detailArea.innerHTML = app_keywords;
            optKeywords.value = app_keywords;

            ["stats", "statsurl"].forEach(function(param, id) {
                // this parameters are not yet supported but must be saved for later
                var parameter = new Object();
                if (application.attr(param)) {
                    parameter[param] = application.attr(param);
                    savedParameters.application.push(parameter);
                }
            });
            ["title", "logo", "help", "style", "home", "favicon", "icon-help", "studio"].forEach(function(value,id) {
                if (application.attr(value)) {
                    $("#opt-" + value).val(application.attr(value)).trigger("change");
                }
                if (value === "style") {
                    updateTheme($("#opt-" + value)[0]);
                }
                if (value === "studio" && application.attr(value) != 'false') {
                    $("#opt-studio").prop("checked", true);
                }
            });

            ["exportpng","zoomtools", "measuretools", "showhelp", "coordinates",  "mouseposition", "geoloc", "initialextenttool",
                "togglealllayersfromtheme"].forEach(function(value,id) {
                if (application.attr(value) && application.attr(value) === "true") {
                    $("#opt-" + value).prop("checked", true);
                }
            });
            //Mapoptions
            var mapoptions = $(xml).find("mapoptions");
            ["projection", "maxzoom"].forEach(function(value,id) {
                if (mapoptions.attr(value)) {
                    $("#opt-" + value).val(mapoptions.attr(value));
                }
            });
            map.getView().setCenter(mapoptions.attr("center").split(",").map(Number));
            map.getView().setZoom(parseInt(mapoptions.attr("zoom")));
            //BaseLayers
            var baseLayersMode = $(xml).find("baselayers").attr("style") || "default";
            $("#frm-bl-mode option[value='"+baseLayersMode+"']").prop("selected", true);
            var baselayers = $(xml).find("baselayer");
            //Reinitialisation
            $(".bl input").prop("checked",false);
            $("#frm-bl-visible option").attr('disabled', 'disabled');
            baselayers.each(function(i, bl) {
                var id = $(bl).attr("id");
                var savedBaselayer = {};
                $.each(bl.attributes, function (i, attr) {
                    if (attr.name !== "visible") {
                        savedBaselayer[attr.name] = attr.nodeValue;
                    }
                });
                if (_conf.baselayers[id]) {
                    $("#frm-bl .bl[data-layerid='"+id+"'] input").prop("checked",true).trigger('change');
                } else {
                    savedParameters.baselayers[id] = savedBaselayer;
                    console.log ("baselayer " + id + ": unknown");
                }
            });
            mv.showBaseLayers(savedParameters.baselayers, "custom-bl");
            $("#frm-bl .custom-bl input").prop("checked",true).trigger('change');
            var visibleBaselayer = $(xml).find('baselayer[visible="true"]').attr("id");
            $("#frm-bl-visible").val(visibleBaselayer).trigger('change');
            //tHEMES & layers
            var themePanel =  $(xml).find("themes");
            if (themePanel.attr("mini") === "true") {
                $('#opt-mini').prop('checked', true);
            }
            var themes = $(xml).find("theme");
            themes.each(function(id, th) {
                addTheme ($(th).attr("name"), ($(th).attr("collapsed") || true), $(th).attr("id"), $(th).attr("icon"), $(th).attr("url"));
                var layers = $(th).find("layer");
                var counter = 0;
                layers.each(function(id, l) {
                    counter +=1;
                    var layer = {
                        id: $(l).attr("id"),
                        type: $(l).attr("type") || "wms",
                        tiled: ($(l).attr("tiled") === "true"),
                        scalemin: $(l).attr("scalemin"),
                        scalemax: $(l).attr("scalemax"),
                        title: $(l).attr("name"),
                        name: $(l).attr("name"),
                        url: $(l).attr("url"),
                        queryable: ($(l).attr("queryable") === "true"),
                        featurecount: $(l).attr("featurecount"),
                        infopanel: $(l).attr("infopanel") || 'right-panel',
                        searchable: ($(l).attr("searchable") === "true"),
                        searchengine:$(l).attr("searchengine"),
                        fusesearchkeys:$(l).attr("fusesearchkeys"),
                        fusesearchresult:$(l).attr("fusesearchresult"),
                        secure: $(l).attr("secure") || 'public',
                        useproxy: ($(l).attr("useproxy") === "true"),
                        infoformat: $(l).attr("infoformat"),
                        metadata: $(l).attr("metadata"),
                        "metadata-csw": $(l).attr("metadata-csw"),
                        attribution: $(l).attr("attribution"),
                        filter: $(l).attr("filter"),
                        visible: ($(l).attr("visible") === "true"),
                        opacity: $(l).attr("opacity"),
                        template: $(l).find("template").text(),
                        usetemplate: ($(l).find("template") && $(l).find("template").text().length > 3 || ($(l).find("template").attr("url") && ($(l).find("template").attr("url").length>1))),
                        templateurl : false,
                        fields:  $(l).attr("fields"),
                        fieldsoptions : false,
                        aliases:  $(l).attr("aliases"),
                        style:  $(l).attr("style"),
                        styleurl:  $(l).attr("styleurl"),
                        filterstyle:  $(l).attr("filterstyle"),
                        stylesalias:  $(l).attr("stylesalias"),
                        sld: $(l).attr("sld"),
                        legendurl: $(l).attr("legendurl"),
                        attributefilter: ($(l).attr("attributefilter") === "true"),
                        showintoc: ($(l).attr("showintoc") === "true"),
                        exclusive: ($(l).attr("exclusive") === "true"),
                        toplayer: ($(l).attr("toplayer") === "true"),
                        dynamiclegend: ($(l).attr("dynamiclegend") === "true"),
                        styletitle: $(l).attr("styletitle"),
                        index: $(l).attr("index")
                    };
                    if (layer.attributefilter) {
                        layer.attributefield = $(l).attr("attributefield");
                        layer.attributelabel = $(l).attr("attributelabel");
                        layer.attributevalues = $(l).attr("attributevalues");
                    }
                    if (layer.usetemplate === true && $(l).find("template").attr("url")) {
                        layer.templateurl = $(l).find("template").attr("url");
                        console.log("referenced template from layer %s: %s", layer.id, layer.templateurl);
                    }
                    $("#frm-template").prop("checked", (layer.usetemplate));
                    if (layer.fields && layer.aliases) {
                        layer.fieldsoptions = {};
                        $(layer.fields.split(",")).each(function (index, fld) {
                            var type = "text";
                            var alias = layer.aliases.split(",")[index];
                            layer.fieldsoptions[fld] = {"name": fld, "alias": alias, "type": type};
                        });
                    }
                    config.themes[$(th).attr("id")].layers.push(layer);

                });
                if ($(th).attr("url")) {
                    $(".themes-list-item[data-themeid='"+$(th).attr("id")+"'] .theme-infos-layer").text("Ext.");
                } else {
                    $(".themes-list-item[data-themeid='"+$(th).attr("id")+"'] .theme-infos-layer").text(counter);
                }
            });

            $("#mod-importfile").modal("hide");
            console.groupEnd("parseApplication");
        },
        getVersionsByApp() {
            const id = config.id;
            fetch(`${ _conf.api }/${ id }/versions`)
                .then(r => r.ok ? r.json() : Promise.reject(r))
                .then(data => {
                    mv.getAppsTable(data)
                })
                .catch(err => console.log(err));
        },
        showListApplications(data, search) {
            document.querySelector("#liste_applications").innerHTML = "";
            $("#liste_applications a").remove();
            var applications = [];
            var groups = [];
            var creators = [];

            // Get list of groups
            data.forEach(function(app) {
                if (app.group && groups.indexOf(app.group) == -1) {
                    groups.push(app.group);
                }
            });

            $("#apps_group_list option").remove();
            $("#apps_group_list").append('<option>Tous</option>');
            $("#apps_group_list").parent().toggle(groups.length > 1);

            groups.forEach(function(group) {
                $("#apps_group_list").append(
                    '<option>' + group + '</option>'
                )
            });

            // Get list of creators)
            data.forEach(function(app) {
                if (app.creator && creators.indexOf(app.creator) == -1) {
                    creators.push(app.creator);
                }
            });

            $("#apps_creator_list option").remove();
            $("#apps_creator_list").append('<option>Tous</option>');
            $("#apps_creator_list").parent().toggle(creators.length > 1);

            creators.forEach(function(creator) {
                $("#apps_creator_list").append(
                    '<option>' + creator + '</option>'
                )
            });

            data
                .sort(function(map1, map2) {return (map1.title > map2.title) ? 1 : -1;})
                .forEach((app) => {
                    // allow to filter according to PHP or Python backend
                    const navButtons = [{
                        show: !_conf.is_php,
                        html: `
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-id="${ app.id }" data-title="${ app.title }" onclick="previewAppUrl(this.attributes[\'data-id\'].value,this.attributes[\'data-title\'].value);">Prévisualiser</a>
                            </li>`
                        }, {
                            show: app.creator == _userInfo.userName,
                            html: `
                                <li class="nav-item">
                                    <a class="nav-link" href="#" data-url="${ _conf.mviewer_instance + app.url }" data-group="${ app.group }" onclick="loadApplicationParametersFromRemoteFile(this.attributes[\'data-url\'].value)">Modifier</a>
                                </li>`
                        }, {
                            show: !_conf.is_php && app.creator == _userInfo.userName,
                            html: `
                                <li class="nav-item">
                                    <a class="nav-link" href="#" data-id="${ app.id }" onclick="deleteAppFromList(this.attributes[\'data-id\'].value)">Supprimer</a>
                                </li>`
                        }];
                    
                    let badgeLabel = app.publish == "true" ? mviewer.tr("publish") : mviewer.tr("draft");
                    let badgeColor = app.publish == "true" ? "badge-publish" : "badge-draft";
                    let badge = _conf.is_php ? "" : `<span class="badge ${ badgeColor }">${ badgeLabel }</span>`;
                    const items = `
                    <div class="list-group-item">
                            <div class="row">
                            <div class="col-md-6 liste_applications_info">
                                <h5 class="list-group-item-heading">${ app.title } ${badge} </h5> 
                                <div class="app-subjects ${ !app.subjects ? 'd-none' : '' }">Thématiques&nbsp;: ${ app.subjects }</div>
                                <div class="app-group ${ !app.group ? 'd-none' : '' }">Groupe&nbsp;: ${ app.group }</div>
                                <div class="app-subjects ${!app.id ? "d-none" : ""}">Identifiant&nbsp;: ${ app.id }</div>
                                <div class="app-subjects ${!app.subjects ? "d-none" : ""}">Mots clés&nbsp;: ${ app.keywords }</div>
                                <div class=app-creator ${!app.creator ? "d-none" : ""}">Auteur&nbsp;: ${ app.creator }</div>
                                <div class="app-date">Date&nbsp;: ${ app.date }</div>
                            </div>
                            <div class="col-md-6 d-flex align-items-center">
                                <ul class="nav">
                                    ${navButtons.filter(x => x.show).map(x => x.html).join("")}
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
                        <p>Aucun résultat</p>
                    </h3>
                </div>`;
            }
            if (!applications.length && !search) {
                document.querySelector("#liste_applications").innerHTML = 
                `<div class="text-center p-5">
                    <h3>
                        <i class="ri-eye-off-line"></i>
                        <p>Il n'y a aucune application</p>
                    </h3>
                </div>`;
            }
            $("#liste_applications").append(applications);
            // can't delete all with Python backend
            // delete all is available with first PHP backend only
            if (_conf.is_php) {
                document.querySelector("#deleteAllBtn").classList.remove("d-none")
            } else {
                document.querySelector("#deleteAllBtn").classList.add("d-none")
            }
        },
        getListeApplications(search = "") {
            // default python backend
            let url = `${ _conf.api }?search=${ search }`;
            // if backend is PHP
            if (_conf?.is_php && _conf?.php?.list_service) {
                if (document.querySelector("#appListSearch")) {
                    document.querySelector("#appListSearch").remove();   
                }
                // use php url file
                url = _conf.php.list_service;
            }
            fetch(url)
                .then(r => r.ok ? r.json() : Promise.reject(r))
                .catch(detail => {
                    console.error("map files list retrieval from mviewerstudio backend failed", {
                        detail: detail,
                    });
                })
                .then(data => {
                    mv.showListApplications(data, search);
                })
        },

        gessCSW(metadata_url) {
            if (metadata_url && metadata_url.search('geonetwork') > 1) {
                var mdid = metadata_url.split('#/metadata/')[1];
                return metadata_url.substring(0,metadata_url.search('geonetwork')) +
                    'geonetwork/srv/eng/csw?SERVICE=CSW&VERSION=2.0.2&REQUEST=GetRecordById&elementSetName=full&ID=' +
                    mdid;
            }
        },

        cleanURL(url) {
            var url2 = decodeURIComponent(url).split("?")[0];
            return url2;
        },

        filterApplications() {
            var filter_groups = ($( "#apps_group_list" ).prop('selectedIndex') > 0);
            var filter_creators = ($( "#apps_creator_list" ).prop('selectedIndex') > 0);
            var group = $( "#apps_group_list option:selected" ).text();
            var creator = $( "#apps_creator_list option:selected" ).text();

            $( "#liste_applications a" ).each( function( index, el ){
                var app_creator = $(this).attr("data-creator");
                var app_group = $(this).attr("data-group");

                var app_group_ok = (!filter_groups) || (app_group == group);
                var app_creator_ok = (!filter_creators) || (app_creator == creator);

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
                        _userRole = "Référent";
                        break;
                    case "contributor":
                        _userRole = "Contributeur";
                        break;
                }

                const userFullName = `${data.first_name} ${data.last_name}`

                var items = `
                <a href="#" class="list-group-item"
                    onclick="$(\'#mod-groupselection\').modal(\'hide\');
                        mv.updateUserInfo({
                            userName: ${data.user_name},
                            name: ${ userFullName },
                            groupSlugName: ${ userGroup.slug_name },
                            groupFullName: ${ userGroup.full_name.replace(/\'/g, "\\'") }
                        });">
                    <h4 class="list-group-item-heading">${ userGroup.full_name }</h4>
                    <div class="row small">
                        <div class="col-md-6">Type de groupe&nbsp;: ${ userGroup.group_type }</div>
                        <div class="col-md-6">Rôle pour ce groupe&nbsp;: ${ _userRole }</div>
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
            _userInfo = {..._userInfo, ...infos}
        },

        previewFromId : filepath => {
            const url = _conf.mviewer_instance + '?config=' + _conf.conf_path_from_mviewer + filepath;
            window.open(url,'mvs_vizualize');
        },

        deleteVersion: (id, version) => mv.deleteVersions(id, [version]),

        onInputVersion : (el) => {
            if (el.value) {
                document.querySelector("#mod-appversions .modal-footer").classList.remove("d-none");
                document.querySelector("#createVersionInput").classList.remove("is-invalid");
                document.querySelector("#createVersionInput").classList.add("is-valid");
            } else {
                document.querySelector("#mod-appversions .modal-footer").classList.add("d-none")
                document.querySelector("#createVersionInput").classList.add("is-invalid");
                document.querySelector("#createVersionInput").classList.remove("is-valid");
            }
        },

        showCreateVersionInput: () => {
            document.querySelector("#appsListTable").innerHTML = "";
            $("#appsListTable").append(
                `<div class="col-md-12" id="groupVersionInput">
                    <div class="form-group">
                        <label for="createVersionInput" i18n="version.comment" class="form-label">${mviewer.tr("version.comment")}</label>
                        <input required oninput="mv.onInputVersion(this)"class="form-control is-invalid" id="createVersionInput" type="text" placeholder="${mviewer.tr("version.comment.ph")}">
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
                    <p>
                    Vous souhaitez restaurer une version antérieure de votre application, en effectuant cette action vous perdrez toutes les modifications réalisées depuis cette version.
                    </p>
                    <p><strong>Voulez-vous continuer ?</strong></p>
                    <a class="cardsClose save-close zoomCard" data-bs-dismiss="modal" onclick="mv.changeVersion('${ id }', '${ version }', true)">
                        <i class="ri-save-line"></i>
                        <span i18n="modal.exit.save">Restaurer mon application</span>
                    </a>
                    <a class="cardsClose notsave-close zoomCard" data-bs-target="#mod-appversions" data-bs-toggle="modal">
                        <i class="bi bi-x-circle"></i>
                        <span i18n="modal.exit.notsave">Conserver mes modifications et rester sur le projet en cours </span>
                    </a>
                    <a class="returnConf-close" data-bs-target="#mod-appversions" data-bs-toggle="modal" aria-label="Close"><i class="ri-arrow-left-line"></i> <span i18n="modal.exit.previous">Retour</span></a>                    
                </div>
            `;
        },
        createVersion: (id) => {
            id = id || config?.id;
            if (!id) return;

            const conf = getConfig();
            document.querySelector("#appsListTable").innerHTML = "";
            const promises = [
                // save current config XML state
                fetch(_conf.api, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'text/xml'
                    },
                    body: conf.join("")
                })
                .then(r => {
                    if (!r.ok) {
                        return Promise.reject(r);
                    } else {
                        fetch(`${ _conf.api }/${id}/version`, {method: "POST"})
                            .then(r => r.ok ? r.json() : Promise.reject(r))
                            .catch(err => alertCustom("Erreur lors de la création de l'état.", "danger"))
                    }
                })
                .catch(err => alertCustom("Erreur lors de la sauvegarde.", "danger"))

            ];
            Promise.all(promises).then(values => {
                mv.refreshTable();
            })
        },
        changeVersion: (id, version, asNew = false) => {
            fetch(`${ _conf.api }/${ id }/version/${ version }`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({as_new: asNew})
            })
            .catch(err => console.log(err))
            .then(r => r.json())
                .then(r => {
                    document.querySelector("#mod-appversions .modal-header .close").click();
                    showHome();
                    // display
                    const url = `${ _conf.mviewer_instance }${ _conf.conf_path_from_mviewer }${ mv.getApps().config.url }`;
                    loadApplicationParametersFromRemoteFile(url);
            })
        },
        previewVersion: (id, version) => {
            fetch(`${ _conf.api }/${id}/version/${version}/preview`, {method: "GET"})
            .catch(err => console.log(err))
            .then(r => r.json())
                .then(r => {
                    url = _conf.mviewer_instance + '?config=' + r.file
                    window.open(url, "mvs_vizualize");
            })
        },
        deleteVersions: (id, versions) => {
            fetch(`${ _conf.api }/${ id }/version`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ versions: versions })
            })
                .catch(err => console.log(err))
                .then(r => r.json())
                .then(r => mv.refreshTable())
        },
        formatDate: (value) => moment(value, "YYYY-MM-DD-HH-mm-ss").format("DD/MM/YYYY - HH:mm:ss"),
        actionVersionFormatter: (value, row, index) => {
            const flag = `<a id="versionVersionIcon"><i class="ri-price-tag-3-line"></i></a>`
            return `
                <a id="versionPreviewLink" onclick="mv.previewVersion('${config.id}', '${row.id}')"><i class="ri-eye-line"></i></a>
                <a id="versionDeleteLink" class="d-none" onclick="mv.deleteVersion('${config.id }', '${ row.id}')"><i class="ri-delete-bin-2-line"></i></a>
                <a id="versionAsNewLink" data-bs-target="#genericModal" data-bs-toggle="modal" onclick="mv.showAlertChangeVersion('${config.id }', '${ row.id}', true)"><i class="ri-arrow-go-back-fill"></i></a>
                ${row?.version ? flag : ""}
            `;
        },
        appsTableToolbar: () => {
            const toolbar = document.querySelector(".toolbar");
            if (toolbar) toolbar.remove();
            const btns = [
                {
                    text: "Marquer cet état",
                    icon: "bi bi-plus-lg",
                    btnClass: "btn btn-info",
                    id: "createVersionBtn",
                    click: 'mv.showCreateVersionInput()'
                }, {
                    text: "Recharger",
                    icon: "ri-refresh-line",
                    btnClass: "btn btn-info",
                    id: "createVersionBtn",
                    click: 'mv.refreshTable()'
                }
            ];
            return `
            <div class="toolbar" style="display:inline-flex">
                ${ btns.map(b => `
                    <button id="${b.id}" class="${ b.btnClass } ml-2" onclick="${ b.click || '' }">
                        <i class="${ b.icon }"></i>
                        <span>${ b.text }</span>
                    </button>
                `).join("") }
                <div class="custom-control custom-switch mt-2 ml-2" id="btnSwitchHistoryTagsOnly">
                    <input type="checkbox" onchange="mv.showTagsOnly(this)" class="custom-control-input" id="inputSwitchHistoryTagsOnly" ${config?.showTags ? 'checked' : ''}>
                    <label class="custom-control-label" for="inputSwitchHistoryTagsOnly"><span>Voir les versions</span></label>
                </div>
            </div>
            `;
        },
        showTagsOnly: (el) => {
            config.showTags = el.checked;
            mv.refreshTable()
        },
        refreshTable: () => {
            document.querySelector("#appsListTable").innerHTML = "";
            mv.getVersionsByApp();
        },
        currentCommitSyle: (row) => {
            return {
                classes: row.current && "currentVersion"
            }
        },
        getAppsTable: (apps) => {
            if (document.querySelector("#tableVersions")) {
                document.querySelector("#appsListTable").innerHTML = "";
            }
            let data = apps.versions.commits;
            if (config.showTags) {
                data = data.filter(d => d.tag);
            }
            data = data.map((v, i) => ({
                number: i, 
                id: v.id,
                version: v?.tag,
                description: v.message,
                author: v.author,
                date: v.date,
                current: v.current ? '<i class="ri-check-line" style="font-size: 20px"></i>' : ""
            }));
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
                    data-row-style="mv.currentCommitSyle"
                >
                    <thead>
                        <tr>
                        <th data-field="current">Actif</th>
                        <th data-field="description">Description</th>
                        <th
                            data-field="date"
                            data-formatter="mv.formatDate"
                            data-sortable="true"
                        >
                            Date
                        </th>
                        <th 
                            class="versionActionsCol"
                            data-field="version"
                            data-formatter="mv.actionVersionFormatter"
                        >
                            Actions
                        </th>
                        </tr>
                    </thead>
                </table>
            `;

            $('#appsListTable').append(tableDom);
            const $table = $("#tableVersions");
            $table.bootstrapTable({data: data})
        },
        onSearchApp: ({ value }) => {
            document.getElementById('liste_applications').innerHTML = "";
            if (value) {
                return mv.getListeApplications(value)
            }
            return mv.getListeApplications(value)
        },
        showPublishModal: (shareLink = "", iframeLink = "", draftLink = "") => {
            const publishModal = new bootstrap.Modal('#genericModal');
            genericModalContent.innerHTML = "";
            genericModalContent.innerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title" i18n="modal.publish.title">Publiée avec succés</h5>
                    <button type="button" onclick="mv.refreshOnPublish('${draftLink}')" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <p>
                        <strong>
                            Votre application est maintenant disponible en ligne.
                        </strong>    
                    </p>
                    <!-- input-->
                    <div class="form-group">
                        <label for="publishShareLink">Liens de partage</label>
                        <input value="${shareLink}" type="text" class="form-control" id="publishShareLink">
                    </div>
                    <div class="form-group">
                        <label for="publishIframeLink">Intégration en iframe</label>
                        <input value="${iframeLink}" type="text" class="form-control" id="publishIframeLink">
                    </div>
                    <!-- buttons-->
                    <p><strong>Que souhaitez-vous faire ?</strong></p>
                    <a class="cardsClose save-close zoomCard" data-bs-dismiss="modal" onclick="mv.refreshOnPublish('${draftLink}')">
                        <i class="ri-tools-fill"></i>
                        <span i18n="modal.exit.nextChange">${mviewer.tr("modal.exit.nextChange")}</span>
                    </a>
                    <a class="cardsClose notsave-close zoomCard" onclick="showHome()" data-bs-dismiss="modal">
                        <i class="ri-home-2-line"></i>
                        <span i18n="modal.exit.goHome">${mviewer.tr("modal.exit.goHome")}</span>
                    </a>
                    <a class="returnConf-close" onclick="mv.refreshOnPublish('${draftLink}')" data-bs-target="#genericModal" data-bs-toggle="modal" aria-label="Close"><i class="ri-arrow-left-line"></i> <span i18n="modal.exit.previous">Retour</span></a>                    
                </div>
            `;
            publishModal.show();
        },
        publish: (id) => {
            if (!id) {
                return alertCustom("L'ID n'est pas renseigné. Veuillez contacter un administrateur.", "danger");
            }
            if (!config.isFile) {
                return alertCustom("Enregistrez une premère fois avant de publier !", "danger");
            }
            fetch(`${ _conf.api }/${id}/publish`)
                .then(r => {
                    return r.ok ? r.json() : Promise.reject(r)
                })
                .then(data => {
                    if (!_conf?.mviewer_publish) {
                        return alertCustom("Configuration manquante pour la publication. Veuillez contacter un administrateur.", "danger");
                    }
                    if (!data.online_file) {
                        return alertCustom("Le lien vers le fichier publié n'est pas accessible. Veuillez contacter un administrateur.", "danger");
                    }
                    return data
                })
                .then(data => {
                    const shareLink = `${ _conf?.mviewer_publish || "" }${ data.online_file }`;
                    const iframeLink = `<iframe allowFullScreen style='border: none;' height='600' width='800' src='${ shareLink }'></iframe>`;
                    mv.showPublishModal(shareLink, iframeLink, data.draft_file);
                    alertCustom("L'application a bien été publiée !", "success");
                })
                .catch(err => {
                    alertCustom("Une erreur s'est produite. Veuillez contacter un administrateur.", "danger");
                })
        },
        refreshOnPublish: (file) => {
            const url = _conf.mviewer_instance + file;
            loadApplicationParametersFromRemoteFile(url);
        },
        unpublish: (id) => {
            fetch(`${ _conf.api }/${ id }/publish`, { method: "DELETE" })
                .then(r => {
                    return r.ok ? r.json() : Promise.reject(r)
                })
                .then(r => {
                    alertCustom(mviewer.tr("modal.unpublish.title"), "warning");
                    mv.refreshOnPublish(r?.draft_file);
                    document.querySelector("#toolsbarStudio-unpublish").classList.add("d-none");
                    [".badge-publish", "#toolsbarStudio-unpublish"].forEach(e => {
                        document.querySelector(e).classList.add("d-none");
                    });
                    [".badge-draft"].forEach(e => {
                        document.querySelector(e).classList.remove("d-none");
                    });
                })
                .catch(err => alertCustom("Une erreur s'est produite. Veuillez contacter un administrateur.", "danger"))
        }
    }
})();

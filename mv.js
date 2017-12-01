var mv = (function () {

    

    
    var _wmsLayerProperties = {
            "type": "wms",
            "tiled": false,
            "url": ""};
    
    _layerProperties =  function (wms_capabilities) {
           //todo
     };
    

    return {
    
        showCWSResults: function (results) {
            console.log(results);
            var html = [];
            $.each(results, function (index, result) {
                var div = ['<div class="ogc-result csw-result col-sm-6 col-md-4" data-title="'+result.title+'" data-layerid="'+result.layerid+'" data-metadata="'+result.metadata+'" data-metadata-csw="'+result['metadata-csw']+'" data-url="'+result.wms+'" data-attribution="'+result.attribution+'" data-type="wms">',
                    '<div class="thumbnail">',
                      '<img src="'+result.image+'">',
                      '<div class="caption">',
                        '<h3>'+result.title+'</h3>',
                        '<p>'+result.abstract+'</p>',                    
                      '</div>',                  
                      '<input id="'+result.layerid+'-ck" type="checkbox" aria-label="...">',
                       
                    '</div>',
                  '</div>'].join("");
                html.push(div);
           });
           $("#csw-results").append(html).show(); 
           
        },
        
        showBaseLayers: function (data) {
             var html = [];
             var html2 = [];
             $.each(data, function (index, l) {
                var div = ['<div class="bl col-sm-6 col-md-3" data-title="'+l.label+'" data-layerid="'+l.id+'" >',
                         '<div class="thumbnail">',                      
                      '<div class="caption">',
                        '<h4>'+l.label+'</h4>',
                        '<p>'+l.title+'</p>',                    
                      '</div>',
                      '<img src="'+l.thumbgallery+'">',                      
                      '<input id="'+l.id+'-bl" type="checkbox" aria-label="...">',
                  '</div>'].join("");
                html.push(div);
                html2.push('<option disabled value="'+l.id+'" >'+l.label + ' - ' + l.title+'</option>');
           });
           $("#frm-bl").append(html);
           $("#frm-bl-visible").append(html2);
           $(".bl input").bind("change", function (e) {
            console.log($(this).parent().parent().attr("data-layerid"), $(e.currentTarget).prop('checked'));
                var id = $(this).parent().parent().attr("data-layerid");
                var value = $(e.currentTarget).prop('checked');
                if (value === true) {
                     $("#frm-bl-visible option[value='"+id+"']").removeAttr('disabled');
                } else {
                    $("#frm-bl-visible option[value='"+id+"']").attr('disabled', 'disabled');
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
                style.name
                style.src
                var div = ['<div class="layer-style col-sm-6 col-md-4" name="'+style.name+'" data-legendurl="'+style.src+'" data-stylename="'+style.name+'" data-layerid="'+layerid+'" >',
                         '<div class="thumbnail">',
                      '<img src="'+style.src+'">',
                      '<div class="caption">',
                        '<span>'+style.name+'</span>',                                 
                      '</div>',
                      '<input id="'+style.name+'-style-alias" type="text" value="'+style.name+'" >',
                      '<input id="'+style.name+'-style-selection" type="checkbox" aria-label="...">',
                  '</div>'].join("");
                html.push(div);
            });
            $("#frm-lis-styles").append(html);
            if (layer.style && layer.style !="") {
                var styles = layer.style.split(",");
                var aliases;
                switch (styles.length) {
                    case 1:
                        $(".layer-style[name='"+layer.style+"'] input[type='checkbox']").prop("checked",  "checked");
                        break;
                    default:
                        aliases = layer.stylesalias.split(",");
                        for (var i = 0; i<=styles.length ; i++) {
                            $(".layer-style[name='"+styles[i]+"'] input[type='checkbox']").prop("checked",  "checked");
                            $(".layer-style[name='"+styles[i]+"'] input[type='text']").val(aliases[i]);
                        }
                
                }
            }
        
        },
        
        showDistinctValues: function (values, option) {
            console.log(option);
            var html = [];
            $.each(values, function (id, value) {
                html.push('<a onclick="$(this).toggleClass(\'active\');" class="list-group-item">'+value+'</a>');
            });
            $("#distinct_values a").remove();
            $("#distinct_values").append(html.join(" "));
            $("#mod-featuresview").modal();
            $("#mod-featuresview").attr("data-target", option);
        
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
                    values.push("'"+value+"'");
                } else {
                    values.push(value);
                }
            });
            var expression ="";
            if (operator === "=") {
                expression = values[0];
            } else {
                expression = "("+values.join(",")+")";
            }
            filter = fld+ " " + operator + " " + expression;
            $("#frm-filter").val(filter);
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
            $(fields).each(function (id, fld) {               
                if (config.temp.layers[layerid].fields[fld]) {
                     $("#attribute_filter_fields, #opt-attributefield").append('<option value="'+fld+'">'+fld+'</option>');
                }
                //name, alias, type
                    var alias="";
                    var selected = "";
                    if (layer.fieldsoptions && layer.fieldsoptions[fld]) {
                        alias = layer.fieldsoptions[fld].alias;
                        selected = "selected";
                    } else {
                        alias = fld;
                        selected = "";
                    }
                    var item = ['<div class="row fld '+selected+'" data-field="'+fld+'" ><div class="col-md-3 fld-name">'+fld+'</div>',
                                    '<div class="col-md-3 fld-alias"><input type="text" value="'+alias+'" class="form-control"></div>',
                                    '<div class="col-md-3 fld-option">',
                                        '<select class="form-control" onchange="mv.fieldTypeSelectionChange(this)">',
                                                '<option value="false">Non utilisé</option>',
                                                '<option value="title">Titre</option>',
                                                '<option value="link">Lien</option>',
                                                '<option value="image">Image</option>',
                                                '<option value="text">Texte</option>',
                                        '</select></div></div>'].join("");
                                    
                                                                    
                                    
                   $("#frm-lis-fields").append(item);
                   if (layer.fieldsoptions && layer.fieldsoptions[fld]) {
                        $("#frm-lis-fields .fld[data-field='"+fld+"'] option[value='"+layer.fieldsoptions[fld].type+"']").prop("selected",  "selected");
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
            console.log(results);
            var html = [];
             $.each(results, function (index, result) {
                var div = ['<div class="ogc-result wms-result col-sm-6 col-md-4" data-title="'+result.title+'" data-layerid="'+result.layerid+'" data-metadata="'+result.metadata+'" data-metadata-csw="'+result['metadata-csw']+'" data-url="'+result.wms+'" data-attribution="'+result.attribution+'" data-type="wms">',
                        '<h3>'+result.title+'</h3>',
                        '<p>'+result.abstract+'</p>',
                      '<input id="'+result.layerid+'-ck" type="checkbox" aria-label="...">',
                  '</div>'].join("");
                html.push(div);
           });
           $("#wms-results").append(html).show();
        },
        
        getConfLayers: function () {
            var selected_layers = $(".ogc-result input[type='checkbox']:checked");            
            var counter = 0;
            var ogc_type = "";
            selected_layers.each(function(i,ctl) {
            if (ctl.checked) {
                    var conf = $(ctl).closest(".ogc-result").data();
                    if (counter > 0) {
                        addLayer('Nouvelle couche');
                        $(".list-group-item.layers-list-item").removeClass("active").last().addClass("active");
                    }                    
                    $(".layers-list-item.active")                        
                        .attr("data-type", "wms")
                        .attr("data-url", conf.url)
                        .attr("data-layerid", conf.layerid)
                        .attr("data-title", conf.title)
                        .attr("data-queryable", "true")
                        .attr("infoformat", "text/html")
                        .attr("data-metadata", conf.metadata)
                        .attr("data-metadata-csw", mv.escapeXml(conf.metadataCsw))
                        .attr("visible", true)
                        .attr("data-attribution", conf.attribution)
                        .find(".layer-name").text(conf.layerid);                        
                    
                        
                     var layer = {
                        "id": conf.layerid,
                        "title": conf.title,
                        "name": conf.title,
                        "type": "wms",           
                        "url": conf.url,
                        "queryable": true, 
                        "attribution": conf.attribution,
                        "infoformat": "text/html",      
                        "metadata": conf.metadata,
                        "metadata-csw" : mv.escapeXml(conf.metadataCsw),
                        "visible": true
                    };
                    
                    config.themes[$("#theme-edit").attr("data-themeid")].layers.push(layer);    
                }
                counter+=1;
             });
             $("#mod-layerNew").modal('hide');
             //remove selection from results
             $(".ogc-result input[type='checkbox']:checked").prop("checked",false);
        },
        
         resetSearch: function () {           
           $("#csw-results .csw-result").remove();
           $("#wms-results .wms-result").remove();
           $("#wfs-results .wfs-result").remove();
           
        },
        
        fieldTypeSelectionChange: function (select) {
            if ($(select).val() === "false") {
                $(select).closest(".fld").removeClass("selected");
            } else {
                $(select).closest(".fld").addClass("selected");
            }
        },
        
        showLayerOptions: function (el) {
            //clear forms
            $("#layer_conf1 form").trigger('reset');
            $("#layer_conf2 form").trigger('reset');
            $("#frm-lis-fields").empty();
            $("#layer_conf3 form").trigger('reset');
            $("#frm-lis-styles").empty();
            $("#layer_conf4 form").trigger('reset');
            $("#layer_conf5 form").trigger('reset');
             $("#layer_conf6 form").trigger('reset');
            $("#layer_sections>.tab-pane").removeClass('active').first().addClass('active');
            $("#layer_sections_menu li").removeClass('active').first().addClass('active');
            
            var layerid = el.attr("data-layerid");
            var themeid = $("#theme-edit").attr("data-themeid");
            
            function getLayerbyId(l) {
              return l.id === layerid;
            }
            var layer = config.themes[themeid].layers.find(getLayerbyId);
            
            $("#frm-type").val(layer.type).trigger("change");
            $("#frm-name").val(layer.title);
            $("#frm-scalemin").val(layer.scalemin);
            $("#frm-scalemax").val(layer.scalemax);
            $("#frm-opacity").val(layer.opacity);
            $("#frm-legendurl").val(layer.legendurl);
            $("#frm-layerid").val(layer.id);
            $("#frm-url").val(layer.url);
            $("#frm-queryable").prop("checked", (layer.queryable));
            $("#frm-featurecount").val(layer.featurecount);
            $("#frm-secure").prop("checked", (layer.secure)); 
            $("#frm-searchable").prop("checked", (layer.searchable));
            $("#frm-searchengine").val(layer.searchengine).trigger("change");
            $("#frm-fusesearchkeys").val(layer.fusesearchkeys);
            $("#frm-fusesearchresult").val(layer.fusesearchresult);
            $("#frm-infoformat option[value='"+layer.infoformat+"']").prop("selected", true).trigger("change");            
            $("#frm-metadata").val(layer.metadata);
            $("#frm-metadata-csw").val(layer["metadata-csw"]);
            $("#frm-visible").prop("checked", layer.visible);
            $("#frm-tiled").prop("checked", layer.tiled);
            $("#frm-attribution").val(layer.attribution);
            $("#frm-filter").val(layer.filter);
            if (layer.attributefilter) {
                $("#frm-attributelabel").val(layer.attributelabel);
                layer.attributevalues.split(",").forEach(function (value,id) {
                    $("#control_fields_tags").tagsinput('add', value);
                });
            }
            if (layer.usetemplate && layer.templateurl) {
                $("#frm-template").prop("checked", true);
                $("#frm-template-url").val(layer.templateurl);
                console.log(layer.templateurl);
            }
            if (layer.type === "wms") {
                $("a[href='#layer_conf4']").parent().show();
                $("a[href='#layer_conf5']").parent().show();
                ogc.getFieldsFromWMS(layer.url, layerid);
                ogc.getStylesFromWMS(layer.url, layerid);
            } else {
                $("a[href='#layer_conf4']").parent().hide();
                $("a[href='#layer_conf4']").parent().hide();
            }
        },
        
        writeFieldsOptions: function (layer) {
            var aliases = [];
            var fields = [];
            var template = {"title":"", "text":[], "photo":[], "link":[], "template":[]};            

            $.each(layer.fieldsoptions, function (index, options) {
                if (layer.usetemplate) {
                    switch (options.type) {
                        case "title":
                            template.title = '<h3 class="title-feature">{{'+options.name+'}}</h3>';
                            break;
                        case "text":
                            template.text.push('<div class="feature-text"><span>'+options.alias+':</span> {{'+options.name+'}}</div><br/>' );
                            break;
                        case "image":
                            template.photo.push('<img src="{{'+options.name+'}}" class="img-responsive" style="margin-top:5%;" />');
                            break;
                         case "link":
                            template.link.push('<a href="{{'+options.name+'}}" target="_blank">'+options.alias+'</a>');
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
            if (layer.usetemplate) {
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
                console.log(template.template.join(" \n"));
                layer.template = template.template.join(" \n");
            } else {            
                layer.fields = fields.join(",");
                layer.aliases = aliases.join(",");
            }
        },
        
        saveLayerOptions: function () {
            var el = $(".layers-list-item.active");
            var layerid = el.attr("data-layerid");
            var themeid = $("#theme-edit").attr("data-themeid");            
            function getLayerbyId(l) {
              return l.id === layerid;
            }
            var layer = config.themes[themeid].layers.find(getLayerbyId);
            if ( $("#frm-scalemin").val()>= 0 && $("#frm-scalemax").val()> 0) {
                layer.scalemin = $("#frm-scalemin").val();
                layer.scalemax = $("#frm-scalemax").val();
            } else {
                delete layer.scalemin;
                delete layer.scalemax;
            }
            layer.type =  $("#frm-type").val();
            layer.title =  $("#frm-name").val();
            layer.name =  $("#frm-name").val();
            layer.id = $("#frm-layerid").val();
            layer.url =  $("#frm-url").val();
            layer.legendurl =  $("#frm-legendurl").val();
            layer.queryable = ($("#frm-queryable").prop("checked") === true);
            layer.secure = ($("#frm-secure").prop("checked") === true);
            layer.searchable = ($("#frm-searchable").prop("checked") === true);
            layer.searchengine = $("#frm-searchengine").val();
            layer.fusesearchkeys = $("#frm-fusesearchkeys").val();
            layer.fusesearchresult = $("#frm-fusesearchresult").val();
            layer.infoformat = $("#frm-infoformat").val();
            layer.featurecount = $("#frm-featurecount").val();    
            layer.metadata = $("#frm-metadata").val();
            layer["metadata-csw"] = $("#frm-metadata-csw").val();
            layer["attribution"] = $("#frm-attribution").val();
            layer.visible = ($("#frm-visible").prop("checked") === true);
            layer.opacity = $("#frm-opacity").val();
            layer.tiled = ($("#frm-tiled").prop("checked") === true);
            layer.usetemplate = ($("#frm-template").prop("checked") === true);
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
            
            //Fields
            layer.fieldsoptions = {};            
            $("#frm-lis-fields option[value!='false']:selected").each(function (index, option) {
                var type = option.value;
                var field = $(option).closest(".fld").attr("data-field");
                var alias = $(option).closest(".fld").find(".fld-alias input").val();                
                layer.fieldsoptions[field] = {"name": field, "alias": alias, "type": type};                
            });
            mv.writeFieldsOptions(layer);
            //Fields
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
            
            $("#mod-layerOptions").modal('hide');
            
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
            $("#mod-codeview").modal();
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
                   layer_parameters[p] = [p, '="', l[p], '"'].join('');                    
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
                        "metadata",
                        "metadata-csw",
                        "attribution",
                        "queryable",
                        "searchable",
                        "searchengine",
                        "fusesearchkeys",
                        "fusesearchresult",
                        "secure",                        
                        "filter",
                        "sld",
                        "legendurl",
                        "scalemin",
                        "scalemax",
                        "featurecount",
                        "opacity" 
                ];
                optional_parameters.forEach(function(p,i) {
                    if (l[p]) {
                        layer_parameters[p] = [p, '="', l[p], '"'].join('');
                    }
                });
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
            return unsafe.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                }
            });
        },
        
        search : function () {
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
            console.log(title, texts, photos, links);
            
        },
        
        showHideQueryParameters : function (value) {
            if (value === "application/vnd.ogc.gml") {
                $("#query-parameters").addClass("visible");
            } else {
                $("#query-parameters").removeClass("visible");
            }
        },
        
        changeVisibleBaseLayer : function (visibleBaselayer) {
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
        
        changeSearchLocalities: function (value) {
            switch (value) {
                case "false":
                    $("#searchlocalities_options").hide();
                    break;
                 case "ban":
                 case  "geoportail":               
                    $("#searchlocalities_options").show();
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
        
        changeLayerType: function (value) {
           switch (value) {
            case "wms":
                $("#frm-searchengine option[value='fuse']").attr("disabled","disabled");
                break;
            case "geojson":                
                $("#frm-searchengine option[value='fuse']").removeAttr('disabled');
                break;
           }
        }
        
        
    }

})();
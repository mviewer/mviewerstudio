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
                html2.push('<option value="'+l.id+'" >'+l.label + ' - ' + l.title+'</option>');
           });
           $("#frm-bl").append(html);
           $("#frm-bl-visible").append(html2);
        },
        
        showStyles: function (styles, layerid) {
            $("#frm-lis-styles .layer-style").remove();
            var themeid = $("#theme-edit").attr("data-themeid");
            function getLayerbyId(l) {
              return l.id === layerid;
            }
            var layer = config.themes[themeid].layers.find(getLayerbyId);
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
        
        showDistinctValues: function (values) {
            var html = [];
            $.each(values, function (id, value) {
                html.push('<a onclick="$(this).toggleClass(\'active\');" class="list-group-item">'+value+'</a>');
            });
            $("#distinct_values a").remove();
            $("#distinct_values").append(html.join(" "));
        
        },

        saveAttributeFilter: function () {
            var values = [];
            var layerid = $(".layers-list-item.active").attr("data-layerid");
            var fld = $("#attribute_filter_fields").val();
            var operator = $("#attribute_filter_operators").val();
            var selected = $("#distinct_values a.active");
            var type = config.temp.layers[layerid].fields[fld].type;
            
            $.each(selected, function (id, value) {
                if (type === 'string') {
                    values.push("'"+$(value).text()+"'");
                } else {
                    values.push($(value).text());
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
            var themeid = $("#theme-edit").attr("data-themeid");
            function getLayerbyId(l) {
              return l.id === layerid;
            }
            var layer = config.themes[themeid].layers.find(getLayerbyId);            
            $(fields).each(function (id, fld) {
               
            if (config.temp.layers[layerid].fields[fld]) {
                 $("#attribute_filter_fields").append('<option value="'+fld+'">'+fld+'</option>');
            }
            attribute_filter_fields
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
            var layerid = el.attr("data-layerid");
            var themeid = $("#theme-edit").attr("data-themeid");
            
            function getLayerbyId(l) {
              return l.id === layerid;
            }
            var layer = config.themes[themeid].layers.find(getLayerbyId);
            
            $("#frm-type").val(layer.type);
            $("#frm-name").val(layer.title);
            $("#frm-layerid").val(layer.id);
            $("#frm-url").val(layer.url);
            $("#frm-queryable").prop("checked", (layer.queryable));            
            $("#frm-infoformat option[value='"+layer.infoformat+"']").prop("selected", true);            
            $("#frm-metadata").val(layer.metadata);
            $("#frm-metadata-csw").val(layer["metadata-csw"]);
            $("#frm-visible").prop("checked", layer.visible);
            $("#frm-attribution").val(layer.attribution);
            $("#frm-filter").val(layer.filter);
            if (layer.usetemplate && layer.template) {
                $("#frm-template").prop("checked", true);
                console.log(layer.template);
            }            
            ogc.getFieldsFromWMS(layer.url, layerid);
            ogc.getStylesFromWMS(layer.url, layerid);
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
                            template.text.push('<span>'+options.alias+':</span> {{'+options.name+'}}<br/>' );
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
            
            layer.type =  $("#frm-type").val();
            layer.title =  $("#frm-name").val();
            layer.id = $("#frm-layerid").val();
            layer.url =  $("#frm-url").val();
            layer.queryable = ($("#frm-queryable").prop("checked") === true);            
            layer.infoformat = $("#frm-infoformat").val();           
            layer.metadata = $("#frm-metadata").val();
            layer["metadata-csw"] = $("#frm-metadata-csw").val();
            layer["attribution"] = $("#frm-attribution").val();
            layer.visible = ($("#frm-visible").prop("checked") === true);
            layer.usetemplate = ($("#frm-template").prop("checked") === true);
            layer.filter = $("#frm-filter").val();
            
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
            
        },
        
        form2xml: function () {
            //Not complete eg fields, aliases...
            var str =[
                        '<layer',
                            '    type="'+$("#frm-type").val()+'"',                            
                            '    url="'+$("#frm-url").val()+'"',
                            '    id="'+$("#frm-layerid").val()+'"',
                            '    name="'+$("#frm-name").val()+'"',
                            '    queryable="'+($("#frm-queryable").prop("checked") === true)+'"',
                            '    infoformat="'+$("#frm-infoformat").val()+'"',
                            '    metadata="'+$("#frm-metadata").val()+'"',
                            '    metadata-csw="'+$("#frm-metadata-csw").val()+'"',
                            '    attribution="'+$("#frm-attribution").val()+'"',
                            '    filter="'+$("#frm-filter").val()+'"',
                            '    visible="'+($("#frm-visible").prop("checked") === true)+'">',
                        '</layer>'
                    ].join(" \n");
             console.log(str);
             $("#mod-codeview").modal();
             $("#mod-codeview pre").text(str);
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
        
        changeVisibleBaseLayer : function (visibleBaselayer) {
            $(".bl").removeClass("visible");
            $(".bl[data-layerid='"+visibleBaselayer+"']").addClass("visible");
        }
        
        
    }

})();
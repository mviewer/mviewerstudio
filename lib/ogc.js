var ogc = (function () {


   $.findNS = function (o, nodeName)
{
    return o.children().filter(function ()
    {
        if (this.nodeName)
            return this.nodeName.toUpperCase() == nodeName.toUpperCase();
        else
            return false;
    });
};


    //var _mode_layerFind = {type:'csw', url:'https://geobretagne.fr/geonetwork/srv/fre/csw', metadata_url:'https://geobretagne.fr/geonetwork/apps/georchestra/'};
              
    
    var _cswFilter = function (str, typeNames) {
        var resulttype = ['resultType="results_with_summary" startPosition="1" maxRecords="30" xmlns:gmd="http://www.isotc211.org/2005/gmd">',
            '<csw:Query typeNames="csw:Record"><csw:ElementSetName>full</csw:ElementSetName><csw:Constraint version="1.1.0">'].join('');
        if (typeNames = "gmd:MD_Metadata") {
            resulttype = ['resultType="results" outputSchema="csw:IsoRecord" startPosition="1" maxRecords="30">',
            '<csw:Query typeNames="gmd:MD_Metadata"><csw:ElementSetName>full</csw:ElementSetName><csw:Constraint version="1.1.0">'].join('');
        }
        return ['<?xml version="1.0" encoding="UTF-8"?>',
            '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="2.0.2" ',
            resulttype,
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">',
            '<ogc:And><ogc:And><ogc:Or>',
            '<ogc:PropertyIsLike wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>Type</ogc:PropertyName><ogc:Literal>dataset</ogc:Literal></ogc:PropertyIsLike>',
            '<ogc:PropertyIsLike wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>Type</ogc:PropertyName><ogc:Literal>series</ogc:Literal></ogc:PropertyIsLike>',
            '</ogc:Or></ogc:And>',
            /*'<ogc:BBOX>',
            '<gml:Envelope xmlns:gml="http://www.opengis.net/gml"><gml:lowerCorner>-180 -90</gml:lowerCorner>',
            '<gml:upperCorner>180 90</gml:upperCorner></gml:Envelope></ogc:BBOX>',*/
            '<ogc:Or><ogc:Or><ogc:PropertyIsEqualTo matchCase="true">',
            '<ogc:PropertyName>Title</ogc:PropertyName>',
            '<ogc:Literal>'+str+'</ogc:Literal>',
            '</ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo matchCase="true">',
            '<ogc:PropertyName>AlternateTitle</ogc:PropertyName>',
            '<ogc:Literal>'+str+'</ogc:Literal>',
            '</ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo matchCase="true">',
            '<ogc:PropertyName>Identifier</ogc:PropertyName>',
            '<ogc:Literal>'+str+'</ogc:Literal>',
            '</ogc:PropertyIsEqualTo><ogc:PropertyIsEqualTo matchCase="true">',
            '<ogc:PropertyName>ResourceIdentifier</ogc:PropertyName>',
            '<ogc:Literal>'+str+'</ogc:Literal>',
            '</ogc:PropertyIsEqualTo></ogc:Or><ogc:And><ogc:Or>',
            '<ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>Title</ogc:PropertyName>',
            '<ogc:Literal>'+str+'*</ogc:Literal></ogc:PropertyIsLike>',
            '<ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>AlternateTitle</ogc:PropertyName>',
            '<ogc:Literal>'+str+'*</ogc:Literal></ogc:PropertyIsLike>',
            '<ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>Abstract</ogc:PropertyName>',
            '<ogc:Literal>'+str+'*</ogc:Literal>',
            '</ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>Subject</ogc:PropertyName>',
            '<ogc:Literal>'+str+'*</ogc:Literal>',
            '</ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">',
            '<ogc:PropertyName>OrganisationName</ogc:PropertyName>',
            '<ogc:Literal>'+str+'*</ogc:Literal>',
            '</ogc:PropertyIsLike></ogc:Or></ogc:And></ogc:Or></ogc:And></ogc:Filter>',
            '</csw:Constraint><ogc:SortBy xmlns:ogc="http://www.opengis.net/ogc">',
            '<ogc:SortProperty><ogc:PropertyName>Relevance</ogc:PropertyName><ogc:SortOrder>DESC</ogc:SortOrder>',
            '</ogc:SortProperty></ogc:SortBy></csw:Query></csw:GetRecords>'].join('');
      };
      
      var _cswParse = function (xml, csw_url, metadata_url, typeNames) {
            var results = [];            
            if (typeNames === "gmd:MD_Metadata") {                
                $.each($(xml).find("gmd\\:MD_Metadata, MD_Metadata"), function( index, metadata ) {
                    var layer = {};                    
                    layer.identifier = $(metadata).find("gmd\\:fileIdentifier, fileIdentifier").find("gco\\:CharacterString, CharacterString").text();                    
                    layer.abstract = $(metadata).find("gmd\\:identificationInfo, identificationInfo").find("gmd\\:MD_DataIdentification,  MD_DataIdentification")
                    .find("gmd\\:abstract, abstract").find("gco\\:CharacterString, CharacterString").text();
                    layer.attribution = $(metadata).find("gmd\\:identificationInfo, identificationInfo").find("gmd\\:MD_DataIdentification,  MD_DataIdentification")
                    .find("gmd\\:pointOfContact, pointOfContact").find("gmd\\:CI_ResponsibleParty, CI_ResponsibleParty").find("gmd\\:organisationName, organisationName")
                    .find("gco\\:CharacterString, CharacterString").text();
                    layer.image = $(metadata).find("gmd\\:identificationInfo, identificationInfo").find("gmd\\:MD_DataIdentification,  MD_DataIdentification")
                    .find("gmd\\:graphicOverview, graphicOverview").find("gmd\\:fileName, fileName").find("gco\\:CharacterString, CharacterString").text();
                    layer.wms = $(metadata).find("gmd\\:protocol, protocol").find("gco\\:CharacterString, CharacterString").filter(function( index, el ) {
                        return $(el).text().search("OGC:WMS") >= 0;
                    }).parent().parent().find("gmd\\:URL, URL").text().split("?")[0];                    
                    layer.wfs = $(metadata).find("gmd\\:protocol, protocol").find("gco\\:CharacterString, CharacterString").filter(function( index, el ) {
                        return $(el).text().search("OGC:WFS") >= 0;
                    }).parent().parent().find("gmd\\:URL, URL").text().split("?")[0];                    
                    layer.layerid = $(metadata).find("gmd\\:protocol, protocol").find("gco\\:CharacterString, CharacterString").filter(function( index, el ) {
                        return $(el).text().search("OGC:WMS") >= 0;
                    }).parent().parent().find("gmd\\:name, name").find("gco\\:CharacterString, CharacterString").text();                    
                    layer.title = $(metadata).find("gmd\\:identificationInfo, identificationInfo").find("gmd\\:MD_DataIdentification,  MD_DataIdentification")
                    .find("gmd\\:citation, citation").find("gmd\\:CI_Citation, CI_Citation").find("gmd\\:title, title").find("gco\\:CharacterString, CharacterString").text();
                    layer.metadata = metadata_url + layer.identifier;
                    layer['metadata-csw'] = csw_url + '?SERVICE=CSW&VERSION=2.0.2&REQUEST=GetRecordById&elementSetName=full&ID&ID=' + layer.identifier;
                    if (layer.layerid!="" && layer.wms!="") {
                        results.push(layer);     
                     } else {
                        console.log("Fiche de métadonnée incomplète : "+ layer.identifier);
                     } 
                });
            
            } else {
                $.each($(xml).find("Record"), function( index, metadata ) {                
                    var layer = {};
                    layer.identifier = $(metadata).find('identifier').text();
                    layer.image = $(metadata).find('[protocol="image/png"]').text();
                    layer.abstract = $(metadata).find('abstract').text();
                    layer.wms = $(metadata).find('[protocol="OGC:WMS"]').text().split("?")[0];
                    layer.wfs = $(metadata).find('[protocol="OGC:WFS"]').text().split("?")[0];
                    layer.layerid = $(metadata).find('[protocol="OGC:WMS"]').attr('name');
                    layer.title = $(metadata).find("title").first().text();
                    layer.attribution="Attributions";
                    layer.metadata = metadata_url + layer.identifier;
                    layer['metadata-csw'] = csw_url + '?SERVICE=CSW&VERSION=2.0.2&REQUEST=GetRecordById&elementSetName=full&ID&ID=' + layer.identifier;
                    results.push(layer);               
                });
            }
            
            mv.showCWSResults(results);
      };
      
      var _cswAjax = function (url, body, metadata_url, typeNames) {                
                $.ajax({
                    type: "POST",
                    url: mv.ajaxURL(url),
                    crossDomain: true,
                    data: body,
                    dataType: "xml",
                    contentType: "application/xml",
                    success: function (data) {
                        _cswParse(data, url, metadata_url, typeNames);
                    },                
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Problème avec la requête" +  thrownError);
                    }
                });
      };
      
      var _wmsCapabilitiesParse = function (data, layerid) {
        var layer =  $(data).find("Layer Layer Name").filter(function( index, name ) {
             return $(name).text() === layerid;
        }).parent();
        var styles = layer.find("Style");
        var crs = layer.find("CRS").first().text();
        config.temp.layers[layerid].projection = crs;
        var lst = [];
        styles.each(function (index, style) {            
            lst.push({"name" : $(style).find("Name").text(), "src": $(style).find("OnlineResource").attr("xlink\:href")});
        });
        mv.showStyles(lst, layerid);
      };
      
    var _wmsParse = function (xml, keyword) {
        var results = {};
        var parentLayerId = undefined;
        var parentExtTitle = undefined;

        // Parse one Layer item and its Layer subitems
        function parseLayer(index, l) {
            var layer = {};
            var previousParentLayerId = parentLayerId;
            var previousParentExtTitle = parentExtTitle;

            layer.abstract = $(l).find('Abstract').text();
            layer.wms = $(xml).find('Capability>Request>GetCapabilities>DCPType>HTTP>Get>OnlineResource').attr("xlink\:href").replace(":80","").split("?")[0];
            layer.layerid = $(l).find(">Name").text();
            layer.parentLayerId = parentLayerId;
            layer.title = $(l).find(">Title").text();
            if (parentLayerId) {
                layer.extTitle = parentExtTitle + " > " + layer.title;
            } else {
                layer.extTitle = layer.title;
            }
            layer.attribution = $(l).find("Attribution Title").text();
            layer.metadata = $(l).find('MetadataURL[type="TC211"]>OnlineResource').attr("xlink\:href");
            layer['metadata-csw'] = $(l).find('MetadataURL[type="ISO19115\:2003"]>OnlineResource').attr("xlink\:href");

            // Filter layers with regard to the provided keyword
            if (keyword) {
                if ((layer.title.toLowerCase().search(keyword.toLowerCase()) >= 0) || (layer.abstract.toLowerCase().search(keyword.toLowerCase()) >= 0)) {
                    results[layer.layerid] = layer;
                }
            } else {
                results[layer.layerid] = layer;
            }

            // Parse sublayers
            if ($(l).find(">Layer").length > 0) {
                parentLayerId = layer.layerid;
                parentExtTitle = layer.extTitle;
                $(l).find(">Layer").each(parseLayer);
            }

            // Reset parent layer id to the previous value
            parentLayerId = previousParentLayerId;
            parentExtTitle = previousParentExtTitle;
        }

        // Search the first level Layer item(s) (there should be only one)
        $(xml).find("Capability>Layer").each(parseLayer);

        mv.showWMSResults(results);
    };
      
      var _wmsAjax = function (url, keyword) {
                var url2 = mv.ajaxURL(url+'?REQUEST=GetCapabilities&SERVICE=WMS&Version=1.3.0');
                $.ajax({
                    type: "GET",
                    url: url2,
                    crossDomain: true,                    
                    dataType: "xml",
                    contentType: "application/xml",
                    success: function (data) {
                        _wmsParse(data, keyword);
                    },                
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Problème avec la requête WMS GetCapabilities" +  thrownError);
                    }
                });
      };
      
      var _DescribeFeatureTypeParse = function (data, typename, layerid, url) {
        var fields = [];        
        var layer = {wfs_url: url, fields:{}};
        $(data).find("xsd\\:sequence, sequence").find("xsd\\:element, element").each(function (id, fld){
            var _type;
            var xml_type = $(fld).attr("type");
            if (xml_type.search("gml")!= -1) {
                _type = "geometry";
                layer.geometry = $(fld).attr("name");
            } else if (xml_type.search("string")!= -1) {
                _type = "string";
                fields.push($(fld).attr("name"));
                layer.fields[$(fld).attr("name")] = {"type": _type};
            } else {
                _type = "number";
                fields.push($(fld).attr("name"));
                layer.fields[$(fld).attr("name")] = {"type": _type};
            }
            config.temp.layers[layerid] = layer;            
        });       
        mv.showFields(fields, layerid);        
      };
      
      var _getFields = function (url, typename, layerid) {
         $.ajax({
                    type: "GET",
                    url: mv.ajaxURL(url+'?SERVICE=WFS&VERSION=1.1.0&REQUEST=DescribeFeatureType&TYPENAME='+typename),
                    crossDomain: true,                    
                    dataType: "xml",
                    contentType: "application/xml",
                    success: function (data) {
                        _DescribeFeatureTypeParse(data, typename, layerid, url);
                    },                
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Problème avec la requête WFS DescribeFeatureType" +  thrownError);
                    }
                });
      };
      
        var _getStyles = function (url, layerid) {                  
            var url2 = mv.ajaxURL(url+'?REQUEST=GetCapabilities&SERVICE=WMS&Version=1.3.0');
                    
         $.ajax({
                    type: "GET",
                    url: url2,
                    crossDomain: true,                    
                    dataType: "xml",
                    contentType: "application/xml",
                    success: function (data) {
                        _wmsCapabilitiesParse(data, layerid);
                    },                
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Problème avec la requête WMS GetCapabilities" +  thrownError);
                    }
                });
      };
      
      var _describeLayerParse = function (xml, layerid) {        
        var wfs_url = $(xml).find("LayerDescription").attr("wfs").split("?")[0];
        var typename = $(xml).find("LayerDescription Query").attr("typeName");
        _getFields(wfs_url, typename, layerid);
        
      };
      var _getWFSUrl = function (wms_url, layerid) {        
         $.ajax({
                    type: "GET",
                    url: mv.ajaxURL(wms_url+'?SERVICE=WMS&VERSION=1.1.1&REQUEST=DescribeLayer&LAYERS='+layerid),
                    crossDomain: true,                    
                    dataType: "xml",
                    contentType: "application/xml",
                    success: function (data) {
                        _describeLayerParse(data, layerid);
                    },                
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Problème avec la requête DescribeLayer" +  thrownError);
                    }
                });
      };
      
      var _getDictinctValues = function (data, propertyname, option) {
        var distinctValues = [];
        var testValues = {};
        $.each(data.features, function (id,feature) {
            var value = feature.properties[propertyname];
            if (!testValues[value]) {
                distinctValues.push(value);
                testValues[value] = true;
            }            
        });
        mv.showDistinctValues(distinctValues, option);
      };

    return {
    
        /*setLayerFinderMode: function (options) {
            _mode_layerFind = options;
        },*/
        
        cswSearch: function (url, keyword, metadata_url) {
            //var typeNames = "csw:Record";
            var typeNames = "gmd:MD_Metadata";
            var filter = _cswFilter(keyword, typeNames);
            _cswAjax(url, filter, metadata_url, typeNames);
        },  
        
        wmsSearch: function (url, keyword) {            
            _wmsAjax(url, keyword);
        },
        
        getFieldsFromWMS (url, layerid) {
            _getWFSUrl (url, layerid);
        },
        
        getStylesFromWMS (url, layerid) {
            _getStyles (url, layerid);
        },
        
        getFeatures (url, typename, propertyname, option) {            
             $.ajax({
                    type: "GET",
                    url: mv.ajaxURL(url+'?SERVICE=WFS&VERSION=1.0.0&REQUEST=GETFEATURE&TYPENAME='+typename+'&outputFormat=application/json&propertyName='+propertyname+'&maxFeatures=100'),
                    crossDomain: true,                    
                    dataType: "json",
                    contentType: "application/json",
                    success: function (data) {
                        _getDictinctValues(data, propertyname, option);
                    },                
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Problème avec la requête GetFeature" +  thrownError);
                    }
                });
            
        }
    }

})();
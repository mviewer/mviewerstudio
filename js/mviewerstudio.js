var _conf;
var API = {};

var mviewer = {};

$(document).ready(function(){

    //Get URL Parameters
    if (window.location.search) {
        $.extend(API, $.parseJSON('{"' + decodeURIComponent(window.location.search.substring(1)
            .replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}'));
    }
    fetch("apps/config.json", {
        method: "GET",
        header: {
            contentType: "application/json"
        }
    })
        .then(r => r.json())
        .then(data => {
            //Mviewer Studio version
            console.groupCollapsed("init app from config");
            _conf = data.app_conf;
            const VERSION =  _conf.mviewerstudio_version
            console.log("MviewerStudio version " + VERSION);
            if (_conf.proxy === undefined) {
                _conf.proxy = "../proxy/?url=";
            }

            if (_conf.logout_url) {
                $("#menu_user_logout a").attr("href", _conf.logout_url);
            }

            // Update web page title and title in the brand navbar
            document.title = _conf.studio_title;
            $("#studio-title").text(_conf.studio_title);

            // Base layers
            mv.showBaseLayers(_conf.baselayers, "default-bl");
            // Sélection par défaut des 2 1er baselayers
            $("#frm-bl .bl input").slice(0,2).prop("checked",true).trigger('change');
            $("#frm-bl-visible").val($("#frm-bl-visible option:not(:disabled)").first().val());

            // Map extent
            map2.getView().setCenter(_conf.map.center);
            map2.getView().setZoom(_conf.map.zoom);

            // Form placeholders
            $("#opt-title").attr("placeholder", _conf.app_form_placeholders.app_title);
            $("#opt-logo").attr("placeholder", _conf.app_form_placeholders.logo_url);
            $("#opt-help").attr("placeholder", _conf.app_form_placeholders.help_file);

            // translate
            _initTranslate();

            var csw_providers = [];
            var wms_providers = [];
            if (_conf.external_themes && _conf.external_themes.used && _conf.external_themes.url) {
                    $.ajax({
                    type: "GET",
                    url: _conf.external_themes.url,
                    success: function (csv) {
                        _conf.external_themes.data = Papa.parse(csv, {
                            header: true
                        }).data;
                        mv.getThemeTable(_conf.external_themes.data);
                    }
                    });
            } else {
                $("#btn-importTheme").remove();
            }

            nb_providers = 0

            if (_conf.data_providers && _conf.data_providers.csw) {
                _conf.data_providers.csw.forEach(function(provider, id) {
                    var cls = "active";
                    if (nb_providers > 0) {
                        cls ="";
                    }
                    csw_provider_html = '<li class="' + cls + '">';
                    csw_provider_html += '<a onclick="setActiveProvider(this);" href="#" class="dropdown-item"';
                    csw_provider_html += ' data-providertype="csw" data-provider="' + provider.url + '"';
                    if (provider.baseref) {
                        csw_provider_html += ' data-metadata-app="' + provider.baseref + '"';
                    }
                    csw_provider_html += '>' + provider.title + '</a></li>';
                    csw_providers.push(csw_provider_html);
                    nb_providers ++;
                });
                $("#providers_list").append(csw_providers.join(" "));
                if (_conf.data_providers.csw.length > 0) {
                    $("#providers_list").append('<li role="separator" class="divider"></li>');
                }
            }

            if (_conf.data_providers && _conf.data_providers.wms) {
                _conf.data_providers.wms.forEach(function(provider, id) {
                    var cls = "active";
                    if (nb_providers > 0) {
                        cls ="";
                    }
                    wms_providers.push('<li class="' + cls + '">' +
                        '<a onclick="setActiveProvider(this);" data-providertype="wms" class="dropdown-item"' +
                        ' data-provider="' + provider.url + '" href="#">' +
                        provider.title + '</a></li>');
                    nb_providers ++;
                });

                $("#providers_list").append(wms_providers.join(" "));
                if(_conf.data_providers.wms.length > 0) {
                    $("#providers_list").append('<li role="separator" class="divider"></li>');
                }
            }

            if (API.xml) {
                loadApplicationParametersFromRemoteFile(API.xml);
            } else if (API.wmc) {
                loadApplicationParametersFromWMC(API.wmc);
            } else {
                newConfiguration();
            }

            updateProviderSearchButtonState();

            // Default params for layers
            if (_conf.default_params && _conf.default_params.layer) {
                mv.setDefaultLayerProperties(_conf.default_params.layer);
            }

            // Get user info
            getUser();
            console.groupEnd("init app from config");
        })
        .catch(err => {
            console.log(err);
            alertCustom("Impossible de récupérer la configuration. Veuillez contacter un administrateur.", "danger")
        });
});

//EPSG:2154
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

ol.proj.proj4.register(proj4);

//Map
var map = new ol.Map({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    target: 'map'
});

var savedParameters;

//Map_filter
var draw;
var source = new ol.source.Vector({wrapX: false});
var vector = new ol.layer.Vector({
    source: source
});
var map2 = new ol.Map({
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        vector
    ],
    target: 'map_filter'
});
var config;

const getUser = () => {
    if (!_conf.user_info) return;
    fetch(_conf.user_info, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => {
            var userGroupFullName = "";
            var userGroupSlugName = "";
            var selectGroupPopup = false;
            if (data) {
                if (data.organisation && data.organisation.legal_name) {
                    userGroupFullName = data.organisation.legal_name;
                } else if (data && data.user_groups ) {
                    if (data.user_groups.length > 1) {
                        selectGroupPopup = true;
                    } else {
                        userGroupFullName = data.user_groups[0].full_name;
                        userGroupSlugName = data.user_groups[0].slug_name;
                    }
                }
                if (selectGroupPopup) {
                    mv.updateUserGroupList(data);
                    $("#mod-groupselection").modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                } else {
                    mv.updateUserInfo({
                        userName: data.user_name,
                        name: `${ data.first_name } ${ data.last_name }`,
                        groupSlugName: userGroupSlugName || slugify(userGroupFullName),
                        groupFullName: userGroupFullName
                    });
                }
                if (_conf.user_info_visible && data.user_name != "anonymous") {
                    let connectText = `Connecté en tant que ${ data.first_name } ${ data.last_name } (${userGroupFullName})`
                    $("#user_connected").text(connectText);
                    document.querySelector("#user_connected").classList.remove("d-none");
                    document.querySelector("#menu_user_logout").classList.remove("d-none");
                }
            }
        })
        .catch(err => alertCustom(mviewer.tr('msg.user_info_retrieval_error'), 'danger'))
}

var newConfiguration = function (infos) {
    ["opt-title", "opt-logo", "optProxyUrl", "opt-favicon", "opt-help", "opt-home", "theme-edit-icon", "theme-edit-title"].forEach(function (param, id) {
        $("#"+param).val("");
    });

    // default checked state
    ["opt-exportpng", "opt-zoomtools", "opt-geoloc", "opt-mouseposition", "opt-studio", "opt-measuretools", "opt-initialextenttool", "theme-edit-collapsed", "opt-mini", "opt-showhelp", "opt-coordinates",
        "opt-togglealllayersfromtheme", "SwitchAdressSearch", "SwitchCustomBackground", "SwitchAdvanced"
    ].forEach(id => {
        document.querySelector(`#${ id }`).checked = false;
    });
    ["opt-zoomtools", "opt-measuretools", "opt-initialextenttool"].forEach(id => {
        document.querySelector(`#${ id }`).checked = true;
    });
    
   
    $("#opt-style").val("css/themes/default.css").trigger("change");
    $("#frm-searchlocalities").val("ban").trigger("change");    
    $("#mod-themeOptions").modal('hide');
    $('#FadvElasticBlock form').trigger("reset");

    // Icon help 
    var icon = 'fas fa-home';
    $("#opt-iconhelp").val(icon);
    $("#opt-iconhelp").siblings('.selected-icon').attr('class', 'selected-icon');
    $("#opt-iconhelp").siblings('.selected-icon').addClass(icon);
    
    map.getView().setCenter(_conf.map.center);
    map.getView().setZoom(_conf.map.zoom);
    const newDate = moment()
    config = {
        application: { title: "", logo: "" },
        themes: {},
        date: infos?.date || newDate.toISOString(),
        temp: { layers: {} },
        id: infos?.id || mv.uuid(),
        description: newDate.format("DD-MM-YYYY-HH-mm-ss"),
        isFile: !!infos?.id,
        relation: infos?.relation
    };
    //Store des parametres non gérés
    savedParameters = {"application":[], "baselayers": {}};
    $("#themes-list, #themeLayers, #liste_applications, #distinct_values").find(".list-group-item").remove();
    $("#frm-bl .custom-bl").remove();
    $("#nameAppBlock").empty();

    // Gestion des accordéons    
    ["collapseSearch", "collapseHomePage", "collapseFondPlan", "collapseElasticSearch"].forEach(function (param) {
        $("#"+param).collapse("hide");
    });

    // Gestion des fonds de plan 
    $("#frm-bl .bl input").prop("checked",false).trigger('change');
    $("#frm-bl .bl input").slice(0,2).prop("checked",true).trigger('change');
    $("#frm-bl-mode").val("default").trigger("change");   
    $("#frm-bl-visible").val($("#frm-bl-visible option:not(:disabled)").first().val());

    //Init advanced options
    $('.advanced').css("display", "none");

    // Init du wizard 
    $('#stepStudio').find('.nav-item a:first').tab('show');
    $('#navWizFadv').css("display", "none");
    
};


var loadLayers = function (themeid) {
    var theme = config.themes[themeid];
    if (theme) {
        $.each(theme.layers, function (index, layer) {
            addLayer(layer.title, layer.id, layer.index);
        });
    }
};

var sortableLayerList = Sortable.create(document.getElementById('themeLayers'), {
    handle: '.moveList',
    animation: 150,
    ghostClass: 'ghost',
    onEnd: function (evt) {
        sortLayers(evt.oldIndex, evt.newIndex);
    }
});

var deleteThemeItem = function (btn) {
    var el = $(btn).closest(".list-group-item")[0];
    var themeid = $(el).attr("data-themeid");
    deleteTheme(themeid);
    el && el.parentNode.removeChild(el);
};

var deleteLayerItem = function (btn) {
    var el = $(btn).closest(".layers-list-item")[0];
    deleteLayer(el.getAttribute('data-layerid'));
    el && el.parentNode.removeChild(el);
};

var sortableThemeList = Sortable.create(document.getElementById('themes-list'), {
    handle: '.moveList',
    animation: 150,
    ghostClass: 'ghost',
    onEnd: function (evt) {
        sortThemes();
    }
});

sortThemes = function () {
    var orderedThemes = {};
    $(".themes-list-item").each(function(i,item) {
        var id = $(this).attr("data-themeid");
        orderedThemes[id] = config.themes[id];
    });
    config.themes = orderedThemes;
};

setConf = (key, value) => {
    _conf[key] = value
};

getConf = (key) => _conf[key]

sortLayers = function (fromIndex, toIndex) {
    var themeid = $("#themes-list .active").attr("data-themeid");
    var arr = config.themes[themeid].layers;
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
};

var sortableAttributeList = Sortable.create(document.getElementById('frm-lis-fields'), {
    handle: '.bi-arrows-move',
    animation: 150,
    ghostClass: 'ghost',
});

$('input[type=file]').change(function () {
    loadApplicationParametersFromFile();
});


var addLayer = function (title, layerid, index) {
    // test if theme is saved
    if (!config.themes[$("#theme-edit").attr("data-themeid")]) {
        saveTheme();
    }
    var item = $("#themeLayers").append(`
        <div class="list-group-item layers-list-item" data-layerid="${layerid}">
            <span class="layer-name moveList">${title}</span>
            <div class="layer-options-btn" style="display:inline-flex; justify-content: end;">
                <button class="btn btn-sm btn-secondary"><span class="layer-move moveList" title="Déplacer"><i class="bi bi-arrows-move"></i></span></button>
                <button class="btn btn-sm btn-secondary" onclick="deleteLayerItem(this);"><span class="layer-remove" title="Supprimer"><i class="bi bi-x-circle"></i></span></button>
                <button class="btn btn-sm btn-info" onclick="editLayer(this);"><span class="layer-edit" title="Editer cette couche"><i class="bi bi-gear-fill"></i></span></button>
            </div>
        </div>`);

     if (title === 'Nouvelle couche') {
        item.find(".layer-edit").last().click();
     }
};

var editLayer = function (item) {
    $("#themeLayers .list-group-item").removeClass("active");
    var element = $(item).parent().parent();
    element.addClass("active");
    var title = element.find(".layer-name").text();
    var layerid = element.attr("data-layerid");
    if (layerid != "undefined") {
        $("#mod-layerOptions").modal('show');
        $("#mod-themeOptions").modal('hide');
        mv.showLayerOptions(element);
    } else {
        $("#input-ogc-filter").val("")
        $("#csw-results .csw-result").remove();
        $("#mod-layerNew").modal('show');
        $("#mod-themeOptions").modal('hide');
    }
};

var importThemes = function () {
    console.groupCollapsed("importThemes");
    //console.log("external theme to import", _conf.external_themes.data);
    $("#tableThemaExt .selected").each(function (id, item) {
        var url = $(item).attr("data-url");
        var id  = $(item).attr("data-theme-id");
        var label  = $(item).attr("data-theme-label");
        addTheme(label, true, id, false, url, "default");
    });
    console.groupEnd("importThemes");
    $("#mod-themesview").modal('hide');
};

var addTheme = function (title, collapsed, themeid, icon, url, layersvisibility) {
    if ($("#mod-themeOptions").is(":visible")) {
        alert(mviewer.tr('msg.save_theme_first'));        
        return;
    }
    if (url) {
        //external theme
        $("#themes-list").append(`
            <div class="list-group-item list-group-item themes-list-item" data-theme-url="${url}" data-theme="${title}" data-themeid="${themeid}" data-theme-collapsed="${collapsed}" data-theme-icon="${icon}" data-theme-layersvisibility="${layersvisibility}">
                <div class="theme-infos">
                    <span class="theme-name moveList">${title}</span><span class="theme-infos-layer">Ext.</span>
                </div>
                <div class="theme-options-btn">
                    <button class="btn btn-sm btn-secondary" ><span class="theme-move moveList" title="Déplacer"><i class="bi bi-arrows-move"></i></span></button>
                    <button class="btn btn-sm btn-secondary" onclick="deleteThemeItem(this);" ><span class="theme-remove" title="Supprimer"><i class="bi bi-x-circle"></i></span></button>
                    <button class="btn btn-sm btn-info" onclick="editThemeExt(this);"><span class="theme-edit" title="Editer ce thème"><i class="bi bi-gear-fill"></i></span></button>
                </div>
            </div>`
        );
    } else {
         $("#themes-list").append([
        '<div class="list-group-item themes-list-item" data-theme="'+title+'" data-themeid="'+themeid+'" data-theme-collapsed="'+collapsed+'" data-theme-icon="'+icon+'">',   
            '<div class="theme-infos">',
                '<span class="theme-name moveList">'+title+'</span><span class="theme-infos-layer">0</span>',
            '</div>',
            '<div class="theme-options-btn">',
                '<button class="btn btn-sm btn-secondary" ><span class="theme-move moveList" title="Déplacer"><i class="bi bi-arrows-move"></i></span></button>',
                '<button class="btn btn-sm btn-secondary" onclick="deleteThemeItem(this);" ><span class="theme-remove" title="Supprimer"><i class="bi bi-x-circle"></i></span></button>',
                '<button class="btn btn-sm btn-info" onclick="editTheme(this);"><span class="theme-edit" title="Editer ce thème"><i class="bi bi-gear-fill"></i></span></button>',                
            '</div>',
        '</div>'].join(""));
    }
    config.themes[themeid] = {
        title:title,
        id: themeid,
        icon: icon,
        collapsed: collapsed,
        layersvisibility: layersvisibility,
        url: url,
        layers: []
    };
    if (title === "Nouvelle thématique") {
        $(".themes-list-item[data-themeid='"+themeid+"'] .theme-edit").parent().trigger("click");
    }
};

var editTheme = function (item) {
    $("#themes-list .list-group-item").removeClass("active");
    $(item).parent().parent().addClass("active");
    var title = $(item).parent().parent().attr("data-theme");
    var themeid = $(item).parent().parent().attr("data-themeid");
    var collapsed = ($(item).parent().parent().attr("data-theme-collapsed")==="true")?false:true;
    var icon = $(item).parent().parent().attr("data-theme-icon");
    if (icon === "undefined") icon = 'fas fa-caret-right';

    $("#mod-themeOptions").modal('show');
    $("#theme-edit-title").val(title);
    $("#theme-edit-collapsed").prop('checked', collapsed);
    $("#theme-edit").attr("data-themeid", themeid);
    $("#theme-pick-icon").val(icon);
    $("#theme-pick-icon").siblings('.selected-icon').attr('class', 'selected-icon');
    $("#theme-pick-icon").siblings('.selected-icon').addClass(icon);

    //Remove old layers entries
    $(".layers-list-item").remove();
    //Show layerslm
    loadLayers(themeid);
};

var saveTheme = function () {
    //get active item in left panel
    var theme = $("#themes-list .active");
    //get edited values (right panel)
    var title = $("#theme-edit-title").val();
    var themeid = $("#theme-edit").attr("data-themeid");
    var collapsed = !$("#theme-edit-collapsed").prop('checked');
    var icon = $.trim($("#theme-pick-icon").val());
    //update values in left panel
    theme.attr("data-theme", title);
    theme.attr("data-theme-collapsed", collapsed);
    theme.attr("data-theme-icon", icon);
    theme.find(".theme-name").text(title);
    var nb_layers = $("#themeLayers .list-group-item").length;
    theme.find(".theme-infos-layer").text(nb_layers);
    //deactivate theme edition
    $("#themes-list .list-group-item").removeClass("active");
    $("#mod-themeOptions").modal('hide');

    //save theme locally
    config.themes[themeid].title = title;
    config.themes[themeid].id = themeid;
    config.themes[themeid].collapsed = collapsed;
    config.themes[themeid].icon = icon;
};

var editThemeExt = function (item) {    
    $("#themes-list .list-group-item").removeClass("active");
    $(item).parent().parent().addClass("active");
    var themeid = $(item).parent().parent().attr("data-themeid");
    $("#themeExt-edit").attr("data-themeid", themeid);
    document.getElementById("nameThemeExt").innerHTML = "";
    var title = $(item).parent().parent().attr("data-theme");
    var titleBlock = document.getElementById("nameThemeExt");
    titleBlock.append(title);
    var layersvisibility = $(item).parent().parent().attr("data-theme-layersvisibility");
    $("#themeext-layersvisibility").val(layersvisibility);
    $("#mod-themeExtOptions").modal('show');
};

var saveThemeExt = function () {
    //get active item in left panel
    var theme = $("#themes-list .active");
    //get edited values
    var themeid = $("#themeExt-edit").attr("data-themeid");
    var layersvisibility = $("#themeext-layersvisibility").val();
    theme.attr("data-theme-layersvisibility", layersvisibility);    
    //save theme locally
    config.themes[themeid].layersvisibility = layersvisibility;
    //deactivate theme edition
    $("#themes-list .list-group-item").removeClass("active");
    $("#mod-themeExtOptions").modal('hide');
};

var deleteTheme = function (themeid) {
    $("#mod-themeOptions").modal('hide');
    delete config.themes[themeid];
};

var deleteLayer = function (layerid) {
    var themeid = $("#theme-edit").attr("data-themeid");
    var index = config.themes[themeid].layers.findIndex(function(l){return l.id === layerid});
    config.themes[themeid].layers.splice(index, 1);
};

var createId = function (obj) {
    var d = new Date();
    var df = d.getFullYear() + ("0"+(d.getMonth()+1)).slice(-2)+
        ("0" + d.getDate()).slice(-2) + ("0" + d.getHours()).slice(-2) + ("0" + d.getMinutes()).slice(-2) + ("0" + d.getSeconds()).slice(-2);
    return obj+'-' + df;
};

var createBaseLayerDef = function (bsl) {
    var parameters ="";
    $.each(bsl, function(param, value) {
        if (param === "attribution") {
            value = mv.escapeXml(value);
        }
        parameters += param+'="' + value +'" ';
    });
    return parameters;
};

var deleteMyApplications = function () {
    if (!_conf?.php?.delete_service) {
        return alert("Erreur de la configuration : contactez un administrateur !");
    }
    $.ajax({
        type: "GET",
        url: _conf.php.delete_service,
        success: function( data ) {
            alert(data.deleted_files + mviewer.tr('msg.deleted_apps'));
            mv.getListeApplications();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error("map files deletion failed", {
                xhr: xhr,
                ajaxOptions: ajaxOptions,
                thrownError: thrownError
            });
            alert(mviewer.tr('msg.delete_req_error'));
        }
    });
};

var deleteApplication = (id) => {
    return fetch(`${_conf.api}/${id}`, {
        method: "DELETE"
    })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(r => r.success && showHome())    
    .then(alertCustom('Application supprimée avec succès !', 'info'))
    .catch(err => alertCustom("Suppression impossible.", "danger"))
};

var showAlertDelApp = (id) => {
    genericModalContent.innerHTML = "";
    genericModalContent.innerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title" i18n="modal.exit.title">Attention</h5>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <p>
                    Êtes-vous sûr de vouloir supprimer votre application définitivement ?
                    </p>
                    <a class="cardsClose save-close zoomCard" data-bs-dismiss="modal" onclick="deleteApplication('${ id }');">
                        <i class="ri-delete-bin-2-line"></i>
                        <span>Supprimer mon application et retourner à l'accueil</span>
                    </a>
                    <a class="cardsClose notsave-close zoomCard" class="close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ri-arrow-go-back-line"></i>
                        <span>Annuler</span>
                    </a>
                    <a class="returnConf-close" class="close" data-bs-dismiss="modal" aria-label="Close"><i class="ri-arrow-left-line"></i> <span i18n="modal.exit.previous">Retour</span></a>                    
                </div>
            `;
    $("#genericModal").modal('show');
}

var showAlertDelAppFromList = (id) => {
    genericModalContent.innerHTML = "";
    genericModalContent.innerHTML = `
        <div class="modal-header">
            <h5 class="modal-title" i18n="modal.exit.title">Attention</h5>
            <button type="button" class="close" data-bs-toggle="modal" data-bs-target="#mod-importfile" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        </div>
        <div class="modal-body">
            <p>
            Êtes-vous sûr de vouloir supprimer cette application définitivement ?
            </p>
            <a class="cardsClose save-close zoomCard" data-bs-toggle="modal" data-bs-target="#mod-importfile" onclick="deleteAppFromList('${ id }');">
                <i class="ri-delete-bin-2-line"></i>
                <span>Supprimer cette application</span>
            </a>
            <a class="cardsClose notsave-close zoomCard" class="close" data-bs-toggle="modal" data-bs-target="#mod-importfile" aria-label="Close">
                <i class="ri-arrow-go-back-line"></i>
                <span>Annuler</span>
            </a>
            <a class="returnConf-close" class="close" data-bs-toggle="modal" data-bs-target="#mod-importfile" aria-label="Close"><i class="ri-arrow-left-line"></i> <span i18n="modal.exit.previous">Retour</span></a>                    
        </div>
    `;
    $("#genericModal").modal('show');
}

var deleteAppFromList = (id) => {
    deleteApplication(id).then(r => {
        document.getElementById('liste_applications').innerHTML = "";
        mv.getListeApplications();
    });
}

var getConfig = () => {
    var padding = function (n) {
        return '\r\n' + " ".repeat(n);
    };
    var savedProxy = "";
    var olscompletion = "";
    var elasticsearch = "";
    // Url du studio
    var studioUrl = "";

    if ($('#opt-studio').prop('checked')) {
        let readURL = new URL(window.location.href);
        studioUrl = readURL.origin + readURL.pathname;
    }

    var application = ['<application',
        'title="'+$("#opt-title").val()+'"',
        'logo="'+$("#opt-logo").val()+'"',
        'favicon="'+$("#opt-favicon").val()+'"',
        'help="'+$("#opt-help").val()+'"',
        'titlehelp="'+$("#opt-titlehelp").val()+'"',
        'iconhelp="'+$("#opt-iconhelp").val()+'"',
        'home="'+$("#opt-home").val()+'"',
        'style="'+$("#opt-style").val()+'"',
        'zoomtools="'+($('#opt-zoomtools').prop('checked')=== true)+'"',
        'initialextenttool="'+($('#opt-initialextenttool').prop('checked')=== true)+'"',
        'exportpng="'+($('#opt-exportpng').prop('checked')=== true)+'"',        
        'showhelp="'+($('#opt-showhelp').prop('checked')=== true)+'"',
        'coordinates="'+($('#opt-coordinates').prop('checked')=== true)+'"',
        'measuretools="'+($('#opt-measuretools').prop('checked')=== true)+'"',
        'mouseposition="'+($('#opt-mouseposition').prop('checked')=== true)+'"',
        'geoloc="'+($('#opt-geoloc').prop('checked')=== true)+'"',
        'studio="'+studioUrl+'"',        
        'togglealllayersfromtheme="'+($('#opt-togglealllayersfromtheme').prop('checked')=== true)+'"'];

    config.title = $("#opt-title").val();

    if(config.title == ''){
        $('#opt-title').addClass('is-invalid');
        alertCustom('Veuillez renseigner un nom à votre application !', 'danger')
    }

    savedParameters.application.forEach(function(parameter, id){
        $.each(parameter,function(prop,val) {
            application.push(prop+'="'+val+'"');
        });
    });
    application = application.join(padding(4)) + '>'+padding(0)+'</application>';
    if ( _conf.proxy || $("#optProxyUrl").val()) {
        // savedProxy = padding(0) + "<proxy url='" + $("#optProxyUrl").val() || _conf.proxy + "'/>";
        savedProxy = `${padding(0)}<proxy url='${$("#optProxyUrl").val() || _conf.proxy}'/>`
    }
    var search_params = {"bbox":false, "localities": false, "features":false, "static":false};
    if ( $("#frm-searchlocalities").val() !="false"  ) {
        olscompletion = [padding(0) + '<olscompletion type="'+$("#frm-searchlocalities").val()+'"',
            'url="'+$("#opt-searchlocalities-url").val()+'"',
            'attribution="'+$("#opt-searchlocalities-attribution").val()+'" />'].join(" ");
            search_params.localities = true;
    }
    if ( $("#frm-globalsearch").val() === "elasticsearch" && $("#opt-elasticsearch-url").val() ) {
        elasticsearch = [padding(0) + '<elasticsearch url="'+$("#opt-elasticsearch-url").val()+'"',
            'geometryfield="'+$("#opt-elasticsearch-geometryfield").val()+'"',
            'linkid="'+$("#opt-elasticsearch-linkid").val()+'"',
            'doctypes="'+$("#opt-elasticsearch-doctypes").val()+'"',
            'mode="'+($("#opt-elasticsearch-mode").val() || 'match')+'"',
            'version="'+$("#opt-elasticsearch-version").val()+'" />'].join(" ");
            if ($("#opt-elasticsearch-doctypes").val().length >=0) {
                search_params.static = "true";
            }
            if ($("#opt-elasticsearch-bbox").prop("checked")) {
                search_params.bbox = "true";
            }
    }
    if ( $("#opt-searchfeatures").prop("checked") ) {
        search_params.features = true;
    }

    searchparameters = padding(0) + '<searchparameters bbox="'+search_params.bbox+'" localities="'+search_params.localities+'" features="'+search_params.features+'" static="'+search_params.static+'"/>';

    var maxextentStr = '';
    if ( $("#opt-maxextent").prop("checked") ) {
        maxextent = map.getView().calculateExtent();
        maxextentStr = `maxextent="${maxextent}"`;
    }
    var center = map.getView().getCenter().join(",");
    var zoom = map.getView().getZoom();
    var mapoptions = padding(0) + '<mapoptions maxzoom="20" projection="EPSG:3857" center="'+center+'" zoom="'+zoom+'" '+maxextentStr+'/>';

    var baseLayersMode = $("#frm-bl-mode").val();
    var visibleBaselayer = $("#frm-bl-visible").val();
    var baseLayers =   [padding(0) + '<baselayers style="'+baseLayersMode+'">'];
    $(".bl input:checked").each(function (i, b) {
        // set first bl visible
        const baseLayerId = $(b).parent().parent().attr("data-layerid");
        
        var baseLayer = _conf.baselayers[baseLayerId] || savedParameters.baselayers[baseLayerId] || getConf("customBaseLayers")[baseLayerId];
        var definition = [
            '<baselayer visible="false" ',
            createBaseLayerDef(baseLayer),
            ' ></baselayer>'].join("");
        if (baseLayer.id === visibleBaselayer) {
            definition = definition.replace('visible="false"', 'visible="true"');
        }
        baseLayers.push(padding(4) + definition);
    });
    baseLayers.push(padding(0)+'</baselayers>');
    var themes = [ padding(0)+ '<themes mini="'+($('#opt-mini').prop('checked')=== true)+'">'];
    // Respect theme order
    $(".themes-list-item").each(function (id, theme) {
        var themeid =  $(theme).attr("data-themeid");
        if (config.themes[themeid]) {
            var t = config.themes[themeid];
            var theme = [];
            if (t.url) {
                theme = [padding(4)+'<theme id="'+t.id+'" url="'+t.url+'" name="'+t.title+'" collapsed="'+t.collapsed+'" icon="'+t.icon+'" layersvisibility="'+t.layersvisibility+'">'];
            } else {
                theme = [padding(4)+'<theme id="'+t.id+'" name="'+t.title+'" collapsed="'+t.collapsed+'" icon="'+t.icon+'">'];
            }
            $(t.layers).each (function (i, l) {
                var layer = mv.writeLayerNode(l);
                theme.push(layer);
            });
            themes.push(theme.join(" "));
            themes.push(padding(4) + '</theme>');
        }
    });
    themes.push(padding(0) + '</themes>');
    
    const mviewerVersion = _conf?.mviewer_version || "";

    var conf = ['<?xml version="1.0" encoding="UTF-8"?>\r\n<config mviewerversion="'+ mviewerVersion +'" mviewerstudioversion="'+ _conf?.mviewerstudio_version +'">\r\n',
        '<metadata>\r\n'+mv.createDublinCore(config)+'\r\n</metadata>\r\n',
        application,
        mapoptions,
        savedProxy,
        olscompletion,
        elasticsearch,
        searchparameters,
        baseLayers.join(" "),
        themes.join(" "),
        padding(0)+ '</config>'];

    return conf
}

let previewWithPhp = (conf) => {
    if (!_conf?.php?.upload_service) {
        alertCustom("Erreur de configuration : contactez un administrateur !", 'error');
    }
    // Save the map serverside
    $.ajax({
        type: "POST",
        url: _conf.php.upload_service,
        data: conf.join(""),
        dataType: 'json',
        contentType: 'text/xml',
        success: function (data) {
            // Preview the map
            var url = "";
            if (data.success && data.filepath) {
                // Build a short and readable URL for the map
                let url = mv.produceUrl(data.filePath);
                window.open(url, 'mvs_vizualize');
                alertCustom("Téléchargement terminé !", 'success');
            }
        }
    })
}

let previewAppsWithoutSave = (id, showPublish) => {
    if (config.relation && _conf.publish_url && showPublish) {
        const filePath = `${ mv.getAuthentUserInfos().groupFullName }/${ config.relation }`;
        const previewUrl = mv.produceUrl(filePath, true);
        return window.open(previewUrl, 'mvs_vizualize');
    }
    const confXml = getConfig();
    if (!confXml || (confXml && !mv.validateXML(confXml.join("")))) {
        return alertCustom("XML invalide !", 'danger');
    }
    if (_conf.is_php) {
        return previewWithPhp(confXml)
    }
    if (!id || !config.isFile) {
        return alertCustom(mviewer.tr('msg.preview_no_save'), 'danger');
    }
    return fetch(`${ _conf.api }/${ id }/preview`, {
        method: "POST",
        headers: {
            'Content-Type': 'text/xml'
        },
        body: confXml.join("")
    })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => {
            const url = mv.produceUrl(data.file, config.relation && config.showPublish);
            window.open(url, 'mvs_vizualize');
        })
        .catch(err => alertCustom(mviewer.tr('msg.xml_doc_invalid'), 'error'))
};

const downloadXML = () => {
    const conf = getConfig();
    if (mv.validateXML(conf.join(""))) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(conf.join("")));
        element.setAttribute('download', document.querySelector("#opt-title").value || moment().format("MMDDYYYYhhmmss"));
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
};

var saveAppWithPhp = (conf) => {
    $.ajax({
        type: "POST",
        url: _conf.php.upload_service,
        data: conf.join(""),
        dataType: 'json',
        contentType: 'text/xml',
        success: function (data) {
            alert(mviewer.tr('msg.file_saved_on_server') + " (" + data.filepath + ").");
        }
    })
}

var saveApplicationParameters = (message = "") => {
    const conf = getConfig();
    if (!conf || !mv.validateXML(conf.join(""))) {
        return alertCustom(mviewer.tr('msg.xml_doc_invalid'), 'danger');
    }
    if (_conf.is_php) {
        return saveAppWithPhp(conf)
    }
    // Save the map serverside
    const url = message ? `${ _conf.api }?message=${message}` : _conf.api;
    return fetch(url, {
        method: config.isFile ? "PUT" : "POST",
        headers: {
            'Content-Type': 'text/xml'
        },
        body: conf.join("")
    })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(() => {
        if (!_conf.is_php) {
            // don't execute this code with php backend
            config.isFile = true;
            document.querySelector("#toolsbarStudio-delete").classList.remove("d-none");
            document.querySelector("#layerOptionBtn").classList.remove("d-none");
            mv.manageDraftBadge(config.relation);
        } else {
            config.isFile = false;
        }
        alertCustom(mviewer.tr('msg.file_saved_on_server'), 'info');
    }).catch(err => alertCustom(mviewer.tr('msg.save_failure'), 'danger'));
};

var addgeoFilter = function () {
    var layername = $(".layers-list-item.active").attr("data-layerid");
    map2.updateSize();
    draw = new ol.interaction.Draw({
        source: source,
        type: "Polygon"
    });
    draw.on('drawend', function (e) {
        source.clear();
        var currentFeature = e.feature;//this is the feature fired the event
        var layer = config.temp.layers[layername];
        var projGeom = e.feature.getGeometry().clone().transform('EPSG:3857',layer.projection);
        var format = new ol.format.WKT();
        var wktRepresenation  = format.writeGeometry(projGeom);
        $("#frm-filter").val('INTERSECTS('+layer.geometry+ ',' + wktRepresenation + ')');
        $("#filter_wizard").hide();
    });
    map2.addInteraction(draw);
};

var extractFeatures = function (fld, option) {
    var layerid = $(".layers-list-item.active").attr("data-layerid");
    var layer = config.temp.layers[layerid];
    ogc.getFeatures(layer.wfs_url,layerid,fld, option);
    if (option === 'control') {
        $("#frm-attributelabel").val(fld);
    }
};

var loadApplicationParametersFromFile = function () {
    var file = document.getElementById("filebutton").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            var xml = $.parseXML(evt.target.result);
            mv.parseApplication(xml);
        }
        reader.onerror = function (evt) {
            //alert(mviewer.tr('msg.file_read_error'));
            alertCustom(mviewer.tr('msg.file_read_error'), 'danger');
        }
        showStudio();
    }
};

var loadApplicationParametersFromRemoteFile = function (url) {
    const waitRequests = [
        fetch(url, {
            method: "GET",
            cache: "no-cache"
        }).then(r => {
            return r.ok ? r.text() : Promise.reject(r)
        })
            .then(xmlAsString => new window.DOMParser().parseFromString(xmlAsString, "text/xml"))
            .catch(r => {
                alertCustom(mviewer.tr('msg.retrieval_req_error'), "danger");
            })
    ];
    if (!_conf.is_php) {
        waitRequests.push(
            fetch(_conf.api)
                .then(r => {
                    return r.ok ? r.json() : Promise.reject(r)
                })
            .then(r => {
                return r.filter(app => app.id == config.id);
            })
            .catch(() => alert(mviewer.tr('msg.retrieval_req_error'), "danger"))
        );
    }
    Promise.all(waitRequests).then((values) => {
        const data = values[0];
        mv.parseApplication(data);
        if (!_conf.is_php && values[1]) {
            const appMeta = values[1][0];
            if (appMeta?.versions) {
                config.versions = appMeta.versions;
            }
        }
        showStudio();
        if (!_conf.is_php) {
            // don't execute this code with php backend
            document.querySelector("#toolsbarStudio-delete").classList.remove("d-none");
            document.querySelector("#layerOptionBtn").classList.remove("d-none");
        }
    });
};

var loadApplicationParametersFromWMC = function (url) {
    $.ajax({
        type: "GET",
        url: url,
        success: function( data ) {
            mv.parseWMC(data);
            showStudio();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error("web map context (WMC) file retrieval failed", {
                xhr: xhr,
                ajaxOptions: ajaxOptions,
                thrownError: thrownError
            });
            //alert(mviewer.tr('msg.retrieval_req_error'));
            alertCustom(mviewer.tr('msg.retrieval_req_error'), 'danger');
        }
    });

};

var updateTheme = function (el) {
    var cls = $("#"+el.id+" option[value='"+el.value+"']").text();
    $(el).removeClass().addClass("form-control " + cls);
};

var setActiveProvider = function (el) {
    $(el).parent().parent().find(".active").removeClass("active");
    $(el).parent().addClass("active");
    updateProviderSearchButtonState();
};

var updateProviderSearchButtonState = function () {
    var active_provider_item = $("#providers_list").find(".active");
    if (active_provider_item) {
        $("#providers_dropdown").html(active_provider_item.text() + ' <span class="caret"/>');
        $("#search-message").text("");
        $("#search-message").hide();
        $("#provider_search_btn").prop('disabled', false);
    } else {
        $("#provider_search_btn").prop('disabled', true);
        $("#search-message").text("Aucun fournisseur sélectionné. Veuillez en choisir un.");
        $("#search-message").show();
    }
};

var addNewProvider = function (el) {
    var frm = $(el).closest("#addCatalogData");
    var url = frm.find("input.custom-url").val();
    var type = frm.find("select").val();
    var title = frm.find("input.custom-title").val();

    if (title && url) {
        $("#providers_list").append('<li><a onclick="setActiveProvider(this);" class="dropdown-item" data-providertype="' + type +
            '" data-provider="' + url + '" href="#">' + title + '</a></li>').trigger("click");
        frm.find("input.custom-url").val("");
        frm.find("input.custom-title").val("");
        updateAddProviderButtonState(el);
    }
};

var updateAddProviderButtonState = function (el) {
    var frm = $(el).closest("div");
    var url = frm.find("input.custom-url").val();
    var title = frm.find("input.custom-title").val();
    $("#add_provider_btn").prop('disabled', !(url && title));
};


 // Set translation tool, using i18next
 // see http://i18next.com/docs/
 // the ?lang parameter is used to set the locale
 var url = new URL(location.href);
 var lang = url.searchParams.get("lang");
 if (lang == null) {
    lang = "fr";
 }
 var _configureTranslate = function (dic) {
    mviewer.lang = {};
    //load i18n for all languages availables
    Object.entries(dic).forEach(function (l) {
        mviewer.lang[l[0]] = i18n.create({"values": l[1]});
    });
    if (mviewer.lang[lang]) {
        mviewer.tr = mviewer.lang[lang];
        _elementTranslate("body");
        mviewer.lang.lang = lang;
    } else {
         console.log("langue non disponible " + lang);
    }
};

 var _initTranslate = function() {
    mviewer.tr = function (s) { return s; };
    if (lang) {
        var defaultFile = "mviewerstudio.i18n.json";
        $.ajax({
            url: defaultFile,
            dataType: "json",
            success: _configureTranslate,
            error: function () {
                console.log("Error: can't load JSON lang file!")
            }
        });
    }
  };

/**
 * Translate DOM elements
 * @param element String - tag to identify DOM elements to translate
 */

var _elementTranslate = function (element) {
    // translate each html elements with i18n as attribute
    //var htmlType = ["placeholder", "title", "accesskey", "alt", "value", "data-original-title"];
    // Removed "value", because if prevents you from translating drop-down select boxes
    var htmlType = ["placeholder", "title", "accesskey", "alt", "data-original-title"];
    var _element = $(element);
    _element.find("[i18n]").each((i, el) => {
        let find = false;
        let tr = mviewer.lang[lang]($(el).attr("i18n"));
        htmlType.forEach((att) => {
            if ($(el).attr(att) && tr) {
                $(el).attr(att, tr);
                find = true;
            }
        });
        if(!find && $(el).text().indexOf("{{")=== -1) {
            $(el).text(tr);
        }
    });
    var ret = (element === "body")?true:_element[0].outerHTML;
    return ret;
};

$('#mod-featuresview').on('hidden.bs.modal', function () {
    var option = $(this).attr("data-bs-target");
    var target = "";
    if (option === 'source') { target = "#source_fields_tags"; }
    if (option === 'control') { target = "#control_fields_tags"; }
    $("#distinct_values a.active").each(function (id, fld) {
        $(target).tagsinput('add', $(fld).text());
    });
});

$('a[data-bs-target="#geo_filter"]').on('shown.bs.tab', function (e) {
    addgeoFilter();
});

$(".checkedurl").change(mv.checkURL);

$("#mod-importfile").on('shown.bs.modal', function () {
    document.getElementById('liste_applications').innerHTML = "";
    mv.getListeApplications();
});


var uploadSldFileToBackend = function(e) {
    var reader = new FileReader()
    e.files[0].text().then(function (sldFile) {
        const url = _conf.is_php ? _conf.php.store_style_service : _conf.store_style_service;
        $.ajax(url, {
            data: sldFile,
            method: 'POST',
            processData: false,
            contentType: 'text/plain',
            success: function(data) {
                // this final URL need to be reachable via geoserver which will fetch the SLD and apply it to the layer.
                var finalUrl = "";
                if (_conf.mviewer_instance.startsWith('http')) {
                    finalUrl = _conf.mviewer_instance + data.filepath
                } else {
                    finalUrl = window.location.origin + _conf.mviewer_instance + data.filepath
                }
                $("#frm-sld").val(finalUrl)
            },
            error: function() {
                 //alert(mviewer.tr('msg.retrieval_req_error'));
                 alertCustom(mviewer.tr('msg.retrieval_req_error'), 'danger');
            }
        })
    });
}

// Press Enter to search data
$('#input-ogc-filter').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        mv.search();
    }
    event.stopPropagation();
});

// Display tooltip bootstrap
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

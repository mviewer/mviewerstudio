import TemplateGenerator from "./TemplateGenerator.js";

// TODO : delete on issue-160 finish and before PR merge
const prisons = "https://gis.jdev.fr/geoserver/wfs?wfs?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=prison:densite_carcerale_etab&outputFormat=application/json"
const lycees = "https://ows.region-bretagne.fr/geoserver/rb/wfs?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=rb:lycee&outputFormat=application/json";

fetch(prisons)
    .then(r => r.json())
    .then(r => {
        const templateGenerator = new TemplateGenerator(r);
        

        templateGenerator.show();

        mv.templateGenerator = templateGenerator;
    });
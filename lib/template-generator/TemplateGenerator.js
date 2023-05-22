/**
 * This is ES6 module compliant.
 * This module allow to ease mustache template creation with dedicated generator UI.
 * Need mviewerstudio core version > 3.2 to works correctly.
 */
import ComponentsSelector from './ComponentsSelector.js';

import TextH1Component from './components/library/TextH1Component.js';
import TextH3Component from './components/library/TextH3Component.js';
import ImageComponent from './components/library/ImageComponent.js';
import ButtonComponent from './components/library/ButtonComponent.js';
import ListComponent from './components/library/ListComponent.js';
import NumbersComponent from './components/library/NumbersComponent.js';
import IframeComponent from './components/library/IframeComponent.js';
import { RightPanelLocation } from './components/content/RightPanelLocation.js';
import { BottomPanelLocation } from './components/content/BottomPanelLocation.js';
import { BottomPanelHtmlPreview } from './components/content/BottomPanelLocation.js';
import { hashString, compareHash } from './utils.js';
const components = [
  new TextH1Component(),
  new TextH3Component(),
  new ButtonComponent(),
  new ListComponent(),
  new NumbersComponent(),
  new IframeComponent(),
  new ImageComponent()
];

const maxItemsByCol = 3;
const maxCols = 2;

export default class TemplateGenerator {
  selected = [];
  selectedPanel = "";
  removeEvent = () => {
    new CustomEvent('removeComponent');
  };
  /**
   * contructor
   * @param {any} getFeatures response
   */
  constructor(getFeatures) {
    this.data = getFeatures;
    this.feature = getFeatures && getFeatures[0]
    this.components = [];
    this.componentSelector = new ComponentsSelector(
      components,
      'modalTemplateGeneratorBody'
    );
    let layerId = $(".layers-list-item.active").attr("data-layerid");
    this.layer = mv.getLayerById(layerId);
    mv.templateGenerator = this;
    this.show();
    this.callTemplate();
    document.querySelector("#frm-infopanel").addEventListener("change", () => {
      this.show()
    });
  }
  /**
   * Manage drag and drop area according to right or bottom panel
   * @returns {any} target DOM element
   */
  dragDropComponentTarget = () => {
    // easy with right-panel
    if (this.selectedPanel == "right-panel") return generatorComponentsDDArea;
    // bottom-panel : search to complete cols first
    let cols = [...document.querySelectorAll(".colDDArea")];
    let colToComplete = cols.filter(c => c.querySelectorAll(".cardComponent").length < maxItemsByCol)[0];
    if (colToComplete) {
      return colToComplete
    }
    // need to split drag and drop area in columns of 3 items
    if (this.selected.length % maxItemsByCol == 1) {
      let uuidCol = mv.uuidv4();
      generatorComponentsDDArea.insertAdjacentHTML("beforeend", `<div class="col-6 colDDArea" id="${ uuidCol }"></div>`);
      let col = document.getElementById(uuidCol);
      Sortable.create(col, {
        group: "bottomColGenerator"
      })
      return document.getElementById(uuidCol);
    } else {
      let last = cols[cols.length - 1];
      return last;
    }

  }
  /**
   * Trigger on select component from component selector
   * @param {detail} param0 detail from customEvent
   * @returns 
   */
  addToSelection = ({ detail }) => {
    let type = null;
    let attributes = [];
    if (!detail.component) return;
    if (this.selectedPanel == "bottom-panel" && this.selected.length == (maxCols * maxItemsByCol)) {
      alertCustom('Limite atteinte : supprimer un élément du template pour en rajouter !', 'warning');
      return;
    }

    // read template
    // create new configurable component instance
    let componentsToAdd = new detail.component(detail.header, detail?.content?.attributes);
    // push to follow in other condition
    this.selected.push(componentsToAdd);
    // needed with bottom panel to split in different horizontal columns
    let target = this.dragDropComponentTarget()
    // insert component to configurable drag drop generator area
    if (target) {
      componentsToAdd.add(target, attributes);
    }
  };
  /**
   * Display template generator modal content
   */
  show() {
    this.showBadges();
    this.showDragAndDropComponentArea();
    // init sortable
    this.sortable = Sortable.create(generatorComponentsDDArea, {
      handle: '.titleComp',
      animation: 150
    });
  }
  /**
   * Display header badges
   */
  showBadges() {
    document.querySelector('.badgeOptions').innerHTML = '';
    const layerTitle = document.getElementById("frm-layer-title").value;
    const panelLocation = document.getElementById("frm-infopanel");
    this.selectedPanel = panelLocation.value;
    const readableLocationValue = panelLocation.querySelectorAll(`option[value='${ this.selectedPanel }']`)[0].innerHTML

    const badges = [
      { icon: 'ri-database-2-line', text: layerTitle },
      { icon: 'ri-layout-2-line', text: readableLocationValue },
    ]
      .map(
        (badge) => `
            <div>
                <i class="${badge.icon}"></i>
                <span>${badge.text}</span>
            </div>
        `
      )
      .join('');
    document.querySelector('.badgeOptions').insertAdjacentHTML('beforeend', badges);
  }
  /**
   * Create drag and drop selected component area
   */
  showDragAndDropComponentArea = () => {
    let ddArea = document.querySelector(".ddComponentsArea");
    ddArea.innerHTML = ""
    let ddDomPanel = this.selectedPanel == "right-panel" ? RightPanelLocation : BottomPanelLocation;
    ddArea.insertAdjacentHTML("beforeend", ddDomPanel);
  }
  /**
   * Delete component from selection
   * @param {any} el DOM query element
   */
  removeComponent = (el) => {
    const id = el.parentElement.parentElement.id;
    let parentCol = el.closest(".colDDArea");
    document.getElementById(id).remove();
    if (this.selectedPanel == "bottom-panel" && parentCol) {
      let childsCol = parentCol.querySelectorAll(".cardComponent");
      if (!childsCol.length) {
        parentCol.remove();
      }     
    }
    this.selected = this.selected.filter(component => component.uuid !== id);
    this.componentSelector.removeSelected(id);
  };
  /**
   * Mustache content to read with mviewer
   * @param {string} content as msustache content
   * @returns 
   */
  getFinalMstFile = (content) => {
    let mstContent = `{{#features}}
      <li id="{{feature_ol_uid}}" class="item mstudio_template" style="width:100%;">
        ${ content }
      </li>
    {{/features}}`;
    let hash = hashString(mstContent);
    return `<hash style="display:none;">${ hash }</hash>${ mstContent }`;

  }
  /**
   * Mustache content to preview corretly
   * @param {string} content syntax mustache
   * @returns 
   */
  getPreviewMstFile = (content) => {
    return `{{#properties}}
      ${ content }
  {{/properties}}`
  }
  /**
   * Generate right template syntax
   * @param {boolean} isPreview 
   * @returns {string} mustache syntax
   */
  toRightTemplate(isPreview) {
    // get order ids
    const order = [...document.getElementById("generatorComponentsDDArea").querySelectorAll(".cardComponent")].map(x => x.id);
    // order selected
    const ordered = []
    // render each
    this.selected.forEach(component => {
      const idx = order.indexOf(component.uuid);
      ordered[idx] = component.render ? component.render(isPreview) : ""
    });
    let content = ordered.join("");
    return isPreview ? this.getPreviewMstFile(content) : this.getFinalMstFile(content);
  }
  /**
   * Generate bottom template syntax
   * @param {boolean} isPreview 
   * @returns {string} mustache syntax
   */
  toBottomTemplate(isPreview) {
    let groups = [];
    let cols = [...document.querySelectorAll(".colDDArea")];
    // TO FINISH
    cols.forEach((col, index) => {
      let components = [...col.querySelectorAll(".cardComponent")].map(z => this.selected.filter(s => s.uuid == z.id)[0]);
      components = components.map(c => c.render ? c.render(isPreview) : "");
      groups.push(components.join(""));
    })
    let html = BottomPanelHtmlPreview(groups);
    return isPreview ? this.getPreviewMstFile(html) : this.getFinalMstFile(html);
  }
  /**
   * Return template syntax according to preview action or final template restitution
   * @param {boolean} isPreview 
   * @returns {string} template syntax
   */
  toTemplate(isPreview) {
    if (this.selectedPanel == "right-panel") {
      return this.toRightTemplate(isPreview);
    }
    return this.toBottomTemplate(isPreview);
  }
  /**
   * Convert generator UI to mustache syntax -> Preview
   */
  preview() {
    const content = this.toTemplate(true);
    this.cleanPreview();
    if (content) {
      document.getElementById("generatorPreviewEmptyMsg").classList.add("d-none");
      document.getElementById("generatorPreviewContent").classList.remove("d-none");
      generatorPreviewContent.innerHTML = Mustache.render(content, mv.templateGenerator.feature);
    }
  }
  /**
   * Clean preview IHM area
   */
  cleanPreview() {
    generatorPreviewContent.innerHTML = "";
    document.getElementById("generatorPreviewContent").classList.add("d-none");
    document.getElementById("generatorPreviewEmptyMsg").classList.remove("d-none");
  }

  /**
   * Save template string into layer param
   */
  onValid() {
    this.layer.templateFromGenerator = this.toTemplate();
    this.layer.generatorTemplateUrl = false;
  }

  /**
   * Clean generator preview area
   */
  clean = () => {
    generatorComponentsDDArea.innerHTML = ""; 
    this.cleanPreview();
  }
  /**
   * Delete template from server
   */
  removeTemplate = () => {
    if (this.layer.templateurl) {
      let url = `${ _conf.api }/${ config.id }/template/${ this.layer.id }`
      fetch(url, {method:"DELETE"}).then(response => response.json())
        .catch(r => console.log(r)) 
    } else {
      this.layer.templateFromGenerator = "";
    }
    this.manageTplArea();
  }

  /**
   * Will display custom template generator UI to delete / custom 
   * OR show create new custom button
   */
  manageTplArea = () => {
    let tplManagerArea = document.getElementById("customTemplateManager");
    let newTplManagerArea = document.getElementById("newCustomTemplateManager");
    if (this.layer.templateFromGenerator) {
      tplManagerArea.classList.remove("d-none");
      newTplManagerArea.classList.add("d-none");
    } else {
      newTplManagerArea.classList.remove("d-none");
      tplManagerArea.classList.add("d-none");
    }
  }
  /**
   * From template, call template content to detect compliant template with generator or
   * external uncompliant
   * @returns {undefined}
   */
  callTemplate = () => {
    if (this.layer.templateFromGenerator) {
      this.readTemplate(this.layer.templateFromGenerator);
    } else if (this.layer.templateurl || this.layer.generatorTemplateUrl) {
      let url = this.layer.templateurl || this.layer.generatorTemplateUrl;
      if (!url) return;
      fetch(url).then(response => response.text()).then(mstContent => {
        let validContent = this.readTemplate(mstContent);
        // if template was compliant template generator -> this is not external template
        if (validContent) {
          this.layer.useexternaltemplate = false;
          $("#frm-template").prop("checked", false);
          $("#frm-template-url").val("");
        }
        this.manageTplArea();
      })
    }
    this.manageTplArea();
  }
  /**
   * Read integrity hash, detect generator class
   * WARNING : 
   * This is primitiv check !
   * Handmade template could be compliant if hash is regenerate and mstudio_templat class inserted.
   * -------
   * @param {string} mstContent from mustache file
   * @returns {boolean}
   */
  readTemplate = (mstContent) => {
    let checkIntegrity = compareHash(mstContent);
    let div = document.createElement("div");
    div.innerHTML = mstContent;
    // check integrity and if tpl is generator compliant
    if (!div.querySelector(".mstudio_template") || !checkIntegrity) return false;
    this.layer.templateFromGenerator = mstContent;
    this.templateFromGenerator = mstContent;
    div.querySelectorAll(".template-component").forEach(el => {
      let component = el.attributes["data-component"].value;
      let header = this.componentSelector.getHeaders().filter(h => h.class == component)[0];
      if (header) {
        mv.templateGenerator.addToSelection({detail: {component: header.click(), header: header, content: el}}) 
      }
    })
    return checkIntegrity;
  }
}

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
    this.feature = getFeatures[0]
    this.components = [];
    this.componentSelector = new ComponentsSelector(
      components,
      'modalTemplateGeneratorBody'
    );
    mv.templateGenerator = this;
    this.show();
  }

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
      let uuidCol = crypto.randomUUID();
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

  addToSelection = ({ detail }) => {
    if (!detail.component) return;
    if (this.selectedPanel == "bottom-panel" && this.selected.length == (maxCols * maxItemsByCol)) {
      alertCustom('Limite atteinte : supprimer un élément du template pour en rajouter !', 'warning');
      return;
    } 
    // create new configurable component instance
    let componentsToAdd = new detail.component(detail.header);
    // push to follow in other condition
    this.selected.push(componentsToAdd);
    // needed with bottom panel to split in different horizontal columns
    let target = this.dragDropComponentTarget()
    // insert component to configurable drag drop generator area
    if (target) {
      componentsToAdd.add(target); 
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

  showComponent() {
    componentSelector.show();
  }
  /**
   * Display header badges
   */
  showBadges() {
    document.querySelector('.badgeOptions').innerHTML = '';
    const layerTitle = document.getElementById("frm-layer-title").value;
    const panelLocation = document.getElementById("frm-infopanel");
    this.selectedPanel = panelLocation.value;
    const readableLocationValue = panelLocation.querySelectorAll(`option[value='${this.selectedPanel}']`)[0].innerHTML
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

  showDragAndDropComponentArea = () => {
    let ddArea = document.querySelector(".ddComponentsArea");
    ddArea.innerHTML = ""
    let ddDomPanel = this.selectedPanel == "right-panel" ? RightPanelLocation : BottomPanelLocation;
    ddArea.insertAdjacentHTML("beforeend", ddDomPanel);
  }

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

  getFinalMstFile = (content) => {
    return `{{#features}}
      <li class="item mstudio_template" style="width:100%;">
        ${ content }
      </li>
    {{/features}}`;
  }
  getPreviewMstFile = (content) => {
    return `{{#properties}}
      ${ content }
  {{/properties}}`
  }

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

  toTemplate(isPreview) {
    if (this.selectedPanel == "right-panel") {
      return this.toRightTemplate(isPreview);
    }
    return this.toBottomTemplate(isPreview);
  }

  preview() {
    const content = this.toTemplate(true);
    this.cleanPreview();
    if (content) {
      document.getElementById("generatorPreviewEmptyMsg").classList.add("d-none");
      document.getElementById("generatorPreviewContent").classList.remove("d-none");
      generatorPreviewContent.innerHTML = Mustache.render(content, mv.templateGenerator.feature);
    }
  }

  cleanPreview() {
    generatorPreviewContent.innerHTML = "";
    document.getElementById("generatorPreviewContent").classList.add("d-none");
    document.getElementById("generatorPreviewEmptyMsg").classList.remove("d-none");
  }

  saveFile() {
    const name = $("#frm-layerid").val() || "lycee";
    const url = `${ _conf.api }/${ config.id }/template/${ name }`;
    fetch(`${ url }`, {
      method: "POST",
      headers: {
          'Content-Type': 'text/xml'
      },
      body: this.toTemplate()
    }).then(r => r.json()).then(r => {
      $("#frm-template-url").val(r.filepath);
    })
  }

  clean = () => {
    generatorComponentsDDArea.innerHTML = ""; 
    this.cleanPreview();

  }
}

import ComponentsSelector from './ComponentsSelector.js';

import TextH1Component from './components/library/TextH1Component.js';
import TextH3Component from './components/library/TextH3Component.js';
import ImageComponent from './components/library/ImageComponent.js';
import ButtonComponent from './components/library/ButtonComponent.js';
import ListComponent from './components/library/ListComponent.js';
import NumbersComponent from './components/library/NumbersComponent.js';
import IframeComponent from './components/library/IframeComponent.js';

const components = [
  new TextH1Component(),
  new TextH3Component(),
  new ButtonComponent(),
  new ListComponent(),
  new NumbersComponent(),
  new IframeComponent(),
  new ImageComponent()
];

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
    // init sortable
    this.sortable = Sortable.create(document.getElementById('generatorComponentsDDArea'), {
      handle: '.titleComp',
      animation: 150
    });
    mv.templateGenerator = this;
    this.show();
  }

  addToSelection = ({ detail }) => {
    if (!detail.component) return;
    let componentsToAdd = new detail.component(detail.header);
    componentsToAdd.add(generatorComponentsDDArea);
    this.selected.push(componentsToAdd);
  };
  /**
   * Display template generator modal content
   */
  show() {
    this.showBadges();
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

  removeComponent = (el) => {
    const id = el.parentElement.parentElement.id;
    document.getElementById(id).remove();
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

  toTemplate(templateFunc) {
    // get order ids
    const order = [...document.getElementById("generatorComponentsDDArea").querySelectorAll(".cardComponent")].map(x => x.id);
    // order selected
    const ordered = []
    // render each
    this.selected.forEach(component => {
      const idx = order.indexOf(component.uuid);
      ordered[idx] = component.render ? component.render() : ""
    });
    return templateFunc(ordered.join(""));
  }

  preview() {
    const content = this.toTemplate(this.getPreviewMstFile);
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
      body: this.toTemplate(this.getFinalMstFile)
    }).then(r => r.json()).then(r => {
      $("#frm-template-url").val(r.filepath);
    })
  }

  clean = () => {
    generatorComponentsDDArea.innerHTML = "";
    this.cleanPreview();

  }
}

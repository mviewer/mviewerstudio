import TypeFieldSelector from '../forms/TypeFieldSelector.js';
import InputStaticValueComponent from "../forms/InputStaticValueComponent.js";
import InputFieldValueComponent from '../forms/InputFieldValueComponent.js';
import InputTagsComponent from '../forms/InputTagsComponent.js';

export default class TemplateComponent {
  componentsArea = null;
  fields = [];
  selected = false;
  customFields = [];
  constructor(
    header = { icon: '', title: '' },
    defaultTypeFields = ['field', 'multi', 'static'],
    customFields = []
  ) {
    this.uuid = crypto.randomUUID().split('-').join('');
    this.header = { ...header, id: this.uuid };
    this.typeFieldSelector = new TypeFieldSelector(defaultTypeFields);
    this.customFields = customFields;
  }

  getFields = () => {
    return this.fields;
  }

  cardHeader = () => `<div class="titleCompBlock mb-3">
    <div class="titleComp"><i class="${this.header.icon}"></i>${this.header.title}</div>
    <span class="deleteComp" onclick="mv.templateGenerator.removeComponent(this)"><i class="bi bi-x-circle"></i></span>
  </div>`;

  addSelectors = (customSelectors) =>
    (this.customSelectors = [...this.customSelectors, ...customSelectors]);
  
  getForms = (value) => {
    const forms = [];
    this.fields = [];
    this.cleanAreaComponents();
    const staticField = value == 'static' && new InputStaticValueComponent(this.uuid);

    let dataFields = Object.keys(mv.templateGenerator?.feature?.properties);
    const fieldField = value == 'field' && dataFields && new InputFieldValueComponent(this.uuid, dataFields);
    
    const multiField = value == 'multi' && dataFields && new InputTagsComponent(this.uuid, dataFields, "data-allow-new='true'");
    mv.multiField = multiField;
    if (staticField) {
      forms.push(staticField.render());
      this.fields.push(staticField);
    }
    if (fieldField) {
      forms.push(fieldField.render());
      this.fields.push(fieldField);
    }
    if (multiField) {
      forms.push(multiField.render());
      this.fields.push(multiField);
    }
    this.componentsArea.insertAdjacentHTML("beforeend", forms.join(''));

    if (multiField) {
      multiField.activate();
    }
  }

  getCustomFields = () => {
    let customForms = []
    if (this.customFields.length) {
      customForms = this.customFields.map(component => {
        return component.render();
      });
    }
    this.componentsArea.insertAdjacentHTML("beforeend", customForms.join(''));
  }

  content = () => {
    return `
    <div class="card cardComponent titleComponent" id=${this.uuid}>
        ${this.cardHeader()}
        ${this.typeFieldSelector.render()}
        <div class="subcomponents" id="${crypto.randomUUID()}"></div>
    </div> `};

  add = (target, position = 'beforeend') => {
    target.insertAdjacentHTML(position, this.content());
    this.componentsArea = document.getElementById(this.uuid).querySelector(".subcomponents");
    const typeFieldSelectorFromDOM = document.getElementById(this.typeFieldSelector.uuid);
    typeFieldSelectorFromDOM.addEventListener(
      "change",
      (el) => {
        this.getForms(el.target.value);
        this.getCustomFields();
      }
    )
  };

  remove = () => document.getElementById(this.uuid).remove();

  cleanAreaComponents = () => {
    [...this.componentsArea.childNodes].forEach(x => x.remove())
  }

  setSelected = () => {this.selected = !this.selected}
}

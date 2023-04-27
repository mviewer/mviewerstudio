import TypeFieldSelector from './TypeFieldSelector.js';
import InputStaticValueComponent from "./InputStaticValueComponent.js";

export default class TemplateComponent {
  componentsArea = null;
  constructor(
    header = { icon: '', title: '' },
    defaultTypeFields = ['field', 'multi', 'static'],
  ) {
    this.uuid = crypto.randomUUID().split('-').join('');
    this.header = { ...header, id: this.uuid };
    this.typeFieldSelector = new TypeFieldSelector(defaultTypeFields);
  }

  cardHeader = () => `<div class="titleCompBlock mb-3">
    <div class="titleComp"><i class="${this.header.icon}"></i>${this.header.title}</div>
    <span class="deleteComp" onclick="mv.templateGenerator.removeComponent(this)"><i class="bi bi-x-circle"></i></span>
  </div>`;

  addSelectors = (customSelectors) =>
    (this.customSelectors = [...this.customSelectors, ...customSelectors]);
  
  getForms = (value) => {
    this.cleanAreaComponents();
    const forms = [];
    if (value == 'static') {
      forms.push(new InputStaticValueComponent(this.uuid).getContent());
    }
    this.componentsArea.insertAdjacentHTML("beforeend", forms.join(""));
  }

  content = () => {
    return `
    <div class="card cardComponent titleComponent" id=${this.uuid}>
        ${this.cardHeader()}
        ${this.typeFieldSelector.getContent()}
        <div class="subcomponents" id="${crypto.randomUUID()}"></div>
    </div> `};

  add = (target, position = 'beforeend') => {
    target.insertAdjacentHTML(position, this.content());
    this.componentsArea = document.getElementById(this.uuid).querySelector(".subcomponents");
    const typeFieldSelectorFromDOM = document.getElementById(this.typeFieldSelector.uuid);
    typeFieldSelectorFromDOM.addEventListener(
      "change",
      (el) => {
        this.getForms(el.target.value)
      }
    )
  };

  remove = () => document.getElementById(this.uuid).remove();

  cleanAreaComponents = () => {
    [...this.componentsArea.querySelectorAll(".component-form")].forEach(x => x.remove())
  }
}

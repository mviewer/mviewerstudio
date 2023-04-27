import TypeFieldSelector from './TypeFieldSelector.js';
import Forms from './Forms.js';

export default class TemplateComponent {
  constructor(
    header = { icon: '', title: '' },
    defaultTypeFields = ['field', 'multi', 'static'],
    forms = []
  ) {
    this.forms = new Forms(forms);
    this.uuid = crypto.randomUUID().split('-').join('');
    this.header = { ...header, id: this.uuid };
    this.typeFieldSelector = new TypeFieldSelector(defaultTypeFields);
  }

  cardDeader = () => `<div class="titleCompBlock mb-3">
    <div class="titleComp"><i class="${this.header.icon}"></i>${this.header.title}</div>
    <span class="deleteComp" onclick="mv.templateGenerator.removeComponent(this)"><i class="bi bi-x-circle"></i></span>
  </div>`;

  addSelectors = (customSelectors) =>
    (this.customSelectors = [...this.customSelectors, ...customSelectors]);

  content = () => `
    <div class="card cardComponent titleComponent" id=${this.uuid}>
        ${this.cardDeader()}
        ${this.typeFieldSelector.createSelector()}
    </div> `;

  add = (target, position = 'beforeend') => {
    target.insertAdjacentHTML(position, this.content());
  };

  remove = () => document.getElementById(this.uuid).remove();
}

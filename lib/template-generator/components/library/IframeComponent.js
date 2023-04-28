import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi-code-slash',
  title: 'Iframe',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export default class IframeComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<iframe id="${crypto.randomUUID()}" src="${value}" width="300" heigth="200"></iframe>`
  }
}

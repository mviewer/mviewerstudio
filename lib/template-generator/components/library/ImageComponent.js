import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-image-alt',
  title: 'Image',
};

const defaultTypeFields = ['field', 'static'];

export default class ImageComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<img src="${value}"><br/>`
  }
}

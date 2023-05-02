import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-image-alt',
  title: 'Image',
  id: crypto.randomUUID(),
  click: () => ImageComponent
});

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
    return `<div class="col-12-xs" style="padding: 5px;"><img src="${value}" style="width: 100%;"></div>`
    
  }
}

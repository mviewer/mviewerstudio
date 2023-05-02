import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-image-alt',
  title: 'Image',
  id: crypto.randomUUID(),
  click: () => ImageComponent
});

const defaultTypeFields = ['field', 'static'];

export default class ImageComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<div class="imageComponent mb-2">
      <!--
      Prop : img -> src
      -->
      <img src="${value}" class="img img-responsive" style="max-height:300px;"/>
    </div>`;
  }
}

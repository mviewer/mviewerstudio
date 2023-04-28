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
}

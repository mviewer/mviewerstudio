import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-type-h3',
  title: 'Sous-titre',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextH3Component extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }
}

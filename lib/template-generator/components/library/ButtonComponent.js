import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-box-arrow-up-right',
  title: 'Bouton',
};

const defaultTypeFields = ['field', 'static'];

export default class ButtonComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }
}

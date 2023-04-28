import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-123',
  title: 'Chiffre clé',
};

const defaultTypeFields = ['field', 'static'];

export default class NumbersComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }
}

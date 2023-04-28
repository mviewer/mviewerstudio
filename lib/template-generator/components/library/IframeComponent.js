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
}

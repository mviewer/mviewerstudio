import TemplateComponent from './TemplateComponent.js';
import ColorSelector from '../forms/ColorSelector.js';

export const header = () => ({
  icon: 'bi bi-type-h3',
  id: crypto.randomUUID(),
  title: 'Titre',
  click: () => TextH1Component
});

const defaultTypeFields = ['field', 'multi', 'static'];

const textColor = new ColorSelector("#000000", "Couleur du texte");

export default class TextH1Component extends TemplateComponent {
  color = null;
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields, [textColor]);
  }

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map(x => x.getValue())[0],
      color: textColor.getValue(),
    };
    return this.template(values);
  }

  template = ({value, color="#009688"}) => {
    return `
    <div class="textH3Component mb-2">
        <!--
        Variable : nom
        Prop : color
        -->
        <h4 style="font-weight:bold; color:${color};">${ value }</h4>
    </div>`
  }
}

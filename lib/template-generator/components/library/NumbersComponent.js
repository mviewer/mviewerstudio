import TemplateComponent from './TemplateComponent.js';
import ColorSelector from '../forms/ColorSelector.js';
import InputTextComponents from '../forms/InputTextComponent.js';

export const header = () => ({
  icon: 'bi bi-123',
  title: 'Chiffre clé',
  id: crypto.randomUUID(),
  click: () => NumbersComponent
});

const defaultTypeFields = ['field', 'static'];
const textColor = new ColorSelector("#009688", "Couleur du texte");
const backgroundColor = new ColorSelector("#f4f4f4", "Couleur du fond");
const iconeInput = new InputTextComponents("", "Icône");
const describeInput = new InputTextComponents("", "Description");

export default class NumbersComponent extends TemplateComponent {
  field = "";
  icon = "";
  text = "";
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields, [textColor, backgroundColor, iconeInput, describeInput]);
  }

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      field: this.getFields().map(x => x.getValue())[0],
      icon: iconeInput.getValue(),
      text: describeInput.getValue(),
      color: textColor.getValue() || "#009688",
      backgroundColor: backgroundColor.getValue() || "#f4f4f4"
    };
    return this.template(values);
  }

  template({field, icon, text, color, backgroundColor}) {
    return `
    <div class="numberComponent mb-2" style="margin: 12px 0px;display: flex;align-items: center;color: ${color};justify-content: flex-start;background: ${backgroundColor};padding: 14px;border-radius: 5px;width: fit-content;">
    <!--
    Prop : icon font awesome 
    Variable : div > nombre
    Variable : div > text
    -->
    <div style="font-size: 40px;"><i class="${icon}"></i></div>
    <div style="line-height: 1.2;padding: 0px 15px;">
            <div style="font-size: 24px;font-weight: bold;">${field}</div>
            <div>${text}</div>
        </div>
    </div>
  `}
}

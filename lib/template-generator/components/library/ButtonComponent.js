import TemplateComponent from './TemplateComponent.js';
import ColorSelector from '../forms/ColorSelector.js';
import InputTextComponents from '../forms/InputTextComponent.js';

export const header = () => ({
  icon: 'bi bi-box-arrow-up-right',
  title: 'Bouton',
  id: crypto.randomUUID(),
  click: () => ButtonComponent
});

const backgroundColor = new ColorSelector("#345266", "Couleur du fond");
const textColor = new ColorSelector("#ffffff", "Couleur du texte");
const textComponent = new InputTextComponents("Accéder", "Texte du bouton");
const iconeInput = new InputTextComponents("", "Icône");

const defaultTypeFields = ['field', 'static'];

export default class ButtonComponent extends TemplateComponent {
  color = "#ffffff";
  backgroundColor = "#345266";
  icon = "";
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields, [textColor, backgroundColor, iconeInput, textComponent]);
  }

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      href: this.getFields().map(x => x.getValue())[0],
      text: textComponent.getValue(),
      color: textColor.getValue(),
      backgroundColor: backgroundColor.getValue(),
      icon: iconeInput.getValue()
    };
    return this.template(values);
  }

  template = ({href, text = "visiter", color = "white", backgroundColor = "#345266", icon}) => {
    return `
    <div class="linkComponent mb-2">
      <!--
      Variable : a > href
      Prop : color
      Prop : background-color
      -->
      <a href="${href}" target="_blank" class="btn" style="background-color: ${backgroundColor};color:${color};">${icon}${text}</a>
    </div>
    `
  }
}

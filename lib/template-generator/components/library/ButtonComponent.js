import TemplateComponent from './TemplateComponent.js';
import ColorSelector from '../forms/ColorSelector.js';
import InputTextComponents from '../forms/InputTextComponent.js';
import IconSelector from '../forms/IconSelector.js';
export const header = () => ({
  icon: 'bi bi-box-arrow-up-right',
  title: 'Bouton',
  id: crypto.randomUUID(),
  click: () => ButtonComponent,
  class: "linkComponent"
});

const defaultTypeFields = ['field', 'static'];

const attributes = ["data-type-selector", "data-text", "data-color", "data-icon", "data-bg-color"];

export default class ButtonComponent extends TemplateComponent {
  color = "#ffffff";
  backgroundColor = "#345266";
  constructor(customHeader) {
    const backgroundColor = new ColorSelector("#345266", "Couleur du fond");
    const textColor = new ColorSelector("#ffffff", "Couleur du texte");
    const textComponent = new InputTextComponents("Accéder", "Texte du bouton");
    const iconSelect = new IconSelector("Chosir", "iconsModal", "templageGeneratorModal");
    super(customHeader || header(), defaultTypeFields, [textColor, backgroundColor, textComponent, iconSelect]);
    this.textColor = textColor;
    this.backgroundColor = backgroundColor;
    this.iconSelect = iconSelect;
    this.textComponent = textComponent;
  }

  getAttributes = () => attributes

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      href: this.getFields().map(x => x.getValue())[0],
      text: this.textComponent.getValue(),
      color: this.textColor.getValue(),
      backgroundColor: this.backgroundColor.getValue(),
      icon: this.iconSelect.getValue()
    };
    return this.template(values);
  }

  template = ({href, text = "visiter", color = "white", backgroundColor = "#345266", icon}) => {
    return `
    <div class="${header().class } template-component mb-2"
      data-type-selector="${this.getType()}"
      data-href="${href}"
      data-text="${text}"
      data-icon="${icon}"
      data-color="${color}"
      data-bg-color="${backgroundColor}"
      data-component="${header().class}"
    >
      <a href="${href}" target="_blank" class="btn" style="background-color: ${ backgroundColor };color:${ color };">
        <i class="${icon}"></i>
        ${text}
      </a>
    </div>
    `
  }
}

import TemplateComponent from './TemplateComponent.js';
import ColorSelector from '../forms/ColorSelector.js';
import InputTextComponents from '../forms/InputTextComponent.js';
import IconSelector from '../forms/IconSelector.js';
export const header = () => ({
  icon: 'bi bi-box-arrow-up-right',
  title: 'Bouton',
  id: crypto.randomUUID(),
  click: () => ButtonComponent
});

const defaultTypeFields = ['field', 'static'];

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
    <div class="linkComponent mb-2">
      <a href="${href }" target="_blank" class="btn" style="background-color: ${ backgroundColor };color:${ color };">
        <i class="${ icon }"></i>
      ${ text}</a>
    </div>
    `
  }
}

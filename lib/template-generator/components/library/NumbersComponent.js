import TemplateComponent from './TemplateComponent.js';
import ColorSelector from '../forms/ColorSelector.js';
import InputTextComponents from '../forms/InputTextComponent.js';
import IconSelector from '../forms/IconSelector.js';

export const header = () => ({
  icon: 'bi bi-123',
  title: 'Chiffre clé',
  id: mv.uuidv4(),
  click: () => NumbersComponent,
  class: "numberComponent"
});

const defaultTypeFields = ['field', 'static'];

const attributes = ["data-type-selector", "data-value", "data-text", "data-color", "data-icon", "data-bg-color"];


export default class NumbersComponent extends TemplateComponent {
  field = "";
  icon = "";
  text = "";
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach(a => defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value));
    }
    const textColor = new ColorSelector(defaultValues.get("data-bg-color") || "#009688", "Couleur du texte");
    const backgroundColor = new ColorSelector(defaultValues.get("data-color") || "#f4f4f4", "Couleur du fond");
    const iconSelect = new IconSelector("Chosir", "iconsModal", "templageGeneratorModal", defaultValues.get("data-icon"));
    const describeInput = new InputTextComponents(defaultValues.get("data-text") || "", "Description");
    super(
      customHeader || header(),
      defaultTypeFields,
      [textColor, backgroundColor, iconSelect, describeInput],
      defaultValues
    );
    this.textColor = textColor;
    this.backgroundColor = backgroundColor;
    this.iconSelect = iconSelect;
    this.describeInput = describeInput;
  }

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map(x => x.getValue())[0],
      icon: this.iconSelect.getValue(),
      text: this.describeInput.getValue(),
      color: this.textColor.getValue() || "#009688",
      backgroundColor: this.backgroundColor.getValue() || "#f4f4f4"
    };
    return this.template(values);
  }

  template({ value, icon, text, color, backgroundColor }) {
    return `
    {{#${value.value}}}
    <div class="${header().class } template-component mb-2"
      style="margin: 12px 0px;display:flex; align-items:center; color:${ color }; justify-content:flex-start;background: ${ backgroundColor}; padding: 14px;border-radius: 5px;width: fit-content;"
      data-type-selector="${this.getType()}"
      data-value="${value.value}"
      data-text="${text}"
      data-icon="${icon}"
      data-color="${color}"
      data-bg-color="${backgroundColor}"
      data-component="${header().class}"
      >
      <div style="font-size: 40px;"><i class="${ icon }"></i></div>
      <div style="line-height: 1.2;padding: 0px 15px;">
            <div style="font-size: 24px;font-weight: bold;">${value.template}</div>
            <div>${text}</div>
        </div>
    </div>
    {{/${value.value}}}
  `}

  getAttributes = () => attributes
}

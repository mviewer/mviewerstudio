import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-123',
  title: 'Chiffre clé',
  id: crypto.randomUUID(),
  click: () => NumbersComponent
});

const defaultTypeFields = ['field', 'static'];

export default class NumbersComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }

  render() {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template(number, icon, text) {
    return `
    <div class="numberComponent mb-2" style="margin: 12px 0px;display: flex;align-items: center;color: #009688;justify-content: flex-start;background: #f4f4f4;padding: 14px;border-radius: 5px;width: fit-content;">
    <!--
    Prop : icon font awesome 
    Variable : div > nombre
    Variable : div > text
    -->
    <div style="font-size: 40px;"><i class="${icon}"></i></div>
    <div style="line-height: 1.2;padding: 0px 15px;">
            <div style="font-size: 24px;font-weight: bold;">${number}</div>
            <div>${text}</div>
        </div>
    </div>
  `}
}

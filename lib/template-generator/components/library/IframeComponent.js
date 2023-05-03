import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi-code-slash',
  title: 'Iframe',
  id: crypto.randomUUID(),
  click: () => IframeComponent
});

const defaultTypeFields = ['field', 'static'];

export default class IframeComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (src) => {
    return `
    <div class="iframeComponent mb-2">
    <!--
    Prop : iframe -> src
    -->
        <iframe src="${ src }" height="200" width="100%"  frameborder="0" name="demo">
            <p>Votre navigateur ne supporte aucune iframe</p>
        </iframe>
    </div>`;
  }
}

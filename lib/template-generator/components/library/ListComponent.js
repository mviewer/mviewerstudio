import TemplateComponent from "./TemplateComponent.js";

export const header = () => ({
  icon: "bi bi-list-ul",
  title: mviewer.tr("template.list.title"),
  id: mv.uuidv4(),
  click: () => ListComponent,
  class: "listComponent",
  helpMsg: mviewer.tr("msg.template.help.json"),
});

const defaultTypeFields = ["liField"];

const attributes = ["data-type-selector", "data-value", "data-sub-value"];

const parsableJsonData = (props) => {
  let newProps = {};
  Object.keys(props).forEach((x) => {
    try {
      newProps[x] = JSON.parse(props[x]);
    } catch {
      newProps[x] = props[x];
    }
  });
  return newProps;
};

export default class ListComponent extends TemplateComponent {
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach((a) =>
        defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value)
      );
    }
    super(customHeader || header(), defaultTypeFields, [], defaultValues);
  }

  render = (isPreview) => {
    if (!this.getFields().length) return "";
    if (this.getType() == "static" && isPreview) {
      let tplPreview = this.getFields().map((x) =>
        x.processValueToMst(parsableJsonData)
      )[0];
      return this.template({ template: tplPreview });
    } else {
      return this.template(this.getFields().map((x) => x.getValue(isPreview))[0]);
    }
  };

  getAttributes = () => attributes;

  template = (value) => {
    return `
    <div class="${header().class} template-component mb-2"
      data-type-selector="${this.getType()}"
      data-value="${value?.value}"
      data-sub-value="${value?.subValue || ""}"
      data-component="${header().class}"
    >
      <ul style="list-style-type: disc;margin-bottom:10px;">
          ${value?.template}
      </ul>
    </div>
    `;
  };
}

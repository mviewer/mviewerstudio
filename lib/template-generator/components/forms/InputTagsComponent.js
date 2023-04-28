import Tags from "./tags.js";
export default class InputTagsComponent {
    uuid = crypto.randomUUID()
    divId = "";
    fields = [];
    selector = "componentsTagsSelector";
    options = "";
    values = []
    constructor(divId, fields, options = "", selector = "componentsTagsSelector") {
        this.divId = divId;
        this.fields = fields;
        this.selector = selector;
        this.options = this.options + " " + options;
    }
    createOptions = () => {
        return this.fields.map(field => `<option value="${field}">${field}</option>`)
    }
    getContent = () => `<select class="form-control form-select form-control-sm component-form ${this.selector}" id="${this.uuid}" name="tags[]" multiple ${this.options}>
            ${this.createOptions().join("")}
        </select>
        <div class="invalid-feedback">Veuillez choisir un champ valide !</div>`;
    getValue = () => this.asTemplateSyntax();
    onAddValue = (item) => {
        this.values.push(item);
    };
    onRemoveValue = (value) => {
        this.values = this.values.filter(item => value !== item.value);
    }
    activate = () => {
        Tags.init(`.${ this.selector }`, {
            activeClasses: ["activeMultiSelectTag"],
            onSelectItem: this.onAddValue,
            onCreateItem: option => { this.onAddValue({value: option.value, created: "true"}) },
            onClearItem: this.onRemoveValue
         });
    }
    asTemplateSyntax = (separator = " ") => {
        return this.values.map(v => 
            v.created ? v.value : `{{#${v.value}}}{{${v.value}}}{{/${v.value}}}`
        ).join(separator)
    }
}
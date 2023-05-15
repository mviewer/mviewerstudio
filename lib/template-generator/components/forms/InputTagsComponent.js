import Tags from "./tags.js";
export default class InputTagsComponent {
    uuid = mv.uuidv4()
    divId = "";
    fields = [];
    selector = "componentsTagsSelector";
    options = "";
    values = [];
    placeholder = "Ajouter un champ...";
    defaultValues;
    isActivate = false;
    constructor(divId, fields, options = "", values, selector = "componentsTagsSelector", placeholder="Ajouter un champ...") {
        this.divId = divId;
        this.fields = fields;
        this.selector = selector;
        this.options = this.options + " " + options;
        this.placeholder = placeholder;
        this.classId = "multi" + this.uuid
        if (values) {
            this.defaultValues = values.split(",").filter(x => x);
            this.initValues(this.defaultValues);
        }
    }
    initValues = (values) => {
        this.values = this.defaultValues.map(v => ({value: v, created: !this.fields.includes(v)}))
    }
    createOptions = () => {
        let mergeValues = this.fields;
        if (this.defaultValues) {
            mergeValues = [...new Set([...this.defaultValues, ...this.fields])];   
        }
        return mergeValues.map(field => {
            let s = this.defaultValues ? this.defaultValues.includes(field) ? "selected='selected'" : "" : "";
            return `<option ${s} value="${ field }">${ field }</option>`
        })
    }
    render = () => `<select placeholder="${this.placeholder}" class="${this.classId} form-control form-select form-control-sm component-form ${this.selector}" id="${this.uuid}" name="tags[]" multiple ${this.options}>
            ${this.createOptions().join("")}
        </select>
        <div class="invalid-feedback">Veuillez choisir un champ valide !</div>`;
    getValue = () => ({
        value: this.values.map(v => v.value).join(","),
        template: this.asTemplateSyntax()
    });
    onAddValue = (item) => {
        this.values.push(item);
        console.log([...document.getElementById(this.uuid)?.selectedOptions].map(x => x.value));
    };
    onRemoveValue = (value) => {
        this.values = this.values.filter(item => value !== item.value);
        if (!this.fields.includes(value)) {
            document.getElementById(this.uuid).querySelector(`option[value="${value}"]`).remove()
        }
    }
    activate = () => {
        if (this.isActivate) return;

        Tags.init(`.${ this.classId }`, {
            activeClasses: ["activeMultiSelectTag"],
            autoselectFirst: false,
            placeholder: this.placeholder,
            onSelectItem: this.onAddValue,
            allowClear: true,
            clearEnd: true,
            onCreateItem: option => { this.onAddValue({value: option.value, created: "true"}) },
            onClearItem: this.onRemoveValue
        });
        this.isActivate = true;
    }
    asTemplateSyntax = (separator = " ") => {
        return this.values.map(v => 
            !this.fields.includes(v.value) ? v.value : `{{#${v.value}}}{{${v.value}}}{{/${v.value}}}`
        ).join(separator)
    }
}
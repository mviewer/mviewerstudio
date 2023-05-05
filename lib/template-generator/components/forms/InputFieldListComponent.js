
import Tags from "./tags.js";
import InputTagsComponent from "./InputTagsComponent.js";

export default class InputFieldListComponent {
    uuid = crypto.randomUUID()
    divId = "";
    fields = [];
    tagsSelector = null;
    eventName = ""
    constructor(divId, fields) {
        this.divId = divId;
        this.fields = fields;
        this.feature = mv.templateGenerator.feature;
        this.eventName = "select-" + this.uuid;
        document.addEventListener(this.eventName, (e) => this.onSelect(e.detail));
    }

    parseFieldToJson = (field) => {
        // read fields if json
        let jsonStringContent = mv.templateGenerator.feature.properties[field];
        let jsonContent = null;
        try {
            jsonContent = JSON.parse(jsonStringContent);
        } catch (e) {
            // return an error if not json or array
            jsonContent = null
        }
        if (!jsonContent) return;
        return jsonContent;
    }

    onSelect = (el) => {
        // clean
        document.querySelector(".jsonFields").innerHTML = "";
        this.subFieldsSelector = null;
        let jsonContent = this.parseFieldToJson(el.value);
        let subFields = [];
        // init tags selector
        // Next, we could get [object, object] or [string, number] json types
        // So, we need to control first item and allow to create json sub selctor or not according to type
        if (jsonContent && !(typeof jsonContent[0] == "string")) {
            subFields = Object.keys(jsonContent[0]);
        }
        let subSelector = "sub-select-" + this.uuid;
        this.subFieldsSelector = new InputTagsComponent(subSelector, subFields, "data-allow-new='true'");
        document.querySelector(".jsonFields").insertAdjacentHTML("beforeend", this.subFieldsSelector.render());
        this.subFieldsSelector.activate();
    }

    asTemplateSyntax = (field) => {
        return `{{#${ field }}}{{${ field }}}{{/${ field }}}`;
    }
    createOptions = () => {
        return this.fields.map(field => `<option field="${ field }" value="${ field }">${ field }</option>`);
    }

    render = (isPreview) => {
        return `<select onchange="mv.createDispatchEvent('${this.eventName}', this)"class="form-control form-control-sm li-field-name component-form" id="${ this.uuid }">
            ${ this.createOptions().join("") }
        </select>
        <span class="jsonFields"></span>
        `;
    };

    onAddValue = (item) => {
        this.values.push(item);
    };

    activate = () => {
        Tags.init(`.${ this.selector }`, {
            activeClasses: ["activeMultiSelectTag"],
            onSelectItem: this.onAddValue,
            onCreateItem: option => { this.onAddValue({value: option.value, created: "true"}) },
            onClearItem: this.onRemoveValue
         });
    }

    getValue = (isPreview) => {
        let domEl = document.getElementById(this.divId);
        let fieldName = domEl.querySelector(".li-field-name")?.value;
        let subSyntax = this.subFieldsSelector && this.subFieldsSelector.getValue();
        let mstSyntax = `
            {{#${ fieldName }}}
            <li>${ subSyntax || "{{.}}" }</li>
            {{/${ fieldName }}}`;
        if (isPreview) {
            let props = this.parseFieldToJson(fieldName);
            return Mustache.render(mstSyntax, { [fieldName]: props });
        }
        return `
            {{#${ fieldName }}}
            <li>${ subSyntax || "{{.}}" }</li>
            {{/${ fieldName }}}
        `;
    };
}
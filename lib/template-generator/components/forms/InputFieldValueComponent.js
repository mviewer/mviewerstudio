export default class InputFieldValueComponent {
    uuid = crypto.randomUUID()
    divId = "";
    fields = [];
    constructor(divId, fields) {
        this.divId = divId;
        this.fields = fields;
    }
    asTemplateSyntax = (field) => {
        return `{{#${ field }}}{{${ field }}}{{/${ field }}}`;
    }
    createOptions = () => {
        return this.fields.map(field => `<option field="${field}" value="${this.asTemplateSyntax(field)}">${field}</option>`)
    }
    render = () => `<select class="form-control form-control-sm component-form" id="${this.uuid}">
            ${this.createOptions().join("")}
        </select>`;
    getValue = () => {
        return document.getElementById(this.uuid).value
    };
    getAttribute = (name) => {
        return document.getElementById(this.uuid).querySelector(`option[value='${ this.getValue() }']`).getAttribute(name);
    }
}
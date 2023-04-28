export default class InputFieldValueComponent {
    uuid = crypto.randomUUID()
    divId = "";
    fields = [];
    constructor(divId, fields) {
        this.divId = divId;
        this.fields = fields
    }
    asTemplateSyntax = (field) => {
        return `{{#${ field }}}{{${ field }}}{{/${ field }}}`;
    }
    createOptions = () => {
        return this.fields.map(field => `<option value="${this.asTemplateSyntax(field)}">${field}</option>`)
    }
    getContent = () => `<select class="form-control form-control-sm component-form" id="${this.uuid}">
            ${this.createOptions().join("")}
        </select>`;
    getValue = () => {
        return document.getElementById(this.uuid).value
    };
}
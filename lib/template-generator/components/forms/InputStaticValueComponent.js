export default class InputStaticValueComponent {
    uuid = crypto.randomUUID()
    divId = "";
    constructor(divId) {
        this.divId = divId;
    }
    getContent = () => `
        <input class="form-control component-form" type="text" id="${this.uuid}" placeholder="Saisir une valeur...">
    `;
    getValue = () => document.getElementById(this.uuid).value;
}
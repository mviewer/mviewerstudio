export default class InputStaticValueComponent {
    uuid = crypto.randomUUID()
    divId = "";
    constructor(divId, type="text") {
        this.divId = divId;
        this.type = type;
    }
    render = () => `
        <input class="form-control component-form" type="${this.type || "text"}" id="${this.uuid}" placeholder="Saisir une valeur...">
    `;
    getValue = () => {
        const htmlElement = document.getElementById(this.uuid);
        return htmlElement?.value
    };
}
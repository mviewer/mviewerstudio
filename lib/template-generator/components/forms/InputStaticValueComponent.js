export default class InputStaticValueComponent {
    uuid = mv.uuidv4()
    divId = "";
    defaultValue = "";
    constructor(divId, defaultValue, type="text") {
        this.divId = divId;
        this.type = type;
        this.defaultValue = defaultValue;
    }
    render = (value) => {
        let v = value || this.defaultValue;
        v = v ? `value="${v}"` : "value=''"
        return `
        <input ${v} class="form-control component-form" type="${this.type || "text"}" id="${this.uuid}" placeholder="Saisir une valeur...">
    `};
    getValue = () => {
        const htmlElement = document.getElementById(this.uuid);
        return {
            value: htmlElement?.value,
            template: htmlElement?.value
        }
    }
}
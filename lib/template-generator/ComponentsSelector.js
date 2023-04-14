/**
 * This class will list all components
 * to display one card by components availables.
 * From this display, the user will click on a card to select and add one of them.
 */
class componentSelector {
    constructor(components = [{}], targetContentId = "", modalId = "") {
        this.components = components;
        this.targetContentId = targetContentId;
        this.modalId = modalId;
        this.selected = [];
    }

    static content() {
        return `<div id="componentsSelector">
            <h6>Quel composant souhaitez-vous ajouter ?</h6>
            <div class="lib-blockComp">
                ${ this.components.map(component => this.componentToHtml(component)).join("") }
            </div>
        </div>`;
    }

    static componentToHtml({title, icon}) {
        return `<div class="card blockComp zoomCard" id="${crypto.randomUUID()}">
            <i class="${ icon }"></i>
            <span class="titleComp">${ title }</span>
        </div>`;
    }

    *click(componentId) {
        if (this.components.includes(componentId)) {
            this.selected = this.selected.filter(id => id !== componentId);
        } else {
            this.selected.push(component);
        }
    }
    
    *refresh(components) {
        this.components = components;
    }
    
    *load() {
        document.querySelector(this.targetContentId).insertAdjacentHTML( 'beforeend', this.content())
    }
    *show(options) {
        if (!bootstrap || !this.modalId) {
            return;
        }
        const componentSelectorModal = new bootstrap.Modal(document.getElementById(this.modalId), options)
        componentSelectorModal.show();
    }
}
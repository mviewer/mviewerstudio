class TemplateGenerator {
    /**
     * contructor
     * @param {any} getFeatures response
     */
    constructor(getFeatures) {
        this.data = getFeatures;
        this.components = [];
    }
    /**
     * Display template generator modal content
     */
    show() {
        this.showBadges();
    }
    /**
     * Display header badges
     */
    showBadges() {
        document.querySelector(".badgeOptions").innerHTML = "";
        const layerTitle = "Lycées de Bretagne";
        const panelLocation = "Panneau de droite";
        const badges = [
            { icon: "ri-database-2-line", text: layerTitle },
            { icon: "ri-layout-2-line", text: panelLocation }
        ].map(badge => `
            <div>
                <i class="${ badge.icon }"></i>
                <span>${ badge.text }</span>
            </div>
        `).join("");
        document.querySelector(".badgeOptions").insertAdjacentHTML('beforeend', badges);
    }

    /**
     * Init sortable area
     * @param {string} area html element id
     * @param {*} list div id name in camelCase without special chars (e.g simpleId not simple-id)
     * @param {*} options Sortable options (handle, animation, whatever...)
     */
    sortableArea(area, list, options) {
        if (Sortable && area) {
            Sortable.create(list, options);
        }
    }
    displayComponents() {
        
    }
}
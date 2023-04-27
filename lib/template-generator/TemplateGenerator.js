import ComponentsSelector from './ComponentsSelector.js';

import { TextH1Component } from './components/library/TextH1Component.js';

const h1 = new TextH1Component();

const components = [h1];

export default class TemplateGenerator {
  selected = [];
  removeEvent = () => {
    new CustomEvent('removeComponent');
  };
  /**
   * contructor
   * @param {any} getFeatures response
   */
  constructor(getFeatures) {
    this.data = getFeatures;
    this.components = [];
    this.componentSelector = new ComponentsSelector(
      components,
      'modalTemplateGeneratorBody'
    );
    document.addEventListener('addTemplateComponent', this.addToSelection);
  }

  addToSelection = ({ detail }) => {
    this.selected = components.filter((c) => detail.includes(c.uuid));
    this.selected.forEach((s) => {
      s.add(generatorComponents);
    });
  };
  /**
   * Display template generator modal content
   */
  show() {
    this.showBadges();
  }

  showComponent() {
    componentSelector.show();
  }
  /**
   * Display header badges
   */
  showBadges() {
    document.querySelector('.badgeOptions').innerHTML = '';
    const layerTitle = 'Lycées de Bretagne';
    const panelLocation = 'Panneau de droite';
    const badges = [
      { icon: 'ri-database-2-line', text: layerTitle },
      { icon: 'ri-layout-2-line', text: panelLocation },
    ]
      .map(
        (badge) => `
            <div>
                <i class="${badge.icon}"></i>
                <span>${badge.text}</span>
            </div>
        `
      )
      .join('');
    document.querySelector('.badgeOptions').insertAdjacentHTML('beforeend', badges);
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
  removeComponent = (el) => {
    this.selected = this.selected.filter((component) => {
      if (component.uuid == el.parentElement.parentElement.id) {
        component.remove();
        return false;
      }
    });
  };
  displayComponents() {}
}

import ComponentsSelector from './ComponentsSelector.js';

import TextH1Component from './components/library/TextH1Component.js';
import TextH3Component from './components/library/TextH3Component.js';
import ImageComponent from './components/library/ImageComponent.js';
import ButtonComponent from './components/library/ButtonComponent.js';
import ListComponent from './components/library/ListComponent.js';
import NumbersComponent from './components/library/NumbersComponent.js';
import IframeComponent from './components/library/IframeComponent.js';

const components = [
  new TextH1Component(),
  new TextH3Component(),
  new ButtonComponent(),
  new ListComponent(),
  new NumbersComponent(),
  new IframeComponent(),
  new ImageComponent()
];

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
    Sortable.create(document.getElementById('generatorComponentsDDArea'), {
      handle: '.titleComp',
      animation: 150,
      // ghostClass: 'ghost',
      // onEnd: function (evt) {
      //     sortLayers(evt.oldIndex, evt.newIndex);
      // }
  })
  }

  addToSelection = ({ detail }) => {
    // clean selection area
    if (generatorComponentsDDArea) {
      [...generatorComponentsDDArea.querySelectorAll(".cardComponent")].forEach(x => x.remove()) 
    }
    this.selected = components.filter((c) => detail.includes(c.uuid));
    this.selected.forEach((s) => {
      s.add(generatorComponentsDDArea);
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
    const id = el.parentElement.parentElement.id;
    document.getElementById(id).remove();
    this.selected = this.selected.filter(component => component.uuid !== id);
    this.componentSelector.removeSelected(id);
  };
  displayComponents() {}
}

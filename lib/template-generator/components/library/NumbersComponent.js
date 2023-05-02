import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-123',
  title: 'Chiffre clé',
  id: crypto.randomUUID(),
  click: () => NumbersComponent
});

const defaultTypeFields = ['field', 'static'];

export default class NumbersComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }

  render() {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template(field) {
    return `
      <div class="row numberkey" style="height: auto;">
        <div class="zone-iconnumber col-sm-4">
            <div id="iconnumber"><i class="ri-numbers-line"></i></div>
        </div>
        <div class="col-sm-8 numText">
          <div class="number-feature">${field}</div>
        </div>
      </div>
      <style>
        .numberkey {
          margin-top: 10px; 
          height: auto;   
        }
      
        .zone-iconnumber{
          padding:10px 20px;
        }
      
        #iconnumber{
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          height: 60px;
          width: 60px;
          background: var(--mynumbercolor);
        }
        .number-feature {
          color: var(--mynumbercolor);
          font-family: var(--myfont);
          font-weight:700;
          font-size:25px;   
        }
      </style>
  `}
}

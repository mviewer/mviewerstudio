export const BottomPanelLocation = `
<div class="row" id="bottom-panel-generator">
    <div class="col-12 mb-2">
        <div id="generatorComponents" class="card" style="padding: 10px;">
            <div id="cardAddComponent" class="card addComponent border-info text-info" onclick="mv.templateGenerator.componentSelector.load()" data-bs-toggle="modal" data-bs-target="#templageGeneratorSelector">
                <h6><i class="ri-add-line"></i></h6>
                <h6>Ajouter un composant</h6>
            </div>
            <hr/>
            <div class="row" id="generatorComponentsDDArea"><!-- insert components here --></div>
        </div>
    </div>
    <div class="col-12">
        <div id="generatorPreview" class="card col-12" style="height: 315px;"> 
            <div class="previewMess" id="generatorPreviewEmptyMsg">
                <h6><i class="ri-search-eye-line"></i></h6>
                <h6>Aperçu</h6>
            </div>
            <div id="generatorPreviewContent" class="p-3">
            </div>
        </div>
    </div>
</div>`;

export const BottomPanelHtmlPreview = (groups) => `
    <div class="row">
        <!--CONTENT-->
        ${groups
          .map((x, i) => {
            return `<div class="col-md-6 sortableLiComponent-${i}">${x}</div>`;
          })
          .join("")}
    </div>	
`;

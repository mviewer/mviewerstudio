export const RightPanelLocation = `
<div class="row" id="right-panel-generator">
    <div class="col-md-6">
        <div id="generatorComponents" class="card" style="height: 630px; padding: 10px;">
            <div id="cardAddComponent" class="card addComponent border-info text-info" onclick="mv.templateGenerator.componentSelector.load()" data-bs-toggle="modal" data-bs-target="#templageGeneratorSelector">
                <h6><i class="ri-add-line"></i></h6>
                <h6 i18n="template.add_component">Ajouter un composant</h6>
            </div>
            <hr/>
            <div id="generatorComponentsDDArea"><!-- insert components here --></div>
        </div>
    </div>
    <div class="col-md-6">
        <div id="generatorPreview" class="card" style="height: 630px;"> 
            <div class="previewMess" id="generatorPreviewEmptyMsg">
                <h6><i class="ri-search-eye-line"></i></h6>
                <h6 i18n="template.preview">Aperçu</h6>
            </div>
            <div id="generatorPreviewContent" class="p-3">
            </div>
        </div>
    </div>
</div>`;

/* Manage display of module */

function showStudio() {
    document.getElementById("containerHome").hidden = true;
    document.getElementById("containerStudio").hidden = false;
    map.updateSize();
}

function showHome() {
    document.getElementById("containerStudio").hidden = true;
    document.getElementById("containerHome").hidden = false;
}

// Manage display of options

const activeSearch = document.getElementById('SwitchAdressSearch');

activeSearch.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    document.getElementById('AppSearchBlock').style.display = "block"; 
  } else {
    document.getElementById('AppSearchBlock').style.display = "none";
  }    
})


// Manage display nav-tab for LayerOptions modal 

$('#mod-layerOptions').on('hidden.bs.modal', function() { 
  // reset multi-tab modal to initial state 
  $(this).find('.nav-item a:first').tab('show');   
}) ;
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

const activeElasSearch = document.getElementById('SwitchElastic');

activeElasSearch.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    document.getElementById('FadvElasticBlock').style.display = "block"; 
  } else {
    document.getElementById('FadvElasticBlock').style.display = "none";
  }    
})
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
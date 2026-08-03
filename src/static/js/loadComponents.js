/**
 * Point d'entrée centralisé de chargement des composants frontend.
 * Ajouter ici chaque composant partagé exposé dans `js/components/`.
 */
import StepBadge from "./components/stepBadge/stepBadge.js";
import GristApiKey from "./components/gristApiKey/gristApiKey.js";
import importGristArea from "./components/importGristArea/importGristArea.js";
import UploadFile from "./components/uploadFile/uploadFile.js";
import ListGristTables from "./components/listGristTables/listGristTables.js";
import Table from "./components/table/table.js";
import Input from "./components/input/input.js";
import Select from "./components/select/select.js";
import * as gristValidation from "./utils/grist/validation.js";

mv.components = mv.components || {};
mv.components.grist = mv.components.grist || {};
mv.utils = mv.utils || {};
mv.utils.grist = mv.utils.grist || {};
mv.components.stepBadge = StepBadge;
mv.components.uploadFile = UploadFile;
mv.components.table = Table;
mv.components.input = Input;
mv.components.select = Select;
mv.components.grist.gristApiKey = GristApiKey;
mv.components.grist.importGristArea = importGristArea;
mv.components.grist.listGristTables = ListGristTables;
mv.utils.grist.validation = gristValidation;

gristValidation.bindNewLayerModalValidation();

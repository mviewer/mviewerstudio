/**
 * Point d'entrée centralisé de chargement des composants frontend.
 * Ajouter ici chaque composant partagé exposé dans `js/components/`.
 */
import StepBadge from "./components/stepBadge/stepBadge.js";
import GristApiKey from "./components/grist/gristApiKey/gristApiKey.js";
import GristWizard from "./components/grist/gristWizard/gristWizard.js";
import GristAddressArea from "./components/grist/gristAddressArea/gristAddressArea.js";
import GristCoordinatesArea from "./components/grist/gristCoordinatesArea/gristCoordinatesArea.js";
import importGristArea from "./components/grist/importGristArea/importGristArea.js";
import UploadFile from "./components/uploadFile/uploadFile.js";
import ListGristTables from "./components/grist/listGristTables/listGristTables.js";
import Table from "./components/table/table.js";
import Input from "./components/input/input.js";
import Select from "./components/select/select.js";
import Switch from "./components/switch/switch.js";
import Multiselect from "./components/multiselect/multiselect.js";
import * as gristUtils from "./utils/grist/grist.js";
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
mv.components.switch = Switch;
mv.components.multiselect = Multiselect;
mv.components.grist.gristApiKey = GristApiKey;
mv.components.grist.gristWizard = GristWizard;
mv.components.grist.gristAddressArea = GristAddressArea;
mv.components.grist.gristCoordinatesArea = GristCoordinatesArea;
mv.components.grist.importGristArea = importGristArea;
mv.components.grist.listGristTables = ListGristTables;
mv.utils.grist.grist = gristUtils;
mv.utils.grist.validation = gristValidation;

gristUtils.bindNewLayerModalGrist();
gristValidation.bindNewLayerModalValidation();

/**
 * Point d'entrée centralisé de chargement des composants frontend.
 * Ajouter ici chaque composant partagé exposé dans `js/components/`.
 */
import StepBadge from "./components/stepBadge.js";
import GristApiKey from "./components/gristApiKey.js";

mv.components = mv.components || {};
mv.components.stepBadge = StepBadge;
mv.components.gristApiKey = GristApiKey;

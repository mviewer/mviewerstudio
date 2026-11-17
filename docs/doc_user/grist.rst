.. _donnees_grist:

Ajouter et localiser des données Grist
======================================

Accès : thématique → « Ajouter une donnée » → onglet Grist.

Connexion et choix des données
------------------------------

1. Valider une clé API Grist ; droits d’écriture requis pour la jointure et le géocodage.
2. Sélectionner une table existante ou importer un fichier ``.csv``, ``.txt`` ou ``.xlsx``.
3. Pour un fichier, vérifier l’aperçu et renseigner la destination et le nom de la table.
4. Passer à la localisation après l’import et la relecture des champs.

Les actions de rafraîchissement rechargent les listes et les colonnes après modification dans Grist.

Choisir une localisation
------------------------

Un seul mode actif à la fois.

.. list-table:: Modes de localisation
   :header-rows: 1
   :widths: 20 40 40

   * - Mode
     - Paramètres
     - Traitement
   * - Adresses
     - Champs composant l’adresse.
     - Géocodage puis écriture des coordonnées et du bilan dans Grist ; service et critères configurés par l’administrateur.
   * - Référentiel
     - Champ de correspondance, référentiel et format GeoJSON ou WKT.
     - Jointure avec le champ configuré du WFS, puis écriture dans Grist.
   * - Coordonnées X/Y
     - Colonnes X/Y existantes et projection.
     - Contrôle des lignes sans coordonnées ; ``0`` accepté, sans jointure.

Jointure par référentiel
~~~~~~~~~~~~~~~~~~~~~~~~

* Correspondance : champ Grist choisi → ``join_field`` du référentiel ; exemple : ``FINESS_ET`` → ``CODE_FINESS``.
* Géométrie : colonne définie par ``geometry_field_name``, sans sortie X/Y.
* Coordonnées : colonnes ``x_field_name`` et ``y_field_name`` renseignées ensemble ; géométrie Point requise.
* Une géométrie ponctuelle n’active pas automatiquement la sortie X/Y.
* Projection : ``srs`` du référentiel ; noms de sortie ajustés aux identifiants réellement attribués par Grist.
* Colonnes de sortie déjà détectées : confirmation d’écrasement dans l’assistant d’ajout.

Résultat et export
------------------

* Bilan : lignes localisées et lignes en échec.
* Correction : ouvrir la table dans Grist, modifier les valeurs, relancer le traitement.
* Ajout à la carte : au moins une ligne localisée.
* Export : couche CSV authentifiée via l’API Grist ou son proxy ; le document reste privé selon ses droits d’accès.

.. list-table:: Attributs XML
   :header-rows: 1
   :widths: 45 55

   * - Attribut
     - Utilisation
   * - ``geojsonField``
     - Colonne géométrique écrite dans Grist pour une sortie GeoJSON.
   * - ``xfield``, ``yfield``
     - Colonnes de coordonnées réellement écrites.
   * - ``joinReferential``, ``joinMatchingField``
     - Référentiel et champ de correspondance conservés.
   * - ``joinCentroidField``
     - Colonne de centroïdes renseignée après son écriture dans Grist.

Accès au CSV, URL et CORS : :doc:`../doc_tech/proxy`.

Modifier la localisation
-------------------------

Rouvrir les paramètres de la donnée pour modifier sa localisation.
Une nouvelle jointure actualise les colonnes et la projection conservées dans la couche.

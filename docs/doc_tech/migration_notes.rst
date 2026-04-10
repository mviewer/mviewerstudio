

.. Authors :
.. mviewer team

.. _migration_notes:

Notes de migration
==================================

Passer de v4.2.x à v4.3.0
~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Suppression du PHP**

Comme annoncé, le backend PHP a été supprimé au profit du backend Python.
Il n'est donc plus nécessaire d'installer PHP et de configurer le backend PHP pour faire fonctionner mviewerstudio.

.. warning::

    Qu'est-ce qu change ?

    - Le backend PHP n'est plus supporté.
    - Le frontend appelle uniquement l'API Python.
    - Les brouillons, publications et versions reposent sur le backend Python.
    - Les anciens XML issus du mode PHP ne sont pas directement exploitables comme des applications Python versionnées. Il faut les réimporter manuellement dans mviewerstudio avec le backend python.

Il est donc fortement conseillé de migrer vers le backend Python pour bénéficier des dernières fonctionnalités et des correctifs de sécurité.

2. **Modification de la gestion des fichiers static**

Suite à la suppression de PHP, tous les fichiers static sont désormais gérés par le backend Python (gunicorn / Flask).

- Le backend est localisé dans `/src`
- Les fichiers static sont localisés dans `/src/static`
- Le fichier de configuration du frontend est localisé dans `/src/static/config.json`

Autrefois, les fichiers static étaient à la racine du projet et devaient être copiés vers le répertoire static du backend choisi.
Cette modification n'est donc plus à faire.

Il en est de même pour la configuration du frontend qui est à modifier directement dans `/src/static/config.json`

3. **Impact sur l'installation**

La procédure d'installation a été simplifiée puisque le backend PHP n'existe plus et que seules les ressources associées à Python restent dans le code source.

4. **Impact sur le service gunicorn**


Pour migrer vers cette nouvelle version, il est nécessaire de modifier le fichier mviewerstudio.service en utilisant les nouveaux chemins d'accès pour : 

- WorkingDirectory - Doit pointer vers le répertoire où mviewerstudio est installé
- ExecStart - l'argument WSGI/ASGI (application target) de gunicorn doit être modifié pour pointer vers l'emplacement du module python et l'objet associé (`src.app:app` par défaut). 

5. **Récupération du code source**

.. warning::

    Vous ne devez avoir aucune modification dans le code source du projet (répertoire ISO avec la branche master).


.. warning::

    Faites une copie des fichiers mviewerstudio.service et config.json avant de faire la migration.


Exécuter ces commandes : 

.. code-block:: sh

       cd /path/to/mviewerstudio
       git pull
       # Vérifiez que vous êtes bien sur la branche master


Modifiez maintenant le contenu du fichier `mviewerstudio.service` en s'aidant de la page :ref:`install_python`).

Modifiez enfin le fichier de configuration du frontend `src/static/config.json` pour adapter les paramètres à votre installation (reprenez votre fichier précédent).

6. **Impact sur les cartes mviewer**

Aucun impact.

Passer de v4.1 à v4.2
~~~~~~~~~~~~~~~~~~~~~~

Suite aux modifications du backend pour afficher plus de logs, il est nécessaire de modifier le fichier mviewerstudio.service en ajoutant les options StandardOutput et StandardError comme ici :
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html#creation-du-service-et-activation-du-service


Passer de v3.9.x à v4.x
~~~~~~~~~~~~~~~~~~~~~~

La version 4 de mviewerstudio propose un nouveau backend Python afin de disposer d'un système de stockage et de versionnement des configurations.
Le stockage est notamment possible par organisation (seulement compatible security-proxy geOrchestra pour la version 4).

Un utilisateur d'une organisation A ne pourra également pas modifier une carte qui ne lui appartient pas. Il pourra cependant voir toutes les cartes des utilisateurs du même organisme.
Si vous ne disposez pas de système d'authentification, cette version propose par défaut d'inclure tous les utilisateurs (dit Anonymes) dans un groupe Public (nom modifiables dans les paramètres).

Pour avoir une vision détaillée des nouveautés, nous vous invitons à consulter la documentation utilisateur et la note de release GitHub.

1. **Compatibilité des XML**

La version 4 utilise des propriétés et des informations du XML rajoutées par le backend Python de mviewerstudio v4.
Ces XML sont notamment versionnés et non dupliqués à chaque modification.
Les XML réalisés avec la version de mviewerstudio < 4 ne sont pas compatibles avec le backend Python de la v4.

2. **Migration vers le backend Python**

Le backend Python est désormais l'unique backend maintenu. Les XML issus des versions antérieures doivent donc être réimportés puis réenregistrés pour bénéficier du stockage, du versionnement et de la publication.

3. **Migrer vos XML manuellement**

Si vous souhaiter utiliser le backend Python, mais que vous désirez conserver vos XML, il sera nécessaire de les réimporter unitairement en ouvrant le XML ``Depuis un ordinateur``.
Vous devrez donc ouvrir le fichier afin de le re sauvegarder avec les informations nécessaires pour le bon fonctionnement de la v4.

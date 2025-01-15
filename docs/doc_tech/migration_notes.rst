

.. Authors :
.. mviewer team

.. _migration_notes:

Notes de migration
==================================

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

2. **Choix du backend**

Le backend PHP reste toutefois utilisable et identique à la version 3.9.x sans nouveautés. Vos XML seront réutilisables en l'état.
Si vous n'utiliser pas le backend Python, notez alors que vous ne pourrez pas disposer des dernières nouveautés telles que le versionnement, la publication ou encore le générateur de template.

3. **Migrer vos XML manuellement**

Si vous souhaiter utiliser le backend Python, mais que vous désirez conserver vos XML, il sera nécessaire de les réimporter unitairement en ouvrant le XML ``Depuis un ordinateur``.
Vous devrez donc ouvrir le fichier afin de le re sauvegarder avec les informations nécessaires pour le bon fonctionnement de la v4.

Passer de v4.1 à v4.2
~~~~~~~~~~~~~~~~~~~~~~

Suite aux modifications du backend pour afficher plus de logs, il est nécessaire de modifier le fichier mviewerstudio.service en ajoutant les options StandardOutput et StandardError comme ici :
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html#creation-du-service-et-activation-du-service

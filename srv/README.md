 ### user_info.php
 
Ce service retourne les informations liées à l'utilisateur connecté. Il sert d'intermédiaire entre un backend spécifique gérant l'authentification et mviewerstudio

**Propriétés**
 | Method | Parameter | Content-Type |
| --- | --- | --- | 
| GET | - | `application/json`

**Exemple de réponse**

Selon mviewerstudio.js, on devrait avoir :
    
    {
        "first_name": "",
        "last_name":"",
        "user_groups": [{"full_name":""}]
    }
    
  A la place, nous avons : 
    
    {
        "first_name": "",
        "last_name":"",
        "organisation": {"legal_name":""}
    }
    

### srv/list.php
Ce service retourne la liste des applications (config.xml) créées par l'utilisateur courant (utlisateur connecté ou anonymous)

**Propriétés**
 | Method | Parameter | Content-Type |
| --- | --- | --- | 
| GET | - | `application/json`

**Exemple de réponse**
    
    [{
        "url":"apps/store/f212c672d9e3968e39cffad5caf26426.xml",
        "creator":"anonymous",
        "date":"2020-02-18T14:42:35.667Z",
        "title":"Démo GéoBretagne",
        "subjects":["Randonnée","Supervision"]
    }]
    
    
    
### srv/store.php
Enregistrement d'un fichier de configuration pour l'utilisateur courant

**Propriétés**
 | Method | Parameter | Content-Type |
| --- | --- | --- | 
| POST | config.xml | `application/json`

**Exemple de réponse**
    
    {
        "success":true,
        "filepath":"06c143f8760b2392a1637c8dd3c6aef2.xml"
    }
    

### srv/delete.php
Supprime toutes les applications de l'utilisateur connecté

**Propriétés**
 | Method | Parameter | Content-Type |
| --- | --- | --- | 
| GET | - | `application/json`

**Exemple de réponse**

     { 
        "deleted_files": 13
     }

# 🗺️ mviewerstudio

**mviewerstudio** est une application web qui facilite la création de configurations pour [mviewer](https://github.com/mviewer/mviewer) avec une interface graphique ergonomique et simple.

- **Frontend** : JavaScript
- **Backend** : Python + Flask
- **Plateforme** : Linux

---

## 🚀 Démarrage rapide avec docker compose

```
# code source
git clone https://github.com/mviewer/mviewerstudio.git
cd mviewerstudio
# Préparer les permissions selon docker/README.fr.md avant le démarrage
# docker
docker compose up -d
```
Accédez à : **http://localhost/mviewerstudio**

Consultez le [guide Docker](docker/README.fr.md) pour préparer les permissions et configurer les UID/GID.

Pour des instructions détaillées avec Flask ou Docker, voir le [Guide d'installation](install/README.fr.md)

---

## 📚 Documentation

### Installation

- 🇫🇷 [Instructions d'installation en français](install/README.fr.md)
- 🇬🇧 [Installation instructions in English](install/README.en.md)

### Documentation en ligne

- 📘 [Documentation utilisateur (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_user/accueil.html)
- 🔧 [Guide d'installation (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html)
- ⚙️ [Configuration et administration (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/config_front.html)
- 💻 [Documentation technique (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/dev_corner.html)

---

## ✅ Prérequis

- Système Linux avec `bash`
- Python >= 3.12 et `venv`
- `git`
- `apt` (optionnel, pour installation automatique)

---

## 🔗 Ressources

- [Dépôt GitHub](https://github.com/mviewer/mviewerstudio)
- [Documentation ReadTheDocs](https://mviewerstudio.readthedocs.io/fr/stable/)
- [mviewer](https://github.com/mviewer/mviewer)

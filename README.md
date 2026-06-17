# 🎮 YouTube Gamepad

Une extension Chrome qui permet de naviguer sur YouTube avec une manette de jeu.

---

## Fonctionnalités

- 🕹️ Navigation entre les vidéos de la page d'accueil avec le joystick gauche
- ▶️ Lancement d'une vidéo avec le bouton A
- ⏸️ Pause / Lecture avec le bouton A pendant la lecture
- ⬅️ Retour à l'accueil avec le bouton B
- 🔲 Plein écran avec le bouton X
- 📺 Chargement automatique des nouvelles vidéos en scrollant

---

## Installation

1. Clone le repo :
   ```bash
   git clone https://github.com/juliolegrandsage/yotube_gamepad_controller.git
   ```

2. Ouvre Chrome et va sur `chrome://extensions`

3. Active le **mode développeur** (toggle en haut à droite)

4. Clique sur **Charger l'extension non empaquetée**

5. Sélectionne le dossier du repo

6. Va sur [youtube.com](https://www.youtube.com) et connecte ta manette 🎮

---

## Contrôles

### Tu peux toi-même binder tes propres touches sur la popup de l'extension.

---

## Structure du projet

```
youtube-gamepad/
├── manifest.json
└── content.js
```

---

## Compatibilité

- ✅ Chrome (Manifest V3)
- ✅ Manettes Xbox, PlayStation, 8BitDo et génériques (standard Gamepad API)

---

## Limitations connues

- Fonctionne uniquement sur la page d'accueil de YouTube pour la navigation
- La manette doit être connectée **avant** ou **après** le chargement de la page (l'événement `gamepadconnected` est détecté automatiquement)

---

## Licence

MIT

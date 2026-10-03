# Wochenplan

Minimalistische Wochenplan-App fuer Montag bis Freitag mit zwei Personenfarben, aktueller Kalenderwoche, lokaler Speicherung und GitHub-Pages-Deployment.

## Funktionen

- Wochenansicht fuer Montag bis Freitag
- Zwei Personenprofile in Rosa und Blau
- Eingabe von Titel, Tag, Startzeit, Endzeit und Notiz
- Speicherung im Browser per Local Storage
- Backup exportieren und wieder importieren
- Mobile Ansicht fuer iPhone und andere kleine Displays

## Lokal starten

```bash
cd app
npm install
npm run dev
```

## Production Build

```bash
cd app
npm run build
```

## GitHub Pages

Das Deployment ist bereits als GitHub Actions Workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) vorbereitet.

Nach dem Push auf `main` wird die App automatisch gebaut und auf GitHub Pages veroeffentlicht.

Falls GitHub Pages noch nicht auf `GitHub Actions` gestellt ist:

1. Repository auf GitHub oeffnen.
2. `Settings` > `Pages` aufrufen.
3. Unter `Build and deployment` als Source `GitHub Actions` auswaehlen.

## Hinweis zur Speicherung

Die Termine bleiben dauerhaft im Browser des jeweiligen Geraets gespeichert. Fuer den Wechsel auf ein anderes Geraet kannst du die Backup-Funktion nutzen.
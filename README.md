# Healthy Tracker

A private, local-first PWA for a sustainable 12-week start: machine workouts, beginner walk–run intervals, flexible Thai meals, and body-composition trends.

## Run locally

```powershell
node server.js
```

Open `http://localhost:4173`. Run the dependency-free test suite with `node --test`.

## Personal data

The public app starts empty. Health data lives in browser `localStorage` and user-exported JSON files only. The generated `outputs/inbody-private-import.json` is intentionally ignored by Git and can be imported from **Settings & Backup** on the user's device.

## GitHub Pages

Push `main` to the public repository `hopepb0123456-ai/healthy-tracker`, then choose **GitHub Actions** as the Pages source. The included workflow tests and deploys the static app to:

`https://hopepb0123456-ai.github.io/healthy-tracker/`

On iPhone, open that URL in Safari, tap **Share**, then **Add to Home Screen**.

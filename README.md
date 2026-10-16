# Séries — chaque jour compte

PWA de suivi de séries (streaks) : habitudes et « jours sans », double confirmation à chaque coche, records, Hall of fame, sauvegarde JSON. 100 % locale (IndexedDB), aucune donnée ne quitte l'appareil. Interface en français et en anglais.

En ligne : <https://jirr.github.io/streak/>

## Prérequis

- Node 22.12 ou plus

## Commandes

```bash
npm install
npm run dev        # http://localhost:5173/streak/
npm test           # tests Vitest (fuseau forcé sur Europe/Paris)
npm run coverage   # couverture de src/domain (seuils : 90 % lignes, 85 % branches)
npm run build      # tsc -b + vite build → dist/
npm run preview    # sert dist/ sous /streak/ (http://localhost:4173/streak/), service worker actif
npm run generate-pwa-assets   # régénère les icônes depuis public/logo.svg
```

Le service worker n'est actif qu'avec `npm run preview` ou en production (désactivé en `dev` pour ne pas fausser le rechargement à chaud).

## Architecture

```
app.config.ts        REPO_NAME / BASE_PATH / DB_NAME (seul endroit à modifier pour renommer le repo)
src/domain/          TypeScript pur (aucun import React/DOM/Dexie) : périodes, streaks, check-ins,
                     rappels, sauvegarde, presets. Copiable tel quel dans Capacitor / React Native.
src/data/            Contrat `Repositories` + implémentation Dexie (utilisable dans la page ET le service worker).
src/notifications/   `NotificationScheduler` (interface) + implémentation web best effort.
src/pwa/             Invite d'installation, bandeau de mise à jour.
src/app/             Store Zustand, routeur (hash), horloge réactive.
src/i18n/            Catalogues de textes UI fr/en (`messages.ts`) et hook `useI18n`.
src/ui/              Écrans, composants, tokens CSS (CSS Modules).
src/sw.ts            Service worker : precache, mise à jour, rappels (periodicsync), clic sur notification.
fixtures/            `demo-backup.json` : sauvegarde de démo importable depuis « Mon compte ».
```

Règles de calcul : la source de vérité est le `dayKey` local (`yyyy-MM-dd`) de chaque coche ; semaines ISO (lundi) ; une coche par jour ; un objectif « N jours par semaine/mois » valide la période à N coches ; heure de grâce (4 h par défaut) pendant laquelle on peut encore cocher la veille.

## Langues

Français et anglais. Par défaut, la langue suit celle du système (`navigator.languages`, repli sur l'anglais si ni fr ni en) ; elle se change dans Mon compte → Langue (Système / Français / English), réglage sauvegardé avec les autres. Les textes de l'UI sont dans `src/i18n/messages.ts` (le type `Messages` oblige l'anglais à couvrir toutes les clés) ; les libellés métier (unités, notifications, presets) sont dans `src/domain/` et prennent la langue en paramètre. Les titres des séries déjà créées ne sont pas traduits (ce sont des données utilisateur).

## Renommer le repo

Modifier `REPO_NAME` dans `app.config.ts`. L'URL change (`https://jirr.github.io/<nom>/`) et, le navigateur isolant les données par origine, **les données de l'ancienne adresse ne suivent pas** : exporter depuis l'ancienne adresse, importer sur la nouvelle.

## Déploiement (GitHub Pages)

1. Repo public `jirr/streak`.
2. Settings → Pages → Source : « GitHub Actions ».
3. Push sur `main` : `.github/workflows/deploy.yml` lance les tests, build et publie `dist/`.

## Installer l'app

- **Android / Chrome** : bouton « Installer l'app » (accueil ou Mon compte) ou menu ⋮ → Installer l'application.
- **iPhone (Safari)** : Partager → « Sur l'écran d'accueil ». Voir l'écran `/install` dans l'app.

## Limites connues de la V0

- **Rappels non garantis app fermée.** Sans serveur, ils arrivent surtout quand l'app est ouverte ou récemment utilisée (timer + Periodic Background Sync, Chromium installé uniquement, fréquence décidée par le navigateur). Sur iPhone, quasi aucun rappel sans Web Push ; seuls le bandeau, le badge et le titre d'onglet fonctionnent.
- **Données liées à l'origine** `jirr.github.io` + chemin ; la base IndexedDB (`series-app-v1`) est partagée avec les autres projets `jirr.github.io`, d'où un nom dédié.
- **Safari** peut effacer les données d'un site non installé après 7 jours sans visite : installer l'app et exporter régulièrement.
- Sur iOS, le stockage de Safari et celui de l'app installée sont séparés : exporter puis importer.
- Pas de multi-appareil, pas de synchronisation.
- Un voyage entre fuseaux horaires peut décaler un jour.

## Vérification d'installabilité (Lighthouse)

La catégorie PWA a disparu de Lighthouse 12. Utiliser Lighthouse 11.7.1 :

```bash
npm run build && npm run preview
npx lighthouse@11.7.1 http://localhost:4173/streak/ --only-categories=pwa --output=json --output-path=./lh.json --chrome-flags="--headless=new"
```

Puis vérifier `audits["installable-manifest"].score === 1`. À défaut : DevTools → Application → Manifest (section Installability sans erreur).

## Pistes V1

1. **Capacitor + `@capacitor/local-notifications`** : emballer ce build, implémenter un `CapacitorNotificationScheduler` (notifications locales répétitives par série, annulées quand la série est cochée). Rappels fiables, app fermée, sans serveur ; `domain/` réutilisé tel quel.
2. **Web Push (VAPID)** avec un petit backend (Cloudflare Worker + Cron + KV/D1) ; nécessite une identité utilisateur et, sur iOS, l'installation sur l'écran d'accueil (16.4+).

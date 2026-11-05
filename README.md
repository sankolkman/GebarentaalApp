# Gebaren – vingeralfabet (proefversie)

Kleine webapp om het vingeralfabet van de Nederlandse Gebarentaal (NGT) te leren.

- **Alfabet**: alle 26 handvormen, met een videofragment per letter (bij J en Z beweegt de hand)
- **Herkennen**: zie een handvorm en kies de letter, of zie een letter en kies de handvorm. Letters die je fout had komen vaker terug.
- **Spellen**: lees een gespeld woord of een naam (alles in één keer of één voor één) en typ wat er staat

Je voortgang staat in je browser. Geen account, geen server.

## Starten

```bash
npm install
npm run dev
```

`npm test` draait de tests, `npm run build` maakt een statische site in `dist/`.

## Beelden en licentie

De handvormen komen uit de video [NGT handalfabet](https://commons.wikimedia.org/wiki/File:NGT_handalfabet.webm) door **Vera de Kok**, gepubliceerd op Wikimedia Commons onder [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Wijzigingen: de video is bijgesneden (de letter in beeld is weggehaald, zodat die geen antwoord verraadt), verkleind en geknipt in een foto en een kort fragment per letter. De afgeleide beelden in `public/letters/` en `public/clips/` vallen daarom ook onder **CC BY-SA 4.0**.

Opnieuw maken (ffmpeg komt mee via het npm-pakket `ffmpeg-static`):

```bash
# download NGT_handalfabet.webm van de Commons-pagina hierboven
npm run frames -- pad/naar/NGT_handalfabet.webm
```

De tijden per letter staan in [scripts/extract-frames.mjs](scripts/extract-frames.mjs).

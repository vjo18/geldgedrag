# Geldgedrag publiceren zonder Codespaces

De actuele website staat in `docs/`. Het is een statische website: HTML, CSS, JavaScript, CSV-gegevens en de offline PDF. Een Codespace, Node-build of Astro-installatie is niet nodig om haar te publiceren of eenvoudige wijzigingen te doen.

## Eenmalig publiceren

1. Voeg de pull request met de nieuwe website samen naar `main`.
2. Open **Settings → Pages** in deze repository.
3. Kies bij **Build and deployment → Source** voor **GitHub Actions** als dat nog niet geselecteerd is.
4. Open het tabblad **Actions** en controleer **Deploy to GitHub Pages**. Na de merge start deze automatisch. Zo nodig kun je **Run workflow** gebruiken.
5. Open het adres dat de geslaagde deployment toont.

Het bestaande domein `geldgedrag.be` is overgenomen uit `public/CNAME` naar `docs/CNAME`. De workflow gebruikt de bestaande Pages-configuratie en past DNS niet aan. Als het domein al naar GitHub Pages wijst, is daarvoor geen nieuwe DNS-configuratie nodig. Controleer eventuele domeinmeldingen en HTTPS onder **Settings → Pages**.

De oude Astro-bestanden blijven in de repository als naslag. Ze worden niet meer gebruikt door de publicatieworkflow. De nieuwe workflow valideert de statische website en publiceert uitsluitend `docs/`.

## Later wijzigen via de GitHub-website

1. Open bijvoorbeeld `docs/over.html` of `docs/jaarreeksen.csv`.
2. Klik op het potlood om het bestand te bewerken.
3. Kies **Commit changes** en bij voorkeur een nieuwe branch met een pull request.
4. Na het samenvoegen naar `main` wordt de wijziging automatisch gepubliceerd.

Teksten staan in de HTML-bestanden. Algemene opmaak staat in `docs/design.css`; de homepage heeft daarnaast `docs/home.css`. Alle interne paden zijn relatief, zodat de bestanden zowel onder een eigen domein als onder een GitHub Pages-projectpad werken.

De twee essayknoppen downloaden hetzelfde bestand: `docs/essay-geldgedrag.pdf`. De PDF verwijst voor de webeditie naar `https://geldgedrag.be/essay.html`.

## Jaarcijfers en PDF

Zie `DATA_BIJWERKEN.md` voor de gegevenskolommen, brondefinities en vaste basisjaren. De interactieve grafieken nemen beschikbare nieuwe jaarregels automatisch over. De PDF is een afzonderlijk, vast document en moet na een relevante wijziging opnieuw worden gegenereerd en geüpload.

Lokaal kan dat met Python, ReportLab, Matplotlib en de DejaVu-lettertypen:

```sh
python tools/generate_essay_pdf.py
python tools/check_site.py
```

Je kunt deze updates ook hier in ChatGPT laten voorbereiden. Codespaces is daarvoor niet vereist.

## Wat de automatische controles doen

- Controleren of lokale pagina's, assets en ankers bestaan.
- Controleren op dubbele HTML-id's en onjuiste jaarvolgorde in CSV's.
- Controleren of de PDF en het domeinbestand aanwezig zijn.
- De JavaScript-bestanden controleren op syntaxisfouten.

De workflow gebruikt geen repositorygeheimen of persoonlijke toegangstokens. De standaard `GITHUB_TOKEN` krijgt alleen de benodigde Pages-publicatierechten. Publicatie van deze publieke repository kan via GitHub Pages zonder Codespaces-tegoed.

## Definitief essay vanuit Word bijwerken

De webtekst is op 30 oktober 2026 woordelijk overgenomen uit de goedgekeurde Wordversie. Opmerkingen en de inhoudsopgave van Word worden niet als artikeltekst gepubliceerd. De zes interactieve grafieken blijven onderdeel van de webeditie.

Om een volgende definitieve Wordversie over te nemen, gebruik je Python met `lxml`, `reportlab`, `matplotlib` en `numpy`:

```sh
python tools/import_essay_docx.py definitief-essay.docx
python tools/generate_essay_pdf.py
python tools/check_site.py
```

De importer vervangt de artikeltekst en bronnen, behoudt de bestaande grafiekbesturing en controleert of alle tekstblokken uit Word terugkomen. Controleer de nieuwe webeditie en PDF vóór het samenvoegen. Bewaar het Worddocument zelf buiten de publieke repository wanneer het alleen als redactioneel werkbestand dient.

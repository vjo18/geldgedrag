# Jaarreeksen jaarlijks aanvullen

De nieuwe historische vergelijking en de vijf essaygrafieken lezen allebei `docs/jaarreeksen.csv`. Er zijn geen vaste eindjaren in hun berekeningen. De bestaande endowmentcalculator heeft nog zijn eigen ingebouwde modeldata; die moeten afzonderlijk worden bijgewerkt wanneer je ook dat model vernieuwt.

## CSV bijwerken

1. Voeg onderaan één regel toe voor het nieuwe jaar. Gebruik een puntkomma als scheidingsteken. Een punt of komma als decimaalteken kan; gebruik geen duizendtalscheidingstekens.
2. Laat ontbrekende waarden leeg. Gebruik daarvoor nooit 0 en kopieer geen vorig jaar als vervanging.
3. Controleer bron, indexvariant, valuta, periode, geografische samenstelling en eenheid. Noteer nieuwe publicatiegegevens en revisies in `docs/jaarreeksen-bronnen.json`.
4. Controleer de pagina Vermogensvormen en de vijf grafieken in het essay. Zij nemen nieuwe jaren over zodra voor de gekozen reeks voldoende gegevens bestaan.
5. Publiceer de gewijzigde bestanden via de GitHub-publicatieworkflow.

| Kolom | Betekenis / eenheid |
| --- | --- |
| year | Jaartal, uniek en oplopend |
| msci_eur | Aangeleverde MSCI ACWI IMI netto-rendementsindex, EUR |
| sp500_eur | Aangeleverde S&P 500 netto-rendementsindex, EUR |
| gold_eur | Goudprijs EUR per troy ounce |
| bitcoin_eur | EUR per BTC; leeg vóór 2010 |
| cpi_be | Belgische CPI; gebruik dezelfde basis en periode voor alle jaren |
| wage_be_eur | Belgische bruto jaarloonreeks in EUR, met dezelfde populatie en periode |
| house_be_eur | Belgische woningprijsreeks in EUR; behoud dezelfde woningcategorie en statistische definitie |
| m3_ea_bn | M3 eurozone, miljard EUR; houd samenstelling en peilmoment consistent |
| debt_ea20_mn | Geconsolideerde bruto overheidsschuld EA20 op jaareinde, miljoen EUR |
| gdp_ea20_mn | Nominaal bbp EA20 tijdens het jaar, miljoen EUR |

## Belangrijke controles

- Een EUR-netto-index is niet uitwisselbaar met een USD-index, prijsindex, bruto-index of ETF-prijs.
- Wijzig de basis van CPI of een index alleen door de volledige reeks consequent te herbaseren.
- Meng EA20 niet met EA21 of België. De aanvullende officiële eurozonereeksen hebben vaste EA20-samenstelling en beginnen in 2022. De Belgische schuld- en bbpreeksen uit de werkmap beginnen in 1999 en zijn de standaardweergave in het essay. Oudere geverifieerde EA20-waarden mogen later worden toegevoegd in de lege velden.
- Schuld is een voorraad en bbp een jaarstroom. De schuldreeks betreft alleen overheden.
- Vul de brondefinities voor de aangeleverde loon-, woning-, M3- en CPI-reeksen verder aan zodra de oorspronkelijke exports beschikbaar zijn.
- Bij onvolledige jaren beperkt de vergelijking haar keuzemogelijkheden tot gemeenschappelijke gegevens. Interne gaten worden niet geïnterpoleerd.

Voorbeeld van een lege nieuwe jaarregel: kopieer de kolomstructuur, vul het nieuwe jaartal in en vul uitsluitend werkelijk beschikbare waarden aan. Publiceer nooit verzonnen voorbeeldcijfers.

## Werkmap v2 en extra kolommen

De laatste import gebruikt DATA en BRONNEN uit de aangeleverde basiswerkmap. Alle bronnen en hun opmerkingen zijn bewaard in jaarreeksen-bronnen.json.

| Extra kolom | Betekenis |
| --- | --- |
| house_index_be | OECD nominal house price index België, jaargemiddelde; gebruikt voor de essayvergelijking met loon |
| debt_be_bn | NBB geconsolideerde bruto overheidsschuld België, miljard EUR op jaareinde |
| household_debt_be_bn | NBB leningen van Belgische huishoudens S14, miljard EUR op jaareinde |
| company_debt_be_bn | NBB leningen en schuldbewijzen van niet-financiële ondernemingen S11, miljard EUR op jaareinde |
| gdp_be_bn | Eurostat/NBB nominaal bbp België, miljard EUR per jaar |

De samengestelde Statbel-verkoopprijsreeks blijft apart in house_be_eur en wordt niet als consistente woningprijsindex gebruikt. Goud is voor deze vergelijkingen eveneens uit de nieuwste werkmap overgenomen; de endowmentcalculator blijft zijn eigen modeldata gebruiken.

## Langetermijngrafiek industriële uurlonen en S&P 500

De aanvullende essaygrafiek 1964–2022 gebruikt afzonderlijk `docs/langetermijn.csv`, met brondefinities in `docs/langetermijn-bronnen.json`. Meng deze industriële uurloonindex niet met de bruto jaarloonreeks vanaf 1999. De loonreeks eindigt bij de laatst beschikbare waarneming in deze bron (2022); voeg alleen jaren toe wanneer alle vier bronreeksen beschikbaar zijn.

S&P-kolommen bevatten jaarlijkse procentuele rendementen in USD, zonder en met herbelegde dividenden. Het geselecteerde basisjaar krijgt index 100: pas rendementen toe vanaf het daaropvolgende jaar. De CPI-kolom dient voor een rekenkundige correctie met Belgische inflatie, zonder wisselkoerscorrectie. Dit is geen EUR-koopkrachtrendement van een Belgische belegger en geen netto-ETF-rendement. Zowel prijs- als totaalrendementen moeten dezelfde kalenderjaarconventie behouden. Nieuwe complete jaren worden automatisch beschikbaar in de periodekeuze.

## Geldhoeveelheid, schuld en resterende koopkracht

De indexvergelijking in hoofdstuk 2 gebruikt vijf reeksen: M3 (eurozone), Belgische overheidsschuld, leningen van Belgische huishoudens, schuld van Belgische niet-financiële ondernemingen en Belgische CPI. Iedere reeks wordt gedeeld door de eigen waarde in het gekozen startjaar en vermenigvuldigd met 100. De verschillende geografische dekking en meetmomenten blijven expliciet vermeld. De CPI-index toont het prijsniveau, niet het jaarlijkse inflatiepercentage. De schuldsectoren worden niet opgeteld. Reeksen kunnen via de legenda verborgen en weer getoond worden; ten minste één reeks blijft zichtbaar. De losse M3-grafiek is vervallen; bronbedragen blijven afleesbaar in de tooltip.

De koopkrachtgrafiek in deel I, hoofdstuk 4, gebruikt dezelfde Belgische CPI uit `jaarreeksen.csv`: 100 × CPI(1999) / CPI(jaar). Het basisjaar staat vast op 1999; het eindjaar volgt automatisch de beschikbare CPI-jaren. Dit toont de koopkracht van een onveranderd bedrag zonder rente, niet de koopkracht van een loon. De bronindex en het koopkrachtverlies zijn via de tooltip afleesbaar. Geen nieuwe gegevensbestanden zijn nodig voor deze twee grafieken.

## Plaats en functie van de essaygrafieken

- Hoofdstuk 2: geldhoeveelheid, drie schuldsectoren en consumentenprijzen — relatieve groei en definities.
- Hoofdstuk 4: koopkracht — omgekeerde CPI vanaf vast basisjaar 1999.
- Hoofdstuk 6: nominaal bbp en schulden van overheid, huishoudens en niet-financiële ondernemingen — relatieve groei met index 100, plus sector/bbp in de samenvatting, tooltips en jaarwaardentabel.
- Hoofdstuk 9: loon en woningprijsindex — toegang tot wonen.
- Hoofdstuk 15: loon, wereldaandelen en goud — verschillende ontwikkeling van inkomen en bestaand bezit.
- Hoofdstuk 19: industriële uurlonen en S&P 500 — herbeleggen over een lange periode.

De eerdere losse M3-grafiek is samengevoegd met de indexvergelijking om herhaling te vermijden. De twee aandelenvergelijkingen hebben verschillende functies, perioden, valuta en loondefinities; zij worden niet aan elkaar geplakt.

De losse schuldgrafiek in hoofdstuk 16 is verwijderd als herhaling. De drie sectoren blijven in hoofdstuk 2 staan. In hoofdstuk 6 worden bbp en schulden van overheid, huishoudens en niet-financiële ondernemingen gecombineerd. Iedere verhouding = 100 × sectorschuld / nominaal bbp, met dezelfde geografie, valuta-eenheid en hetzelfde jaar. De sectoren worden niet opgeteld. Voor EA20 zijn alleen overheidsschuld en bbp aangeleverd; Belgische sectoren worden daar niet ingemengd. België gebruikt miljard EUR; EA20 miljoen EUR voor beide reeksen. De verhoudingen gebruiken de bronbedragen, niet de genormaliseerde indexstanden. Alle datalijnen zijn vol; kleuren onderscheiden de sectoren consequent tussen de grafieken.

## Offline PDF opnieuw genereren

Na een wijziging aan de essaytekst of de cijfers: voer `python tools/generate_essay_pdf.py` uit. Dit bouwt `docs/essay-geldgedrag.pdf` rechtstreeks uit `docs/essay.html`, `docs/jaarreeksen.csv` en `docs/langetermijn.csv`. Benodigd: ReportLab, Matplotlib en de DejaVu-lettertypen. De volledige tekst, inhoudsopgave, paginanummers, bronlinks en zes statische grafieken worden meegenomen. Het gaat om de Belgische weergave vanaf 1999 en de nominale langetermijnvergelijking in USD vanaf 1964; interactieve periodekeuzes blijven op de website.

Controleer na het genereren de pagina's visueel en publiceer de bijgewerkte PDF met de website. Beide downloadknoppen gebruiken hetzelfde bestand. De datum op het omslag wordt automatisch bijgewerkt.

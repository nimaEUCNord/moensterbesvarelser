# Sådan fodres en journal ind i showroom-siden

Siden `hookes-lov-journal.html` bygges ud fra en PDF og en liste med lærerkommentarer.
Resultatet er én selvstændig HTML-fil, der virker offline og kan lægges på Lectio/Teams.

## Ny journal (fx en anonymiseret elevjournal)

1. Gem journalen som PDF fra Word (Filer → Gem som → PDF). Læg PDF'en (og gerne .docx'en) i `journal/`.
2. Kopiér `build/kommentarer.json`, og ret `pdf`, `docx`, `ud` og kommentarerne.
   Hver kommentar peger på et sted i teksten med et citat:
   - `"start"`: de første ord i tekststykket, og `"slut"`: de sidste ord (valgfri)
   - `"boks": true` markerer det hele som én kasse (godt til lister, tabeller og ligninger)
   - `"billede": 0` peger på et billede i stedet (billederne tælles fra forsiden, startende med 0)
   - `"typiskFejl"` (valgfri) viser en svag og en stærk formulering under kommentaren
   - Mellemrum og kursiv matematik er ligegyldige for søgningen.
3. Kør: `python build/build_html.py build/min-kommentarfil.json`
   Kan et citat ikke findes, skriver scriptet hvilket.

Kræver Python med `pymupdf` (`pip install pymupdf`).

## Genskab eksempel-journalen (Hookes lov)

Journalen er bygget af scripts, så den kan ændres og bygges igen:

1. `powershell -File build/excel_chart.ps1`: Figur 2 som et Excel-punktdiagram (`journal/figur2-graf.png`)
2. `node build/make_docx.js <raa.docx>`: Word-dokumentet med ligninger som pladsholdere (kræver `npm install docx`)
3. `powershell -File build/finish_word.ps1 <raa.docx> "journal/Hookes lov - journal"`: Word laver
   ligningerne om til rigtige Word-ligninger (som WordMat), opdaterer indholdsfortegnelsen og gemmer .docx og .pdf
4. `python build/build_html.py`

Skitsen `journal/figur1-skitse.png` er et skærmbillede af `build/figur1-skitse.html`.

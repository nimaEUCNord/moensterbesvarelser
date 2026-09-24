# Sådan fodres en journal ind i Mønsterbesvarelser

Siden `fysik/hookes-lov-journal.html` bygges ud fra en PDF og en liste med lærerkommentarer.
Resultatet er én selvstændig HTML-fil, der virker offline og kan lægges på Lectio/Teams.
Den kan også lægges på hjemmesiden https://mosskov.github.io/moensterbesvarelser/ (se Publicering nederst).

## Ny journal (fx en anonymiseret elevjournal)

1. Gem journalen som PDF fra Word (Filer → Gem som → PDF). Læg PDF'en (og gerne .docx'en) i `journal/`.
2. Kopiér `build/kommentarer.json`, og ret `pdf`, `docx`, `ud` og kommentarerne.
   Hver kommentar peger på et sted i teksten med et citat:
   - `"start"`: de første ord i tekststykket, og `"slut"`: de sidste ord (valgfri)
   - `"boks": true` markerer det hele som én kasse (godt til lister, tabeller og ligninger)
   - `"billede": 0` peger på et billede i stedet (billederne tælles fra forsiden, startende med 0)
   - `"typiskFejl"` (valgfri) viser en svag og en stærk formulering under kommentaren
   - `"guide"` (valgfri) viser et link til en guide under kommentaren, fx
     `{"titel": "Graf i Excel", "href": "../vaerktoejer/graf-i-excel.html#trin-5"}`
   - Mellemrum og kursiv matematik er ligegyldige for søgningen.
   Findes dokumentet i flere versioner (fx Word og LaTeX), bygges hver version som sin egen side med sin
   egen kommentarfil. Alle kommentarfilerne får den samme liste, som giver en vælger øverst på siden:
   `"varianter": [{"navn": "Word + WordMat + Excel", "href": "hookes-lov-journal.html"}, {"navn": "LaTeX"}]`
   En version uden `"href"` vises som "kommer snart". Opgaveregning skal have versionerne WordMat, Maple og I hånden.
   `"sektion"` (fx `"journal"`) er fanen på fagsiden, som "Fysik" i topbjælken går tilbage til, og `"seOgsaa"` er
   en liste af links (`type`, `titel`, `tekst`, `href`), der vises nederst på siden.
   `"titel"`, `"overlinje"` og `"intro"` er sidens overskrift, linjen over den og teksten under den. Titlen
   beskriver dokumenttypen og niveauet (fx "En god journal i 1g"), og emnet står i overlinjen.
   `"tjekliste"` (`titel`, `href`) linker fra værktøjslinjen til dokumenttypens fælles tjekliste, fx
   `fysik/tjekliste-journal.html`.
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

## Publicering (GitHub Pages)

Første gang (ikke gjort endnu):
`gh repo create Mosskov/moensterbesvarelser --public --source . --push` og derefter
`gh api -X POST repos/Mosskov/moensterbesvarelser/pages -f "source[branch]=main" -f "source[path]=/"`

Hjemmesiden er repoet `Mosskov/moensterbesvarelser`. Forsiden `index.html` viser kun fagene.
Hvert fag har sin egen mappe med en fagside (fx `fysik/index.html`), der viser fagets dokumenter.
Fælles stil og temaknapper ligger i `assets/site.css` og `assets/site.js`.
Guiderne (Word, Excel, WordMat) ligger i `vaerktoejer/` og er almindelige, håndskrevne HTML-sider, der ikke bygges.
De bruger `assets/guide.css` (trin og tegnede Excel-skærme). En ny guide erstatter et "Kommer snart"-kort på
`vaerktoejer/index.html`, og journalerne linker til den med `"guide"` i kommentarfilen.
Tjeklisterne (fx `fysik/tjekliste-journal.html`) er også håndskrevne. Der er én pr. dokumenttype, og de bruger
`assets/tjekliste.css` og `assets/tjekliste.js`.
GitHub bygger siden igen, hver gang der bliver pushet til `main`.

1. Ret skabelonen eller kommentarfilen, og kør `python build/build_html.py ...`
2. Er det et nyt dokument, så sæt `"ud"` til fagets mappe (fx `"kemi/titel.html"`), erstat det rigtige
   "Kommer snart"-kort på fagsiden (under dokumenttypen og klassetrinnet) med et link-kort, og ret antallet på forsiden. Første dokument i et nyt fag: kopiér `fysik/index.html` til fagets mappe, og gør
   fagets "Kommer snart"-kort på forsiden til et link (`<a class="card" href="kemi/">`).
3. `git add -A`, `git commit -m "..."` og `git push`. Siden er opdateret efter et minut eller to.

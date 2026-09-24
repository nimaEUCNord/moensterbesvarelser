// Bygger råudgaven af journalen (.docx). Ligninger skrives som pladsholdere i Words
// lineære format: §§D...§§ (display) og §§I...§§ (i teksten). finish_word.ps1 laver dem
// om til rigtige Word-ligninger (som WordMat), opdaterer felter og gemmer som PDF.
//   node make_docx.js <ud.docx>
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, WidthType, ShadingType, TabStopType,
  TabStopPosition, PageNumber, TableOfContents, SequentialIdentifier, PageBreak, VerticalAlign,
} = require("docx");

const out = process.argv[2] || path.join(__dirname, "..", "journal", "_raa.docx");
const J = path.join(__dirname, "..", "journal");
const FONT = "Calibri";

// --- tekst med pladsholdere: "Kraften §§IF§§ er ..." -> runs
const runs = (s, o = {}) => [new TextRun({ text: s, ...o })];
const P = (s, o = {}) => new Paragraph({ children: runs(s), ...o });
const EQ = (lin) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 160 }, children: [new TextRun("§§D" + lin + "§§")] });
const I = (lin) => "§§I" + lin + "§§";
const H = (no, title, o = {}) => new Paragraph({
  heading: HeadingLevel.HEADING_1, tabStops: [{ type: TabStopType.LEFT, position: 567 }],
  children: [new TextRun(no + "\t" + title)], ...o,
});
const bullet = (s) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 60 }, children: runs(s) });
const step = (s) => new Paragraph({ numbering: { reference: "num", level: 0 }, spacing: { after: 60 }, children: runs(s) });
const caption = (kind, s, o = {}) => new Paragraph({
  style: "Caption", ...o,
  children: [new TextRun(kind + " "), new SequentialIdentifier(kind), new TextRun(": " + s)],
});
const img = (file, w, h) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
  children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(J, file)), transformation: { width: w, height: h } })],
});

// --- forside-tabel (label/værdi)
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const infoRow = (k, v) => new TableRow({ children: [
  new TableCell({ borders: noBorders, width: { size: 2600, type: WidthType.DXA }, children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: k, color: "595959" })] })] }),
  new TableCell({ borders: noBorders, width: { size: 6426, type: WidthType.DXA }, children: [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: v })] })] }),
] });

// --- datatabel
const data = [
  [0, "12,3", "0,000", "0,000"], [50, "14,8", "0,025", "0,491"], [100, "17,1", "0,048", "0,982"],
  [150, "19,7", "0,074", "1,473"], [200, "22,2", "0,099", "1,964"], [250, "24,5", "0,122", "2,455"], [300, "27,1", "0,148", "2,946"],
];
const line = { style: BorderStyle.SINGLE, size: 4, color: "8EAADB" };
const cellBorders = { top: line, bottom: line, left: line, right: line };
const COLW = [2000, 2000, 2400, 2000];
const cell = (t, head, i) => new TableCell({
  borders: cellBorders, width: { size: COLW[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
  shading: head ? { type: ShadingType.CLEAR, color: "auto", fill: "D9E2F3" } : undefined,
  margins: { top: 40, bottom: 40, left: 100, right: 100 },
  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: runs(t, head ? { bold: true } : {}) })],
});
const dataTable = new Table({
  width: { size: COLW.reduce((a, b) => a + b), type: WidthType.DXA }, columnWidths: COLW, alignment: AlignmentType.CENTER,
  rows: [
    new TableRow({ tableHeader: true, children: ["Masse m / g", "Position L / cm", "Forlængelse Δx / m", "Kraft F / N"].map((t, i) => cell(t, true, i)) }),
    ...data.map((r) => new TableRow({ children: r.map((v, i) => cell(String(v), false, i)) })),
  ],
});

const header = new Header({ children: [new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 4 } },
  children: [new TextRun({ text: "Freja Madsen, 1.x · Fysik", size: 18, color: "7F7F7F" }), new TextRun({ text: "\tHookes lov – journal", size: 18, color: "7F7F7F" })],
}) ] });
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
  new TextRun({ children: ["Side ", PageNumber.CURRENT, " af ", PageNumber.TOTAL_PAGES], size: 18, color: "7F7F7F" }),
] }) ] });
const empty = () => new Header({ children: [new Paragraph("")] });

const doc = new Document({
  creator: "Freja Madsen",
  title: "Bestemmelse af fjederkonstanten for en skruefjeder",
  styles: {
    default: { document: { run: { font: FONT, size: 22 }, paragraph: { spacing: { after: 160, line: 276 } } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Calibri Light", size: 56, color: "1F1F1F" }, paragraph: { spacing: { after: 120, line: 240 } } },
      { id: "Subtitle", name: "Subtitle", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 28, color: "5A5A5A" }, paragraph: { spacing: { after: 240 } } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Calibri Light", size: 32, color: "2F5496" }, paragraph: { spacing: { before: 360, after: 120 }, keepNext: true, outlineLevel: 0 } },
      { id: "Caption", name: "caption", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { italics: true, size: 18, color: "44546A" }, paragraph: { spacing: { before: 60, after: 200 } } },
    ],
  },
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  features: { updateFields: true },
  sections: [{
    properties: { titlePage: true, page: { margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } },
    headers: { default: header, first: empty() },
    footers: { default: footer, first: new Footer({ children: [new Paragraph("")] }) },
    children: [
      // ---------------- Forside
      new Paragraph({ spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: "FYSIK · JOURNAL", size: 20, color: "2F5496", bold: true, characterSpacing: 40 })] }),
      new Paragraph({ style: "Title", children: [new TextRun("Bestemmelse af fjederkonstanten for en skruefjeder")] }),
      new Paragraph({ style: "Subtitle", border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2F5496", space: 12 } }, children: [new TextRun("Hookes lov undersøgt med lodder og en lineal")] }),
      img("figur1-skitse.png", 190, 197),
      new Paragraph({ spacing: { before: 1400 }, children: [] }),
      new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [2600, 6426], rows: [
        infoRow("Navn", "Freja Madsen"), infoRow("Klasse", "1.x, fysik"), infoRow("Makker", "Ali Hassan"),
        infoRow("Forsøget udført", "10. september 2026"), infoRow("Afleveret", "17. september 2026"),
      ] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- Indhold
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Indholdsfortegnelse", font: "Calibri Light", size: 32, color: "2F5496" })] }),
      new TableOfContents("Indholdsfortegnelse", { hyperlink: true, headingStyleRange: "1-1" }),

      H("1", "Formål"),
      P(`Formålet er at undersøge, om fjederkraften ${I("F")} er proportional med fjederens forlængelse ${I("Δx")}, og at bestemme fjederkonstanten ${I("k")} for fjederen.`),

      H("2", "Teori"),
      P("Når man hænger et lod i en fjeder, strækker fjederen sig. Ifølge Hookes lov er kraften fra fjederen proportional med forlængelsen:"),
      EQ("F=k⋅Δx#(1)"),
      P("hvor", { spacing: { after: 60 } }),
      ...[["F", "er fjederkraften, målt i newton (N)"], ["k", "er fjederkonstanten, målt i newton per meter (N/m)"], ["Δx", "er forlængelsen i forhold til startpositionen, målt i meter (m)"]].map(([s, t], i, a) =>
        new Paragraph({ indent: { left: 567 }, tabStops: [{ type: TabStopType.LEFT, position: 1400 }], spacing: { after: i === a.length - 1 ? 160 : 40 }, children: runs(I(s) + "\t" + t) })),
      P("Når loddet hænger stille, er fjederkraften lige så stor som tyngdekraften på loddet:"),
      EQ("F=m⋅g#(2)"),
      P(`hvor ${I("m")} er loddets masse i kg, og ${I('g=9,82" m"∕"s"^2')} er tyngdeaccelerationen i Danmark.`),
      P(`Hvis (1) gælder, vil en graf af ${I("F")} som funktion af ${I("Δx")} være en ret linje gennem (0,0), og hældningen er ${I("k")}. Vi antager, at fjederen ikke bliver strakt så meget, at den bliver varigt deformeret, og at fjederens egen masse ikke påvirker resultatet.`),

      H("3", "Materialer og opstilling"),
      bullet("Stativ med tværstang"),
      bullet(`Skruefjeder (producentens værdi: ${I('k=20" N"∕"m"')})`),
      bullet("Loddeholder og 6 lodder à 50 g"),
      bullet("Lineal, 30 cm med mm-inddeling"),
      bullet("Viser (en tynd ståltråd tapet fast under loddeholderen)"),
      img("figur1-skitse.png", 250, 259),
      caption("Figur", "Opstillingen. Viserens position L aflæses på linealen, og forlængelsen er Δx = L − L₀.", { alignment: AlignmentType.CENTER }),

      H("4", "Fremgangsmåde"),
      step("Fjederen hænges i stativet med den tomme loddeholder og viseren på."),
      step(`Linealen stilles lodret ved siden af, og viserens startposition ${I("L_0")} aflæses, med øjet i samme højde som viseren.`),
      step(`Der lægges ét lod (50 g) på ad gangen. Når fjederen hænger helt stille, aflæses viserens position ${I("L")}.`),
      step("Det gentages, indtil der hænger 300 g i alt."),
      step(`Til sidst fjernes lodderne, og vi tjekker, at viseren er tilbage ved ${I("L_0")}. Så ved vi, at fjederen ikke er blevet strakt for meget.`),

      H("5", "Måleresultater"),
      P(`Startpositionen var ${I('L_0=12,3" cm"')}. Tabellen viser de målte positioner og de beregnede værdier.`),
      caption("Tabel", "Målte og beregnede værdier. L er aflæst med en usikkerhed på ±0,1 cm.", { keepNext: true, spacing: { before: 120, after: 80 } }),
      dataTable,

      H("6", "Databehandling"),
      P(`Kraften er beregnet med (2), og forlængelsen er beregnet som ${I("Δx=L-L_0")} og omregnet til meter. Eksempel med 150 g, beregnet med WordMat:`),
      EQ('F=m⋅g=0,150" kg"⋅9,82" m"∕"s"^2 =1,473" N"'),
      EQ('Δx=L-L_0=19,7" cm"-12,3" cm"=7,4" cm"=0,074" m"'),
      P(`Grafen viser ${I("F")} som funktion af ${I("Δx")}. Vi har lavet et punktdiagram med en lineær tendenslinje i Excel.`, { keepNext: true }),
      img("figur2-graf.png", 540, 326),
      caption("Figur", "Kraften F som funktion af forlængelsen Δx. Punkterne er målinger, og den stiplede linje er den lineære tendenslinje.", { alignment: AlignmentType.CENTER }),
      P(`Punkterne ligger på en ret linje tæt på (0,0), så ${I("F")} er proportional med ${I("Δx")}, som (1) siger. Hældningen er fjederkonstanten: ${I('k=19,95" N"∕"m"')}. Skæringen med y-aksen er 0,0024 N, og det er så tæt på 0, at det ligger inden for måleusikkerheden.`),

      H("7", "Diskussion"),
      P(`Den største fejlkilde er aflæsningen af linealen. Viseren svingede lidt op og ned, og vi kunne kun aflæse til nærmeste mm, så hver aflæsning har en usikkerhed på ca. ±0,1 cm. Fordi ${I("Δx")} er forskellen mellem to aflæsninger, kan den være op til ±0,2 cm forkert. Det betyder mest ved de små forlængelser: ved 50 g (${I('Δx=2,5" cm"')}) er det ca. 8 %. Det kan forklare, at punktet ved 100 g ligger lidt over linjen.`),
      P("Hvis vi ikke havde øjet i samme højde som viseren, kan der også være en parallaksefejl, men den er den samme ved alle målinger og påvirker derfor næsten ikke hældningen. Fjederens egen masse påvirker heller ikke resultatet, fordi vi målte forlængelsen fra startpositionen med fjederen allerede hængende."),
      P(`Ved den største forlængelse (14,8 cm) er usikkerheden ca. 0,2/14,8 ≈ 1,4 %. Det giver en usikkerhed på ${I("k")} på ca. ±0,3 N/m. Producentens værdi er 20 N/m, og vores resultat afviger med (20 − 19,95)/20 ≈ 0,3 %. Det ligger inden for usikkerheden.`),
      P(`Da viseren var tilbage ved ${I("L_0")} efter forsøget, og punkterne ligger på en ret linje (${I("R^2=0,9998")}), er fjederen ikke blevet strakt ud over det område, hvor Hookes lov gælder.`),

      H("8", "Konklusion"),
      P(`Forsøget viser, at fjederkraften er proportional med forlængelsen for kræfter mellem 0 og 2,9 N, fordi målepunkterne ligger på en ret linje gennem (0,0). Fjederkonstanten er bestemt til ${I('k=(20,0±0,3)" N"∕"m"')}, hvilket stemmer med producentens værdi på 20 N/m.`),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("Skrevet:", out); });

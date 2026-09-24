# Gør pladsholderne fra make_docx.js til rigtige Word-ligninger (samme slags som WordMat laver),
# sætter Figur 2 ind som et rigtigt diagram, opdaterer indholdsfortegnelse og felter og gemmer
# journalen som .docx og .pdf.
#   powershell -File finish_word.ps1 <raa.docx> <ud-uden-endelse>
param([string]$Raw, [string]$OutBase)
$mark = [string][char]0xA7 + [char]0xA7          # "§§"

# Diagrammer i Word tegnes med Excels decimaltegn. Excel sættes til dansk komma under
# kørslen og stilles tilbage bagefter (indstillingen gemmes først, når Excel lukker).
function Set-ExcelSeparators($use, $dec, $th) {
  $x = New-Object -ComObject Excel.Application
  $old = @($x.UseSystemSeparators, $x.DecimalSeparator, $x.ThousandsSeparator)
  $x.DecimalSeparator = $dec; $x.ThousandsSeparator = $th; $x.UseSystemSeparators = $use
  $x.Quit(); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($x)
  [GC]::Collect(); Start-Sleep 2
  return $old
}

# Figur 2: punktdiagram af F mod dx med lineær tendenslinje. Diagrammet laves i Word, så data
# ligger i en integreret projektmappe, ligesom når eleven indsætter med "Behold kildeformatering
# og integrer projektmappe". Det kan redigeres i Word og er skarpt i PDF'en.
function Add-Figur2($doc) {
  $dx = @(0, 0.025, 0.048, 0.074, 0.099, 0.122, 0.148)
  $F  = @(0, 0.491, 0.982, 1.473, 1.964, 2.455, 2.946)
  $r = $doc.Content
  if (-not $r.Find.Execute("[[GRAF]]")) { throw "Mangler pladsholderen [[GRAF]]" }
  $r.Text = ""
  $s = $doc.InlineShapes.AddChart2(-1, -4169, $r)   # xlXYScatter
  $s.Width = 405; $s.Height = 245
  $ch = $s.Chart
  $ch.ChartData.Activate()
  $wb = $null
  for ($i = 0; $i -lt 40 -and -not $wb; $i++) { Start-Sleep -Milliseconds 250; try { $wb = $ch.ChartData.Workbook } catch {} }
  if (-not $wb) { throw "Diagrammets projektmappe åbnede ikke" }
  $wb.Application.WindowState = -4140              # minimeret
  $ws = $wb.Worksheets.Item(1)
  $ws.Cells.Clear()
  $ws.Cells.Item(1, 1).Value2 = "Δx / m"
  $ws.Cells.Item(1, 2).Value2 = "F / N"
  for ($i = 0; $i -lt $dx.Count; $i++) {
    $ws.Cells.Item($i + 2, 1).Value2 = [double]$dx[$i]
    $ws.Cells.Item($i + 2, 2).Value2 = [double]$F[$i]
  }
  if ($ws.ListObjects.Count) { [void]$ws.ListObjects.Item(1).Resize($ws.Range("A1:B8")) }
  $ch.SetSourceData("='" + $ws.Name + "'!`$A`$1:`$B`$8")
  $wb.Close()

  $ch.HasTitle = $false
  $ch.HasLegend = $false
  $ch.ChartArea.Format.TextFrame2.TextRange.Font.Size = 10
  $ch.ChartArea.Format.Line.Visible = 0            # ingen ramme
  $ch.ChartArea.Format.Fill.ForeColor.RGB = 0xFFFFFF

  $ser = $ch.SeriesCollection(1)
  $ser.MarkerStyle = 8                             # cirkel
  $ser.MarkerSize = 6
  $ser.MarkerBackgroundColor = 0xC47244            # BGR -> #4472C4
  $ser.MarkerForegroundColor = 0xC47244

  $t = $ser.Trendlines().Add(-4132)                # xlLinear
  $t.DisplayEquation = $true; $t.DisplayRSquared = $true
  $t.Format.Line.ForeColor.RGB = 0x7F7F7F
  $t.Format.Line.DashStyle = 4                     # msoLineDash
  $t.Format.Line.Weight = 1.25

  $ax = $ch.Axes(1)                                # x
  $ax.MinimumScale = 0; $ax.MaximumScale = 0.16; $ax.MajorUnit = 0.02
  $ax.TickLabels.NumberFormatLocal = "0,00"   # lokalt format (komma), gemmes som 0.00
  $ax.HasTitle = $true; $ax.AxisTitle.Text = "Forlængelse Δx / m"
  $ay = $ch.Axes(2)                                # y
  $ay.MinimumScale = 0; $ay.MaximumScale = 3.5; $ay.MajorUnit = 0.5
  $ay.TickLabels.NumberFormatLocal = "0,0"
  $ay.HasTitle = $true; $ay.AxisTitle.Text = "Kraft F / N"
  $ay.HasMajorGridlines = $true
  $ay.MajorGridlines.Format.Line.ForeColor.RGB = 0xE0E0E0

  # Flyt ligningen ned under linjen, så den ikke dækker punkterne
  $pa = $ch.PlotArea
  $lbl = $t.DataLabel
  $lbl.Format.TextFrame2.TextRange.Font.Size = 10
  $lbl.Left = $pa.InsideLeft + $pa.InsideWidth * 0.66
  $lbl.Top = $pa.InsideTop + $pa.InsideHeight * 0.55
  $s.AlternativeText = "Punktdiagram af kraften F som funktion af forlængelsen Δx med lineær tendenslinje: y = 19,95x + 0,0024, R² = 0,9998."
}

$oldSep = Set-ExcelSeparators $false "," "."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open([System.IO.Path]::GetFullPath($Raw))
  $pos = 0; $n = 0
  while ($true) {
    $r = $doc.Range($pos, $doc.Content.End)
    $r.Find.ClearFormatting()
    if (-not $r.Find.Execute($mark, $false, $false, $false, $false, $false, $true, 0)) { break }
    $start = $r.Start
    $r2 = $doc.Range($r.End, $doc.Content.End)
    if (-not $r2.Find.Execute($mark, $false, $false, $false, $false, $false, $true, 0)) { throw "Mangler afsluttende §§ efter position $start" }
    $full = $doc.Range($start, $r2.End)
    $txt = $full.Text
    $kind = $txt.Substring(2, 1)
    $full.Text = $txt.Substring(3, $txt.Length - 5)
    $mr = $doc.OMaths.Add($full)
    $om = $mr.OMaths.Item(1)
    $om.BuildUp()
    if ($kind -eq "D") { $om.Type = 0 } else { $om.Type = 1 }
    $pos = $om.Range.End
    $n++
  }
  "Ligninger: $n"
  Add-Figur2 $doc
  Start-Sleep 3   # Word er optaget et øjeblik, mens diagrammet tegnes
  "Figur 2: diagram indsat"
  $doc.Fields.Update() | Out-Null
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  $doc.Repaginate()
  $docx = [System.IO.Path]::GetFullPath("$OutBase.docx")
  $pdf  = [System.IO.Path]::GetFullPath("$OutBase.pdf")
  $doc.SaveAs2($docx, 16)
  $doc.ExportAsFixedFormat($pdf, 17)
  "Sider: " + $doc.ComputeStatistics(2)
  "Gemt: $docx"
  "Gemt: $pdf"
  $doc.Close(0)
} finally {
  $word.Quit()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
  $null = Set-ExcelSeparators $oldSep[0] $oldSep[1] $oldSep[2]
}

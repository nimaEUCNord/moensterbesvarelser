# Gør pladsholderne fra make_docx.js til rigtige Word-ligninger (samme slags som WordMat laver),
# opdaterer indholdsfortegnelse og felter og gemmer journalen som .docx og .pdf.
#   powershell -File finish_word.ps1 <raa.docx> <ud-uden-endelse>
param([string]$Raw, [string]$OutBase)
$mark = [string][char]0xA7 + [char]0xA7          # "§§"
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
}

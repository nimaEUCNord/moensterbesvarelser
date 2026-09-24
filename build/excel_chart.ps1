# Laver Figur 2 (F som funktion af dx) som et rigtigt Excel-punktdiagram med tendenslinje
# og gemmer det som PNG. Brug: powershell -File excel_chart.ps1 <output.png>
param([string]$Out = "$PSScriptRoot\..\journal\figur2-graf.png")

$dx = @(0, 0.025, 0.048, 0.074, 0.099, 0.122, 0.148)
$F  = @(0, 0.491, 0.982, 1.473, 1.964, 2.455, 2.946)

$xl = New-Object -ComObject Excel.Application
$xl.DisplayAlerts = $false
# Dansk decimalkomma i diagrammet, uanset Excels indstilling (stilles tilbage til sidst)
$oldSys = $xl.UseSystemSeparators; $oldDec = $xl.DecimalSeparator; $oldTh = $xl.ThousandsSeparator
$xl.UseSystemSeparators = $false; $xl.DecimalSeparator = ","; $xl.ThousandsSeparator = "."
try {
  $wb = $xl.Workbooks.Add()
  $ws = $wb.Worksheets.Item(1)
  $ws.Cells.Item(1, 1).Value2 = "Δx / m"
  $ws.Cells.Item(1, 2).Value2 = "F / N"
  for ($i = 0; $i -lt $dx.Count; $i++) {
    $ws.Cells.Item($i + 2, 1).Value2 = [double]$dx[$i]
    $ws.Cells.Item($i + 2, 2).Value2 = [double]$F[$i]
  }
  $co = $ws.ChartObjects().Add(20, 20, 720, 440)
  $ch = $co.Chart
  $ch.ChartType = -4169            # xlXYScatter
  $ch.SetSourceData($ws.Range("A1:B8"))
  $ch.HasTitle = $false
  $ch.HasLegend = $false
  $ch.ChartArea.Format.TextFrame2.TextRange.Font.Size = 17
  $ch.ChartArea.Format.Line.Visible = 0     # ingen ramme

  $s = $ch.SeriesCollection(1)
  $s.MarkerStyle = 8               # cirkel
  $s.MarkerSize = 9
  $s.MarkerBackgroundColor = 0xC47244  # BGR -> #4472C4
  $s.MarkerForegroundColor = 0xC47244

  $t = $s.Trendlines().Add(-4132)  # xlLinear
  # Excel beregner ikke tendenslinjens etiket, når den styres i baggrunden. Samme tal regnes
  # derfor med HÆLDNING/SKÆRING/FORKLARINGSGRAD og sættes ind som tekstfelt, hvor etiketten ville stå.
  $wf = $xl.WorksheetFunction
  $a = $wf.Slope($ws.Range("B2:B8"), $ws.Range("A2:A8"))
  $b = $wf.Intercept($ws.Range("B2:B8"), $ws.Range("A2:A8"))
  $r2 = $wf.RSq($ws.Range("B2:B8"), $ws.Range("A2:A8"))
  $da = [System.Globalization.CultureInfo]::GetCultureInfo("da-DK")
  $label = "y = " + $a.ToString("0.00", $da) + "x + " + $b.ToString("0.0000", $da) + "`r" + "R² = " + $r2.ToString("0.0000", $da)
  $t.Format.Line.ForeColor.RGB = 0x7F7F7F
  $t.Format.Line.DashStyle = 4     # msoLineDash
  $t.Format.Line.Weight = 1.75

  $ax = $ch.Axes(1)                # x
  $ax.MinimumScale = 0; $ax.MaximumScale = 0.16; $ax.MajorUnit = 0.02
  $ax.TickLabels.NumberFormat = "0.00"
  $ax.HasTitle = $true; $ax.AxisTitle.Text = "Forlængelse Δx / m"
  $ay = $ch.Axes(2)                # y
  $ay.MinimumScale = 0; $ay.MaximumScale = 3.5; $ay.MajorUnit = 0.5
  $ay.TickLabels.NumberFormat = "0,0"   # (med kommaseparator giver dette 3,5 — testet)
  $ay.HasTitle = $true; $ay.AxisTitle.Text = "Kraft F / N"
  $ay.HasMajorGridlines = $true
  $ay.MajorGridlines.Format.Line.ForeColor.RGB = 0xE0E0E0

  $ch.HasTitle = $true; $ch.ChartTitle.Delete()
  $pa = $ch.PlotArea
  $tb = $ch.Shapes.AddTextbox(1, $pa.InsideLeft + $pa.InsideWidth * 0.64, $pa.InsideTop + $pa.InsideHeight * 0.58, 220, 60)
  $tb.TextFrame2.TextRange.Text = $label
  $tb.TextFrame2.TextRange.Font.Size = 17
  $tb.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = 0x595959
  $tb.Line.Visible = 0; $tb.Fill.Visible = 0
  "Etiket: " + ($label -replace "`r", " | ")

  $full = [System.IO.Path]::GetFullPath($Out)
  $null = $ch.Export($full, "PNG")
  "Gemt: $full"
  $wb.Close($false)
} finally {
  $xl.DecimalSeparator = $oldDec; $xl.ThousandsSeparator = $oldTh; $xl.UseSystemSeparators = $oldSys
  $xl.Quit()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
}

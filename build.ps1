# Samler src/ til én selvstændig HTML-fil i dist/, klar til at publicere på claude.ai.
# Gør det samme som build.js, men kræver ikke Node.js.
# Kør: powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding $false
$src = Join-Path $PSScriptRoot "src"
$read = { param($f) [IO.File]::ReadAllText((Join-Path $src $f), $utf8) }

$html = & $read "index.html"
$out = $html.Replace('<link rel="stylesheet" href="styles.css">', "<style>`n" + (& $read "styles.css") + "</style>")
$out = $out.Replace('<script src="demo.js"></script>', "<script>`n" + (& $read "demo.js") + "</script>")
$out = $out.Replace('<script src="app.js"></script>', "<script>`n" + (& $read "app.js") + "</script>")

$dist = Join-Path $PSScriptRoot "dist"
New-Item -ItemType Directory -Force $dist | Out-Null
$target = Join-Path $dist "ddp-planlaegning.html"
[IO.File]::WriteAllText($target, $out, $utf8)
Write-Output "Bygget: $target"

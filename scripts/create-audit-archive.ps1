param([string]$Output = "oap-v0.1-audit.zip")

$root = [System.IO.Path]::GetFullPath((Get-Location).Path)
$target = [System.IO.Path]::GetFullPath((Join-Path $root $Output))
if ([System.IO.Path]::GetDirectoryName($target) -ne $root) { throw "Archive must be created at repository root." }
if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($target, [System.IO.FileMode]::CreateNew)
$zip = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
    $relative -notmatch '(^|/)(\.git|node_modules|dist|coverage|\.cache|\.tmp|controlled-sources)(/|$)' -and
    $relative -notmatch '(^|/)(\.env[^/]*|.*\.(key|pem|p12|pfx|log|tmp))$' -and
    $relative -notmatch '\.zip$'
  } | Sort-Object FullName
  foreach ($file in $files) {
    $name = $file.FullName.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
    $entry = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
    $entry.ExternalAttributes = (0x81A4 -shl 16)
    $inputStream = [System.IO.File]::OpenRead($file.FullName)
    $outputStream = $entry.Open()
    try { $inputStream.CopyTo($outputStream) } finally { $outputStream.Dispose(); $inputStream.Dispose() }
  }
} finally { $zip.Dispose(); $stream.Dispose() }

$archive = [System.IO.Compression.ZipFile]::OpenRead($target)
try {
  $bad = $archive.Entries | Where-Object { $_.FullName -match '\\|(^|/)(\.git|node_modules|dist|coverage|\.cache|\.tmp|controlled-sources)(/|$)|\.zip$|\.(key|pem|p12|pfx|log|tmp)$' }
  if ($bad) { throw "Archive exclusion or path portability verification failed." }
  $count = $archive.Entries.Count
} finally { $archive.Dispose() }
$hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
$size = (Get-Item -LiteralPath $target).Length
Write-Output "archive=$([System.IO.Path]::GetFileName($target))"
Write-Output "entries=$count"
Write-Output "bytes=$size"
Write-Output "sha256=$hash"
Write-Output "exclusions=verified"

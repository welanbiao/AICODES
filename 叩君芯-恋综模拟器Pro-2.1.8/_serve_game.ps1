# Minimal static file server for the love-sim folder (ASCII-only)
param(
  [int]$Port = 5178
)
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Get-ChildItem -LiteralPath $dir -Filter '*Pro.html' |
  Where-Object { $_.Length -gt 500000 } |
  Select-Object -First 1
if (-not $html) { throw 'Pro.html not found' }

$listener = [System.Net.HttpListener]::new()
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
} catch {
  Write-Output ("BIND_FAIL " + $_.Exception.Message)
  exit 1
}
Write-Output ("SERVING " + $dir)
Write-Output ("PREFIX " + $prefix)
Write-Output ("GAME " + $html.Name)

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.js'   { 'application/javascript; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.webp' { 'image/webp' }
    '.gif'  { 'image/gif' }
    '.svg'  { 'image/svg+xml' }
    '.woff' { 'font/woff' }
    '.woff2'{ 'font/woff2' }
    '.mp3'  { 'audio/mpeg' }
    '.mp4'  { 'video/mp4' }
    default { 'application/octet-stream' }
  }
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $reqPath = [uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($reqPath)) { $reqPath = $html.Name }
    $full = [IO.Path]::GetFullPath((Join-Path $dir ($reqPath -replace '/', [IO.Path]::DirectorySeparatorChar)))
    if (-not $full.StartsWith($dir, [StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
      $ctx.Response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes('Not Found')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $ctx.Response.Close()
      continue
    }
    $data = [IO.File]::ReadAllBytes($full)
    $ctx.Response.StatusCode = 200
    $ctx.Response.ContentType = Get-ContentType $full
    $ctx.Response.ContentLength64 = $data.LongLength
    $ctx.Response.Headers['Cache-Control'] = 'no-cache'
    $ctx.Response.OutputStream.Write($data, 0, $data.Length)
    $ctx.Response.Close()
  } catch {
    try {
      $ctx.Response.StatusCode = 500
      $ctx.Response.Close()
    } catch {}
  }
}

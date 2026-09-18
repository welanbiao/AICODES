# Simple static file server for 恋综模拟器Pro
param(
  [int]$Port = 8080,
  [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
} catch {
  Write-Host "Port $Port busy, trying 8765..."
  $Port = 8765
  $prefix = "http://127.0.0.1:$Port/"
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add($prefix)
  $listener.Start()
}

Write-Host "Serving $Root"
Write-Host "Open: ${prefix}%E6%81%8B%E7%BB%BC%E6%A8%A1%E6%8B%9F%E5%99%A8Pro.html"
Write-Host "Or:   ${prefix}index-redirect (auto)"
Write-Host "Press Ctrl+C to stop."

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.svg'  = 'image/svg+xml'
  '.mp3'  = 'audio/mpeg'
  '.wav'  = 'audio/wav'
  '.ogg'  = 'audio/ogg'
  '.mp4'  = 'video/mp4'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.LocalPath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($path) -or $path -eq 'index-redirect') {
      $path = '恋综模拟器Pro.html'
    }
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root $path))
    $rootFull = [System.IO.Path]::GetFullPath($Root)
    if (-not $full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $bytes = [Text.Encoding]::UTF8.GetBytes('Forbidden')
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } elseif (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
      $res.StatusCode = 404
      $msg = "Not Found: $path"
      $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.LongLength
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $res.StatusCode = 500
    $bytes = [Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } finally {
    $res.OutputStream.Close()
  }
}

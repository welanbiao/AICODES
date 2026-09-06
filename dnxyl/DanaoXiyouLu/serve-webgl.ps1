# Serve the WebGL build at http://127.0.0.1:5173/
Set-StrictMode -Version 1
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrEmpty($root) -and $MyInvocation.MyCommand.Path) {
    $root = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if ([string]::IsNullOrEmpty($root)) {
    $root = (Get-Location).Path
}
$dir = Join-Path $root "Builds\WebGL"
$index = Join-Path $dir "index.html"
if (-not (Test-Path $index)) {
    Write-Host "还没有 WebGL 包：$index"
    Write-Host "1. 安装 WebGL 模块后，在 Unity 菜单选：大闹西游路 → 构建 WebGL（浏览器 5173）"
    Write-Host "2. 构建完成再运行本脚本。"
    exit 1
}

Write-Host "打开浏览器访问  http://127.0.0.1:5173/"
Set-Location $dir
$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) {
    python -m http.server 5173 --bind 127.0.0.1
    exit $LASTEXITCODE
}
$py = Get-Command py -ErrorAction SilentlyContinue
if ($py) {
    py -3 -m http.server 5173 --bind 127.0.0.1
    exit $LASTEXITCODE
}
$npx = Get-Command npx -ErrorAction SilentlyContinue
if ($npx) {
    npx --yes serve -l 5173 .
    exit $LASTEXITCODE
}
Write-Host "需要 Python 或 Node（npx）才能在 5173 端口起静态服务。"
exit 1

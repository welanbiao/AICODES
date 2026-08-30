# Auto commit + push over SSH when the agent finishes a turn.
# Triggered by Cursor hook: stop

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Consume hook stdin JSON (required)
try { [void][Console]::In.ReadToEnd() } catch {}

function Write-HookJson {
  param([string]$Json = '{}')
  [Console]::Out.Write($Json)
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

# Ensure remotes always use SSH
$sshUrl = 'git@github.com:welanbiao/AICODES.git'
try {
  $current = (git remote get-url origin 2>$null)
  if ($current -match '^https://github\.com/') {
    git remote set-url origin $sshUrl 2>$null
  }
} catch {}

$status = git status --porcelain 2>$null
if (-not $status) {
  Write-HookJson '{}'
  exit 0
}

# Stage everything except secrets
git add -A 2>$null
git reset HEAD -- .env .env.* *.pem *.key 2>$null | Out-Null

$staged = git diff --cached --name-only 2>$null
if (-not $staged) {
  Write-HookJson '{}'
  exit 0
}

$summary = ($staged | Select-Object -First 5) -join ', '
if (($staged | Measure-Object).Count -gt 5) { $summary += ', ...' }
$message = "auto: update $summary"

$commitOk = $false
git commit -m $message 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { $commitOk = $true }

if (-not $commitOk) {
  Write-HookJson '{}'
  exit 0
}

# Push via SSH (never force)
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
if (-not $branch) { $branch = 'master' }

git push -u origin $branch 2>&1 | Out-Null

Write-HookJson '{}'
exit 0

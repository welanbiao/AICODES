# Auto-git safety net: batch commit + pull --no-rebase + SSH push.
# Intended to run on agent `stop` (once per turn), NOT on every file edit.
$ErrorActionPreference = 'Continue'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Drain hook stdin (JSON payload) so the pipe does not hang.
$hookInput = ''
try { $hookInput = [Console]::In.ReadToEnd() } catch { $hookInput = '' }

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-Output '{}'
    exit 0
}
Set-Location $repoRoot

$ssh = 'C:/Program Files/Git/usr/bin/ssh.exe'
if (Test-Path $ssh) {
    $env:GIT_SSH_COMMAND = "`"$ssh`""
}

$hookDir = Join-Path $repoRoot '.cursor/hooks'
$lockPath = Join-Path $hookDir 'auto-git.lock'
$msgPath = Join-Path $hookDir 'pending-commit-msg.txt'
$skipPatterns = @(
    '(^|/|\\)\.env$',
    '(^|/|\\)\.env\.',
    'credentials\.json$',
    '(^|/|\\)secrets?(/|\\)',
    '\.pem$',
    '\.key$',
    '\.p12$',
    '\.pfx$',
    'id_rsa',
    '\.keystore$'
)

function Test-BlockedPath([string]$path) {
    foreach ($pat in $skipPatterns) {
        if ($path -match $pat) { return $true }
    }
    return $false
}

function Get-ChangedPaths {
    $status = git status --porcelain 2>$null
    if (-not $status) { return @() }
    $paths = @()
    foreach ($line in ($status -split "`n")) {
        $line = $line.TrimEnd("`r")
        if (-not $line) { continue }
        $path = $line.Substring([Math]::Min(3, $line.Length)).Trim()
        if ($path -match ' -> ') { $path = ($path -split ' -> ')[-1] }
        $path = $path.Trim('"')
        if (-not $path) { continue }
        if (Test-BlockedPath $path) { continue }
        $paths += $path
    }
    return ,$paths
}

function Get-BusinessCommitMessage([string[]]$paths) {
    if (Test-Path -LiteralPath $msgPath) {
        $fromFile = (Get-Content -LiteralPath $msgPath -Raw -ErrorAction SilentlyContinue)
        if ($fromFile) {
            $title = ($fromFile -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -First 1)
            if ($title -and $title.Length -ge 4) { return $title }
        }
    }

    # Fallback: group by top-level area so the title stays readable without an LLM.
    $areas = @{}
    foreach ($p in $paths) {
        $norm = $p -replace '\\', '/'
        $area = if ($norm -match '^([^/]+)/') { $Matches[1] } else { '根目录' }
        if (-not $areas.ContainsKey($area)) { $areas[$area] = 0 }
        $areas[$area]++
    }
    $top = ($areas.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3 | ForEach-Object { $_.Key }) -join '、'
    $count = $paths.Count
    return "完善 $top 相关改动（共 $count 个文件）"
}

function Sync-AndPush {
    $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
    if (-not $branch) { return }
    $branch = $branch.Trim()
    if (-not $branch -or $branch -eq 'HEAD') { return }

    # Prefer merge pull (no rebase) to avoid rewriting shared history.
    git pull --no-rebase --no-edit origin $branch 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        # Likely conflict or network blip — do not force anything.
        return
    }
    git push -u origin "HEAD:$branch" 2>$null | Out-Null
}

# Simple lock to avoid overlapping stop/afterFileEdit races.
$lockTaken = $false
try {
    if (Test-Path -LiteralPath $lockPath) {
        $age = (Get-Date) - (Get-Item -LiteralPath $lockPath).LastWriteTime
        if ($age.TotalSeconds -lt 90) {
            Write-Output '{}'
            exit 0
        }
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
    Set-Content -LiteralPath $lockPath -Value (Get-Date).ToString('o') -Encoding UTF8
    $lockTaken = $true

    $paths = Get-ChangedPaths
    if ($paths.Count -gt 0) {
        git add -- $paths 2>$null | Out-Null
        $staged = @(git diff --cached --name-only 2>$null | Where-Object { $_ })
        if ($staged.Count -gt 0) {
            $msg = Get-BusinessCommitMessage $staged
            # Avoid interactive editors; pass message directly.
            git commit -m $msg 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $msgPath)) {
                Remove-Item -LiteralPath $msgPath -Force -ErrorAction SilentlyContinue
            }
        }
    }

    Sync-AndPush
}
finally {
    if ($lockTaken) {
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Output '{}'
exit 0

# Auto commit, merge remote, and push over SSH after agent work.
$ErrorActionPreference = 'Continue'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Drain hook stdin (JSON payload) so the pipe does not hang.
$null = [Console]::In.ReadToEnd()

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

$status = git status --porcelain 2>$null
if (-not $status) {
    # Still try to merge + push in case local commits are ahead.
    $branch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    if ($branch -and $branch -ne 'HEAD') {
        git pull --no-rebase --no-edit origin $branch 2>$null | Out-Null
        git push origin "HEAD:$branch" 2>$null | Out-Null
    }
    Write-Output '{}'
    exit 0
}

# Skip obvious secrets / env files from the commit set.
$skipPatterns = @('\.env$', '\.env\.', 'credentials\.json$', 'secret', '\.pem$', '\.key$')
$paths = @()
foreach ($line in ($status -split "`n")) {
    $line = $line.TrimEnd()
    if (-not $line) { continue }
    $path = $line.Substring([Math]::Min(3, $line.Length)).Trim()
    if ($path -match ' -> ') { $path = ($path -split ' -> ')[-1] }
    $blocked = $false
    foreach ($pat in $skipPatterns) {
        if ($path -match $pat) { $blocked = $true; break }
    }
    if (-not $blocked) { $paths += $path }
}

if ($paths.Count -eq 0) {
    Write-Output '{}'
    exit 0
}

git add -- $paths 2>$null | Out-Null
$staged = git diff --cached --name-only 2>$null
if (-not $staged) {
    Write-Output '{}'
    exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$summary = (($staged | Select-Object -First 5) -join ', ')
if (($staged | Measure-Object).Count -gt 5) { $summary += ', ...' }
$msg = "auto: $summary ($stamp)"

git commit -m $msg 2>$null | Out-Null

$branch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
if ($branch -and $branch -ne 'HEAD') {
    git pull --no-rebase --no-edit origin $branch 2>$null | Out-Null
    git push -u origin "HEAD:$branch" 2>$null | Out-Null
}

Write-Output '{}'
exit 0

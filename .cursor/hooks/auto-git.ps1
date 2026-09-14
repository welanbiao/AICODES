<#
.SYNOPSIS
  End-of-turn safety net: one commit for the whole agent turn, then sync over SSH.

.DESCRIPTION
  Intended for Cursor `stop` only — never afterFileEdit (that would create one
  commit per file). Stages remaining safe paths, creates at most one commit,
  then `git pull --no-rebase` and `git push`. Never force-pushes or rebases.

  The agent must write a business-facing Chinese title to
  `.cursor/hooks/pending-commit-msg.txt`. This script does not invent product
  language; it only falls back to an area summary if that file is missing.

.NOTES
  Fail-open: unexpected errors are logged and the process exits 0 so the agent
  session is not blocked. Conflicts and push failures are recorded in
  auto-git-status.json for the next turn.
#>
$ErrorActionPreference = 'Continue'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Drain hook stdin so the pipe cannot hang.
try { $null = [Console]::In.ReadToEnd() } catch { }

$utf8 = [System.Text.UTF8Encoding]::new($false)
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'never'

function Write-HookOutput {
    Write-Output '{}'
}

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-HookOutput
    exit 0
}
$repoRoot = $repoRoot.Trim()
Set-Location $repoRoot

$ssh = 'C:/Program Files/Git/usr/bin/ssh.exe'
if (Test-Path -LiteralPath $ssh) {
    $env:GIT_SSH_COMMAND = "`"$ssh`" -o BatchMode=yes"
}

$hookDir = Join-Path $repoRoot '.cursor/hooks'
$lockPath = Join-Path $hookDir 'auto-git.lock'
$msgPath = Join-Path $hookDir 'pending-commit-msg.txt'
$logPath = Join-Path $hookDir 'auto-git.log'
$statusPath = Join-Path $hookDir 'auto-git-status.json'
$msgTmpPath = Join-Path $hookDir 'commit-msg.tmp'
$maxFileBytes = 20MB

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
    'id_dsa',
    'id_ed25519',
    '\.keystore$',
    '\.secret$',
    '(^|/|\\)local\.properties$'
)

function Write-Log([string]$message) {
    try {
        if (Test-Path -LiteralPath $logPath) {
            $len = (Get-Item -LiteralPath $logPath).Length
            if ($len -gt 200KB) {
                Remove-Item -LiteralPath $logPath -Force -ErrorAction SilentlyContinue
            }
        }
        $line = '{0} {1}' -f (Get-Date -Format 's'), $message
        [System.IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, $utf8)
    } catch { }
}

function Write-Status([hashtable]$data) {
    try {
        $data['at'] = (Get-Date).ToString('o')
        $json = $data | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($statusPath, $json, $utf8)
    } catch { }
}

function Test-GitBusy {
    $gitDir = git rev-parse --git-dir 2>$null
    if (-not $gitDir) { return $true }
    $gitDir = $gitDir.Trim()
    if (-not [System.IO.Path]::IsPathRooted($gitDir)) {
        $gitDir = Join-Path $repoRoot $gitDir
    }
    foreach ($name in @('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply')) {
        if (Test-Path -LiteralPath (Join-Path $gitDir $name)) { return $true }
    }
    return $false
}

function Test-BlockedPath([string]$path) {
    $norm = $path -replace '\\', '/'
    if ($norm -match '\.env\.example$') { return $false }
    foreach ($pat in $skipPatterns) {
        if ($path -match $pat -or $norm -match $pat) { return $true }
    }
    return $false
}

function Test-JunkTitle([string]$title) {
    if (-not $title -or $title.Length -lt 4) { return $true }
    if ($title -match '^(?i)(auto|update|fix|wip|temp|misc|chore|test)[:：\s]') { return $true }
    if ($title -match '(?i)^(add|update|fix)\s+\S+\.\w{1,8}(,|$)') { return $true }
    if ($title -match '(?i)^[\w./\\-]+\.\w{1,8}(,\s*[\w./\\-]+\.\w{1,8})*$') { return $true }
    return $false
}

function Get-GitLines {
    param([string[]]$GitArgs)
    $raw = & git @GitArgs 2>$null
    if ($null -eq $raw) { return @() }
    # PowerShell splits native stdout into an Object[]; never -split that array
    # (it would join with spaces first and collapse every path into one).
    return @($raw | ForEach-Object { "$_".TrimEnd("`r") } | Where-Object { $_ })
}

function Unstage-BlockedIndex {
    foreach ($path in (Get-GitLines -GitArgs @('diff', '--cached', '--name-only'))) {
        $path = $path.Trim().Trim('"')
        if (-not $path) { continue }
        if (Test-BlockedPath $path) {
            Write-Log "unstage-secret $path"
            git restore --staged -- $path 2>$null | Out-Null
        }
    }
}

function Get-ChangedPaths {
    $paths = @()
    foreach ($line in (Get-GitLines -GitArgs @('status', '--porcelain'))) {
        if ($line.Length -lt 4) { continue }
        $raw = $line.Substring(3)
        if ($raw -match ' -> ') { $raw = ($raw -split ' -> ')[-1] }
        $path = $raw.Trim().Trim('"')
        if (-not $path) { continue }
        if (Test-BlockedPath $path) {
            Write-Log "skip-secret $path"
            continue
        }
        $full = Join-Path $repoRoot $path
        if (Test-Path -LiteralPath $full -PathType Leaf) {
            try {
                if ((Get-Item -LiteralPath $full).Length -gt $maxFileBytes) {
                    Write-Log "skip-oversize $path"
                    continue
                }
            } catch { }
        }
        $paths += $path
    }
    return @($paths)
}

function Get-CommitMessageText([string[]]$paths) {
    $title = $null
    $body = $null

    if (Test-Path -LiteralPath $msgPath) {
        $fromFile = [System.IO.File]::ReadAllText($msgPath, $utf8)
        if ($fromFile) {
            $lines = $fromFile -split '\r?\n'
            $titleLine = ($lines | ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -First 1)
            if ($titleLine -and -not (Test-JunkTitle $titleLine)) {
                $title = $titleLine
                $firstIdx = -1
                for ($i = 0; $i -lt $lines.Count; $i++) {
                    if ($lines[$i].Trim()) { $firstIdx = $i; break }
                }
                if ($firstIdx -ge 0 -and $firstIdx + 1 -lt $lines.Count) {
                    $rest = ($lines[($firstIdx + 1)..($lines.Count - 1)] -join "`n").Trim()
                    if ($rest) { $body = $rest }
                }
            } else {
                Write-Log "ignore-junk-title $titleLine"
            }
        }
    }

    if (-not $title) {
        $areas = @{}
        foreach ($p in $paths) {
            $norm = $p -replace '\\', '/'
            $area = if ($norm -match '^([^/]+)/') { $Matches[1] } else { '根目录' }
            if (-not $areas.ContainsKey($area)) { $areas[$area] = 0 }
            $areas[$area]++
        }
        $top = ($areas.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3 | ForEach-Object { $_.Key }) -join '、'
        $title = "完善 $top 相关能力（共 $($paths.Count) 个文件）"
        $body = "自动回退标题：本轮未提供可用的业务向提交说明。"
    }

    if ($body) { return "$title`n`n$body" }
    return $title
}

function Invoke-GitCapture {
    param([Parameter(Mandatory)][string[]]$GitArgs)
    $output = & git @GitArgs 2>&1 | ForEach-Object { "$_" } | Out-String
    return @{
        Code = $LASTEXITCODE
        Output = $output.Trim()
    }
}

function Sync-AndPush {
    $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
    if (-not $branch) { return 'no-branch' }
    $branch = $branch.Trim()
    if (-not $branch -or $branch -eq 'HEAD') { return 'detached-head' }

    $pull = Invoke-GitCapture -GitArgs @('pull', '--no-rebase', '--no-edit', 'origin', $branch)
    if ($pull.Code -ne 0) {
        Write-Log "pull-failed $($pull.Output)"
        Write-Status @{
            ok = $false
            committed = $script:didCommit
            message = $script:usedMessage
            pushed = $false
            error = 'pull_conflict_or_network'
            detail = $pull.Output
        }
        return 'pull-failed'
    }

    $push = Invoke-GitCapture -GitArgs @('push', '-u', 'origin', "HEAD:$branch")
    if ($push.Code -ne 0) {
        Write-Log "push-failed $($push.Output)"
        Write-Status @{
            ok = $false
            committed = $script:didCommit
            message = $script:usedMessage
            pushed = $false
            error = 'push_failed'
            detail = $push.Output
        }
        return 'push-failed'
    }

    Write-Status @{
        ok = $true
        committed = $script:didCommit
        message = $script:usedMessage
        pushed = $true
        error = $null
    }
    return 'ok'
}

$script:didCommit = $false
$script:usedMessage = $null
$lockTaken = $false

try {
    if (Test-Path -LiteralPath $lockPath) {
        $age = (Get-Date) - (Get-Item -LiteralPath $lockPath).LastWriteTime
        if ($age.TotalSeconds -lt 90) {
            Write-Log 'skip-lock-held'
            Write-HookOutput
            exit 0
        }
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
    [System.IO.File]::WriteAllText($lockPath, (Get-Date).ToString('o'), $utf8)
    $lockTaken = $true

    if (Test-GitBusy) {
        Write-Log 'skip-git-busy'
        Write-Status @{ ok = $false; error = 'merge_or_rebase_in_progress'; committed = $false; pushed = $false }
        Write-HookOutput
        exit 0
    }

    Unstage-BlockedIndex
    $paths = @(@(Get-ChangedPaths) | ForEach-Object { $_ })
    Write-Log ("stage-candidates {0}" -f $paths.Count)
    if ($paths.Count -gt 0) {
        foreach ($path in $paths) {
            Write-Log "add $path"
            $add = Invoke-GitCapture -GitArgs @('add', '--', $path)
            if ($add.Code -ne 0) { Write-Log "add-failed $path $($add.Output)" }
        }
        Unstage-BlockedIndex

        $staged = @(Get-GitLines -GitArgs @('diff', '--cached', '--name-only'))
        if ($staged.Count -gt 0) {
            $msg = Get-CommitMessageText $staged
            $script:usedMessage = ($msg -split '\r?\n' | Where-Object { $_.Trim() } | Select-Object -First 1)
            [System.IO.File]::WriteAllText($msgTmpPath, $msg.Trim() + "`n", $utf8)
            $commit = Invoke-GitCapture -GitArgs @('-c', 'i18n.commitEncoding=utf-8', 'commit', '--cleanup=verbatim', '-F', $msgTmpPath)
            Remove-Item -LiteralPath $msgTmpPath -Force -ErrorAction SilentlyContinue
            if ($commit.Code -eq 0) {
                $script:didCommit = $true
                Write-Log "committed $($script:usedMessage)"
                if (Test-Path -LiteralPath $msgPath) {
                    Remove-Item -LiteralPath $msgPath -Force -ErrorAction SilentlyContinue
                }
            } else {
                Write-Log "commit-failed $($commit.Output)"
            }
        }
    }

    $sync = Sync-AndPush
    Write-Log "sync $sync"
}
catch {
    Write-Log "error $($_.Exception.Message)"
    Write-Status @{ ok = $false; error = 'exception'; detail = $_.Exception.Message; committed = $script:didCommit; pushed = $false }
}
finally {
    if ($lockTaken) {
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
    Remove-Item -LiteralPath $msgTmpPath -Force -ErrorAction SilentlyContinue
}

Write-HookOutput
exit 0

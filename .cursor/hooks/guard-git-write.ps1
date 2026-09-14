<#
.SYNOPSIS
  Block mid-turn git history writes so one user request becomes one commit.

.DESCRIPTION
  Cursor `beforeShellExecution` guard. Denies `git commit` / `git push` /
  destructive history rewrites from the agent Shell tool. The `stop` hook
  (`auto-git.ps1`) is the only committer. Read-only git and `git add` stay
  allowed. Fail-open if the payload cannot be parsed.
#>
$ErrorActionPreference = 'Continue'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Write-Allow {
    Write-Output '{"permission":"allow"}'
}

$raw = ''
try { $raw = [Console]::In.ReadToEnd() } catch { $raw = '' }

$command = ''
try {
    if ($raw) {
        $payload = $raw | ConvertFrom-Json
        if ($payload.command) { $command = [string]$payload.command }
    }
} catch {
    Write-Allow
    exit 0
}

if (-not $command) {
    Write-Allow
    exit 0
}

function Test-GitHistoryWrite([string]$text) {
    foreach ($part in ($text -split '(?:;|&&|\|\|)')) {
        $segment = $part.Trim()
        if ($segment -notmatch '(?i)\bgit(\.exe)?\b') { continue }
        # Verb must be the git subcommand, not a flag like --no-rebase.
        if ($segment -match '(?i)\bgit(\.exe)?(?:\s+(?:-[^\s]+|\S+=\S+))*\s+(commit|push|rebase|reset|revert|filter-branch|filter-repo)\b') {
            return $true
        }
        if ($segment -match '(?i)(?:\s|^)--rebase(\s|=|$)') { return $true }
    }
    return $false
}

$deny = Test-GitHistoryWrite $command

if (-not $deny) {
    Write-Allow
    exit 0
}

$agent = '本仓库禁止在对话中途执行 git commit / push / reset / rebase。请把本轮业务向中文标题写入 .cursor/hooks/pending-commit-msg.txt，由 stop 钩子在本轮结束时一次性提交并推送。'
$response = @{
    permission = 'deny'
    agent_message = $agent
    user_message = '已拦截中途 Git 提交，避免改一个文件就产生一次提交。本轮结束会合并成一次提交。'
} | ConvertTo-Json -Compress
Write-Output $response
exit 0

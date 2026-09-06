# Dismiss common Windows error MessageBoxes by clicking 确定 / OK.
# Safe-ish: only standard dialogs (#32770), never UAC / security prompts.
param(
    [switch]$Watch,
    [switch]$StartWatcher
)

$ErrorActionPreference = 'Continue'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

if (-not $Watch) {
    try {
        if ([Console]::IsInputRedirected) { $null = [Console]::In.ReadToEnd() }
    } catch { }
}

$okConfirm = [string]([char]0x786E) + [char]0x5B9A   # 确定
$okYes = [string]([char]0x662F)                       # 是
$uacA = [string]([char]0x7528) + [char]0x6237 + [char]0x5E10 + [char]0x6237 + [char]0x63A7 + [char]0x5236
$uacB = [string]([char]0x7528) + [char]0x6237 + [char]0x8D26 + [char]0x6237 + [char]0x63A7 + [char]0x5236

Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class WinDlgClick {
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lp);
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr hWnd, EnumProc cb, IntPtr lp);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr hWnd, StringBuilder s, int n);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint msg, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    public const uint BM_CLICK = 0x00F5;
    public const uint WM_COMMAND = 0x0111;
    public const int IDOK = 1;

    static string Cls(IntPtr h) {
        var sb = new StringBuilder(256);
        GetClassName(h, sb, 256);
        return sb.ToString();
    }
    static string Txt(IntPtr h) {
        var sb = new StringBuilder(512);
        GetWindowText(h, sb, 512);
        return sb.ToString();
    }

    public static int Dismiss(string ok1, string ok2, string skipA, string skipB) {
        int clicked = 0;
        EnumWindows((h, lp) => {
            if (!IsWindowVisible(h)) return true;
            if (Cls(h) != "#32770") return true;
            string title = Txt(h);
            if (title.IndexOf("User Account Control", StringComparison.OrdinalIgnoreCase) >= 0) return true;
            if (title.IndexOf("Windows Security", StringComparison.OrdinalIgnoreCase) >= 0) return true;
            if (!string.IsNullOrEmpty(skipA) && title.IndexOf(skipA, StringComparison.OrdinalIgnoreCase) >= 0) return true;
            if (!string.IsNullOrEmpty(skipB) && title.IndexOf(skipB, StringComparison.OrdinalIgnoreCase) >= 0) return true;

            uint pid;
            GetWindowThreadProcessId(h, out pid);
            string proc = "";
            try { proc = System.Diagnostics.Process.GetProcessById((int)pid).ProcessName; } catch {}
            string pl = proc.ToLowerInvariant();
            if (pl == "consent" || pl == "credentialuibroker" || pl == "logonui") return true;

            bool allowProc =
                pl.Contains("cursor") || pl.Contains("unity") || pl == "git" || pl == "git-bash" ||
                pl == "ssh" || pl == "werfault" || pl == "powershell" || pl == "pwsh" ||
                pl == "python" || pl == "pythonw" || pl == "node" || pl == "code" ||
                pl == "explorer" || pl == "applicationframehost" || string.IsNullOrEmpty(pl);
            string tl = title.ToLowerInvariant();
            bool allowTitle =
                tl.Contains("error") || tl.Contains("fail") || tl.Contains("disk") ||
                tl.Contains("sqlite") || tl.Contains("cursor") || tl.Contains("unity") ||
                tl.Contains("warning") || title.IndexOf("\u9519\u8BEF") >= 0 ||
                title.IndexOf("\u78C1\u76D8") >= 0 || title.IndexOf("\u8B66\u544A") >= 0 ||
                title.IndexOf("\u65E0\u6CD5") >= 0 || title.Length == 0;
            if (!allowProc && !allowTitle) return true;

            IntPtr btn = IntPtr.Zero;
            EnumChildWindows(h, (c, lp2) => {
                if (Cls(c) != "Button") return true;
                string t = Txt(c).Replace("&", "").Trim();
                if (t.Equals(ok1, StringComparison.OrdinalIgnoreCase) ||
                    t.Equals("OK", StringComparison.OrdinalIgnoreCase) ||
                    t.Equals("Ok", StringComparison.OrdinalIgnoreCase) ||
                    t.Equals(ok2, StringComparison.OrdinalIgnoreCase)) {
                    btn = c;
                    return false;
                }
                return true;
            }, IntPtr.Zero);

            if (btn != IntPtr.Zero) {
                SendMessage(btn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
                clicked++;
            } else if (allowTitle) {
                SendMessage(h, WM_COMMAND, (IntPtr)IDOK, IntPtr.Zero);
                clicked++;
            }
            return true;
        }, IntPtr.Zero);
        return clicked;
    }
}
"@ -ErrorAction SilentlyContinue

function Invoke-Dismiss {
    try {
        return [WinDlgClick]::Dismiss($okConfirm, $okYes, $uacA, $uacB)
    } catch {
        return 0
    }
}

if ($StartWatcher) {
    $mutexName = 'Global\AICODES-DismissWinDlg'
    $created = $false
    try {
        $m = New-Object System.Threading.Mutex($false, $mutexName, [ref]$created)
        if (-not $created) { Write-Output '{}'; exit 0 }
        $m.ReleaseMutex() | Out-Null
        $m.Dispose()
    } catch { }
    $ps = Join-Path $PSHome 'powershell.exe'
    Start-Process -FilePath $ps -WindowStyle Hidden -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath, '-Watch'
    ) | Out-Null
    Write-Output '{}'
    exit 0
}

if ($Watch) {
    $mutexName = 'Global\AICODES-DismissWinDlg'
    $created = $false
    $mutex = $null
    try {
        $mutex = New-Object System.Threading.Mutex($true, $mutexName, [ref]$created)
        if (-not $created) { exit 0 }
    } catch { exit 0 }
    try {
        while ($true) {
            $cursorAlive = @(Get-Process -Name 'Cursor','Cursor Nightly' -ErrorAction SilentlyContinue).Count -gt 0
            if (-not $cursorAlive) { break }
            Invoke-Dismiss | Out-Null
            Start-Sleep -Milliseconds 700
        }
    } finally {
        if ($mutex) { $mutex.ReleaseMutex() | Out-Null; $mutex.Dispose() }
    }
    exit 0
}

$n = Invoke-Dismiss
Write-Output "{}"
exit 0

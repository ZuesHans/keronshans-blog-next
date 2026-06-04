$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ShortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Keronshans Blog Manager.lnk"
$VbsPath = Join-Path $ScriptDir "start-manager-hidden.vbs"
$ElectronIcon = Join-Path $ProjectRoot "node_modules\electron\dist\electron.exe"

if (-not (Test-Path -LiteralPath $VbsPath)) {
  throw "Missing launcher script: $VbsPath"
}

$WindowsDir = $env:WINDIR
if (-not $WindowsDir) { $WindowsDir = $env:SystemRoot }
if (-not $WindowsDir) { $WindowsDir = "C:\Windows" }
$WScriptExe = Join-Path $WindowsDir "System32\wscript.exe"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $WScriptExe
$Shortcut.Arguments = "`"$VbsPath`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "Open Keronshans local blog manager"
if (Test-Path -LiteralPath $ElectronIcon) {
  $Shortcut.IconLocation = "$ElectronIcon,0"
}
$Shortcut.Save()

Write-Host "Created desktop shortcut:" -ForegroundColor Green
Write-Host $ShortcutPath

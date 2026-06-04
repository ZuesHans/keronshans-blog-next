Option Explicit

Dim fso, shell, scriptDir, projectRoot, command

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectRoot = fso.GetParentFolderName(scriptDir)

shell.CurrentDirectory = projectRoot
command = "cmd /c npm run manager"

' 0 = hidden window, False = do not wait for the manager to exit.
shell.Run command, 0, False

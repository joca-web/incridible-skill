# Installs incridible-skill for Claude Code (or any agent that reads ~\.claude\skills).
#   .\install.ps1               user-wide:    $HOME\.claude\skills\incridible-skill
#   .\install.ps1 -Project      this project: .\.claude\skills\incridible-skill
#   .\install.ps1 -Uninstall    remove (add -Project for the project copy)
# Running it again updates an existing install to the version in this folder.
param(
  [switch]$Project,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$Name = 'incridible-skill'
$Src = Join-Path $PSScriptRoot "skills\$Name"

if ($Project) {
  $Base = Join-Path (Get-Location).Path '.claude\skills'
} else {
  $ClaudeHome = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
  $Base = Join-Path $ClaudeHome 'skills'
}
$Dest = Join-Path $Base $Name

if ($Uninstall) {
  if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest; Write-Host "Removed $Dest" }
  else { Write-Host "Nothing to remove at $Dest" }
  return
}

if (-not (Test-Path (Join-Path $Src 'SKILL.md'))) {
  throw "Cannot find $Src\SKILL.md. Run this script from the repository root."
}

New-Item -ItemType Directory -Force -Path $Base | Out-Null
if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
Copy-Item -Recurse -Path $Src -Destination $Dest
Write-Host "Installed $Name to $Dest"
if (Test-Path (Join-Path $Base 'incridible-skill-v2')) {
  Write-Host "Note: an older separate copy named incridible-skill-v2 exists in $Base. It duplicates this skill; delete that folder."
}
Write-Host "Start a new agent session (or run /reload-plugins in Claude Code) to load it."

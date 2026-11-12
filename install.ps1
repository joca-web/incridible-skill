# Installs incridible-skill for Claude Code (or any agent that reads ~\.claude\skills).
#   .\install.ps1               v2 (recommended), user-wide: $HOME\.claude\skills\incridible-skill-v2
#   .\install.ps1 -V1           version 1 instead:            $HOME\.claude\skills\incridible-skill
#   .\install.ps1 -Project      into .\.claude\skills of the current project
#   .\install.ps1 -Uninstall    remove (combine with -V1 and/or -Project)
param(
  [switch]$V1,
  [switch]$Project,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
if ($V1) {
  $Name = 'incridible-skill'
  $Src = Join-Path $PSScriptRoot "skills\$Name"
} else {
  $Name = 'incridible-skill-v2'
  $Src = Join-Path $PSScriptRoot "v2\skills\$Name"
}

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
if (-not $V1 -and (Test-Path (Join-Path $Base 'incridible-skill'))) {
  Write-Host "Note: version 1 is also installed in $Base. Both answer the same requests;"
  Write-Host "      remove it with: .\install.ps1 -V1 -Uninstall$(if ($Project) { ' -Project' })"
}
Write-Host "Start a new agent session (or run /reload-plugins in Claude Code) to load it."

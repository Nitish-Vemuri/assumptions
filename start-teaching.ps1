param([switch]$EnableAI, [int]$Port = 8001)
$ErrorActionPreference = 'Stop'
$launcherArguments = @("--port=$Port")
if ($EnableAI) { $launcherArguments += '--ai' }
& node (Join-Path $PSScriptRoot 'teaching-launcher.js') @launcherArguments

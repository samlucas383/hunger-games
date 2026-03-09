param(
  [ValidateSet("lint", "build", "all")]
  [string]$Task = "all"
)

$ErrorActionPreference = "Stop"

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  throw "Docker is not installed or not on PATH. Install Docker Desktop and retry."
}

$tag = "hunger-games-ci:local"

Write-Host "Building CI image ($tag)..."
docker build -f Dockerfile.ci -t $tag .

$cmd = switch ($Task) {
  "lint"  { "yarn lint" }
  "build" { "yarn build" }
  default  { "yarn lint && yarn build" }
}

Write-Host "Running CI command: $cmd"
docker run --rm $tag bash -lc $cmd

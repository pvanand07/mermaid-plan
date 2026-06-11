$ErrorActionPreference = 'Stop'

$DeployHost = '15.204.162.84'
$DeployUser = 'ubuntu'
$DeployPort = '22'
$RemoteAppDir = '/home/ubuntu/DEV/AGENT_DEV/mermaid-plan'

ssh -p $DeployPort "${DeployUser}@${DeployHost}" "bash ${RemoteAppDir}/deploy/deploy.sh"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

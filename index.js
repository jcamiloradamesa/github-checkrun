const core = require('@actions/core');
const github = require('@actions/github');

execute().catch(error => core.setFailed(error.message));

async function execute(){
  const octokit = new github.getOctokit(core.getInput('token'));
  const checkName = core.getInput('check-name');
  const status = core.getInput('check-value');
  const conclusion = core.getInput('conclusion');
  const runs = getRuns();
  const checkId = runs[checkName];

  core.debug("checkname: " + checkName);
  core.debug("status: " + status);
  core.debug("conclusion: " + conclusion);
  core.debug("runs: " + JSON.stringify(runs));

  if (checkId) {
    if (conclusion) {
      await octokit.checks.update({
        check_run_id: checkId,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        head_sha: github.context.sha,
        name: checkName,
        status: 'completed',
        conclusion: conclusion,
        completed_at: new Date().toISOString()
      });
    }

    else {
      await octokit.checks.update({
        check_run_id: checkId,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        head_sha: github.context.sha,
        name: checkName,
        status: status,
        started_at: new Date().toISOString()
      });
    }
  }

  else {
    const {data} = await octokit.checks.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      head_sha: github.context.sha,
      name: checkName,
      status: status,
      started_at: new Date().toISOString()
    });
    runs[checkName] = data.id;
    exportRuns(runs)
  }
}

function exportRuns(runs) {
  core.debug("updating " + JSON.stringify(runs));
  core.exportVariable("RUNS", JSON.stringify(runs));
}

function getRuns() {
  const runs = process.env.RUNS
  if (runs){
      return JSON.parse(runs)
  }
  return {}
}
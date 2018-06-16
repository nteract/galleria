/**
 * Quick little CircleCI API wrapper, designed for single repo usage
 */

const fetch = require("node-fetch");
const { sleep } = require("./sleep.js");

const OUTCOME_SUCCESS = "success";

class CircleCI {
  constructor(token, { owner, repo }) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  checkBuild(build_num) {
    const { owner, repo, token } = this;

    return fetch(
      `https://circleci.com/api/v1.1/project/github/${owner}/${repo}/${build_num}?circle-token=${token}`
    ).then(r => r.json());
  }

  lastBuilds() {
    const { owner, repo, token } = this;

    const url = `https://circleci.com/api/v1.1/project/github/${owner}/${repo}?circle-token=${token}`;

    return fetch(url).then(r => r.json());
  }

  async artifacts(build_num) {
    const { owner, repo, token } = this;

    let build;
    let iterations = 0;
    let buildFinished = false;
    while (!buildFinished) {
      iterations = iterations + 1;
      await sleep(10 * 1000);
      build = await this.checkBuild(build_num);

      // when build.outcome is null it's in an indeterminate state
      // we could always time this out if we need to
      if (build.outcome) {
        buildFinished = true;
      }
    }

    if (build.outcome !== OUTCOME_SUCCESS) {
      return null;
    }

    const url = `https://circleci.com/api/v1.1/project/github/${owner}/${repo}/${build_num}/artifacts?circle-token=${token}`;

    // NOTE: private repos on circle CI do not allow access to the image directly since they get proxied through github
    return fetch(url).then(r => r.json());
  }
}

module.exports = {
  CircleCI
};

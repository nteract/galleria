const r = require("rethinkdb");

const DATABASE_NAME = "test";

const TABLE_NAME = "galleria_github_events";
const CIRCLE_CI_TABLE_NAME = "galleria_circle_ci";

function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

async function makeBot(robot) {
  const connection = await r.connect({ host: "localhost", port: 28015 });

  // Create our rethinkdb table for github events on startup if it doesn't exist
  await r([CIRCLE_CI_TABLE_NAME, TABLE_NAME])
    .difference(r.db(DATABASE_NAME).tableList())
    .forEach(table => r.db(DATABASE_NAME).tableCreate(table))
    .run(connection);

  robot.log("Galleria is ready to go 🖼Y!");

  // Store all events in rethinkdb for local development
  robot.on("*", async context => {
    await r
      .table(TABLE_NAME)
      .insert([{ type: context.event, payload: context.payload }])
      .run(connection);
  });

  // Our requested permissions allow:
  //
  // * check_run
  // * check_suite
  // * pull_request
  //
  robot.on("check_suite", async context => {
    // TODO: Once Circle CI uses checks we can actually do this (unless there's another hook we can use)
    // return;
    // ...
    const { payload, github, event } = context;
    const { owner, repo } = context.repo();
    const { check_suite } = payload;

    // NOTE: check suites can have more than one pull request
    const { pull_requests, head_commit } = check_suite;

    if (pull_requests.length <= 0) {
      // If there's no pull request, there's nothing we can do
      return;
    }
    // HACK: We'll operate on only the first of the pull requests for now...
    const pr = pull_requests[0];

    // When it's a finished check from CircleCI and it passes...
    robot.log("Wish for CircleCI check data");

    // HACK
    // Since CircleCI does not have check suites ready, we'll poll the Circle CI API
    // For good measure, we'll wait to make sure that
    // * circle ci has created a build_num
    // * the build has finished (poll for this)
    const circleProjects = await github.request({
      method: "GET",
      url: `https://circleci.com/api/v1.1/project/github/${owner}/${repo}?circle-token=${
        process.env.CIRCLE_CI_TOKEN
      }`
    });
    // TODO: Check validity of response from CircleCI
    //       Response should be a 2xx and in the format we expect.
    const builds = JSON.parse(circleProjects.data);

    // Find the first build with the matching commit id
    robot.log(`Searching for commit ${head_commit.id}`);
    const build = builds.find(build => build.vcs_revision === head_commit.id);
    if (!build) {
      console.log(`No build found for ${head_commit.id}`);
      return;
    }
    console.log(`It's build ${build.build_num}!`);

    if (!build.has_artifacts) {
      console.log("No artifacts! ***** ");
    }
    // TODO: Poll until the build is finished
    await sleep(20 * 1000);
    // Get all the artifacts from Circle CI
    robot.log("Wish for artifacts from Circle CI");
    //
    // Now we can look at artifacts
    console.log("LOOKING FOR ARTIFACTS");
    const artifacts = await github.request({
      method: "GET",
      url: `/project/github/${owner}/${repo}/${
        build.build_num
      }/artifacts?circle-token=${process.env.CIRCLE_CI_TOKEN}`
    });
    console.log("HOPE I GOT EM");
    console.log(artifacts);

    robot.log("********************");
    return;

    await r
      .table(CIRCLE_CI_TABLE_NAME)
      .insert([{ type: context.event, payload: context.payload }])
      .run(connection);

    // Grab the `screenshots` directory
    robot.log("Wish for screenshots from the artifacts");

    // Post an issue with the image
    context.github.issues.createComment({
      owner,
      repo,
      number: pr.number,
      body: "🖼 🎨"
    });
  });
}
module.exports = makeBot;

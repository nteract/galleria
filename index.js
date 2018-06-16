const r = require("rethinkdb");

const DATABASE_NAME = "test";
const TABLE_NAME = "galleria_github_events";

function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

async function makeBot(robot) {
  const connection = await r.connect({ host: "localhost", port: 28015 });

  // Create our rethinkdb table for github events on startup if it doesn't exist
  await r([TABLE_NAME])
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

    const { check_suite } = payload;

    // NOTE: check suites can have more than one pull request
    const { pull_requests } = check_suite;

    if (pull_requests.length <= 0) {
      // If there's no pull request, there's nothing we can do
      return;
    }
    // HACK: We'll operate on only the first of the pull requests for now...
    const pr = pull_requests[0];

    // When it's a finished check from CircleCI and it passes
    robot.log("Wish for CircleCI check data");

    // Get all the artifacts from Circle CI
    robot.log("Wish for artifacts from Circle CI");

    // Grab the `screenshots` directory
    robot.log("Wish for screenshots from the artifacts");

    // Post an issue with the image
    const { owner, repo } = context.repo();

    context.github.issues.createComment({
      owner,
      repo,
      number: pr.number,
      body: "🖼 🎨"
    });
  });
}
module.exports = makeBot;

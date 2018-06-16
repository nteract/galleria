const r = require("rethinkdb");
const DATABASE_NAME = "test";

const TABLE_NAME = "galleria_github_events";
const CIRCLE_CI_TABLE_NAME = "galleria_circle_ci";

const { CircleCI } = require("./circle.js");
const { sleep } = require("./sleep.js");

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
    robot.log("Wish for CircleCI to have check_suite or check_run integration");
    robot.log("Falling back on polling Circle CI");
    // HACK
    // Since CircleCI does not have check suites ready, we'll poll the Circle CI API
    // For good measure, we'll wait to make sure that
    // * circle ci has created a build_num
    // * the build has finished (poll for this)
    const circle = new CircleCI(process.env.CIRCLE_CI_TOKEN, { owner, repo });

    // TODO: Check validity of response from CircleCI
    //       Response should be a 2xx and in the format we expect.
    const builds = await circle.lastBuilds();

    // Find the first build with the matching commit id
    robot.log(`Searching for commit ${head_commit.id}`);
    const build = builds.find(build => build.vcs_revision === head_commit.id);

    if (!build) {
      robot.log.warn(`No build found for ${head_commit.id}`);
      return;
    }
    robot.log(`It's build ${build.build_num}!`);

    // Get all the artifacts from Circle CI
    robot.log("Wish for artifacts from Circle CI");
    // Now we can look at artifacts
    robot.log.debug("LOOKING FOR ARTIFACTS");
    const artifacts = await circle.artifacts(build.build_num);

    if (!artifacts || artifacts.length <= 0) {
      robot.log("no artifacts available");
      return;
    }
    robot.log("Artifacts", artifacts);

    // Grab the `screenshots` directory
    robot.log("Wish for screenshots from the artifacts");
    robot.log("Wish for declarative Markdown in JS");

    const Heading = (text, level = 1) => `${"#".repeat(level)} ${text}`;
    const Image = (url, description = "") => `![${description}](${url})`;
    const Gallery = images => images.join("\n");
    const P = text => text;
    const SPACE = "\n";
    const Markdown = (...children) => children.join("\n\n");

    const comment = Markdown(
      Heading("Here's your gallery!"),
      P("🖼 🎨"),
      Gallery(
        artifacts
          .filter(
            artifact =>
              artifact.path.endsWith("png") &&
              artifact.path.startsWith("screenshots")
          )
          .map(artifact =>
            Image(
              `${artifact.url}?token=${process.env.CIRCLE_CI_TOKEN}`,
              artifact.pretty_path
            )
          )
      )
    );
    // Post an issue with the image
    robot.log.info("commenting with ", comment);
    await context.github.issues.createComment({
      owner,
      repo,
      number: pr.number,
      body: comment
    });
  });
}
module.exports = makeBot;

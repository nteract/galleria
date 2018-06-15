const r = require("rethinkdb");

const DATABASE_NAME = "test";
const TABLE_NAME = "galleria_github_events";

async function makeBot(robot) {
  const connection = await r.connect({ host: "localhost", port: 28015 });
  const table = await r.db(DATABASE_NAME).tableCreate(TABLE_NAME);

  console.log(table);

  robot.log("Galleria is ready to go 🖼Y!");

  robot.on(["check_run", "check_suite", "pull_request"], async context => {
    const well = await r.table(TABLE_NAME).insert([context.payload]);

    console.log("soooooo well then");
    console.log(well);

    robot.log({ event: context.event });
    robot.log({ action: context.payload.action });
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
module.exports = makeBot;

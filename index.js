module.exports = robot => {
  // Your code here
  robot.log('Yay, the robot was loaded!')

  robot.on(['check_suite', 'pull_request'], async context => {
    robot.log({event: context.event})
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}

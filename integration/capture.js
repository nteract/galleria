const puppeteer = require("puppeteer");
const { mkdirp } = require("mkdirp");
const { sleep } = require("../sleep");

// Make sure that the async/await code below makes node crash so that
// we're not accidentally "passing" our integration tests
process.on("unhandledRejection", up => {
  throw up;
});

// NOTE: Since the prettier config is using no-semicolons and this is an IIFE,
//       we are forced to have a semicolon to start this block.
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.setViewport({
    width: 1200,
    height: 600
  });

  page.on("pageerror", function(err) {
    console.log("Page error: " + err.toString());
    process.exit(1);
  });

  page.on("error", function(err) {
    console.log("Error during puppeteer instrumentation: " + err.toString());
    process.exit(2);
  });

  // Self referential!
  await page.goto("https://github.com/nteract/galleria/commits/master", {
    waitUntil: "domcontentloaded"
  });

  await new Promise((resolve, reject) =>
    mkdirp("screenshots", err => (err ? reject(err) : resolve()))
  );

  await page.hover(".commit-group");

  await page.screenshot({ path: "screenshots/galleria.png" });

  await browser.close();
})();

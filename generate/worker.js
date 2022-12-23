const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const { workerData, parentPort } = require("worker_threads");
const steal = require("steal");
const helpers = require("./helpers");

const {
  mainWithProcessor,
  pathToSteal,
  dest,
  route = "/",
  shouldLoadRoutes,
  environment = "dev",
  BUILD_OPTIONS,
  buildResult
} = workerData;

const dom = helpers.buildBrowserEnvironment(route);

const starts = helpers.pad({
  loadedApp: "Loaded App",
  appComplete: "App Completed",
  domFinalized: "DOM finalized"
})

async function renderAndWrite() {
  try {
    const mainModules = await helpers.loadAppInExistingBrowserEnvironment(mainWithProcessor);
    if(shouldLoadRoutes) {
      const mainModule = await steal(mainWithProcessor);
      const routes = await mainModule[0].getRoutes();
      let rootRouteIdx = routes.indexOf("/");
      if (rootRouteIdx === -1) {
        rootRouteIdx = routes.indexOf("");
      }
      if (rootRouteIdx > -1) {
        routes.splice(rootRouteIdx, 1);
      }
      // return all other routes that aren't the root.
      parentPort.postMessage(routes);
    }
    console.log(starts.loadedApp, "Waiting for App to complete running...")

    process.once("beforeExit", async (code) => {
      const outputPath = path.join(dest, route, `${environment}-ssg.html`);

      console.log(starts.appComplete,"Finalizing DOM before scrape...")
      if(environment === "prod") {
        helpers.updateForProd(dom.window.document, {main: mainWithProcessor}, BUILD_OPTIONS, buildResult, outputPath);
      } else {
        helpers.updateForDev(dom.window.document, mainWithProcessor, pathToSteal);
      }
      if(mainModules[0].updateDocumentBeforeScrape) {
        mainModules[0].updateDocumentBeforeScrape(dom.window.document)
      }

      console.log(starts.domFinalized, "Scraping and writing...")
      await mkdirp(path.dirname(outputPath));
      fs.writeFileSync(
        outputPath,
        dom.window.document.documentElement.outerHTML
      );
      console.log("Updated ", outputPath,".")
    });
  } catch (e) {
    console.error(e)
  }
}
renderAndWrite()


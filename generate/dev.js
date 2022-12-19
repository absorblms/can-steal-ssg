const path = require("path");
const fs = require("fs")

const helpers = require("./helpers");

const MAIN = "~/app/app.ssgjs!can-steal-ssg";

const OUTPUT_PATH = path.join(process.cwd(), "app/dev-ssg.html");


const steal = require.resolve("steal/steal.js")
const pathToSteal = path.relative(OUTPUT_PATH, steal);

const dom = helpers.buildBrowserEnvironment();

const starts = helpers.pad({
	loadedApp: "Loaded App",
	appComplete: "App Completed",
	domFinalized: "DOM finalized"
})



helpers.loadAppInExistingBrowserEnvironment(MAIN).then(function (mainModules) {
	console.log(starts.loadedApp, "Waiting for App to complete running...")

	process.once("beforeExit", (code) => {


		console.log(starts.appComplete,"Finalizing DOM before scrape...")
		helpers.updateForDev(dom.window.document, MAIN, pathToSteal);

		if(mainModules[0].updateDocumentBeforeScrape) {
			mainModules[0].updateDocumentBeforeScrape(dom.window.document)
		}

		console.log(starts.domFinalized, "Scraping and writing...")
		fs.writeFileSync(OUTPUT_PATH,  dom.window.document.documentElement.outerHTML);
		console.log("Updated ", OUTPUT_PATH,".")
	});
},
function (e) {
	console.log(e)
})

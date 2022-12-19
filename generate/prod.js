const path = require("path");
const fs = require("fs")

const helpers = require("./helpers");
const stealTools = require("steal-tools")


const MAIN = "~/app/app.ssgjs!can-steal-ssg";
const CONFIG_PATH = path.join(process.cwd(), "package.json!npm");
const DEST = "prod";
const OUTPUT_PATH = path.join(process.cwd(), DEST, "prod-ssg.html");

const BUILD_OPTIONS = {
  dest: path.join(process.cwd(), DEST),
  bundleSteal: true,
	minify: false
};

const starts = helpers.pad({
	appBuilt: "App built",
	loadedApp: "Loaded app",
	appComplete: "App completed",
	domFinalized: "DOM finalized"
})

console.log("Starting build into", DEST,".");

var stealBuild = stealTools.build({
  config: CONFIG_PATH,
	main: MAIN
},BUILD_OPTIONS).then( (buildResult)=>{

	buildResult.bundles
	console.log(starts.appBuilt,"Loading App in Node.")



	const dom = helpers.buildBrowserEnvironment();

	helpers.loadAppInExistingBrowserEnvironment(MAIN).then(function (mainModules) {
		console.log(starts.loadedApp, "Waiting for App to complete running...")

		process.once("beforeExit", (code) => {


			console.log(starts.appComplete,"Finalizing DOM before scrape...")

			helpers.updateForProd(dom.window.document, {main: MAIN}, BUILD_OPTIONS, buildResult, OUTPUT_PATH);

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

})

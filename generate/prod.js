const path = require("path");
const fs = require("fs")

const helpers = require("./helpers");
const stealTools = require("steal-tools")

const starts = helpers.pad({
	appBuilt: "App built",
	loadedApp: "Loaded app",
	appComplete: "App completed",
	domFinalized: "DOM finalized"
})

module.exports = function({
	main,
	configPath,
	dest,
	outputPath
}) {
	const BUILD_OPTIONS = {
	  dest: path.join(process.cwd(), dest),
	  bundleSteal: true,
		minify: false
	};
	const mainWithProcessor = main.includes("!") ? main : `${main}!can-steal-ssg`;

	console.log("Starting build into", dest,".");

	var stealBuild = stealTools.build({
	  config: configPath,
		main: mainWithProcessor
	},BUILD_OPTIONS).then( (buildResult)=>{

		buildResult.bundles
		console.log(starts.appBuilt,"Loading App in Node.")



		const dom = helpers.buildBrowserEnvironment();

		helpers.loadAppInExistingBrowserEnvironment(mainWithProcessor).then(function (mainModules) {
			console.log(starts.loadedApp, "Waiting for App to complete running...")

			process.once("beforeExit", (code) => {


				console.log(starts.appComplete,"Finalizing DOM before scrape...")

				helpers.updateForProd(dom.window.document, {main: mainWithProcessor}, BUILD_OPTIONS, buildResult, outputPath);

				if(mainModules[0].updateDocumentBeforeScrape) {
					mainModules[0].updateDocumentBeforeScrape(dom.window.document)
				}

				console.log(starts.domFinalized, "Scraping and writing...")
				fs.writeFileSync(outputPath,  dom.window.document.documentElement.outerHTML);
				console.log("Updated ", outputPath,".")
			});
		},
		function (e) {
			console.log(e)
		})

	})

}
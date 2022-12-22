const path = require("path");
const fs = require("fs")

const helpers = require("./helpers");

module.exports = async function({
	main,
	outputPath
}) {
	const mainWithProcessor = main.includes("!") ? main : `${main}!can-steal-ssg`;
	const steal = require.resolve("steal/steal.js")
	const pathToSteal = path.relative(outputPath, steal);

	const dom = helpers.buildBrowserEnvironment();

	const starts = helpers.pad({
		loadedApp: "Loaded App",
		appComplete: "App Completed",
		domFinalized: "DOM finalized"
	})

	try {
		const mainModules = await helpers.loadAppInExistingBrowserEnvironment(mainWithProcessor);

		console.log(starts.loadedApp, "Waiting for App to complete running...")

		process.once("beforeExit", (code) => {


			console.log(starts.appComplete,"Finalizing DOM before scrape...")
			helpers.updateForDev(dom.window.document, mainWithProcessor, pathToSteal);
			if(mainModules[0].updateDocumentBeforeScrape) {
				mainModules[0].updateDocumentBeforeScrape(dom.window.document)
			}

			console.log(starts.domFinalized, "Scraping and writing...")
			fs.writeFileSync(outputPath,  dom.window.document.documentElement.outerHTML);
			console.log("Updated ", outputPath,".")
		});
	} catch (e) {
		console.error(e)
	}
}
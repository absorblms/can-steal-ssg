const path = require("path");
const fs = require("fs");
const { Worker } = require("worker_threads");

const helpers = require("./helpers");

module.exports = async function({
	main
}) {
	const mainWithProcessor = main.includes("!") ? main : `${main}!can-steal-ssg`;
	const mainDir = path.dirname(mainWithProcessor.replace("~", process.cwd()));
	const stealPath = require.resolve("steal/steal.js")
	const pathToSteal = path.relative(mainDir, stealPath);

	const firstWorker = new Worker(path.join(__dirname, "dev-worker.js"), {
		workerData: {
			mainWithProcessor,
			pathToSteal,
			dest: mainDir,
			shouldLoadRoutes: true
		}
	});
	firstWorker.on("message", (routes) => {
		routes.forEach(route => {
			new Worker(path.join(__dirname, "dev-worker.js"), {
				workerData: {
					mainWithProcessor,
					pathToSteal,
					dest: mainDir,
					route
				}
			})
		})
	});
}
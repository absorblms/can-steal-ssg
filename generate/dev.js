const path = require("path");
const fs = require("fs");
const { Worker } = require("worker_threads");

module.exports = async function({
	main,
	numThreads,
	outputFileName
}) {
	const mainWithProcessor = main.includes("!") ? main : `${main}!can-steal-ssg`;
	const mainDir = path.dirname(mainWithProcessor.replace("~", process.cwd()));
	const stealPath = require.resolve("steal/steal.js")
	const pathToSteal = path.relative(mainDir, stealPath);

	let routeIdx = 0;
	let routes;
	const firstWorker = new Worker(path.join(__dirname, "worker.js"), {
		workerData: {
			mainWithProcessor,
			pathToSteal,
			outputFileName,
			dest: mainDir,
			shouldLoadRoutes: true
		}
	});
	firstWorker.on("message", (_routes) => {
		routes = _routes;
		while(routeIdx < numThreads - 1 && routeIdx < routes.length) {
			queueNext();
		}
	});
	firstWorker.on("exit", queueNext);

	function queueNext() {
		if(routeIdx >= routes.length) {
			return;
		}
		const route = routes[routeIdx++];
		const worker = new Worker(path.join(__dirname, "worker.js"), {
			workerData: {
				mainWithProcessor,
				pathToSteal,
				outputFileName,
				dest: mainDir,
				route
			}
		});
		worker.on("exit", queueNext);
	}
}
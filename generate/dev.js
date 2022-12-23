const path = require("path");
const fs = require("fs");
const { Worker } = require("worker_threads");

const MAX_WORKERS = 8;

module.exports = async function({
	main
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
			dest: mainDir,
			shouldLoadRoutes: true
		}
	});
	firstWorker.on("message", (_routes) => {
		routes = _routes;
		while(routeIdx < MAX_WORKERS && routeIdx < routes.length) {
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
				dest: mainDir,
				route
			}
		});
		worker.on("exit", queueNext);
	}
}
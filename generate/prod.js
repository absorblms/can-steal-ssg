const { Worker } = require("worker_threads");
const path = require("path");
const minify = require('babel-preset-minify');
const fs = require("fs");

const stealTools = require("steal-tools");
const babelMinify = require("steal-tools/lib/build_types/babel-minify");

const numThreads = 8;

module.exports = async function({
	main,
	configPath,
	dest,
	numThreads,
	outputFileName,
	buildOptionsPath
}) {
	const BUILD_OPTIONS = {
	  dest: path.join(process.cwd(), dest),
		bundleSteal: true,
		minify: true
	};
	if (buildOptionsPath) {
		Object.assign(BUILD_OPTIONS, require(path.join(process.cwd(), buildOptionsPath)));
	}

	const mainWithProcessor = main.includes("!") ? main : `${main}!can-steal-ssg`;

    const localBuildOptions = BUILD_OPTIONS.minify === 'babel-minify' ? {
        babelMinifyOptions: {
            ...BUILD_OPTIONS.babelMinifyOptions || {},
            minifyPreset(context, _opts = {}) {
                return minify(
                    context,
                    {
                        ..._opts,
                        mangle: {
                            ..._opts.mangle || {},
                            exclude: {
                                ...(_opts.mangle && opts.mangle.exclude || {}),
                                'CustomElement': true
                            }
                        }
                    }
                );
            }
        }
    } : {
        uglifyOptions: {
            ...(BUILD_OPTIONS.uglifyOptions || {}),
            mangle: {
                ...(BUILD_OPTIONS.uglifyOptions && buildOptions.uglifyOptions.mangle || {}),
                reserved: (
                    BUILD_OPTIONS.uglifyOptions &&
                    buildOptions.uglifyOptions.mangle &&
                    buildOptions.uglifyOptions.mangle.reserved || []
                ).concat(['CustomElement'])
            }
        }
    };

	console.log("Starting build into", dest,".");
	try {
		const fullBuildResult = await stealTools.build(
			{
			  config: configPath,
				main: mainWithProcessor
			},
			{
                ...BUILD_OPTIONS,
                ...localBuildOptions
            }
		);
		const buildResult = {
			bundles: fullBuildResult.bundles.map(
				({bundles, buildType, bundlePath}) => ({bundles, buildType, bundlePath})
			),
			loader: {
				main: fullBuildResult.loader.main
			}
		};

		let routeIdx = 0;
		let routes;
		const firstWorker = new Worker(path.join(__dirname, "worker.js"), {
			workerData: {
				mainWithProcessor,
				dest,
				environment: "prod",
				outputFileName,
				BUILD_OPTIONS,
				buildResult,
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
					dest,
					environment: "prod",
					outputFileName,
					BUILD_OPTIONS,
					buildResult,
					route
				}
			});
			worker.on("exit", queueNext);
		}
		// console.log(starts.appBuilt,"Loading App in Node.")

		// const dom = helpers.buildBrowserEnvironment();

		// const mainModules = await helpers.loadAppInExistingBrowserEnvironment(mainWithProcessor);
		// console.log(starts.loadedApp, "Waiting for App to complete running...")

		// process.once("beforeExit", (code) => {
		// 	console.log(starts.appComplete,"Finalizing DOM before scrape...")

		// 	helpers.updateForProd(dom.window.document, {main: mainWithProcessor}, BUILD_OPTIONS, buildResult, outputPath);

		// 	if(mainModules[0].updateDocumentBeforeScrape) {
		// 		mainModules[0].updateDocumentBeforeScrape(dom.window.document)
		// 	}
		// 	const outputPath = `${dest}/prod-ssg.html`;
		// 	console.log(starts.domFinalized, "Scraping and writing...")
		// 	fs.writeFileSync(outputPath,  dom.window.document.documentElement.outerHTML);
		// 	console.log("Updated ", outputPath,".")
		// });
	} catch (e) {
		console.log(e)
	}

};

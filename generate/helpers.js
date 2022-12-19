const steal = require("steal");
const path = require("path");
const fs = require("fs")

const url = require("url")
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const { XMLHttpRequest } = require("w3c-xmlhttprequest")

const helpers = {
	buildBrowserEnvironment(){
		const html = `<!doctype html>
		<head></head>
		<body></body>`

		const dom = new JSDOM(html)

		// This is a bad idea, JSDOM offers options
		// in its constructor to navigate "naturally" to a page
		delete dom.window.location
		dom.window.location = url.parse("http://localhost:4200", true)

		if (!dom.window.location.protocol) {
		  dom.window.location.protocol = "http:"
		}

		// if(request.headers && request.headers["accept-language"]) {
		//     dom.navigator.language = request.headers["accept-language"];
		// }

		global.window = dom.window
		global.HTMLElement = dom.window.HTMLElement
		global.NodeFilter = dom.window.NodeFilter
		global.customElements = dom.window.customElements
		global.document = dom.window.document
		global.location = dom.window.location
		global.Node = window.Node
		global.XMLHttpRequest = XMLHttpRequest
		return dom;
	},
	makeCustomTagsInert(document) {

		Array.from(document.body.getElementsByTagName("*")).forEach((el)=>{
			if(el.tagName.includes("-")) {
				el.setAttribute("can-ssg","inert")
			}
		})
	},
	updateForDev: function(document, main, pathToSteal){
		document.body.setAttribute("can-ssg","dev")
		helpers.makeCustomTagsInert(document);

		const devScript = document.createElement("script");
		devScript.setAttribute("src",pathToSteal);
		devScript.setAttribute("main", main);
		document.body.append(devScript);
	},
	updateForProd: function(document, config, buildOptions, buildResult, outputPath){
		document.body.setAttribute("can-ssg","prod")
		helpers.makeCustomTagsInert(document);

		// figure out which bundle has the main module
		const mainModuleFullName = buildResult.loader.main;

		const mainBundle = buildResult.bundles.find( (bundle) => {
			return bundle.bundles.includes(mainModuleFullName);
		})

		if(!mainBundle) {
			console.error("Can't find the main bundle");
			process.exit(1)
		}

		const pathToBundle = path.relative(path.dirname(outputPath), mainBundle.bundlePath);

		const prodScript = document.createElement("script");
		prodScript.setAttribute("src",pathToBundle);
		document.body.append(prodScript);
	},
	loadAppInExistingBrowserEnvironment(main){
		return steal
		  .startup({
		    main: main,
		    babelOptions: {
		      plugins: ["transform-class-properties"],
		    },
		    plugins: ["can"],
		  });
	},
	pad: function(logs) {
		const pad = Math.max(...Object.values(logs).map( l => l.length));
		const res = {};
		for(var name in logs) {
			res[name] = (logs[name]+".").padEnd(pad+1)
		}
		return res;
	}
}

module.exports = helpers;

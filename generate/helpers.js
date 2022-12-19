const steal = require("steal");
const path = require("path");
const fs = require("fs")

const url = require("url")
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const { XMLHttpRequest } = require("w3c-xmlhttprequest")

const helpers = {
	buildBrowserEnvironment(path = ""){
		const html = `<!doctype html>
		<head></head>
		<body></body>`

		const dom = new JSDOM(html,{
			url: "http://localhost:4200/"+path
		})

		// This is a bad idea, JSDOM offers options
		// in its constructor to navigate "naturally" to a page
		//delete dom.window.location
		//dom.window.location = url.parse("http://localhost:4200", true)

		//if (!dom.window.location.protocol) {
		//  dom.window.location.protocol = "http:"
		//}

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
		global.history = {};
		global.addEventListener = function(){}
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
		// remove all style tags ... I wish we knew which ones were injected by steal ...
		// steal could start using adoptStyles
		Array.from( document.getElementsByTagName("style") ).forEach((style)=>{
			style.remove();
		})

		document.body.setAttribute("can-ssg","prod")
		helpers.makeCustomTagsInert(document);

		// figure out which bundle has the main module
		const mainModuleFullName = buildResult.loader.main;

		const mainJSBundle = buildResult.bundles.find( (bundle) => {
			return bundle.bundles.includes(mainModuleFullName) && bundle.buildType === "js";
		})

		if(mainJSBundle) {
			const pathToBundle = path.relative(path.dirname(outputPath), mainJSBundle.bundlePath);

			const prodScript = document.createElement("script");
			prodScript.setAttribute("src",pathToBundle);
			document.body.append(prodScript);
		}

		const mainCssBundle = buildResult.bundles.find( (bundle) => {
			return bundle.bundles.includes(mainModuleFullName) && bundle.buildType === "css";
		});
		if(mainCssBundle) {
			const pathToCSSBundle = path.relative(path.dirname(outputPath), mainCssBundle.bundlePath);

			const prodCSS = document.createElement("link");
			prodCSS.setAttribute("rel","stylesheet");
			prodCSS.setAttribute("href",pathToCSSBundle);
			document.head.append(prodCSS);


		}
		const aBundlePath = mainJSBundle?.bundlePath ?? mainCssBundle?.bundlePath;
		if(aBundlePath) {
			const pathToBundles = path.relative(path.dirname(outputPath), aBundlePath.replace(/bundles\/.*/,"bundles"));

			const stealConfigScript = document.createElement("script");
			const stealConfig = {
				paths: {
					"bundles/*": pathToBundles+"/*.js",
					"bundles/*.css": pathToBundles+"/*css"
				}
			};

			stealConfigScript.innerHTML = `
				steal = ${JSON.stringify(stealConfig)}
			`;
			document.head.prepend(stealConfigScript);

		}

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

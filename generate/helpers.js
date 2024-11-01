const steal = require("steal");
const path = require("path");
const fs = require("fs")

const url = require("url")
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fetch = require("node-fetch-commonjs")

const { XMLHttpRequest } = require("w3c-xmlhttprequest")

const helpers = {
	buildBrowserEnvironment(path = ""){
		const html = `<!doctype html>
		<head></head>
		<body></body>`
		const virtualConsole = new jsdom.VirtualConsole();
		virtualConsole.sendTo(console);
		const dom = new JSDOM(html,{
			url: "http://localhost:4200/"+path,
			virtualConsole
		})

		global.window = dom.window
		global.HTMLElement = dom.window.HTMLElement
		global.NodeFilter = dom.window.NodeFilter
		global.DocumentFragment = dom.window.DocumentFragment
		global.customElements = dom.window.customElements
		global.document = dom.window.document
		global.location = dom.window.location
		global.Node = window.Node
		global.XMLHttpRequest = XMLHttpRequest
		global.fetch = fetch
		global.history = {};
		global.location = dom.window.location
		global.navigator = dom.window.navigator
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
			if(style.innerHTML.indexOf("/*# sourceURL=") > -1) {
				style.remove();
			}
		})

		document.body.setAttribute("can-ssg","prod")
		helpers.makeCustomTagsInert(document);

		// figure out which bundle has the main module
		const mainModuleFullName = buildResult.loader.main;

		const mainJSBundle = buildResult.bundles.find( (bundle) => {
			return bundle.bundles.includes(mainModuleFullName) && bundle.buildType === "js";
		})

		if (mainJSBundle) {
			const pathToBundle = path.relative(path.dirname(outputPath), mainJSBundle.bundlePath);

			const prodScript = document.createElement("script");
			prodScript.setAttribute("src",pathToBundle);
			// Disabling the writting in of the bundled JS script
			// document.body.append(prodScript);
		}

		const mainCssBundle = buildResult.bundles.find( (bundle) => {
			return bundle.bundles.includes(mainModuleFullName) && bundle.buildType === "css";
		});

		if (mainCssBundle) {
			const relativePath = path.relative(path.dirname(outputPath), mainCssBundle.bundlePath);
			const pathToCSSBundle = path.format({ root: '/', base: relativePath });
			const prodCSS = document.createElement("link");
			prodCSS.setAttribute("rel","stylesheet");
			prodCSS.setAttribute("href", path.normalize(pathToCSSBundle));
			document.head.append(prodCSS);
		}

		const aBundlePath = mainJSBundle?.bundlePath ?? mainCssBundle?.bundlePath;

		if (aBundlePath) {
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
				configMain: "package.json!npm", // have to specify the "default" to avoid a Windows bug in steal
				babelOptions: {
					plugins: ["transform-class-properties"],
				},
				plugins: ["can"],
				map: {
					"steal-less/less-engine": "steal-less/less-engine-node"
				}
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

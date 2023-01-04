const Zone = require("can-zone");
const xhrZone = require("can-zone/xhr");
const RoutePushstate = require("can-route-pushstate");
const isNode = require("can-globals/is-node/is-node");
const fetchZone = require("./fetch-zone");

isNode(false);

const sharedZone = new Zone({ plugins: [xhrZone, fetchZone] })

function beforeEverything(){
	if(globalThis.customElements) {
		const oldDefine = customElements.define;
		customElements.define = function(tag, ElementClass){
			// can-view-callbacks creates elements with Reflect.construct
			//   that don't work with the StacheElement overwriting scheme in jsdom,
			//   so we have to work differently with those classes.
			if(
				ElementClass.toString().indexOf("function") === 0
				&& ElementClass.name === "CustomElement"
			) {
				class RehydrateClass extends HTMLElement {
					connectedCallback(...args){
						if(this.getAttribute("can-ssg") === "inert") {

						} else {
							return ElementClass.prototype.connectedCallback.apply(this, args)
						}
					}
				}
				oldDefine.call(this, tag, RehydrateClass)
			} else {
				class RehydrateClass extends ElementClass {
					initialize(...args){
						if(this.getAttribute("can-ssg") === "inert") {

						} else {
							return super.initialize(...args)
						}
					}
					connectedCallback(...args){
						if(this.getAttribute("can-ssg") === "inert") {

						} else {
							return super.connectedCallback(...args)
						}
					}
					disconnectedCallback(...args){
						if(this.getAttribute("can-ssg") === "inert") {

						} else {
							return super.disconnectedCallback(...args)
						}
					}
				}
				oldDefine.call(this, tag, RehydrateClass)
			}
		}
	}

}
beforeEverything();


module.exports = {
	after(mainElementName){
		sharedZone
		.run(() => {
			if (!document.body.getAttribute("can-ssg")) {
				document.body.append(document.createElement(mainElementName));
			}
		})
		.then(function (data) {
			if (!globalThis.XHR_CACHE && data.xhr) {
				const temp = document.createElement("div")
				temp.innerHTML = `<script>${data.xhr}</script>`
				document.body.appendChild(temp.lastChild)
			}
			if (!globalThis.FETCH_CACHE && data.fetch) {
				const temp = document.createElement("div")
				temp.innerHTML = `<script>${data.fetch}</script>`
				document.body.appendChild(temp.lastChild)
			}
		})

		if (document.body.getAttribute("can-ssg")) {
			//setTimeout(function(){
				new Zone({
					plugins: [xhrZone, fetchZone],
				})
					.run(function () {
						// Check if global flag is set to skip hydration
						// This is required for testing static pages before hydration during e2e
						if (globalThis.skipHydrationCanStacheElement) {
							return
						}

						delete globalThis.canStacheElementInertPrerendered
						const staticapp = document.querySelector(mainElementName)
						const temp = document.createElement("div")
						temp.innerHTML = "<"+mainElementName+"></"+mainElementName+">" // TODO: scrape static attrs from page too
						const liveapp = temp.querySelector(mainElementName)
						liveapp.style.display = "none"
						staticapp.parentNode.insertBefore(liveapp, staticapp)
						return { staticapp, liveapp }
					})
					.then(function (data) {
						// Sets global flag that indicates that hydration has successfully been skipped
						// This is required for testing static pages before hydration during e2e
						if (!data.result) {
							globalThis.skippedHydrationCanStacheElement = true
							return
						}

						const { staticapp, liveapp } = data.result
						staticapp.remove()
						liveapp.style.display = ""
					})
			//},5000)

		}
	}
}

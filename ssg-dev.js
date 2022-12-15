const steal = require("steal")

const url = require("url")
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const html = `<!doctype html>
<title>CanJS and StealJS</title>
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

steal
  .startup({
    main: "~/app/app.ssgjs!can-steal-ssg",
    babelOptions: {
      plugins: ["transform-class-properties"],
    },
    plugins: ["can"],
  })
  .then(
    function () {
      console.log("done loading")

			process.once("beforeExit", (code) => {
				console.log( dom.window.document.documentElement.innerHTML )
			});
    },
    function (e) {
      console.log(e)
    },
  )

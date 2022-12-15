console.log("first thing loaded");

define(["can-globals"],function(globals){
	const imp = "import";

	console.log("got any dependencies we wanted to load")
	return {
		translate: function(load){
			return `
			 ${imp} Zone from "can-zone";
			`+load.source+`
				document.body.append(document.createElement(mainElementName));
			`;
		}
	}
})

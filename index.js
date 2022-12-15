console.log("first thing loaded");

define(["can-steal-ssg/get-app-running","can-globals"],function(app, globals){
	const imp = "import";

	app.beforeEverything();

	console.log("got any dependencies we wanted to load")
	return {
		translate: function(load){
			return `
			 ${imp} app from "can-steal-ssg/get-app-running";
			`+load.source+`;
			app.after(mainElementName)`;
		}
	}
})

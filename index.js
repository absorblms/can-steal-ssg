
define(["can-steal-ssg/get-app-running","can-globals"],function(app, globals){
	const imp = "import";

	return {
		translate: function(load){
			return `
			 ${imp} app from "can-steal-ssg/get-app-running";
			`+load.source+`;
			app.after(mainElementName)`;
		}
	}
})

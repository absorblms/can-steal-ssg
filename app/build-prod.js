const stealTools = require("steal-tools");
const path = require("path");

var promise = stealTools.build({
  config: path.join(__dirname,"..","package.json!npm"),
	main: "~/app/app.ssgjs!can-steal-ssg"
},{
  dest: path.join(__dirname,"..","prod"),
  bundleSteal: true
}).then( (buildResult)=>{
	console.log(buildResult.loader.main)
	//console.log(buildResult.configuration,, buildResult.bundles)
});

const stealTools = require("steal-tools");
const path = require("path");

var promise = stealTools.build({
  config: path.join(__dirname,"..","package.json!npm"),
	main: "~/app/app.ssgjs!can-steal-ssg"
},{
  dest: path.join(__dirname,"..","prod"),
  bundleSteal: true
}).then( (buildResult)=>{

	buildResult.bundles.forEach( b => {
		console.log(b.bundlePath, b.bundles)
		if(b.bundlePath.endsWith(".css")) {
			console.log(b)
		}
	});



	/*console.log(buildResult.bundles)
	//console.log(buildResult.configuration,, buildResult.bundles)


	const mainModuleFullName = buildResult.loader.main;

	const mainBundle = buildResult.bundles.find( (bundle) => {
		return bundle.bundles.includes(mainModuleFullName);
	})*/

});

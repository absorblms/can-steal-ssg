const express = require("express")
const path = require("path")

const {
	name: appName,
	main: appMain
} = require(path.join(process.cwd(), "package.json"));

module.exports = function({
	main,
	port
}) {
	const app = express()

	const rootDir = process.cwd();

	// root things
	app.use("/package.json", express.static(path.join(rootDir, "package.json")))

	// app things
	app.use("/node_modules", express.static(path.join(rootDir, "node_modules")))

	const mainDir = path.dirname(appMain);
	app.use(`/${mainDir}`, express.static(path.join(rootDir, mainDir)))
	app.use("/", (req) => {
		const last = req.url.split("/").reverse()[0];
		if(last && last.indexOf(".") === -1) {
			// assume a route and add a slash to the end so the static will pick it up
			req.url += "/";
		}
		req.next();
	});
	app.use(
		"/",
		express.static(
			path.join(rootDir, mainDir),
			{
				index: "dev-ssg.html",
				redirect: false
			}
		)
	)


	app.use("*", (req, res) => {
		res.send(makePage(req,res))
	});

	app.listen(port || 8080, function () {
	  console.log("Example app listening on port ", port || 8080)
	})


	function makePage(req, res) {
		return `
			<script src="/node_modules/steal/steal.js" main="${main}!can-steal-ssg"></script>
		`
	}
}
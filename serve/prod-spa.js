const express = require("express")
const path = require("path")

const {
	name: appName,
	main: appMain
} = require(path.join(process.cwd(), "package.json"));

module.exports = function({
	dist,
	port,
	indexFileName = "prod-ssg.html"
}) {
	const app = express()

	// app things
	app.use("/", (req) => {
		const last = req.url.split("/").reverse()[0];
		if(last && last.indexOf(".") === -1) {
			// assume a route and add a slash to the end so the static will pick it up
			req.url += "/";
		}
		req.next();
	});
	app.use("/", express.static(path.join(process.cwd(), dist), {
		redirect: false,
		index: indexFileName
	}))


	app.use("*", (req, res) => {
		res.send(makePage(req,res))
	});

	app.listen(port || 8080, function () {
	  console.log("Example app listening on port ", port || 8080)
	})


	function makePage(req, res) {
		return `
		<html>
			<head>
				<link rel="stylesheet" href="/bundles/${appName}/${appMain.trim().replace(/\.\w+$/, ".css")}">
				<script>
					steal = {
						paths: {
							"bundles/*": "bundles/*.js",
							"bundles/*.css": "bundles/*css"
						}
					};
				</script>
			</head>
			<body>
				<script src="/bundles/${appName}/${appMain}"></script>
			</body>
		</html>

		`
	}
};
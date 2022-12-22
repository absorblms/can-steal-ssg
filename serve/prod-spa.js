const express = require("express")
const path = require("path")

const {
	name: appName,
	main: appMain
} = require(path.join(process.cwd(), "package.json"));

module.exports = function({
	dist,
	port
}) {
	const app = express()

	// app things
	app.use("/", express.static(path.join(process.cwd(), dist), {
		redirect: false,
		index: "prod-ssg.html"
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
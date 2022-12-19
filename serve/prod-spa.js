const express = require("express")
const path = require("path")


const app = express()


// app things
app.use("/", express.static(path.join(process.cwd(), "prod")))



app.use("*", (req, res) => {
	res.send(makePage(req,res))
});

app.listen(process.env.PORT || 8080, function () {
  console.log("Example app listening on port ", process.env.PORT || 8080 || 8080)
})


function makePage(req, res) {
	return `
	<html>
		<head>
			<link rel="stylesheet" href="/bundles/can-steal-ssg/app/app.css">
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
			<script src="/bundles/can-steal-ssg/app/app.js"></script>
		</body>
	</html>

	`
}

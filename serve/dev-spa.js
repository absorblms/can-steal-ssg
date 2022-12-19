const express = require("express")
const path = require("path")


const app = express()


// root things
app.use("/get-app-running.js", express.static(path.join(__dirname,"..", "get-app-running.js")))
app.use("/index.js", express.static(path.join(__dirname,"..", "index.js")))
app.use("/package.json", express.static(path.join(__dirname,"..", "package.json")))

// app things
app.use("/node_modules", express.static(path.join(__dirname, "..","node_modules")))
app.use("/app", express.static(path.join(__dirname,"..", "app")))


app.use("*", (req, res) => {
	res.send(makePage(req,res))
});

app.listen(process.env.PORT || 8080, function () {
  console.log("Example app listening on port ", process.env.PORT || 8080 || 8080)
})


function makePage(req, res) {
	return `
		<script src="/node_modules/steal/steal.js" main="~/app/app.ssgjs!can-steal-ssg"></script>
	`
}

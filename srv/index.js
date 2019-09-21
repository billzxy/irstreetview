const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const db = require("./db");
const panoRouter = require("./routes/pano-router");
const app = express();
const apiPort = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("tiny"));
app.use(bodyParser.json());

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use("/api", panoRouter);

app.get("*", (req, res) => {
	res.sendFile("index.html", {
		root: path.resolve(process.cwd(), "public")
	});
});

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`));

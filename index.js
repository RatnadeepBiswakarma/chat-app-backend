const express = require("express");
const mongoose = require("mongoose");
const mainRoute = require("./routes/index.js");
const bodyParser = require("body-parser");
const MONGODB_URI =
  "mongodb+srv://ratnadeep:WFUea3qDPIN2mSIa@cluster0-uhusf.mongodb.net/post-app?w=majority";
const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(bodyParser.json());
app.use(mainRoute);

mongoose.set("useUnifiedTopology", true);
mongoose.set("useNewUrlParser", true);
console.log("Connecting...");
mongoose.connect(MONGODB_URI).then((result) => {
  console.log("App is ready to use.");
  app.listen(5050);
});

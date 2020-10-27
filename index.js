const express = require("express");
const mongoose = require("mongoose");
const mainRoute = require("./routes/index.js");
const bodyParser = require("body-parser");
const MONGODB_URI = "mongodb://127.0.0.1:27017/posts-app";
const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-access-token");
  next();
});
app.use(bodyParser.json());
app.use(mainRoute);

mongoose.set("useUnifiedTopology", true);
mongoose.set("useNewUrlParser", true);
mongoose.set("useCreateIndex", true);
console.log("Connecting...");
mongoose.connect(MONGODB_URI).then((result) => {
  console.log("Connected! ✔");
  app.listen(5050);
});

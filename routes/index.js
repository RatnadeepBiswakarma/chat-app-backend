const { json } = require("body-parser");
const express = require("express");

const router = express.Router();

router.get("/posts", (req, res, next) => {
  res.status(200).json({ posts: ["hello world"] });
});

router.post("/posts", (req, res, next) => {
  console.log(req.body);
  const { title, user_name, content } = req.body;
  return res
    .status(201)
    .json({ message: "Post created", post: { title, user_name, content } });
});

module.exports = router;

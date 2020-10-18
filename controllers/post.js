const mongodb = require("mongodb");
const Post = require("../models/post");
const { validationResult } = require("express-validator");

exports.getPosts = (req, res) => {
  res.status(200).json({ posts: ["hello world"] });
};

exports.postPosts = (req, res) => {
  const errorFormatter = ({ location, msg, param }) => {
    return `${param} ${msg}`;
  };
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() });
  }
  const { title, content } = req.body;

  let post = new Post({
    title,
    content,
    created_on: new Date(),
    updated_on: new Date(),
    userId: new mongodb.ObjectId("5f17e109a02cc497c249ba22"), // hard coded for now
  });
  post.save().then((result) => {
    return res.status(201).json({ message: "Post created", result });
  });
};

const mongodb = require("mongodb");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({ posts: ["hello world"] });
};

exports.postPosts = (req, res, next) => {
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

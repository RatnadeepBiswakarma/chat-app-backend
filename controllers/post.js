const mongodb = require("mongodb");
const Post = require("../models/post");
const { validationResult } = require("express-validator");
const LIMIT = 10;
const SKIP = 0;

exports.getPosts = (req, res) => {
  const dbQueryOptions = { skip: SKIP, limit: LIMIT, sort: "-updated_at" };
  {
    const queryParams = req.query;
    if (queryParams.limit) {
      dbQueryOptions.limit = parseInt(queryParams.limit);
    }
    if (queryParams.skip) {
      dbQueryOptions.skip = parseInt(queryParams.skip);
    }
    if (queryParams.sort_by) {
      dbQueryOptions.sort = queryParams.sort_by;
    }
  }

  const query = Post.find();
  query.setOptions(dbQueryOptions);
  query.exec().then((posts) => {
    res.status(200).json({ posts: posts ? posts : [] });
  });
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

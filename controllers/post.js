exports.getPosts = (req, res, next) => {
  res.status(200).json({ posts: ["hello world"] });
};

exports.postPosts = (req, res, next) => {
  console.log(req.body);
  const { title, user_name, content } = req.body;
  return res
    .status(201)
    .json({ message: "Post created", post: { title, user_name, content } });
};

const postController = require("../controllers/post");
const userController = require("../controllers/user");
const { body, check } = require("express-validator");

const express = require("express");

const router = express.Router();

router.get("/posts", postController.getPosts);

router.post(
  "/posts",
  [
    check("title").exists().withMessage("is required."),
    body("title")
      .isLength({ min: 10 })
      .withMessage("must be at least 10 characters long."),
    check("content").exists().withMessage("is required."),
    body("content")
      .isLength({ min: 10 })
      .withMessage("must be at least 10 characters long."),
  ],
  postController.postPosts
);

router.get("/posts/:postId", postController.getPostById);

router.post("/users", userController.signupUser);

module.exports = router;

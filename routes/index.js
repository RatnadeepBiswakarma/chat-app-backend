const postController = require("../controllers/post");

const express = require("express");

const router = express.Router();

router.get("/posts", postController.getPosts);

router.post("/posts", postController.postPosts);

module.exports = router;

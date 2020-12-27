const express = require("express")
const router = express.Router()

const auth = require("../middlewares/auth")
const postController = require("../controllers/post")
const userController = require("../controllers/user")
const roomController = require("../controllers/room")
const { body, check } = require("express-validator")

router.get("/auth", auth, userController.authUser)

router.get("/messages/:roomId", auth, roomController.getMessages)
router.patch("/messages/:roomId", auth, roomController.patchRead)
router.get("/rooms", auth, roomController.getRooms)

router.post(
  "/posts",
  auth,
  [body("message").exists().withMessage("is required.")],
  postController.postPosts
)

router.get("/users/:email", userController.getUserDetails)

router.post(
  "/users/login",
  [
    check("email").exists().withMessage("is required."),
    body("email").isEmail().withMessage("is not a valid email."),
    check("password").exists().withMessage("is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("must be at least 6 characters."),
  ],
  userController.postLogin
)

router.post(
  "/users",
  [
    check("first_name").exists().withMessage("is required"),
    body("first_name")
      .isLength({ min: 1 })
      .withMessage("must be at least 1 character."),
    check("last_name").exists().withMessage("is required"),
    body("last_name")
      .isLength({ min: 1 })
      .withMessage("must be at least 1 character."),
    check("email").exists().withMessage("is required."),
    body("email").isEmail().withMessage("is not a valid email."),
    check("password").exists().withMessage("is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("must be at least 6 characters."),
  ],
  userController.signupUser
)

router.patch(
  "/posts/:postId",
  auth,
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
  postController.patchPost
)

router.delete(
  "/posts/:postId/delete",
  auth,
  [check("postId").exists().withMessage("is required.")],
  postController.deletePost
)

module.exports = router

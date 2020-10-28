const mongodb = require("mongodb")
const Post = require("../models/post")
const { validationResult } = require("express-validator")
const { prepareUserPublicProfile } = require("../util/user")
const LIMIT = 10
const SKIP = 0

exports.getPosts = (req, res) => {
  let query
  const dbQueryOptions = { skip: SKIP, limit: LIMIT, sort: "-updated_at" }
  {
    const queryParams = req.query
    /* if user is doing a search */
    if (queryParams.search) {
      query = Post.find({ $text: { $search: queryParams.search } })
    } else {
      query = Post.find()
    }
    if (queryParams.limit) {
      dbQueryOptions.limit = parseInt(queryParams.limit)
    }
    if (queryParams.skip) {
      dbQueryOptions.skip = parseInt(queryParams.skip)
    }
    if (queryParams.sort_by) {
      dbQueryOptions.sort = queryParams.sort_by
    }
  }

  query.setOptions(dbQueryOptions)
  /* lean() returns plain js object so that we modify freely
    it also removes other mongoose methods i.e. save() */
  // populate user details
  query.populate("userId")
  query.exec().then(posts => {
    if (posts.length > 0) {
      posts = Array.from(posts).map(p => p.toObject())
      /* just to give the data a better shape */
      posts.forEach(post => {
        if (post.userId) {
          post.user = prepareUserPublicProfile(post.userId)
          Reflect.deleteProperty(post, "userId")
        }
      })
    }
    res.status(200).json({ posts: posts ? posts : [] })
  })
}

exports.getPostById = (req, res) => {
  if (mongodb.ObjectID.isValid(req.params.postId)) {
    Post.findById(new mongodb.ObjectId(req.params.postId))
      .populate("userId")
      .then(post => {
        if (post) {
          post = post.toObject()
          /* just to give the data a better shape */
          post.user = prepareUserPublicProfile(post.userId)
          Reflect.deleteProperty(post, "userId")
          return res.status(200).json({ post })
        }
        return res.status(404).json({ message: "Post not found!" })
      })
  } else {
    return res.status(404).json({ message: "Post id is not valid!" })
  }
}

exports.postPosts = (req, res) => {
  const errorFormatter = ({ msg, param }) => {
    return `${param} ${msg}`
  }
  const errors = validationResult(req).formatWith(errorFormatter)
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() })
  }
  const { title, content } = req.body

  let post = new Post({
    title,
    content,
    created_on: new Date(),
    updated_on: new Date(),
    userId: req.userId,
  })
  post
    .save()
    .then(post => {
      return post.populate("userId").execPopulate()
    })
    .then(post => {
      post = post.toObject()
      /* just to give the data a better shape */
      post.user = prepareUserPublicProfile(post.userId)
      Reflect.deleteProperty(post, "userId")
      return res.status(201).json({ message: "Post created", post })
    })
}

exports.patchPost = (req, res) => {
  const postId = req.params.postId
  if (!mongodb.ObjectID.isValid(req.params.postId)) {
    return res.status(404).json({ message: "Post not found with this id." })
  }
  const { title, content } = req.body
  Post.findOneAndUpdate(
    { _id: postId, userId: req.userId },
    { title, content },
    { new: true }
  )
    .then(post => {
      if (post) {
        post = post.toObject()
        return res.status(200).json({ message: "Post updated!", post })
      }
      return res.status(404).json({ message: "Post not found!" })
    })
    .catch(() => {
      return res.status(500).json({
        message: "Something went wrong. We're on it, please try after sometime",
      })
    })
}

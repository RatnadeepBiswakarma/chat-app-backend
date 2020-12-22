const User = require("../models/user")
const { validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const { jwtSecret } = require("../config")

const errorFormatter = ({ msg, param }) => {
  return `${param} ${msg}`
}

exports.authUser = (req, res) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: `User not found` })
      }
      user = {
        first_name: user.first_name,
        last_name: user.last_name,
        id: user.id,
        email: user.email,
      }
      return res.status(200).json({ user })
    })
    .catch(err => {
      console.log(err)
      return res
        .status(500)
        .json({ message: "Something went wrong, we're looking into it." })
    })
}

exports.signupUser = (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter)
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() })
  }
  const { first_name, last_name, email, password } = req.body
  User.findOne({ email }).then(user => {
    if (user) {
      return res.status(200).json({
        message: "Account with this email id already exists, Please login.",
      })
    }
    const newUser = new User({
      first_name,
      last_name,
      email,
      password,
    })
    newUser
      .save()
      .then(user => {
        user = user.toObject()
        const token = jwt.sign({ userId: user.id.toString() }, jwtSecret, {
          expiresIn: "7 days",
        })
        user = {
          first_name: user.first_name,
          last_name: user.last_name,
          id: user.id,
        }
        return res.status(201).json({ user, token })
      })
      .catch(() => {
        return res.status(500).json({
          message:
            "Account creation failed! We're looking into it, Please try again in sometime.",
        })
      })
  })
}

exports.postLogin = (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter)
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() })
  }
  const { email, password } = req.body
  User.findOne({ email, password }).then(user => {
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password." })
    }
    user = user.toObject()
    const token = jwt.sign({ userId: user.id.toString() }, jwtSecret, {
      expiresIn: "7 days",
    })
    return res.status(200).json({ user, token })
  })
}

exports.getUserDetails = (req, res) => {
  const email = req.params.email
  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(404).json({ message: "No user found" })
    }
    user = user.toObject()
    return res.status(200).json({ user })
  })
}

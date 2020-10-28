const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

const errorFormatter = ({ msg, param }) => {
  return `${param} ${msg}`;
};

exports.signupUser = (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() });
  }
  const { first_name, last_name, email, password } = req.body;
  User.findOne({ email }).then(user => {
    if (user) {
      return res.status(200).json({
        message: "Account with this email id already exists, Please login.",
      });
    }
    const newUser = new User({
      first_name,
      last_name,
      email,
      password,
    });
    newUser
      .save()
      .then(user => {
        user = user.toObject();
        const token = jwt.sign({ userId: user.id.toString() }, jwtSecret, {
          expiresIn: "7 days",
        });
        return res.status(201).json({ user, token });
      })
      .catch(() => {
        return res.status(500).json({
          message:
            "Account creation failed! We're looking into it, Please try again in sometime.",
        });
      });
  });
};

exports.postLogin = (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() });
  }
  const { email, password } = req.body;
  User.findOne({ email, password }).then(user => {
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password." });
    }
    user = user.toObject();
    const token = jwt.sign({ userId: user.id.toString() }, jwtSecret, {
      expiresIn: "7 days",
    });
    return res.status(200).json({ user, token });
  });
};

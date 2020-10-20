const User = require("../models/user");

exports.signupUser = (req, res, next) => {
  const { first_name, last_name, email, password } = req.body;
  User.findOne({ email }).then((user) => {
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
      .then((user) => {
        return res.status(201).json({ user });
      })
      .catch(() => {
        return res.status(500).json({
          message:
            "Account creation failed! We're looking into it, Please try again in sometime.",
        });
      });
  });
};

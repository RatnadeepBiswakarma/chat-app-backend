const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const User = require("../models/user");

module.exports = (req, res, next) => {
  const token = req.get("x-access-token");
  if (!token) {
    return res.status(401).json({ message: "Invalid user token!" });
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, jwtSecret);
  } catch (err) {
    return res.status(500).json({
      message: "Invalid user token.",
    });
  }
  if (!decodedToken) {
    return res.status(401).json({ message: "Invalid user token!" });
  }

  User.findById(decodedToken.userId)
    .then(user => {
      if (user) {
        req.userId = user._id;
        return next();
      }
      return res.status(401).json({ message: "Invalid user token!" });
    })
    .catch(err => console.log("error: ", err));
};

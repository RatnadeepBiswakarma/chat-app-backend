const jwt = require("jsonwebtoken");
const jwtSecret = "twinkletwinklelittlestart";

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
  req.userId = decodedToken.userId;
  next();
};

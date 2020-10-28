const myEnv = require("dotenv").config({ path: ".env.development.local" })
const dotenvExpand = require("dotenv-expand")
dotenvExpand(myEnv)
module.exports = {
  mode: process.env.NODE_ENV,
  jwtSecret: process.env.NODE_JWT_SECRET,
  port: 5050,
}

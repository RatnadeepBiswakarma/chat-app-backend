const express = require("express")
const mongoose = require("mongoose")
const mainRoute = require("./routes/index.js")
const bodyParser = require("body-parser")
const { MONGODB_URI } = require("./config")
const app = express()
const io = require("./socket.js")
const ChatHandlers = require("./controllers/chat.js")
const User = require("./models/user")

const { port } = require("./config")

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-access-token")
  next()
})
app.use(bodyParser.json())
app.use(mainRoute)

mongoose.set("useUnifiedTopology", true)
mongoose.set("useNewUrlParser", true)
mongoose.set("useCreateIndex", true)
mongoose.set("useFindAndModify", false)
console.log("Connecting...")
mongoose.connect(MONGODB_URI).then(() => {
  console.log("Connected! ✔")
  const server = app.listen(port)
  let socketConnection = io.initSocket(server)
  socketConnection.on("connection", socket => {
    // store user id
    socket.user_id = socket.handshake.auth.userId
    const chatHandler = new ChatHandlers(server, socket, socketConnection)
    chatHandler.handleNewConnectedUser(socket.user_id)
  })
  User.findOne({ email: "sage@chatapp.com" }).then(user => {
    if (user) {
      return
    }
    // create the bot user not present
    const bot = new User({
      first_name: "The",
      last_name: "Sage",
      email: "sage@chatapp.com",
      password: "do I need a password?",
      last_online: new Date(),
    })
    bot.save()
  })
})

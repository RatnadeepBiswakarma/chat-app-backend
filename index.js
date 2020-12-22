const express = require("express")
const mongoose = require("mongoose")
const mainRoute = require("./routes/index.js")
const bodyParser = require("body-parser")
const MONGODB_URI = "mongodb://127.0.0.1:27017/posts-app"
const app = express()
const io = require("./socket.js")
const ChatHandlers = require("./controllers/chat.js")

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
    socket.chatHandler = new ChatHandlers(server, socket, socketConnection)
    socket.chatHandler.handleNewConnectedUser(socket.user_id)
  })
})

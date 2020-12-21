const Post = require("../models/post")
const { prepareUserPublicProfile } = require("../util/user")

module.exports = class ChatHandlers {
  constructor(server, socket, io) {
    this.server = server
    this.socket = socket
    this.io = io
    this.socket.on("userConnected", data => {
      this.handleNewConnectedUser(data)
    })
    this.socket.on("new_message", data => {
      this.handleNewMessage(data)
    })
  }

  async handleNewMessage(data) {
    console.log("new_message", data)
    let res = await this.putPost(data.sender_id, data.message)
    this.io.to(data.send_to).emit("new_message", res.post)
    res.post.sent_by_me = true
    this.io.to(data.sender_id).emit("new_message", res.post)
  }

  handleNewConnectedUser(userId) {
    console.log("handleNewConnectedUser", userId)
    this.socket.join(userId)
  }

  putPost(userId, message) {
    let post = new Post({
      message,
      created_on: new Date(),
      updated_on: new Date(),
      userId,
    })
    return post
      .save()
      .then(post => {
        return post.populate("userId").execPopulate()
      })
      .then(post => {
        post = post.toObject()
        /* just to give the data a better shape */
        post.user = prepareUserPublicProfile(post.userId)
        Reflect.deleteProperty(post, "userId")
        return { message: "Post created", post }
      })
  }
}

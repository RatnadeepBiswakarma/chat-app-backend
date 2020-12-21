const Post = require("../models/post")
const Room = require("../models/room")

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
    let room_id = data.roomId
    if (!room_id) {
      const users = [data.target_id, data.sender_id]
      let message = {
        text: data.message,
        sender_id: data.sender_id,
        date: new Date(),
      }
      let new_room = new Room({
        messages: [message],
        users,
      })
      let room = await new_room.save()
      room_id = room.id
      this.socket.join(room_id)
      this.socket.emit("new_message", data)
    }
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

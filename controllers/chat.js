const Post = require("../models/post")
const Room = require("../models/room")
const Message = require("../models/message")
const User = require("../models/user")

const { prepareUserPublicProfile } = require("../util/user")

module.exports = class ChatHandlers {
  constructor(server, socket, io) {
    this.server = server
    this.socket = socket
    this.io = io
    this.socket.join()
    this.socket.on("new_message", data => {
      this.handleNewMessage(data)
    })
    this.socket.on("typing", data => {
      this.handleTyping(data)
    })
    this.socket.on("no_longer_typing", data => {
      this.noLongerTyping(data)
    })
  }

  async handleNewMessage(data) {
    if (data.room_id) {
      let message = new Message(data)
      message
        .save()
        .then(message => {
          message = message.toObject()
          this.io.in(data.room_id).emit("new_message", message)
        })
        .catch(err => console.log(err))
    } else {
      const users = [data.target_id, data.sender_id]
      let new_room = new Room({
        users,
      })
      let room = await new_room.save()

      data.room_id = room.id
      Room.findById(room.id)
        .populate({ path: "users", select: "first_name last_name id email" })
        .then(newRoom => {
          newRoom = newRoom.toObject()
          this.socket.join(newRoom.id)
          let message = new Message(data)
          message
            .save()
            .then(message => {
              message.toObject()
              this.io.in(newRoom.id).emit("room_created", newRoom)
            })
            .catch(err => console.log(err))
        })
        .catch(err => {
          console.log("failed to fetch room", err)
        })
      // add the room to booth users' doc
      this.addRoomToUserDoc(data.target_id, room.id)
      this.addRoomToUserDoc(data.sender_id, room.id)
    }
  }

  handleTyping(data) {
    if (data.room_id) {
      this.socket.to(data.room_id).emit("typing", data)
    }
  }

  noLongerTyping(data) {
    if (data.room_id) {
      this.socket.to(data.room_id).emit("no_longer_typing", data)
    }
  }

  handleNewConnectedUser(user_id) {
    User.findById(user_id).then(user => {
      if (!user) {
        return
      }
      if (user.rooms.length > 0) {
        user.rooms.forEach(room_id => {
          this.socket.join(room_id.toString())
        })
      }
    })
  }

  addRoomToUserDoc(user_id, room_id) {
    User.findById(user_id).then(user => {
      if (!user) {
        return
      }
      user.rooms.push(room_id)
      user.save().catch(err => {
        console.log("failed to add room to user doc")
      })
    })
  }
}

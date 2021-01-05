const Room = require("../models/room")
const Message = require("../models/message")
const User = require("../models/user")
const Mongoose = require("mongoose")

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
    this.socket.on("read_message", data => {
      this.updateRead(data)
    })
    this.socket.on("message_received", data => {
      this.updateDeliver(data)
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
          this.addLastMessageToRoom(data.room_id, message.id)
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
          newRoom.creator_id = data.sender_id
          // join target user socket if online
          const sockets = []
          this.io.sockets.sockets.forEach(s => {
            sockets.push(s)
          })
          const targetUserSocket = sockets.find(
            s => s.user_id === data.target_id
          )
          this.socket.join(newRoom.id)
          if (targetUserSocket) {
            targetUserSocket.join(newRoom.id)
          }

          let message = new Message(data)
          message
            .save()
            .then(message => {
              message = message.toObject()
              this.io.in(newRoom.id).emit("room_created", newRoom)
              this.io.in(newRoom.id).emit("new_message", message)
              this.addLastMessageToRoom(newRoom.id, message.id)
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

  updateMessageStatus(status, data) {
    Message.updateOne(
      {
        room_id: Mongoose.Types.ObjectId(data.room_id),
        sender_id: Mongoose.Types.ObjectId(data.sender_id),
      },
      { status: status }
    )
      .then(() => {
        if (status === "read") {
          this.socket.to(data.room_id).emit("read_updated", data)
        } else if (status === "delivered") {
          this.socket.to(data.room_id).emit("message_delivered", data)
        }
      })
      .catch(err => console.log(err))
  }

  updateRead(data) {
    this.updateMessageStatus("read", data)
  }

  updateDeliver(data) {
    this.updateMessageStatus("delivered", data)
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

  addLastMessageToRoom(room_id, message_id) {
    Room.findByIdAndUpdate(room_id, { last_message: message_id })
      .then(() => {})
      .catch(err => console.log("Failed to update last msg", err))
  }
}

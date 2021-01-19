const Room = require("../models/room")
const Message = require("../models/message")
const User = require("../models/user")
const Mongoose = require("mongoose")
const { hasKey } = require("../util/object")

module.exports = class ChatHandlers {
  constructor(server, socket, io) {
    this.server = server
    this.socket = socket
    this.io = io
    this.onlineUsers = {}
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
    this.socket.on("all_messages_delivered", data =>
      this.markAllMessageAsDelivered(data)
    )
    this.socket.on("disconnect", () => {
      this.handleUserDisconnect()
    })
    this.socket.on("user_online_status", data => {
      this.handleUserOnlineStatusChange(data)
    })
    this.socket.on("get_unread_messages", () => {
      this.getUnreadMessages()
    })
  }

  async handleNewMessage(data) {
    if (data.room_id) {
      this.createNewMessage(data, data.room_id)
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
          this.io.in(newRoom.id).emit("room_created", newRoom)
          this.createNewMessage(data, newRoom.id)
        })
        .catch(err => {
          console.log("failed to fetch room", err)
        })
      // add the room to booth users' doc
      this.addRoomToUserDoc(data.target_id, room.id)
      this.addRoomToUserDoc(data.sender_id, room.id)
    }
  }

  createNewMessage(payload, room_id) {
    let message = new Message(payload)
    message
      .save()
      .then(message => {
        message = message.toObject()
        this.io.in(room_id).emit("new_message", message)
        this.addLastMessageToRoom(room_id, message.id)
      })
      .catch(err => console.log(err))
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
    const query = {
      room_id: Mongoose.Types.ObjectId(data.room_id),
      sender_id: Mongoose.Types.ObjectId(data.sender_id),
    }
    // only mark sent messages as delivered
    if (status === "delivered") {
      query.status = "sent"
    } else {
      // else mark all sent and delivered msgs as read
      query.status = { $in: ["sent", "delivered"] }
    }
    Message.updateMany(query, { status })
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

  markAllMessageAsDelivered(data) {
    Message.updateMany(
      { target_id: data.user_id, status: "sent" },
      { status: "delivered" }
    )
      .then(result => {
        if (result.nModified > 0) {
          User.findById(data.user_id)
            .select("rooms")
            .then(user => {
              if (!user) return
              // notify all the rooms for message delivery
              user.rooms.forEach(room_id => {
                room_id = room_id.toString()
                this.io.in(room_id).emit("all_messages_delivered", { room_id })
              })
            })
            .catch(err => console.log(err))
        }
      })
      .catch(err => console.log("err", err))
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
      } else {
        this.addBotUserForUser(user_id)
      }
      this.updateLastOnlineTime(user_id)
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

  handleUserDisconnect() {
    // update user last_online on disconnect
    this.updateLastOnlineTime(this.socket.user_id)
    this.handleUserOnlineStatusChange({
      status: false,
      user_id: this.socket.user_id,
    })
  }

  updateLastOnlineTime(user_id) {
    User.findByIdAndUpdate(user_id, { last_online: new Date() })
      .then(() => {
        // do nothing
      })
      .catch(err => console.log(err))
  }

  handleUserOnlineStatusChange(data) {
    this.onlineUsers[data.user_id] = data.status
    Room.find({ users: data.user_id })
      .select("id")
      .then(rooms => {
        if (!rooms) {
          return
        }
        rooms.forEach(room => {
          room = room.toObject()
          // send last_online, FE will update local data
          this.socket.to(room.id.toString()).emit("user_online_status", {
            ...data,
            room_id: room.id,
            last_online: new Date(),
          })
        })
      })
      .catch(err => console.log(err))
    // when user goes offline, last_online is updated
    if (!data.status) {
      this.updateLastOnlineTime(data.user_id)
    }
  }

  getUnreadMessages() {
    const { user_id } = this.socket
    Message.find({
      target_id: user_id,
      status: { $in: ["sent", "delivered"] },
    }).then(result => {
      let unreadList = {}
      result.forEach(item => {
        if (hasKey(unreadList, item.room_id)) {
          unreadList[item.room_id].count += 1
          unreadList[item.room_id].message = item.toObject()
        } else {
          unreadList[item.room_id] = { count: 1, message: item.toObject() }
        }
      })
      this.socket.emit("unread_messages", { unreads: unreadList })
    })
  }

  addBotUserForUser(user_id) {
    User.findOne({ email: "sage@chatapp.com" }).then(bot => {
      const bot_id = bot.id.toString()
      let new_room = new Room({
        users: [bot_id, user_id],
      })
      new_room.save().then(room => {
        Room.findById(room.id)
          .populate({ path: "users", select: "first_name last_name id email" })
          .then(newRoom => {
            newRoom = newRoom.toObject()
            // join target user socket if online
            const sockets = []
            this.io.sockets.sockets.forEach(s => {
              sockets.push(s)
            })
            const targetUserSocket = sockets.find(s => s.user_id === user_id)
            this.socket.join(newRoom.id)
            if (targetUserSocket) {
              targetUserSocket.join(newRoom.id)
            }
            this.io.in(newRoom.id).emit("room_created", newRoom)
            const msg = {
              text: "hello this is bot user",
              room_id: newRoom.id,
              sender_id: bot_id,
              target_id: user_id,
            }
            this.createNewMessage(msg, newRoom.id)
            this.addRoomToUserDoc(user_id, newRoom.id)
          })
      })
    })
  }
}

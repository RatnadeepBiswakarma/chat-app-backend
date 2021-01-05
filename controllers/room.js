const Room = require("../models/room")
const Message = require("../models/message")
const Mongoose = require("mongoose")

exports.getRooms = (req, res) => {
  Room.find({ users: req.userId })
    .populate({ path: "users", select: "first_name last_name id email" })
    .populate("last_message")
    .then(rooms => {
      rooms = rooms.map(item => item.toObject())
      return res.status(200).json({ rooms })
    })
    .catch(err => console.log(err))
}

exports.getMessages = (req, res) => {
  const roomId = req.params.roomId
  Message.find({ room_id: Mongoose.Types.ObjectId(roomId) })
    .sort("-created_at")
    .limit(50)
    .then(messages => {
      messages.forEach(item => {
        item = item.toObject()
      })
      messages.reverse()
      return res.status(200).json({ items: messages })
    })
}

exports.patchRead = (req, res) => {
  const roomId = req.params.roomId
  const sender_id = req.body.sender_id
  Message.updateMany(
    {
      room_id: Mongoose.Types.ObjectId(roomId),
      sender_id: Mongoose.Types.ObjectId(sender_id),
    },
    { status: "read" }
  )
    .then(result => {
      res.status(200).json({
        count: result.nModified,
        message: "Marked all messages as read",
      })
    })
    .catch(err => {
      res.status(500).json({
        message: "Failed to mark message as read, please try again later",
      })
      console.log(err)
    })
}

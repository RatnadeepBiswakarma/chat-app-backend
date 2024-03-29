const Message = require("../models/message")
const Mongoose = require("mongoose")

exports.getMessages = (req, res) => {
  const roomId = req.params.roomId
  const skip = Number(req.query.skip) || 0
  const limit = Number(req.query.limit) || 40
  Message.find({ room_id: Mongoose.Types.ObjectId(roomId) })
    .sort("-created_at")
    .limit(limit)
    .skip(skip)
    .then(messages => {
      messages = messages.map(item => item.toObject())
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

const Room = require("../models/room")

exports.getRooms = (req, res) => {
  Room.find({ users: req.userId })
    .sort("-last_message")
    .populate({
      path: "users",
      select: "first_name last_name id email last_online",
    })
    .populate("last_message")
    .then(rooms => {
      rooms = rooms.map(item => item.toObject())
      return res.status(200).json({ rooms })
    })
    .catch(err => console.log(err))
}

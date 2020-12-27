const mongoose = require("mongoose")
const Schema = mongoose.Schema

const messageSchema = new Schema(
  {
    text: {
      type: Object,
      required: true,
    },
    room_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Room",
    },
    sender_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      required: false,
      // delivered, read
      default: "sent",
    },
    date: Date,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    // change _id to id
    toObject: {
      transform(doc, ret) {
        const id = ret._id
        Reflect.deleteProperty(ret, "_id")
        ret.id = id
      },
    },
  }
)

messageSchema.index({ text: "text" })

module.exports = mongoose.model("Message", messageSchema)

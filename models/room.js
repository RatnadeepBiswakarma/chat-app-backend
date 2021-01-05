const mongoose = require("mongoose")
const Schema = mongoose.Schema

const roomSchema = new Schema(
  {
    users: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    last_message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    // change _id to id
    toObject: {
      transform(doc, ret) {
        const id = ret._id.toString()
        Reflect.deleteProperty(ret, "_id")
        ret.id = id
      },
    },
  }
)

module.exports = mongoose.model("Room", roomSchema)

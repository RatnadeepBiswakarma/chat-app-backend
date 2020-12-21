const mongoose = require("mongoose")
const Schema = mongoose.Schema

const roomSchema = new Schema(
  {
    messages: { type: Array, required: false },
    users: { type: Array, required: true, ref: "User", maxlength: 2 }, // array of user ids
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

roomSchema.index({ title: "text", content: "text" })

module.exports = mongoose.model("Room", roomSchema)

const mongoose = require("mongoose")
const Schema = mongoose.Schema

const roomSchema = new Schema(
  {
    users: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
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

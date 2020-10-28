const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
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

userSchema.index({ first_name: "text", last_name: "text", email: "text" })

module.exports = mongoose.model("User", userSchema)

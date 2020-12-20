const mongoose = require("mongoose")
const Schema = mongoose.Schema

const postSchema = new Schema(
  {
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

postSchema.index({ title: "text", content: "text" })

module.exports = mongoose.model("Post", postSchema)

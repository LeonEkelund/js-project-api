import mongoose from "mongoose"

const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, "Message is required"],
    minlength: 5,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  }
})

export const Thought = mongoose.model("Thought", ThoughtSchema)

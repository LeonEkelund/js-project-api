import mongoose from "mongoose"
import bcrypt from "bcrypt"

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6
  }
}, { timestamps: true })

// Hash password before saving
UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10)
  }
})

export const User = mongoose.model("User", UserSchema)

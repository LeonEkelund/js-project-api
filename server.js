import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Thought } from "./models/Thought"
import { User } from "./models/User"
import { authenticateUser } from "./middleware/auth"
import listEndpoints from "express-list-endpoints"

import dotenv from "dotenv"
dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happy-thoughts"
mongoose.connect(mongoUrl)
mongoose.Promise = Promise

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(express.json())

// root - shows all available endpoints
app.get("/", (req, res) => {
  res.json(listEndpoints(app))
})

// ---- AUTH ROUTES ----

// register
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body
    const user = await User.create({ username, email, password })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      token
    })
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Username or email already exists" })
    } else {
      res.status(400).json({ error: error.message })
    }
  }
})

// login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" })
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      token
    })
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" })
  }
})

// ---- THOUGHT ROUTES ----

// get all thoughts
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find().populate("user", "username").sort({ createdAt: -1 })
    res.json(thoughts)
  } catch (error) {
    res.status(500).json({ error: "Could not fetch thoughts" })
  }
})

// create a new thought (authenticated)
app.post("/thoughts", authenticateUser, async (req, res) => {
  try {
    const { message } = req.body
    const thought = await Thought.create({ message, user: req.user._id })
    const populatedThought = await thought.populate("user", "username")
    res.status(201).json(populatedThought)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// get single thought
app.get("/thoughts/:id", async (req, res) => {
  try {
    const { id } = req.params
    const thought = await Thought.findById(id).populate("user", "username")
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" })
    }
    res.json(thought)
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" })
  }
})

// update a thought (authenticated, only creator)
app.put("/thoughts/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body
    const thought = await Thought.findById(id)
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" })
    }
    if (thought.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only edit your own thoughts" })
    }
    thought.message = message
    await thought.save()
    const updatedThought = await thought.populate("user", "username")
    res.json(updatedThought)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// delete a thought (authenticated, only creator)
app.delete("/thoughts/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const thought = await Thought.findById(id)
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" })
    }
    if (thought.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own thoughts" })
    }
    await thought.deleteOne()
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" })
  }
})

// like a thought
app.post("/thoughts/:id/like", async (req, res) => {
  try {
    const { id } = req.params
    const thought = await Thought.findByIdAndUpdate(id, { $inc: { hearts: 1 } }, { new: true }).populate("user", "username")
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" })
    }
    res.json(thought)
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

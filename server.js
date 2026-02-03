import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import { Thought } from "./models/Thought"
import listEndpoints from "express-list-endpoints"

//remove later
import dotenv from "dotenv"
dotenv.config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happy-thoughts"
mongoose.connect(mongoUrl)
mongoose.Promise = Promise

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

// root - shows all available endpoints
app.get("/", (req, res) => {
  res.json(listEndpoints(app))
})

// get all thoughts
app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find()
  res.json(thoughts)
})

// create a new thought
app.post("/thoughts", async (req, res) => {
  const { message } = req.body
  const thought = await Thought.create({ message })
  res.status(201).json(thought)
})

// get single thought
app.get("/thoughts/:id", async (req, res) => {
  const { id } = req.params
  const thought = await Thought.findById(id)
  res.json(thought)
})

// update a thought
app.put("/thoughts/:id", async (req, res) => {
  const { id } = req.params
  const { message } = req.body
  const thought = await Thought.findByIdAndUpdate(id, { message }, { new: true })
  res.json(thought)
})

// delete a thought
app.delete("/thoughts/:id", async (req, res) => {
  const { id } = req.params
  await Thought.findByIdAndDelete(id)
  res.status(204).send()
})

// like a thought
app.post("/thoughts/:id/like", async (req, res) => {
  const { id } = req.params
  const thought = await Thought.findByIdAndUpdate(id, { $inc: { hearts: 1 } }, { new: true })
  res.json(thought)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

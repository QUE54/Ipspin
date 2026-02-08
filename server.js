
import dotenv from "dotenv"
import express from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

console.log("ENV ALL KEYS:", Object.keys(process.env))

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.static("public"))

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("Mongo error:", err.message);
    process.exit(1);
  });

const Spin = mongoose.model("Spin", {
  ip: String,
  time: Date
})

const Wheel = mongoose.model("Wheel", {
  label: String,
  percent: Number
})

const Admin = mongoose.model("Admin", {
  username: String,
  password: String
})

app.post("/setup-admin", async (req, res) => {
  if (req.body.key !== process.env.ADMIN_SETUP_KEY)
    return res.sendStatus(403)

  const hash = await bcrypt.hash(req.body.password, 10)
  await Admin.create({ username: req.body.username, password: hash })
  res.send("admin created")
})

app.post("/admin/login", async (req, res) => {
  const admin = await Admin.findOne({ username: req.body.username })
  if (!admin) return res.sendStatus(401)

  const ok = await bcrypt.compare(req.body.password, admin.password)
  if (!ok) return res.sendStatus(401)

  const token = jwt.sign(
    { id: admin._id },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  )

  res.json({ token })
})

function adminGuard(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.sendStatus(401)
  try {
    jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.sendStatus(403)
  }
}

app.get("/can-spin", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
  const used = await Spin.findOne({ ip })
  res.json({ canSpin: !used })
})

app.post("/spin", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
  if (await Spin.findOne({ ip })) return res.sendStatus(403)

  const items = await Wheel.find()
  const r = Math.random() * 100
  let acc = 0
  let result

  for (const i of items) {
    acc += i.percent
    if (r <= acc) { result = i; break }
  }

  await Spin.create({ ip, time: new Date() })
  res.json(result)
})

app.get("/admin/spins", adminGuard, async (_, res) =>
  res.json(await Spin.find())
)

app.delete("/admin/spins/:ip", adminGuard, async (req, res) => {
  await Spin.deleteOne({ ip: req.params.ip })
  res.send("reset")
})

app.get("/admin/wheel", adminGuard, async (_, res) =>
  res.json(await Wheel.find())
)

app.post("/admin/wheel", adminGuard, async (req, res) =>
  res.json(await Wheel.create(req.body))
)

const MONGO =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI

if (!MONGO) {
  throw new Error("Mongo URI missing")
}

mongoose.connect(MONGO)

app.listen(3000)

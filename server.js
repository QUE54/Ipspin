import dotenv from "dotenv"
import express from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.static("public"))

function getClientIP(req) {
  const xff = req.headers["x-forwarded-for"]
  if (xff) {
    return xff.split(",")[0].trim()
  }
  return req.socket.remoteAddress
}

// connect DB
const MONGO = process.env.MONGO_URI
if (!MONGO) throw new Error("Mongo URI missing")

mongoose.connect(MONGO)
  .then(()=>console.log("MongoDB connected"))
  .catch(e => console.error(e))

// Models
const Spin = mongoose.model("Spin", { ip:String, time:Date })
const Wheel = mongoose.model("Wheel", { label:String, percent:Number })
const Admin = mongoose.model("Admin", { username:String, password:String })

// setup-admin (temporary route)
app.post("/setup-admin", async (req,res) => {
  if (req.body.key !== process.env.ADMIN_SETUP_KEY) return res.sendStatus(403)
  const hash = await bcrypt.hash(req.body.password,10)
  await Admin.create({ username:req.body.username, password:hash })
  res.send("admin created")
})

// Login API
app.post("/admin/login", async (req,res) => {
  const admin = await Admin.findOne({ username:req.body.username })
  if (!admin) return res.sendStatus(401)
  const ok = await bcrypt.compare(req.body.password, admin.password)
  if (!ok) return res.sendStatus(401)

  const token = jwt.sign({ id:admin._id }, process.env.JWT_SECRET, { expiresIn:"12h" })
  res.json({ token })
})

function deviceGuard(req, res, next) {
  const device = req.headers["x-device-token"]
  if (device !== process.env.ADMIN_DEVICE_TOKEN)
    return res.sendStatus(403)
  next()
}

// admin guard
function adminGuard(req,res,next){
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.sendStatus(401)
  try {
    jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.sendStatus(403)
  }
}

// SPA / API
app.get("/can-spin", async (req,res) => {
  const ip = getClientIP(req)
  const used = await Spin.findOne({ ip })
  res.json({ canSpin:!used })
})

app.post("/spin", async (req,res) => {
  const ip = getClientIP(req)
  if (await Spin.findOne({ ip })) return res.sendStatus(403)

  const items = await Wheel.find()
  let result
  let acc = 0
  const r = Math.random()*100
  for (let i of items){
    acc += i.percent
    if (r <= acc){ result = i; break }
  }

  await Spin.create({ ip, time:new Date() })
  res.json(result)
})

// Admin APIs
// Admin APIs (ล็อกทั้งเครื่อง + token)
app.get("/admin/spins", deviceGuard, adminGuard, async (req,res) => {
  res.json(await Spin.find())
})

app.delete("/admin/spins/:ip", deviceGuard, adminGuard, async (req,res) => {
  await Spin.deleteOne({ ip:req.params.ip })
  res.send("reset")
})

app.get("/admin/wheel", deviceGuard, adminGuard, async (req,res) => {
  res.json(await Wheel.find())
})

app.post("/admin/wheel", deviceGuard, adminGuard, async (req,res) => {
  res.json(await Wheel.create(req.body))
})


fix: correct client IP handling
// start
app.listen(process.env.PORT||3000)

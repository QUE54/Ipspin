import dotenv from "dotenv"
import express from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.static("public"))

/* ---------- DB ---------- */
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB connected"))

/* ---------- MODELS ---------- */
const UserIP = mongoose.model("UserIP", {
  ip: String,
  spinsLeft: Number,
  banned: Boolean
})

const Wheel = mongoose.model("Wheel", {
  label: String,
  weight: Number
})

const Admin = mongoose.model("Admin", {
  username: String,
  password: String
})

/* ---------- ADMIN AUTH ---------- */
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

/* ---------- ADMIN SETUP (ใช้ครั้งเดียว) ---------- */
app.post("/setup-admin", async (req,res)=>{
  if (req.body.key !== process.env.ADMIN_SETUP_KEY)
    return res.sendStatus(403)

  const hash = await bcrypt.hash(req.body.password,10)
  await Admin.create({ username:req.body.username, password:hash })
  res.send("admin created")
})

/* ---------- LOGIN ---------- */
app.post("/admin/login", async (req,res)=>{
  const admin = await Admin.findOne({ username:req.body.username })
  if (!admin) return res.sendStatus(401)

  const ok = await bcrypt.compare(req.body.password, admin.password)
  if (!ok) return res.sendStatus(401)

  const token = jwt.sign({ id:admin._id }, process.env.JWT_SECRET)
  res.json({ token })
})

/* ---------- USER ---------- */
function getIP(req){
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress)
    .split(",")[0].trim()
}

app.get("/me", async (req,res)=>{
  const ip = getIP(req)
  let user = await UserIP.findOne({ ip })
  if (!user)
    user = await UserIP.create({ ip, spinsLeft:1, banned:false })

  res.json(user)
})

app.post("/spin", async (req,res)=>{
  const ip = getIP(req)
  const user = await UserIP.findOne({ ip })
  if (!user || user.banned || user.spinsLeft <= 0)
    return res.sendStatus(403)

  const items = await Wheel.find()
  const total = items.reduce((a,b)=>a+b.weight,0)
  let r = Math.random()*total
  let acc = 0, result

  for (let i of items){
    acc += i.weight
    if (r <= acc){ result=i; break }
  }

  user.spinsLeft--
  await user.save()
  res.json(result)
})

/* ---------- ADMIN IP ---------- */
app.get("/admin/users", adminGuard, async (_,res)=>{
  res.json(await UserIP.find())
})

app.post("/admin/users/:ip", adminGuard, async (req,res)=>{
  await UserIP.updateOne(
    { ip:req.params.ip },
    { spinsLeft:req.body.spinsLeft, banned:req.body.banned }
  )
  res.send("ok")
})

/* ---------- ADMIN WHEEL ---------- */
app.get("/admin/wheel", adminGuard, async (_,res)=>{
  res.json(await Wheel.find())
})

app.post("/admin/wheel", adminGuard, async (req,res)=>{
  await Wheel.deleteMany()
  await Wheel.insertMany(req.body)
  res.send("ok")
})

app.listen(process.env.PORT || 3000)

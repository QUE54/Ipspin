import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

dotenv.config()
const app = express()

app.use(express.json())
app.use(express.static("public"))

/* ---------- DB ---------- */
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error(err))

/* ---------- MODELS ---------- */
const Access = mongoose.model("Access", {
  ip: String,
  spinsLeft: { type:Number, default:1 },
  banned: { type:Boolean, default:false }
})

const Wheel = mongoose.model("Wheel",{
  label:String,
  weight:Number
})

const Admin = mongoose.model("Admin",{
  username:String,
  password:String
})

/* ---------- UTILS ---------- */
function getClientIP(req){
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress
  return raw.split(",")[0].trim()
}

function adminGuard(req,res,next){
  const token = req.headers.authorization?.split(" ")[1]
  if(!token) return res.sendStatus(401)
  try{
    jwt.verify(token,process.env.JWT_SECRET)
    next()
  }catch{
    res.sendStatus(403)
  }
}

/* ---------- SETUP ADMIN (ใช้ครั้งเดียว) ---------- */
app.post("/setup-admin", async(req,res)=>{
  if(req.body.key !== process.env.ADMIN_SETUP_KEY)
    return res.sendStatus(403)

  const hash = await bcrypt.hash(req.body.password,10)
  await Admin.create({
    username:req.body.username,
    password:hash
  })
  res.send("admin created")
})

/* ---------- LOGIN ---------- */
app.post("/admin/login", async(req,res)=>{
  const admin = await Admin.findOne({username:req.body.username})
  if(!admin) return res.sendStatus(401)

  const ok = await bcrypt.compare(req.body.password,admin.password)
  if(!ok) return res.sendStatus(401)

  const token = jwt.sign({id:admin._id},process.env.JWT_SECRET,{expiresIn:"12h"})
  res.json({token})
})

/* ---------- USER ---------- */
app.get("/me",(req,res)=>{
  res.json({ip:getClientIP(req)})
})

app.get("/status", async(req,res)=>{
  const ip = getClientIP(req)
  const a = await Access.findOne({ip})
  res.json({status:a?.status || "allow"})
})

app.post("/spin", async(req,res)=>{
  const ip = getClientIP(req)

  let access = await Access.findOne({ip})
  if(!access){
    access = await Access.create({ip,status:"allow"})
  }

  if(access.status==="banned") return res.sendStatus(403)
  if(access.status==="used") return res.json({used:true})

  const wheels = await Wheel.find()
  const total = wheels.reduce((s,w)=>s+w.weight,0)

  let r = Math.random()*total
  let result
  for(let w of wheels){
    r -= w.weight
    if(r<=0){ result=w; break }
  }

  access.status="used"
  access.updatedAt=new Date()
  await access.save()

  res.json(result)
})

/* ---------- ADMIN ---------- */
app.get("/admin/access",adminGuard,async(req,res)=>{
  res.json(await Access.find())
})

app.post("/admin/access/:ip",adminGuard,async(req,res)=>{
  await Access.updateOne(
    {ip:req.params.ip},
    {$set:{status:req.body.status,updatedAt:new Date()}},
    {upsert:true}
  )
  res.send("ok")
})

app.get("/admin/wheel",adminGuard,async(req,res)=>{
  res.json(await Wheel.find())
})

app.post("/admin/wheel",adminGuard,async(req,res)=>{
  await Wheel.deleteMany({})
  await Wheel.insertMany(req.body)
  res.send("saved")
})

app.listen(process.env.PORT||3000)

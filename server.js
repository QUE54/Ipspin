import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

// ===== Schema =====
const Device = mongoose.model("Device", {
  deviceId: String,
  spinsLeft: { type: Number, default: 1 },
  banned: { type: Boolean, default: false }
});

const SpinLog = mongoose.model("SpinLog", {
  deviceId: String,
  prize: String,
  time: { type: Date, default: Date.now }
});

const Prize = mongoose.model("Prize", {
  name: String,
  weight: Number
});

// ===== Utils =====
function auth(req, res, next) {
  try {
    jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

// ===== User =====
app.post("/api/spin", async (req, res) => {
  const { deviceId } = req.body;
  let device = await Device.findOne({ deviceId });

  if (!device) device = await Device.create({ deviceId });

  if (device.banned) return res.json({ error: "ถูกแบน" });
  if (device.spinsLeft <= 0) return res.json({ error: "หมดสิทธิ์" });

  const prizes = await Prize.find();
  const total = prizes.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * total;

  let prize;
  for (let p of prizes) {
    if (rand < p.weight) { prize = p.name; break; }
    rand -= p.weight;
  }

  device.spinsLeft--;
  await device.save();
  await SpinLog.create({ deviceId, prize });

  res.json({ prize });
});

// ===== Admin =====
app.post("/api/admin/login", async (req, res) => {
  const { user, pass } = req.body;
  if (
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS
  ) {
    const token = jwt.sign({}, process.env.JWT_SECRET);
    res.json({ token });
  } else res.sendStatus(401);
});

app.get("/api/admin/devices", auth, async (req, res) => {
  res.json(await Device.find());
});

app.post("/api/admin/device", auth, async (req, res) => {
  const { deviceId, spinsLeft, banned } = req.body;
  await Device.updateOne({ deviceId }, { spinsLeft, banned });
  res.sendStatus(200);
});

app.get("/api/admin/prizes", auth, async (req, res) => {
  res.json(await Prize.find());
});

app.post("/api/admin/prizes", auth, async (req, res) => {
  await Prize.deleteMany();
  await Prize.insertMany(req.body);
  res.sendStatus(200);
});

app.listen(3000, () => console.log("RUN"));

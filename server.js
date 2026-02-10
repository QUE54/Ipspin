import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI);

// ===== Utils =====
function getIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress
  );
}

function randomByWeight(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.weight) <= 0) return i;
  }
}

// ===== Models =====
const IP = mongoose.model(
  "IP",
  new mongoose.Schema({
    ip: String,
    spinsLeft: { type: Number, default: 0 },
    banned: { type: Boolean, default: false }
  })
);

const Wheel = mongoose.model(
  "Wheel",
  new mongoose.Schema({
    label: String,
    weight: Number
  })
);

const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    username: String,
    password: String
  })
);

// ===== Init Admin =====
(async () => {
  const exist = await Admin.findOne({ username: process.env.ADMIN_USER });
  if (!exist) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASS, 10);
    await Admin.create({
      username: process.env.ADMIN_USER,
      password: hash
    });
  }
})();

// ===== Middleware =====
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

// ===== User APIs =====
app.get("/status", async (req, res) => {
  const ip = getIP(req);
  let user = await IP.findOne({ ip });
  if (!user) user = await IP.create({ ip });
  if (user.banned) return res.sendStatus(403);

  res.json({
    ip,
    spinsLeft: user.spinsLeft
  });
});

app.post("/spin", async (req, res) => {
  const ip = getIP(req);
  const user = await IP.findOne({ ip });
  if (!user || user.banned) return res.sendStatus(403);
  if (user.spinsLeft <= 0)
    return res.status(400).json({ error: "NO_SPINS" });

  const wheel = await Wheel.find();
  const result = randomByWeight(wheel);

  user.spinsLeft--;
  await user.save();

  res.json({ reward: result.label });
});

// ===== Admin APIs =====
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.sendStatus(401);

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return res.sendStatus(401);

  const token = jwt.sign({ username }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get("/admin/users", authAdmin, async (req, res) => {
  res.json(await IP.find());
});

app.post("/admin/users/:ip", authAdmin, async (req, res) => {
  const { spinsLeft, banned } = req.body;
  await IP.updateOne(
    { ip: req.params.ip },
    { spinsLeft, banned },
    { upsert: true }
  );
  res.sendStatus(200);
});

app.get("/admin/wheel", authAdmin, async (req, res) => {
  res.json(await Wheel.find());
});

app.post("/admin/wheel", authAdmin, async (req, res) => {
  await Wheel.deleteMany();
  await Wheel.insertMany(req.body);
  res.sendStatus(200);
});

// ===== Start =====
app.listen(process.env.PORT, () =>
  console.log("DSOOD RUNNING")
);

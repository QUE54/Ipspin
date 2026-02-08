import express from "express";
import mongoose from "mongoose";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== CONNECT DB ===== */
mongoose.connect(process.env.MONGO_URL);

/* ===== MODELS ===== */
const Spin = mongoose.model("Spin", {
  ip: { type: String, unique: true },
  reward: String,
  createdAt: { type: Date, default: Date.now }
});

const Wheel = mongoose.model("Wheel", {
  label: String,
  rate: Number
});

/* ===== IP ===== */
const getIP = req =>
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.socket.remoteAddress;

/* ===== USER ===== */
app.get("/", (req, res) => {
  res.send(`
<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lucky Spin</title>
<style>
body{margin:0;font-family:system-ui;background:#020617;color:#e5e7eb}
.app{max-width:420px;margin:auto;padding:20px;text-align:center}
.wheel{
  width:260px;height:260px;margin:30px auto;
  border-radius:50%;border:12px solid #38bdf8;
  display:flex;align-items:center;justify-content:center;
  font-size:20px;transition:transform 3s cubic-bezier(.17,.67,.21,1)
}
button{
  width:100%;padding:16px;font-size:18px;
  border-radius:14px;border:none;background:#38bdf8
}
.info{margin-top:10px;color:#94a3b8;font-size:14px}
</style>

<div class="app">
<h2>🎡 Lucky Spin</h2>
<div class="wheel" id="wheel">TAP</div>
<button onclick="spin()">หมุน</button>
<div id="msg" class="info"></div>
<div class="info">IP: ${getIP(req)}</div>
</div>

<script>
function spin(){
 fetch("/api/spin",{method:"POST"})
 .then(r=>r.json())
 .then(d=>{
   if(d.status==="blocked"){
     msg.innerText="❌ IP นี้สุ่มไปแล้ว";return;
   }
   wheel.style.transform =
     "rotate("+(360*6+Math.random()*360)+"deg)";
   setTimeout(()=>msg.innerText="🎁 ได้: "+d.reward,3000);
 });
}
</script>
`);
});

/* ===== SPIN API ===== */
app.post("/api/spin", async (req,res)=>{
  const ip = getIP(req);
  if(await Spin.findOne({ip}))
    return res.json({status:"blocked"});

  const items = await Wheel.find();
  let pool=[];
  items.forEach(i=>{
    for(let n=0;n<i.rate;n++) pool.push(i.label);
  });

  const reward = pool[Math.floor(Math.random()*pool.length)];
  await Spin.create({ip,reward});
  res.json({status:"ok",reward});
});

/* ===== ADMIN ===== */
app.get("/admin", async (req,res)=>{
  const spins = await Spin.find().sort({createdAt:-1});
  const wheels = await Wheel.find();

  res.send(`
<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin</title>
<style>
body{margin:0;font-family:system-ui;background:#020617;color:#e5e7eb}
.app{max-width:420px;margin:auto;padding:16px}
button,input{
 width:100%;padding:12px;margin-top:6px;
 border-radius:10px;border:none
}
.card{
 border:1px solid #1e293b;
 border-radius:12px;padding:10px;margin-top:8px
}
</style>

<div class="app">
<h2>⚙️ Admin</h2>

<h3>📊 IP ที่สุ่มแล้ว</h3>
${spins.map(s=>`
<div class="card">
${s.ip}<br>🎁 ${s.reward}
<button onclick="delIP('${s.ip}')">คืนสิทธิ์</button>
</div>
`).join("")}

<h3>🎡 วงล้อ</h3>
<form method="POST" action="/admin/wheel">
<input name="label" placeholder="ชื่อรางวัล">
<input name="rate" type="number" placeholder="rate">
<button>เพิ่ม</button>
</form>

${wheels.map(w=>`
<div class="card">
${w.label} (${w.rate})
<button onclick="delWheel('${w._id}')">ลบ</button>
</div>
`).join("")}
</div>

<script>
function delIP(ip){
 fetch("/admin/ip/"+ip,{method:"DELETE"}).then(()=>location.reload())
}
function delWheel(id){
 fetch("/admin/wheel/"+id,{method:"DELETE"}).then(()=>location.reload())
}
</script>
`);
});

app.delete("/admin/ip/:ip", async (req,res)=>{
  await Spin.deleteOne({ip:req.params.ip});
  res.sendStatus(200);
});

app.post("/admin/wheel", async (req,res)=>{
  await Wheel.create({
    label:req.body.label,
    rate:Number(req.body.rate)
  });
  res.redirect("/admin");
});

app.delete("/admin/wheel/:id", async (req,res)=>{
  await Wheel.deleteOne({_id:req.params.id});
  res.sendStatus(200);
});

/* ===== START ===== */
app.listen(3000,()=>console.log("RUNNING"));
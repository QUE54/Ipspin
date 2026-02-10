function token(){ return localStorage.getItem("token") }

async function login(){
  const r = await fetch("/admin/login",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ username:u.value, password:p.value })
  })
  if (!r.ok) return alert("login fail")
  const d = await r.json()
  localStorage.setItem("token",d.token)
  show()
}

async function show(){
  login.style.display="none"
  panel.style.display="block"
  loadUsers()
  loadWheel()
}

async function loadUsers(){
  const r = await fetch("/admin/users",{
    headers:{Authorization:"Bearer "+token()}
  })
  const data = await r.json()
  users.innerHTML=""
  data.forEach(u=>{
    users.innerHTML+=`
      <div>${u.ip}
      <input type="number" value="${u.spinsLeft}"
        onchange="set('${u.ip}',this.value,false)">
      <button onclick="set('${u.ip}',0,true)">BAN</button>
      </div>`
  })
}

function set(ip, spins, banned){
  fetch("/admin/users/"+ip,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token()
    },
    body:JSON.stringify({ spinsLeft:spins, banned })
  }).then(loadUsers)
}

async function loadWheel(){
  const r = await fetch("/admin/wheel",{
    headers:{Authorization:"Bearer "+token()}
  })
  const d = await r.json()
  wheel.value = d.map(x=>`${x.label},${x.weight}`).join("\n")
}

function saveWheel(){
  const data = wheel.value.split("\n").map(l=>{
    const [label,weight]=l.split(",")
    return { label, weight:+weight }
  })
  fetch("/admin/wheel",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token()
    },
    body:JSON.stringify(data)
  })
}


const ADMIN_PASSWORD = "1341501508909"; // ตั้งรหัสเอง

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");

// ถ้าเคยล็อคอินแล้ว
if (localStorage.getItem("isAdmin") === "true") {
  loginBox.style.display = "none";
  adminPanel.style.display = "block";
}

loginBtn.addEventListener("click", () => {
  const pass = document.getElementById("adminPassword").value;

  if (pass === ADMIN_PASSWORD) {
    localStorage.setItem("isAdmin", "true");
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    alert("รหัสไม่ถูกต้อง");
  }
});

const ADMIN_PASSWORD = "1341501508909";

const loginBox = document.getElementById("loginBox");
const panel = document.getElementById("panel");
const usersBox = document.getElementById("users");
const wheelInput = document.getElementById("wheel");

// ===== LOGIN =====
document.getElementById("loginBtn").onclick = () => {
  const pass = document.getElementById("adminPassword").value;
  if (pass === ADMIN_PASSWORD) {
    localStorage.setItem("isAdmin", "1");
    showPanel();
  } else {
    alert("รหัสผิด");
  }
};

if (localStorage.getItem("isAdmin") === "1") showPanel();

function showPanel(){
  loginBox.style.display="none";
  panel.style.display="block";
  loadUsers();
  loadWheel();
}

// ===== USERS =====
function loadUsers(){
  const data = JSON.parse(localStorage.getItem("users") || "{}");
  usersBox.innerHTML = "";
  Object.keys(data).forEach(ip=>{
    const u = data[ip];
    usersBox.innerHTML += `
      <div class="row">
        <span>${ip}</span>
        <input type="number" value="${u.spins}"
          onchange="setSpins('${ip}',this.value)">
        <button onclick="ban('${ip}')">BAN</button>
      </div>`;
  });
}

function setSpins(ip,val){
  const data = JSON.parse(localStorage.getItem("users") || "{}");
  data[ip].spins = +val;
  localStorage.setItem("users",JSON.stringify(data));
}

function ban(ip){
  const data = JSON.parse(localStorage.getItem("users") || "{}");
  data[ip].banned = true;
  localStorage.setItem("users",JSON.stringify(data));
  loadUsers();
}

// ===== WHEEL =====
function loadWheel(){
  const w = JSON.parse(localStorage.getItem("wheel") || "[]");
  wheelInput.value = w.map(x=>`${x.label},${x.weight}`).join("\n");
}

function saveWheel(){
  const lines = wheelInput.value.split("\n");
  const w = lines.map(l=>{
    const [label,weight]=l.split(",");
    return {label,weight:+weight};
  });
  localStorage.setItem("wheel",JSON.stringify(w));
  alert("บันทึกแล้ว");
}

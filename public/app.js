// ================= CONFIG =================
const DEVICE_TOKEN = "3141592653589793"

function getToken(){
  return localStorage.getItem("admin_token")
}

// ================= USER =================
if (document.getElementById("spinBtn")) {
  fetch("/can-spin")
    .then(r=>r.json())
    .then(d=>{
      const btn = document.getElementById("spinBtn")
      document.getElementById("status").textContent =
        d.canSpin ? "คุณมีสิทธิ์สุ่ม" : "IP นี้ใช้สิทธิ์แล้ว"
      btn.disabled = !d.canSpin
    })

  spinBtn.onclick = async ()=>{
    spinBtn.disabled = true
    const r = await fetch("/spin",{ method:"POST" })
    const d = await r.json()
    resultBox.style.display = "block"
    resultText.textContent = d.label
  }
}

// ================= ADMIN =================
if (document.getElementById("loginBox")) {

  if (getToken()) showAdmin()

  window.login = async ()=>{
    const r = await fetch("/admin/login",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        username:user.value,
        password:pass.value
      })
    })

    if (!r.ok) {
      alert("Login ไม่ผ่าน")
      return
    }

    const d = await r.json()
    localStorage.setItem("admin_token", d.token)
    showAdmin()
  }

  function adminHeaders(){
    return {
      Authorization: "Bearer " + getToken(),
      "x-device-token": DEVICE_TOKEN
    }
  }

  function showAdmin(){
    loginBox.style.display = "none"
    adminPanel.style.display = "block"
    loadSpins()
    loadWheel()
  }

  async function loadSpins(){
    const r = await fetch("/admin/spins",{
      headers: adminHeaders()
    })

    if (!r.ok) {
      alert("อุปกรณ์นี้ไม่ได้รับอนุญาต")
      return
    }

    const data = await r.json()
    spinList.innerHTML = ""
    data.forEach(s=>{
      spinList.innerHTML += `
        <div class="item">
          ${s.ip}
          <button class="small-btn" onclick="resetIP('${s.ip}')">
            คืนสิทธิ์
          </button>
        </div>`
    })
  }

  window.resetIP = async (ip)=>{
    await fetch("/admin/spins/"+ip,{
      method:"DELETE",
      headers: adminHeaders()
    })
    loadSpins()
  }

  async function loadWheel(){
    const r = await fetch("/admin/wheel",{
      headers: adminHeaders()
    })
    const data = await r.json()
    wheelList.innerHTML = ""
    data.forEach(w=>{
      wheelList.innerHTML += `
        <div class="item">
          ${w.label} (${w.percent}%)
        </div>`
    })
  }

  window.addWheel = async ()=>{
    await fetch("/admin/wheel",{
      method:"POST",
      headers:{
        ...adminHeaders(),
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        label: label.value,
        percent: +percent.value
      })
    })
    label.value = ""
    percent.value = ""
    loadWheel()
  }
}

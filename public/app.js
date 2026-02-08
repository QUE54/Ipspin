
// ---------- USER ----------
if (document.getElementById("spinBtn")) {
  fetch("/can-spin")
    .then(r=>r.json())
    .then(d=>{
      const btn=document.getElementById("spinBtn")
      document.getElementById("status").textContent =
        d.canSpin ? "คุณมีสิทธิ์สุ่ม" : "IP นี้ใช้สิทธิ์แล้ว"
      btn.disabled = !d.canSpin
    })

  spinBtn.onclick = async ()=>{
    spinBtn.disabled=true
    const r = await fetch("/spin",{method:"POST"})
    const d = await r.json()
    resultBox.style.display="block"
    resultText.textContent = d.label
  }
}

// ---------- ADMIN ----------
if (document.getElementById("loginBox")) {
  if (token) showAdmin()

  window.login = async ()=>{
    const r = await fetch("/admin/login",{
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        username:user.value,
        password:pass.value
      })
    })
    if (!r.ok) return alert("login fail")
    const d = await r.json()
    localStorage.setItem("admin_token",d.token)
    showAdmin()
  }

  function showAdmin(){
    loginBox.style.display="none"
    adminPanel.style.display="block"
    loadSpins()
    loadWheel()
  }

  async function loadSpins(){
    const r = await fetch("/admin/spins",{
      headers:{Authorization:"Bearer "+localStorage.getItem("admin_token")}
    })
    const data = await r.json()
    spinList.innerHTML=""
    data.forEach(s=>{
      spinList.innerHTML+=`
        <div class="item">
          ${s.ip}
          <button class="small-btn" onclick="resetIP('${s.ip}')">คืนสิทธิ์</button>
        </div>`
    })
  }

  window.resetIP = async (ip)=>{
    await fetch("/admin/spins/"+ip,{
      method:"DELETE",
      headers:{Authorization:"Bearer "+localStorage.getItem("admin_token")}
    })
    loadSpins()
  }

  async function loadWheel(){
    const r = await fetch("/admin/wheel",{
      headers:{Authorization:"Bearer "+localStorage.getItem("admin_token")}
    })
    const data = await r.json()
    wheelList.innerHTML=""
    data.forEach(w=>{
      wheelList.innerHTML+=`
        <div class="item">
          ${w.label} (${w.percent}%)
        </div>`
    })
  }

  window.addWheel = async ()=>{
    await fetch("/admin/wheel",{
      method:"POST",
      headers:{
  "Content-Type":"application/json",
  Authorization:"Bearer "+localStorage.getItem("admin_token")
}
      },
      body:JSON.stringify({
        label:label.value,
        percent:+percent.value
      })
    })
    label.value=""
    percent.value=""
    loadWheel()
  }
}

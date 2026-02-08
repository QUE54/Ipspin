const token = localStorage.getItem("admin_token")

/* ---------- USER ---------- */
if(document.getElementById("spinBtn")){
  fetch("/me").then(r=>r.json()).then(d=>{
    myip.textContent=d.ip
  })

  fetch("/status").then(r=>r.json()).then(d=>{
    status.textContent="สถานะ: "+d.status
    if(d.status!=="allow") spinBtn.disabled=true
  })

  spinBtn.onclick=async()=>{
    const r = await fetch("/spin",{method:"POST"})
    if(!r.ok){ alert("ไม่สามารถสุ่ม"); return }
    const d = await r.json()
    result.textContent=d.label
  }
}

/* ---------- ADMIN ---------- */
if(document.getElementById("login")){
  if(token) show()

  window.login=async()=>{
    const r = await fetch("/admin/login",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username:user.value,password:pass.value})
    })
    if(!r.ok) return alert("login fail")
    const d = await r.json()
    localStorage.setItem("admin_token",d.token)
    show()
  }

  function show(){
    login.style.display="none"
    panel.style.display="block"
    loadIP()
    loadWheel()
  }

  async function loadIP(){
    const r = await fetch("/admin/access",{
      headers:{Authorization:"Bearer "+localStorage.getItem("admin_token")}
    })
    const data = await r.json()
    iplist.innerHTML=""
    data.forEach(i=>{
      iplist.innerHTML+=`
        <div>
          ${i.ip} [${i.status}]
          <button onclick="setIP('${i.ip}','allow')">Allow</button>
          <button onclick="setIP('${i.ip}','used')">Reset</button>
          <button onclick="setIP('${i.ip}','banned')">Ban</button>
        </div>`
    })
  }

  window.setIP=async(ip,status)=>{
    await fetch("/admin/access/"+ip,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:"Bearer "+localStorage.getItem("admin_token")
      },
      body:JSON.stringify({status})
    })
    loadIP()
  }

  async function loadWheel(){
    const r = await fetch("/admin/wheel",{
      headers:{Authorization:"Bearer "+localStorage.getItem("admin_token")}
    })
    const d = await r.json()
    wheelInput.value = d.map(w=>`${w.label},${w.weight}`).join("\n")
  }

  window.saveWheel=async()=>{
    const rows = wheelInput.value.trim().split("\n")
    const wheels = rows.map(r=>{
      const [label,weight]=r.split(",")
      return {label,weight:+weight}
    })
    await fetch("/admin/wheel",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:"Bearer "+localStorage.getItem("admin_token")
      },
      body:JSON.stringify(wheels)
    })
    alert("saved")
  }
}

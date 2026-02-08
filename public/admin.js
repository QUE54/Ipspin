let token = localStorage.getItem("admin_token")

async function login(){
  const r = await fetch("/admin/login",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:user.value,password:pass.value})
  })
  const d = await r.json()
  token=d.token
  localStorage.setItem("admin_token",token)
  show()
}

function show(){
  login.style.display="none"
  panel.style.display="block"
  loadIP()
  loadWheel()
}

async function loadIP(){
  const r = await fetch("/admin/access",{headers:{Authorization:"Bearer "+token}})
  const d = await r.json()
  iplist.innerHTML=""
  d.forEach(i=>{
    iplist.innerHTML+=`
      <div>
        ${i.ip}
        <input type="number" value="${i.spinsLeft}"
          onchange="setIP('${i.ip}',this.value,false)">
        <button onclick="setIP('${i.ip}',0,true)">Ban</button>
      </div>`
  })
}

async function setIP(ip,spins,banned){
  await fetch("/admin/access/"+ip,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body:JSON.stringify({spinsLeft:+spins,banned})
  })
  loadIP()
}

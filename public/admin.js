let token = ''

async function login() {
  const res = await fetch('/admin/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      username: user.value,
      password: pass.value
    })
  })
  const data = await res.json()
  token = data.token
  loginBox.style.display = 'none'
  panel.style.display = 'block'
  loadDevices()
  loadWheel()
}

async function loadDevices() {
  const res = await fetch('/admin/devices', {
    headers:{ Authorization:`Bearer ${token}` }
  })
  const list = await res.json()
  devices.innerHTML = ''
  list.forEach(d=>{
    devices.innerHTML += `
      <div class="item">
        <b>${d.deviceId.slice(0,15)}...</b><br>
        Spins: ${d.spinsLeft} | ${d.banned?'🚫 BANNED':'✅'}
        <div class="row">
          <button onclick="update('${d.deviceId}',1)">+1</button>
          <button onclick="update('${d.deviceId}',-1)">-1</button>
          <button onclick="reset('${d.deviceId}')">Reset</button>
          <button onclick="ban('${d.deviceId}')">Ban</button>
        </div>
      </div>`
  })
}

async function update(id,val){
  await fetch(`/admin/device/${id}`,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      Authorization:`Bearer ${token}`
    },
    body: JSON.stringify({delta:val})
  })
  loadDevices()
}

async function reset(id){
  await fetch(`/admin/device/${id}/reset`,{
    method:'POST',
    headers:{Authorization:`Bearer ${token}`}
  })
  loadDevices()
}

async function ban(id){
  await fetch(`/admin/device/${id}/ban`,{
    method:'POST',
    headers:{Authorization:`Bearer ${token}`}
  })
  loadDevices()
}

async function loadWheel(){
  const res = await fetch('/admin/wheel',{
    headers:{Authorization:`Bearer ${token}`}
  })
  const w = await res.json()
  wheel.innerHTML = w.map(i=>`${i.label} (${i.weight})`).join('<br>')
}

async function addPrize(){
  await fetch('/admin/wheel',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      Authorization:`Bearer ${token}`
    },
    body: JSON.stringify({
      label:label.value,
      weight:+weight.value
    })
  })
  loadWheel()
}

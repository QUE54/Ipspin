async function load(){
  const r = await fetch("/status")
  const d = await r.json()

  ip.textContent = d.ip
  left.textContent = d.spinsLeft

  if(d.banned){
    state.textContent="⛔ ถูกแบน"
    spinBtn.disabled=true
  }else if(d.spinsLeft<=0){
    state.textContent="⚠️ สิทธิ์หมด"
    spinBtn.disabled=true
  }else{
    state.textContent="✅ หมุนได้"
    spinBtn.disabled=false
  }
}

spinBtn.onclick = async()=>{
  const r = await fetch("/spin",{method:"POST"})
  if(!r.ok) return
  const d = await r.json()
  result.textContent="🎁 "+d.result.label
  load()
}

load()

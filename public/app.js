fetch("/me").then(r=>r.json()).then(d=>{
  ip.textContent = "IP: "+d.ip
  left.textContent = d.banned
    ? "⛔ ถูกแบน"
    : "สิทธิ์คงเหลือ: "+d.spinsLeft

  if (d.banned || d.spinsLeft<=0)
    spinBtn.disabled = true
})

spinBtn.onclick = async ()=>{
  const r = await fetch("/spin",{method:"POST"})
  if (!r.ok) return alert("หมดสิทธิ์")
  const d = await r.json()
  result.textContent = "ได้: "+d.label
  location.reload()
}

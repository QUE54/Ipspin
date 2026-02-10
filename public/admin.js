let token = "";

async function login() {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: u.value,
      pass: p.value
    })
  });
  const data = await res.json();
  token = data.token;
  load();
}

async function load() {
  const res = await fetch("/api/admin/devices", {
    headers: { authorization: token }
  });
  out.innerText = JSON.stringify(await res.json(), null, 2);
}

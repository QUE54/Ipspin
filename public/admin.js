let token = "";

async function login() {
  const res = await fetch("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user.value,
      password: pass.value
    })
  });
  const data = await res.json();
  token = data.token;
  loadUsers();
}

async function loadUsers() {
  const res = await fetch("/admin/users", {
    headers: { Authorization: "Bearer " + token }
  });
  out.innerText = JSON.stringify(await res.json(), null, 2);
}

async function load() {
  const res = await fetch("/status");
  if (res.status === 403) {
    document.body.innerHTML = "BANNED";
    return;
  }
  const data = await res.json();
  document.getElementById("info").innerText =
    `IP: ${data.ip} | Spins: ${data.spinsLeft}`;
}

document.getElementById("spin").onclick = async () => {
  const res = await fetch("/spin", { method: "POST" });
  const data = await res.json();
  document.getElementById("result").innerText =
    data.reward || data.error;
  load();
};

load();

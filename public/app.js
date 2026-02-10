function getDeviceId() {
  return btoa(
    navigator.userAgent +
    screen.width + screen.height +
    navigator.language +
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

document.getElementById("spin").onclick = async () => {
  const res = await fetch("/api/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: getDeviceId() })
  });
  const data = await res.json();
  document.getElementById("result").innerText =
    data.prize || data.error;
};

/* =========================
   MOCK DATABASE (แทน backend)
========================= */
let wheelData = [
  { name: "1", weight: 60 },
  { name: "2", weight: 30 },
  { name: "3", weight: 7 },
  { name: "4", weight: 3 }
];

let ipRights = {
  "LOCAL": { spins: 3, banned: false }
};

function calculatePercentages() {
  const totalWeight = wheelData.reduce((s, i) => s + i.weight, 0);

  return wheelData.map(item => ({
    ...item,
    percent: totalWeight === 0
      ? 0
      : Math.round((item.weight / totalWeight) * 100)
  }));
}

/* =========================
   IP
========================= */
function getIP() {
  return fetch("https://api.ipify.org?format=json")
    .then(res => res.json())
    .then(d => d.ip)
    .catch(() => "LOCAL");
}

/* =========================
   SPIN PAGE
========================= */
const spinBtn = document.getElementById("spinBtn");
const spinCountEl = document.getElementById("spinCount");
const spinStateEl = document.getElementById("spinState");
const ipEl = document.getElementById("userIp");

if (spinBtn) {
  getIP().then(ip => {
    ipEl.textContent = ip;
    if (!ipRights[ip]) ipRights[ip] = { spins: 0, banned: false };

    updateSpinUI(ip);

    spinBtn.onclick = () => {
      if (ipRights[ip].spins <= 0) return;
      ipRights[ip].spins--;
      updateSpinUI(ip);
      alert("หมุนแล้ว!");
    };
  });
}

function updateSpinUI(ip) {
  const data = ipRights[ip];
  spinCountEl.textContent = data.spins + " ครั้ง";

  if (data.spins > 0) {
    spinBtn.disabled = false;
    spinStateEl.textContent = "สามารถหมุนได้";
    spinStateEl.className = "spin-count";
  } else {
    spinBtn.disabled = true;
    spinStateEl.textContent = "หมดสิทธิ์";
    spinStateEl.className = "spin-disabled";
  }
}

/* =========================
   ADMIN PAGE
========================= */
const ipList = document.getElementById("ipList");
const wheelItems = document.getElementById("wheelItems");
const totalPercentEl = document.getElementById("totalPercent");

if (ipList) renderIP();
if (wheelItems) renderWheelEditor();

function renderIP() {
  ipList.innerHTML = "";
  Object.keys(ipRights).forEach(ip => {
    const row = document.createElement("div");
    row.className = "ip-row";
    row.innerHTML = `
      <div class="ip-address">${ip}</div>
      <div class="ip-actions">
        <button class="btn-allow" onclick="setSpin('${ip}',10)">กำหนดสิทธิ์</button>
        <button class="btn-reset" onclick="setSpin('${ip}',1)">รีเซ็ต</button>
        <button class="btn-ban" onclick="banIP('${ip}')">แบน</button>
      </div>
    `;
    ipList.appendChild(row);
  });
}

function setSpin(ip, count) {
  ipRights[ip].spins = count;
  renderIP();
}

function banIP(ip) {
  ipRights[ip].banned = true;
  alert(ip + " ถูกแบน");
}

/* =========================
   WHEEL EDITOR
========================= */
function renderWheelEditor() {
  wheelItems.innerHTML = "";
  let total = 0;

  wheelData.forEach((item, i) => {
    total += item.weight;
    const div = document.createElement("div");
    div.className = "wheel-item";
    div.innerHTML = `
      <input value="${item.name}" onchange="wheelData[${i}].name=this.value">
      <input type="number" min="1" max="100" value="${item.weight}"
        onchange="wheelData[${i}].weight=parseInt(this.value); renderWheelEditor();">
      <span>${item.weight}%</span>
    `;
    wheelItems.appendChild(div);
  });

  totalPercentEl.textContent = `รวม ${total}%`;
  totalPercentEl.className = "total-percent " + (total === 100 ? "ok" : "bad");
}

function addItem() {
  wheelData.push({ name: "ใหม่", weight: 1 });
  renderWheelEditor();
}

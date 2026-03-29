// ================= CONFIG =================
const API = "http://localhost:3000";

let TOKEN = null;
let USER = null;
let SOCKET = null;

// ================= FORCE LOGIN =================
window.doLogin = async function () {
  const username =
    document.getElementById("in-user")?.value ||
    document.querySelector("input[type=text]")?.value;

  const password =
    document.getElementById("in-pass")?.value ||
    document.querySelector("input[type=password]")?.value;

  const res = await fetch(API + "/api/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert("Login failed");
    return;
  }

  TOKEN = data.token;
  localStorage.setItem("token", TOKEN);

  USER = JSON.parse(atob(TOKEN.split('.')[1]));

  initRealtime();
  forceLoadData();

  if (typeof loadDashboard === "function") {
    loadDashboard();
  }
};

// ================= REALTIME =================
function initRealtime() {
  if (SOCKET) return;

  SOCKET = io(API);

  SOCKET.on("connect", () => {
    SOCKET.emit("join", USER.id);
  });

  SOCKET.on("notification", (data) => {
    console.log("REALTIME:", data);

    injectToast(`📢 ${data.subject}: ${data.score}`);

    // REFRESH UI
    forceLoadData();
  });
}

// ================= FETCH REAL DATA =================
async function fetchResults() {
  const res = await fetch(API + "/api/results", {
    headers: {
      "Authorization": "Bearer " + TOKEN
    }
  });

  return await res.json();
}

// ================= FORCE UI REPLACEMENT =================
async function forceLoadData() {
  console.log("🔥 Replacing fake UI with live data");

  const results = await fetchResults();

  replaceTables(results);
  replaceStats(results);
}

// ================= REPLACE TABLE DATA =================
function replaceTables(results) {
  const tables = document.querySelectorAll("table");

  tables.forEach(table => {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    results.slice(0, 10).forEach(r => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${r.subject}</td>
        <td>${r.score}</td>
        <td>${new Date(r.created_at).toLocaleString()}</td>
      `;

      tbody.appendChild(row);
    });
  });
}

// ================= REPLACE STATS =================
function replaceStats(results) {
  const avg =
    results.reduce((a, b) => a + b.score, 0) / (results.length || 1);

  document.querySelectorAll("*").forEach(el => {
    if (!el.innerText) return;

    if (el.innerText.includes("Students")) {
      el.innerText = results.length + " Records";
    }

    if (el.innerText.includes("%")) {
      el.innerText = avg.toFixed(1) + "% Avg Score";
    }
  });
}

// ================= SEND REAL DATA =================
window.submitResult = async function () {
  await fetch(API + "/api/results", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization":"Bearer " + TOKEN
    },
    body: JSON.stringify({
      student_id: USER.id,
      subject: "Math",
      score: Math.floor(Math.random() * 100)
    })
  });
};

// ================= TOAST =================
function injectToast(msg) {
  let container =
    document.getElementById("toastContainer") ||
    document.body;

  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.top = "20px";
  div.style.right = "20px";
  div.style.background = "#22c55e";
  div.style.color = "#fff";
  div.style.padding = "10px";
  div.style.margin = "5px";
  div.style.borderRadius = "5px";
  div.innerText = msg;

  container.appendChild(div);

  setTimeout(() => div.remove(), 4000);
}

// ================= AUTO START =================
window.addEventListener("load", () => {
  const saved = localStorage.getItem("token");

  if (saved) {
    TOKEN = saved;
    USER = JSON.parse(atob(saved.split('.')[1]));

    initRealtime();
    forceLoadData();

    if (typeof loadDashboard === "function") {
      loadDashboard();
    }
  }
});

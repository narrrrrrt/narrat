// main.js

const state = {
  id: null,
  seat: null,
  token: null,
  hbTimer: null,
};

function log(label, data) {
  const el = document.getElementById("log");
  el.textContent = `${label}:\n` + JSON.stringify(data, null, 2);
}

async function api(path, body = null) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(path, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch (err) {
    return { error: err.message };
  }
}

async function join() {
  const data = await api(`/${state.id}/join`);
  if (data.token) state.token = data.token;
  log("JOIN", data);
}

async function move() {
  if (!state.token) {
    log("MOVE", { error: "no token" });
    return;
  }
  const data = await api(`/${state.id}/move`, { token: state.token, x: 3, y: 2 });
  log("MOVE", data);
}

async function leave() {
  if (!state.token) {
    log("LEAVE", { error: "no token" });
    return;
  }
  const data = await api(`/${state.id}/leave`, { token: state.token });
  state.token = null;
  log("LEAVE", data);
}

async function reset() {
  const data = await api(`/${state.id}/reset`);
  log("RESET", data);
}

function startHeartbeat() {
  if (!state.token) {
    log("HB", { error: "no token" });
    return;
  }
  if (state.hbTimer) return;
  state.hbTimer = setInterval(async () => {
    const data = await api(`/${state.id}/hb`, { token: state.token });
    log("HB", data);
  }, 1000);
}

function stopHeartbeat() {
  if (state.hbTimer) {
    clearInterval(state.hbTimer);
    state.hbTimer = null;
  }
}

// 初期化
const params = new URLSearchParams(location.search);
state.id = params.get("id");
state.seat = params.get("seat");

if (!state.id || !state.seat) {
  alert("id と seat が必要です");
} else {
  document.getElementById("btn-join").onclick = join;
  document.getElementById("btn-move").onclick = move;
  document.getElementById("btn-leave").onclick = leave;
  document.getElementById("btn-reset").onclick = reset;
  document.getElementById("btn-hb-start").onclick = startHeartbeat;
  document.getElementById("btn-hb-stop").onclick = stopHeartbeat;
}